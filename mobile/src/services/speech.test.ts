import * as Speech from 'expo-speech';
import { cancelSpeech, refreshVoices, speak, speechQueueToken } from './speech';

describe('speech adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stops the previous line before speaking and prefers the softer voice', async () => {
    await refreshVoices();
    speak('Apple', { voice: null, volume: 1, rate: 0.9 });
    speak('Ball', { volume: 1 });
    expect(Speech.stop).toHaveBeenCalled();
    const options = (Speech.speak as jest.Mock).mock.calls.at(-1)?.[1];
    expect(options.voice).toBe('en-us-x-sfg-local');
    expect(options.pitch).toBeGreaterThan(1);
    expect(options.pitch).toBeLessThan(1.25);
  });

  it('does not continue an old line after speech is cancelled', () => {
    speak('Hello', {
      volume: 1,
      onEnd: () => speak('Next', { volume: 1 }),
    });
    const token = speechQueueToken();
    const options = (Speech.speak as jest.Mock).mock.calls.at(-1)?.[1];
    cancelSpeech();
    options.onDone();
    expect(speechQueueToken()).toBeGreaterThan(token);
    expect((Speech.speak as jest.Mock).mock.calls.filter((call) => call[0] === 'Next')).toHaveLength(0);
  });
});
