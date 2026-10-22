import { mockAuthAllowed } from './client';
import { readDevVerificationCode, mockAuthClient, resetMockAuthServer } from './mockClient';
import { createProductionAuthClient } from './productionClient';

describe('auth clients', () => {
  beforeEach(() => resetMockAuthServer());

  it('refuses the practice account outside development', () => {
    expect(mockAuthAllowed(false, 'mock')).toBe(false);
    expect(mockAuthAllowed(true, 'production')).toBe(false);
    expect(mockAuthAllowed(true, 'mock')).toBe(true);
  });

  it('does not sign in when no HTTPS account service is configured', async () => {
    const fetchImpl = jest.fn();
    const client = createProductionAuthClient({ baseUrl: 'http://example.test', fetchImpl });
    const result = await client.login({ identifier: 'parent@example.com', password: 'Storybook1' });
    expect(result).toEqual({ ok: false, error: { code: 'unavailable' } });
    expect(fetchImpl).not.toHaveBeenCalled();
    const missing = await createProductionAuthClient({ baseUrl: '  ', fetchImpl }).forgot({ identifier: 'parent@example.com' });
    expect(missing).toEqual({ ok: false, error: { code: 'unavailable' } });
  });

  it('uses the same sign-in failure for an unknown parent and a wrong password', async () => {
    await mockAuthClient.register({ name: 'Ada Parent', identifier: 'parent@example.com', password: 'Storybook1', acceptedTerms: true });
    const unknown = await mockAuthClient.login({ identifier: 'other@example.com', password: 'Storybook1' });
    const wrong = await mockAuthClient.login({ identifier: 'parent@example.com', password: 'nope' });
    expect(unknown).toEqual({ ok: false, error: { code: 'invalid_credentials' } });
    expect(wrong).toEqual(unknown);
  });

  it('confirms recovery without saying whether the account exists', async () => {
    const missing = await mockAuthClient.forgot({ identifier: 'missing@example.com' });
    const known = await mockAuthClient.forgot({ identifier: 'parent@example.com' });
    expect(missing).toEqual({ ok: true, value: { accepted: true } });
    expect(known).toEqual(missing);
  });

  it('rejects a wrong code and accepts the code held by the practice server', async () => {
    const registered = await mockAuthClient.register({
      name: 'Ada Parent',
      identifier: 'parent@example.com',
      password: 'Storybook1',
      acceptedTerms: true,
    });
    if (!registered.ok || !('pendingId' in registered.value)) throw new Error('expected verification');
    const wrong = await mockAuthClient.verify({ pendingId: registered.value.pendingId, code: '000000' });
    expect(wrong.ok).toBe(false);
    const code = readDevVerificationCode(registered.value.pendingId);
    const verified = await mockAuthClient.verify({ pendingId: registered.value.pendingId, code: code ?? '' });
    expect(verified.ok).toBe(true);
    const responseText = JSON.stringify(registered.value);
    expect(responseText).not.toContain(code);
  });
});
