process.env.EXPO_PUBLIC_AUTH_MODE = 'mock';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: async () => undefined,
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(async () => undefined),
  getAvailableVoicesAsync: jest.fn(async () => [
    { identifier: 'en-us-x-sfg-local', name: 'en-us-x-sfg-local', language: 'en-US', quality: 'Default' },
    { identifier: 'en-us-x-iom-local', name: 'en-us-x-iom-local', language: 'en-US', quality: 'Default' },
  ]),
  isSpeakingAsync: jest.fn(async () => false),
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => {
    const player = {
      volume: 1,
      play: jest.fn(),
      pause: jest.fn(),
      remove: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    };
    return player;
  }),
  setAudioModeAsync: jest.fn(async () => undefined),
  setIsAudioActiveAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-file-system', () => ({
  File: class {
    uri = 'file:///cache/kids-tones/tone.wav';
    exists = false;
    create() { this.exists = true; }
    writeSync() { this.exists = true; }
  },
  Directory: class {
    exists = true;
    create() { this.exists = true; }
  },
  Paths: { cache: 'cache' },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-router', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  };
  return {
    useRouter: () => mockRouter,
    usePathname: () => '/',
    Link: ({ children }: { children: unknown }) => children,
    Redirect: ({ href }: { href: string }) => href,
    Stack: Object.assign(({ children }: { children?: unknown }) => children ?? null, { Screen: () => null }),
    Tabs: { Screen: () => null },
    router: mockRouter,
  };
});

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
    AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __reset: () => store.clear(),
  };
});
