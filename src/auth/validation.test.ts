import { canonicalIdentifier, validateNickname, validatePassword, validateRegistration } from './validation';

describe('account validation', () => {
  it('trims identifiers and keeps password characters', () => {
    expect(canonicalIdentifier('  Parent@Example.com ')).toEqual({ kind: 'email', value: 'parent@example.com' });
    expect(canonicalIdentifier(' 98765 43210 ')).toEqual({ kind: 'mobile', value: '+919876543210' });
    expect(canonicalIdentifier('not-an-id')).toBeNull();
    expect(validatePassword(' Story1 ')).toBeNull();
    expect(validatePassword('short1')).toBe('passwordWeak');
    expect(validatePassword('')).toBe('passwordRequired');
  });

  it('requires a parent name, matching passwords, and accepted terms', () => {
    expect(validateRegistration({
      name: 'A',
      identifier: 'parent@example.com',
      password: 'Storybook1',
      confirmation: 'Storybook1',
      acceptedTerms: true,
    }).name).toBe('nameRequired');
    expect(validateRegistration({
      name: 'Ada Parent',
      identifier: 'parent@example.com',
      password: 'Storybook1',
      confirmation: 'different1',
      acceptedTerms: true,
    }).confirmation).toBe('passwordMismatch');
    expect(validateRegistration({
      name: 'Ada Parent',
      identifier: 'parent@example.com',
      password: 'Storybook1',
      confirmation: 'Storybook1',
      acceptedTerms: false,
    }).terms).toBe('termsRequired');
  });

  it('accepts a short nickname and rejects an empty one', () => {
    expect(validateNickname('  Sunny ')).toBeNull();
    expect(validateNickname('')).toBe('nicknameRequired');
    expect(validateNickname('!')).toBe('nicknameInvalid');
  });
});
