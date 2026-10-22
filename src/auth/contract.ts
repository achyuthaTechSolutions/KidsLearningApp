/**
 * Account contract the phone app is ready to call.
 * No server in this repository implements these paths.
 * Production builds report that the service is unavailable.
 * They do not invent a successful login.
 */
export const authEndpoints = {
  login: '/v1/auth/login',
  register: '/v1/auth/register',
  forgot: '/v1/auth/forgot',
  verify: '/v1/auth/verify',
  resend: '/v1/auth/resend',
  refresh: '/v1/auth/refresh',
  logout: '/v1/auth/logout',
  children: '/v1/children',
  selectChild: '/v1/session/child',
} as const;

export type AgeBand = '3-4' | '5-6' | '7-8';
export type AvatarId = 'lion' | 'rabbit' | 'elephant' | 'turtle' | 'monkey';

export interface ParentAccount {
  id: string;
  name: string;
}

export interface SessionGrant {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  parent: ParentAccount;
}

export interface VerificationChallenge {
  verificationRequired: true;
  pendingId: string;
  retryAfterSeconds: number;
}

export interface ChildProfile {
  id: string;
  nickname: string;
  ageBand: AgeBand;
  avatar: AvatarId;
}

export type AuthFailureCode =
  | 'invalid_credentials'
  | 'unavailable'
  | 'network'
  | 'rate_limited'
  | 'verification_failed'
  | 'rejected'
  | 'session_expired'
  | 'child_limit'
  | 'invalid_response';

export interface AuthFailure {
  code: AuthFailureCode;
  retryAfterSeconds?: number;
}

export type AuthResult<T> = { ok: true; value: T } | { ok: false; error: AuthFailure };

export interface RegisterInput {
  name: string;
  identifier: string;
  password: string;
  acceptedTerms: boolean;
}

export interface AuthClient {
  login(input: { identifier: string; password: string }): Promise<AuthResult<SessionGrant | VerificationChallenge>>;
  register(input: RegisterInput): Promise<AuthResult<SessionGrant | VerificationChallenge>>;
  forgot(input: { identifier: string }): Promise<AuthResult<{ accepted: true }>>;
  verify(input: { pendingId: string; code: string }): Promise<AuthResult<SessionGrant>>;
  resend(input: { pendingId: string }): Promise<AuthResult<{ retryAfterSeconds: number }>>;
  refresh(input: { refreshToken: string }): Promise<AuthResult<SessionGrant>>;
  logout(input: { accessToken: string }): Promise<void>;
  listChildren(input: { accessToken: string }): Promise<AuthResult<ChildProfile[]>>;
  createChild(input: { accessToken: string; nickname: string; ageBand: AgeBand; avatar: AvatarId }): Promise<AuthResult<ChildProfile>>;
  selectChild(input: { accessToken: string; childId: string }): Promise<AuthResult<{ childId: string }>>;
}

export function isVerification(value: SessionGrant | VerificationChallenge): value is VerificationChallenge {
  return 'verificationRequired' in value && value.verificationRequired === true;
}
