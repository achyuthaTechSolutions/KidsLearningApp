import { mockAuthClient } from './mockClient';
import { productionAuthClient } from './productionClient';
import type { AuthClient } from './contract';

export function mockAuthAllowed(dev: boolean, mode: string | undefined): boolean {
  return dev === true && mode === 'mock';
}

export function getAuthClient(): AuthClient {
  if (mockAuthAllowed(__DEV__, process.env.EXPO_PUBLIC_AUTH_MODE)) return mockAuthClient;
  return productionAuthClient;
}
