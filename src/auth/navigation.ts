export interface SignedOutPhase {
  kind: 'signedOut';
  onboardingComplete: boolean;
}

export interface VerifyPhase {
  kind: 'verify';
  pendingId: string;
  identifier: string;
  retryAt: number;
}

export interface ChooseChildPhase {
  kind: 'chooseChild';
  parentName: string;
}

export interface ReadyPhase {
  kind: 'ready';
  parentName: string;
  childId: string;
}

export type AuthPhase =
  | { kind: 'loading' }
  | SignedOutPhase
  | VerifyPhase
  | ChooseChildPhase
  | ReadyPhase;

const signedOutPaths = new Set(['/welcome', '/login', '/register', '/forgot', '/legal-terms', '/legal-privacy']);
const verifyPaths = new Set(['/verify', '/legal-terms', '/legal-privacy']);
const childPaths = new Set(['/children', '/add-child', '/legal-terms', '/legal-privacy']);
const authOnlyPaths = new Set([
  '/welcome',
  '/login',
  '/register',
  '/forgot',
  '/verify',
  '/children',
  '/add-child',
  '/legal-terms',
  '/legal-privacy',
]);

export function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split('?')[0] ?? '/';
  const withoutGroups = withoutQuery.replace(/\/\([^/]+\)/g, '') || '/';
  const withSlash = withoutGroups.startsWith('/') ? withoutGroups : `/${withoutGroups}`;
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}

export function landingPath(phase: AuthPhase): string {
  if (phase.kind === 'verify') return '/verify';
  if (phase.kind === 'chooseChild') return '/children';
  if (phase.kind === 'ready') return '/';
  if (phase.kind === 'signedOut' && phase.onboardingComplete) return '/login';
  return '/welcome';
}

/** Returns a path to open, or null when the current path is already allowed. */
export function decideNavigation(phase: AuthPhase, pathname: string): string | null {
  if (phase.kind === 'loading') return null;
  const path = normalizePath(pathname);
  let next: string | null = null;
  if (phase.kind === 'signedOut') next = signedOutPaths.has(path) ? null : landingPath(phase);
  else if (phase.kind === 'verify') next = verifyPaths.has(path) ? null : '/verify';
  else if (phase.kind === 'chooseChild') next = childPaths.has(path) ? null : '/children';
  else next = authOnlyPaths.has(path) ? '/' : null;
  if (next === path) return null;
  return next;
}
