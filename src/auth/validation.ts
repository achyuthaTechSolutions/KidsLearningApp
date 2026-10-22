import type { MessageKey } from '../i18n/messages';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type IdentifierKind = 'email' | 'mobile';

export interface CanonicalIdentifier {
  kind: IdentifierKind;
  value: string;
}

/** Trims surrounding whitespace. Mobile numbers may include spaces or hyphens. Passwords are never passed here. */
export function canonicalIdentifier(raw: string): CanonicalIdentifier | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 254) return null;
  if (trimmed.includes('@')) {
    if (!emailPattern.test(trimmed) || /\s/.test(trimmed)) return null;
    return { kind: 'email', value: trimmed.toLowerCase() };
  }
  const compact = trimmed.replace(/[\s-]/g, '');
  const match = compact.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
  if (!match) return null;
  return { kind: 'mobile', value: `+91${match[1]}` };
}

export function validateIdentifier(raw: string): MessageKey | null {
  if (!raw.trim()) return 'identifierRequired';
  return canonicalIdentifier(raw) ? null : 'identifierInvalid';
}

export function validatePassword(password: string): MessageKey | null {
  if (!password) return 'passwordRequired';
  if (password.length < 8 || password.length > 72 || !/\p{L}/u.test(password) || !/\p{N}/u.test(password)) return 'passwordWeak';
  return null;
}

export function validateParentName(name: string): MessageKey | null {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 60 || !/\p{L}/u.test(trimmed)) return 'nameRequired';
  return null;
}

export function validateNickname(nickname: string): MessageKey | null {
  const trimmed = nickname.trim();
  if (!trimmed) return 'nicknameRequired';
  if (trimmed.length < 2 || trimmed.length > 20 || !/^[\p{L}\p{N} ]+$/u.test(trimmed) || !/\p{L}/u.test(trimmed)) return 'nicknameInvalid';
  return null;
}

export interface RegisterFieldErrors {
  name?: MessageKey;
  identifier?: MessageKey;
  password?: MessageKey;
  confirmation?: MessageKey;
  terms?: MessageKey;
}

export function validateRegistration(input: {
  name: string;
  identifier: string;
  password: string;
  confirmation: string;
  acceptedTerms: boolean;
}): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const name = validateParentName(input.name);
  const identifier = validateIdentifier(input.identifier);
  const password = validatePassword(input.password);
  if (name) errors.name = name;
  if (identifier) errors.identifier = identifier;
  if (password) errors.password = password;
  if (!password && input.password !== input.confirmation) errors.confirmation = 'passwordMismatch';
  if (!input.acceptedTerms) errors.terms = 'termsRequired';
  return errors;
}

export function hasErrors(errors: RegisterFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
