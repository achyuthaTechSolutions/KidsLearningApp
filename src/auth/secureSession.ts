import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'kids-learning-session';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  parentId: string;
  parentName: string;
  selectedChildId: string | null;
}

function parseStored(raw: string | null): StoredSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof value.accessToken !== 'string' || typeof value.refreshToken !== 'string') return null;
    if (typeof value.expiresAt !== 'number' || typeof value.parentId !== 'string' || typeof value.parentName !== 'string') return null;
    if (value.selectedChildId !== null && typeof value.selectedChildId !== 'string') return null;
    return {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
      expiresAt: value.expiresAt,
      parentId: value.parentId,
      parentName: value.parentName,
      selectedChildId: value.selectedChildId ?? null,
    };
  } catch {
    return null;
  }
}

export async function readSession(): Promise<StoredSession | null> {
  try {
    return parseStored(await SecureStore.getItemAsync(SESSION_KEY));
  } catch {
    return null;
  }
}

export async function writeSession(session: StoredSession): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
    return true;
  } catch {
    return false;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // The in-memory phase is cleared by the caller even if the keystore is busy.
  }
}
