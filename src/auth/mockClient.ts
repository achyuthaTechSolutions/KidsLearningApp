import { canonicalIdentifier } from './validation';
import {
  type AgeBand,
  type AuthClient,
  type AuthResult,
  type AvatarId,
  type ChildProfile,
  type RegisterInput,
  type SessionGrant,
  type VerificationChallenge,
} from './contract';

interface MockUser {
  id: string;
  name: string;
  identifier: string;
  password: string;
  verified: boolean;
  pendingId: string;
  code: string;
  codeExpiresAt: number;
  attempts: number;
  nextResendAt: number;
  children: ChildProfile[];
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const users = new Map<string, MockUser>();
const byPending = new Map<string, MockUser>();
const byAccess = new Map<string, MockUser>();
const byRefresh = new Map<string, MockUser>();

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

function sixDigit(): string {
  const bytes = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else bytes[0] = Math.floor(Math.random() * 1_000_000);
  return String(bytes[0] % 1_000_000).padStart(6, '0');
}

function issueCode(user: MockUser): void {
  user.code = sixDigit();
  user.codeExpiresAt = Date.now() + 10 * 60 * 1000;
  user.attempts = 0;
}

function challenge(user: MockUser): VerificationChallenge {
  return { verificationRequired: true, pendingId: user.pendingId, retryAfterSeconds: 0 };
}

function grant(user: MockUser): SessionGrant {
  user.accessToken = randomId('access');
  user.refreshToken = randomId('refresh');
  user.expiresAt = Date.now() + 15 * 60 * 1000;
  byAccess.set(user.accessToken, user);
  byRefresh.set(user.refreshToken, user);
  return {
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
    expiresAt: user.expiresAt,
    parent: { id: user.id, name: user.name },
  };
}

function parentFromAccess(accessToken: string): MockUser | null {
  const user = byAccess.get(accessToken);
  if (!user || user.expiresAt <= Date.now()) return null;
  return user;
}

function invalid(): AuthResult<never> {
  return { ok: false, error: { code: 'invalid_credentials' } };
}

export function resetMockAuthServer(): void {
  users.clear();
  byPending.clear();
  byAccess.clear();
  byRefresh.clear();
}

/** Test helper. Production screens must not import this. The code is never returned by the API. */
export function readDevVerificationCode(pendingId: string): string | null {
  return byPending.get(pendingId)?.code ?? null;
}

export const mockAuthClient: AuthClient = {
  async login({ identifier, password }) {
    const canonical = canonicalIdentifier(identifier);
    const user = canonical ? users.get(canonical.value) : undefined;
    if (!user || user.password !== password) return invalid();
    if (!user.verified) return { ok: true, value: challenge(user) };
    return { ok: true, value: grant(user) };
  },
  async register(input: RegisterInput) {
    if (!input.acceptedTerms) return { ok: false, error: { code: 'rejected' } };
    const canonical = canonicalIdentifier(input.identifier);
    if (!canonical) return { ok: false, error: { code: 'rejected' } };
    if (users.has(canonical.value)) return { ok: false, error: { code: 'rejected' } };
    const user: MockUser = {
      id: randomId('parent'),
      name: input.name.trim(),
      identifier: canonical.value,
      password: input.password,
      verified: false,
      pendingId: randomId('pending'),
      code: '',
      codeExpiresAt: 0,
      attempts: 0,
      nextResendAt: 0,
      children: [],
      accessToken: '',
      refreshToken: '',
      expiresAt: 0,
    };
    issueCode(user);
    users.set(user.identifier, user);
    byPending.set(user.pendingId, user);
    return { ok: true, value: challenge(user) };
  },
  async forgot() {
    return { ok: true, value: { accepted: true } };
  },
  async verify({ pendingId, code }) {
    const user = byPending.get(pendingId);
    if (!user || user.verified) return { ok: false, error: { code: 'verification_failed' } };
    if (user.attempts >= 5 || user.codeExpiresAt <= Date.now() || user.code !== code.trim()) {
      user.attempts += 1;
      return { ok: false, error: { code: 'verification_failed' } };
    }
    user.verified = true;
    user.code = '';
    return { ok: true, value: grant(user) };
  },
  async resend({ pendingId }) {
    const user = byPending.get(pendingId);
    if (!user || user.verified) return { ok: false, error: { code: 'verification_failed' } };
    const now = Date.now();
    if (user.nextResendAt > now) {
      return { ok: false, error: { code: 'rate_limited', retryAfterSeconds: Math.ceil((user.nextResendAt - now) / 1000) } };
    }
    issueCode(user);
    user.nextResendAt = now + 30_000;
    return { ok: true, value: { retryAfterSeconds: 30 } };
  },
  async refresh({ refreshToken }) {
    const user = byRefresh.get(refreshToken);
    if (!user || !user.verified) return { ok: false, error: { code: 'session_expired' } };
    byRefresh.delete(refreshToken);
    byAccess.delete(user.accessToken);
    return { ok: true, value: grant(user) };
  },
  async logout({ accessToken }) {
    const user = byAccess.get(accessToken);
    if (!user) return;
    byAccess.delete(user.accessToken);
    byRefresh.delete(user.refreshToken);
    user.accessToken = '';
    user.refreshToken = '';
    user.expiresAt = 0;
  },
  async listChildren({ accessToken }) {
    const user = parentFromAccess(accessToken);
    if (!user) return { ok: false, error: { code: 'session_expired' } };
    return { ok: true, value: user.children.map((child) => ({ ...child })) };
  },
  async createChild({ accessToken, nickname, ageBand, avatar }) {
    const user = parentFromAccess(accessToken);
    if (!user) return { ok: false, error: { code: 'session_expired' } };
    if (user.children.length >= 4) return { ok: false, error: { code: 'child_limit' } };
    const child: ChildProfile = { id: randomId('child'), nickname: nickname.trim(), ageBand: ageBand as AgeBand, avatar: avatar as AvatarId };
    user.children.push(child);
    return { ok: true, value: { ...child } };
  },
  async selectChild({ accessToken, childId }) {
    const user = parentFromAccess(accessToken);
    if (!user) return { ok: false, error: { code: 'session_expired' } };
    if (!user.children.some((child) => child.id === childId)) return { ok: false, error: { code: 'rejected' } };
    return { ok: true, value: { childId } };
  },
};
