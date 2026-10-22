import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { getAuthClient } from './client';
import {
  isVerification,
  type AgeBand,
  type AuthClient,
  type AuthFailure,
  type AvatarId,
  type ChildProfile,
  type RegisterInput,
  type SessionGrant,
} from './contract';
import { type AuthPhase } from './navigation';
import { markOnboardingComplete, readOnboardingComplete } from './onboarding';
import { clearSession, readSession, writeSession, type StoredSession } from './secureSession';

interface AuthContextValue {
  phase: AuthPhase;
  profiles: ChildProfile[];
  busy: boolean;
  error: AuthFailure | null;
  clearError: () => void;
  completeOnboarding: () => Promise<void>;
  signIn: (input: { identifier: string; password: string }) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  requestRecovery: (identifier: string) => Promise<'accepted' | 'failed'>;
  confirmCode: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  addChild: (input: { nickname: string; ageBand: AgeBand; avatar: AvatarId }) => Promise<boolean>;
  chooseChild: (childId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function storedFrom(grant: SessionGrant, selectedChildId: string | null): StoredSession {
  return {
    accessToken: grant.accessToken,
    refreshToken: grant.refreshToken,
    expiresAt: grant.expiresAt,
    parentId: grant.parent.id,
    parentName: grant.parent.name,
    selectedChildId,
  };
}

export function AuthProvider({ children, client }: { children: ReactNode; client?: AuthClient }) {
  const auth = client ?? getAuthClient();
  const [phase, setPhase] = useState<AuthPhase>({ kind: 'loading' });
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthFailure | null>(null);
  const sessionRef = useRef<StoredSession | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);

  const alive = (id: number) => id === generation.current;

  async function enterSession(grant: SessionGrant, selectedChildId: string | null, id: number) {
    if (!alive(id)) return;
    const stored = storedFrom(grant, selectedChildId);
    const saved = await writeSession(stored);
    if (!alive(id)) return;
    if (!saved) {
      setError({ code: 'unavailable' });
      return;
    }
    sessionRef.current = stored;
    const listed = await auth.listChildren({ accessToken: stored.accessToken });
    if (!alive(id)) return;
    if (!listed.ok) {
      if (listed.error.code === 'session_expired' || listed.error.code === 'invalid_credentials') {
        await clearSession();
        sessionRef.current = null;
        const onboardingComplete = await readOnboardingComplete();
        if (alive(id)) setPhase({ kind: 'signedOut', onboardingComplete });
        return;
      }
      setProfiles([]);
      setError(listed.error);
      if (stored.selectedChildId) setPhase({ kind: 'ready', parentName: stored.parentName, childId: stored.selectedChildId });
      else setPhase({ kind: 'chooseChild', parentName: stored.parentName });
      return;
    }
    setProfiles(listed.value);
    const selected = listed.value.find((child) => child.id === stored.selectedChildId);
    if (selected) setPhase({ kind: 'ready', parentName: stored.parentName, childId: selected.id });
    else setPhase({ kind: 'chooseChild', parentName: stored.parentName });
  }

  useEffect(() => {
    const id = ++generation.current;
    void (async () => {
      const onboardingComplete = await readOnboardingComplete();
      const stored = await readSession();
      if (!alive(id)) return;
      if (!stored) {
        setPhase({ kind: 'signedOut', onboardingComplete });
        return;
      }
      let grant: SessionGrant = {
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        expiresAt: stored.expiresAt,
        parent: { id: stored.parentId, name: stored.parentName },
      };
      if (stored.expiresAt <= Date.now()) {
        const refreshed = await auth.refresh({ refreshToken: stored.refreshToken });
        if (!alive(id)) return;
        if (!refreshed.ok) {
          await clearSession();
          setPhase({ kind: 'signedOut', onboardingComplete });
          return;
        }
        grant = refreshed.value;
      }
      await enterSession(grant, stored.selectedChildId, id);
    })();
    return () => {
      generation.current += 1;
    };
    // enterSession closes over auth, which is the intended client for this provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const current = sessionRef.current;
      if (!current || current.expiresAt > Date.now()) return;
      const id = ++generation.current;
      void auth.refresh({ refreshToken: current.refreshToken }).then(async (refreshed) => {
        if (!alive(id)) return;
        if (!refreshed.ok) {
          await clearSession();
          sessionRef.current = null;
          const onboardingComplete = await readOnboardingComplete();
          if (alive(id)) setPhase({ kind: 'signedOut', onboardingComplete });
          return;
        }
        await enterSession(refreshed.value, current.selectedChildId, id);
      });
    });
    return () => subscription.remove();
  }, [auth]);

  async function withLock(task: (id: number) => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    const id = ++generation.current;
    try {
      await task(id);
    } finally {
      lock.current = false;
      if (alive(id)) setBusy(false);
    }
  }

  const value: AuthContextValue = {
    phase,
    profiles,
    busy,
    error,
    clearError: () => setError(null),
    completeOnboarding: async () => {
      await markOnboardingComplete();
      setPhase((current) => (current.kind === 'signedOut' ? { kind: 'signedOut', onboardingComplete: true } : current));
    },
    signIn: (input) => withLock(async (id) => {
      const result = await auth.login(input);
      if (!alive(id)) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (isVerification(result.value)) {
        setPhase({ kind: 'verify', pendingId: result.value.pendingId, identifier: input.identifier.trim(), retryAt: Date.now() });
        return;
      }
      await enterSession(result.value, null, id);
    }),
    register: (input) => withLock(async (id) => {
      const result = await auth.register(input);
      if (!alive(id)) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (isVerification(result.value)) {
        setPhase({
          kind: 'verify',
          pendingId: result.value.pendingId,
          identifier: input.identifier.trim(),
          retryAt: Date.now() + result.value.retryAfterSeconds * 1000,
        });
        return;
      }
      await enterSession(result.value, null, id);
    }),
    requestRecovery: async (identifier) => {
      if (lock.current) return 'failed';
      lock.current = true;
      setBusy(true);
      setError(null);
      const id = ++generation.current;
      try {
        const result = await auth.forgot({ identifier });
        if (!alive(id)) return 'failed';
        if (!result.ok) {
          setError(result.error);
          return 'failed';
        }
        return 'accepted';
      } finally {
        lock.current = false;
        if (alive(id)) setBusy(false);
      }
    },
    confirmCode: (code) => withLock(async (id) => {
      if (phase.kind !== 'verify') return;
      const result = await auth.verify({ pendingId: phase.pendingId, code });
      if (!alive(id)) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await enterSession(result.value, null, id);
    }),
    resendCode: () => withLock(async (id) => {
      if (phase.kind !== 'verify') return;
      const result = await auth.resend({ pendingId: phase.pendingId });
      if (!alive(id)) return;
      if (!result.ok) {
        setError(result.error);
        if (result.error.retryAfterSeconds) {
          setPhase({ ...phase, retryAt: Date.now() + result.error.retryAfterSeconds * 1000 });
        }
        return;
      }
      setPhase({ ...phase, retryAt: Date.now() + result.value.retryAfterSeconds * 1000 });
    }),
    addChild: async (input) => {
      if (lock.current || !sessionRef.current) return false;
      lock.current = true;
      setBusy(true);
      setError(null);
      const id = ++generation.current;
      try {
        const result = await auth.createChild({ accessToken: sessionRef.current.accessToken, ...input });
        if (!alive(id)) return false;
        if (!result.ok) {
          setError(result.error);
          return false;
        }
        setProfiles((current) => [...current, result.value]);
        return true;
      } finally {
        lock.current = false;
        if (alive(id)) setBusy(false);
      }
    },
    chooseChild: (childId) => withLock(async (id) => {
      const current = sessionRef.current;
      if (!current) return;
      const result = await auth.selectChild({ accessToken: current.accessToken, childId });
      if (!alive(id)) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = { ...current, selectedChildId: childId };
      const saved = await writeSession(next);
      if (!alive(id)) return;
      if (!saved) {
        setError({ code: 'unavailable' });
        return;
      }
      sessionRef.current = next;
      setPhase({ kind: 'ready', parentName: current.parentName, childId });
    }),
    signOut: async () => {
      const id = ++generation.current;
      lock.current = false;
      const current = sessionRef.current;
      sessionRef.current = null;
      setProfiles([]);
      setBusy(false);
      setPhase({ kind: 'signedOut', onboardingComplete: true });
      if (current) await auth.logout({ accessToken: current.accessToken }).catch(() => undefined);
      if (!alive(id)) return;
      await clearSession();
      if (!alive(id)) return;
      const onboardingComplete = await readOnboardingComplete();
      if (alive(id)) setPhase({ kind: 'signedOut', onboardingComplete });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
