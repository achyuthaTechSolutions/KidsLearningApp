import {
  authEndpoints,
  type AuthClient,
  type AuthFailure,
  type AuthResult,
  type ChildProfile,
  type SessionGrant,
  type VerificationChallenge,
} from './contract';

const failure = (code: AuthFailure['code'], retryAfterSeconds?: number): AuthResult<never> => ({
  ok: false,
  error: retryAfterSeconds === undefined ? { code } : { code, retryAfterSeconds },
});

function configuredBase(baseUrl: string | undefined): string | null {
  const trimmed = baseUrl?.trim().replace(/\/$/, '');
  if (!trimmed || !trimmed.startsWith('https://')) return null;
  return trimmed;
}

function parseSession(body: unknown): SessionGrant | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const parent = record.parent;
  if (typeof record.accessToken !== 'string' || record.accessToken.length < 10) return null;
  if (typeof record.refreshToken !== 'string' || record.refreshToken.length < 10) return null;
  if (typeof record.expiresAt !== 'number' || record.expiresAt <= Date.now()) return null;
  if (!parent || typeof parent !== 'object') return null;
  const person = parent as Record<string, unknown>;
  if (typeof person.id !== 'string' || typeof person.name !== 'string') return null;
  return {
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
    expiresAt: record.expiresAt,
    parent: { id: person.id, name: person.name },
  };
}

function parseChallenge(body: unknown): VerificationChallenge | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  if (record.verificationRequired !== true || typeof record.pendingId !== 'string') return null;
  const retryAfterSeconds = typeof record.retryAfterSeconds === 'number' ? record.retryAfterSeconds : 0;
  return { verificationRequired: true, pendingId: record.pendingId, retryAfterSeconds };
}

function parseChild(body: unknown): ChildProfile | null {
  const list = parseChildren({ children: [body] });
  return list?.[0] ?? null;
}

function parseChildren(body: unknown): ChildProfile[] | null {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { children?: unknown }).children)) return null;
  const children = (body as { children: unknown[] }).children;
  const parsed: ChildProfile[] = [];
  for (const item of children) {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.nickname !== 'string') return null;
    if (record.ageBand !== '3-4' && record.ageBand !== '5-6' && record.ageBand !== '7-8') return null;
    if (record.avatar !== 'lion' && record.avatar !== 'rabbit' && record.avatar !== 'elephant' && record.avatar !== 'turtle' && record.avatar !== 'monkey') return null;
    parsed.push({ id: record.id, nickname: record.nickname, ageBand: record.ageBand, avatar: record.avatar });
  }
  return parsed;
}

export function createProductionAuthClient(options?: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): AuthClient {
  const base = configuredBase(options?.baseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL);
  const fetchImpl = options?.fetchImpl ?? fetch;

  async function post(path: string, body: unknown, accessToken?: string): Promise<{ status: number; json: unknown } | AuthFailure> {
    if (!base) return { code: 'unavailable' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetchImpl(`${base}${path}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const json = await response.json().catch(() => null);
      return { status: response.status, json };
    } catch {
      return { code: 'network' };
    } finally {
      clearTimeout(timer);
    }
  }

  function sessionFrom(result: { status: number; json: unknown } | AuthFailure): AuthResult<SessionGrant> {
    if ('code' in result) return { ok: false, error: result };
    if (result.status === 401 || result.status === 403) return failure('session_expired');
    const session = parseSession(result.json);
    if (result.status >= 200 && result.status < 300 && session) return { ok: true, value: session };
    return failure('invalid_response');
  }

  return {
    async login({ identifier, password }) {
      const result = await post(authEndpoints.login, { identifier, password });
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 401 || result.status === 404 || result.status === 400) return failure('invalid_credentials');
      if (result.status === 429) return failure('rate_limited');
      const challenge = parseChallenge(result.json);
      if (challenge) return { ok: true, value: challenge };
      return sessionFrom(result);
    },
    async register(input) {
      const result = await post(authEndpoints.register, input);
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 409 || result.status === 400) return failure('rejected');
      if (result.status === 429) return failure('rate_limited');
      const challenge = parseChallenge(result.json);
      if (challenge) return { ok: true, value: challenge };
      return sessionFrom(result);
    },
    async forgot({ identifier }) {
      const result = await post(authEndpoints.forgot, { identifier });
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 429) return failure('rate_limited');
      if (result.status >= 200 && result.status < 300) return { ok: true, value: { accepted: true } };
      if (result.status === 400 || result.status === 404) return { ok: true, value: { accepted: true } };
      return failure('unavailable');
    },
    async verify({ pendingId, code }) {
      const result = await post(authEndpoints.verify, { pendingId, code });
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 400 || result.status === 401) return failure('verification_failed');
      if (result.status === 429) return failure('rate_limited');
      return sessionFrom(result);
    },
    async resend({ pendingId }) {
      const result = await post(authEndpoints.resend, { pendingId });
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 429) {
        const retryAfterSeconds = result.json && typeof result.json === 'object' && typeof (result.json as { retryAfterSeconds?: unknown }).retryAfterSeconds === 'number'
          ? (result.json as { retryAfterSeconds: number }).retryAfterSeconds
          : 30;
        return failure('rate_limited', retryAfterSeconds);
      }
      if (result.status >= 200 && result.status < 300 && result.json && typeof result.json === 'object') {
        const retryAfterSeconds = typeof (result.json as { retryAfterSeconds?: unknown }).retryAfterSeconds === 'number'
          ? (result.json as { retryAfterSeconds: number }).retryAfterSeconds
          : 30;
        return { ok: true, value: { retryAfterSeconds } };
      }
      return failure('unavailable');
    },
    async refresh({ refreshToken }) {
      const result = await post(authEndpoints.refresh, { refreshToken });
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 401 || result.status === 403) return failure('session_expired');
      return sessionFrom(result);
    },
    async logout({ accessToken }) {
      await post(authEndpoints.logout, {}, accessToken);
    },
    async listChildren({ accessToken }) {
      const result = await post(authEndpoints.children, {}, accessToken);
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 401 || result.status === 403) return failure('session_expired');
      const children = parseChildren(result.json);
      if (result.status >= 200 && result.status < 300 && children) return { ok: true, value: children };
      return failure('invalid_response');
    },
    async createChild(input) {
      const result = await post(authEndpoints.children, input, input.accessToken);
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 401 || result.status === 403) return failure('session_expired');
      if (result.status === 409) return failure('child_limit');
      const created = parseChildren(result.json)?.[0] ?? parseChild(result.json);
      if (result.status >= 200 && result.status < 300 && created) return { ok: true, value: created };
      return failure('invalid_response');
    },
    async selectChild({ accessToken, childId }) {
      const result = await post(authEndpoints.selectChild, { childId }, accessToken);
      if ('code' in result) return { ok: false, error: result };
      if (result.status === 401 || result.status === 403) return failure('session_expired');
      if (result.status >= 200 && result.status < 300) return { ok: true, value: { childId } };
      return failure('rejected');
    },
  };
}

export const productionAuthClient = createProductionAuthClient();
