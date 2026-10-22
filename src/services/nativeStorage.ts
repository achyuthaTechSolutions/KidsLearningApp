import { restoreMirroredStorage, setStorageMirror } from './storage';

/** On Android, copy app preferences into local storage before the app reads progress. */
export async function enableNativeStorageMirror(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { Preferences } = await import('@capacitor/preferences');
    setStorageMirror({
      get: async (key) => (await Preferences.get({ key })).value,
      set: (key, value) => Preferences.set({ key, value }),
      remove: (key) => Preferences.remove({ key }),
    });
    await restoreMirroredStorage();
  } catch {
    // The browser build keeps using localStorage only.
  }
}
