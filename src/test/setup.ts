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

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  Link: ({ children }: { children: unknown }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));
