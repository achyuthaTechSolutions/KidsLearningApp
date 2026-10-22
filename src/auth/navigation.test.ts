import { decideNavigation, normalizePath } from './navigation';

describe('auth navigation', () => {
  it('sends signed-out visitors to welcome until onboarding is stored', () => {
    expect(decideNavigation({ kind: 'signedOut', onboardingComplete: false }, '/keyboard')).toBe('/welcome');
    expect(decideNavigation({ kind: 'signedOut', onboardingComplete: true }, '/')).toBe('/login');
    expect(decideNavigation({ kind: 'signedOut', onboardingComplete: true }, '/login')).toBeNull();
  });

  it('keeps verification and child selection on their own screens', () => {
    expect(decideNavigation({ kind: 'verify', pendingId: 'p', identifier: 'a@b.co', retryAt: 0 }, '/login')).toBe('/verify');
    expect(decideNavigation({ kind: 'chooseChild', parentName: 'Ada' }, '/')).toBe('/children');
    expect(decideNavigation({ kind: 'chooseChild', parentName: 'Ada' }, '/add-child')).toBeNull();
  });

  it('returns a ready session to learning and ignores group prefixes', () => {
    expect(normalizePath('/(auth)/welcome')).toBe('/welcome');
    expect(decideNavigation({ kind: 'ready', parentName: 'Ada', childId: 'c' }, '/login')).toBe('/');
    expect(decideNavigation({ kind: 'ready', parentName: 'Ada', childId: 'c' }, '/alphabet')).toBeNull();
    expect(decideNavigation({ kind: 'loading' }, '/login')).toBeNull();
  });
});
