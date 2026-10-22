import type { AuthFailureCode } from './contract';
import type { MessageKey } from '../i18n/messages';

export function messageForFailure(code: AuthFailureCode, context: 'forgot' | 'generic' = 'generic'): MessageKey {
  if (context === 'forgot' && (code === 'unavailable' || code === 'network' || code === 'invalid_response')) return 'forgotUnavailable';
  switch (code) {
    case 'invalid_credentials':
      return 'invalidCredentials';
    case 'network':
      return 'network';
    case 'rate_limited':
      return 'rateLimited';
    case 'verification_failed':
      return 'verificationFailed';
    case 'rejected':
      return 'rejected';
    case 'session_expired':
      return 'sessionExpired';
    case 'child_limit':
      return 'childLimit';
    default:
      return 'unavailable';
  }
}
