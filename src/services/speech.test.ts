import { describe, expect, it } from 'vitest';
import {
  DEEP_VOICE_PITCH,
  GENTLE_PITCH,
  isChildVoiceName,
  pickKidsVoice,
  pitchForVoice,
  resolveVoice,
  speechVolumeFor,
} from './speech';

function voice(
  name: string,
  lang = 'en-US',
  localService = true,
): SpeechSynthesisVoice {
  return { name, lang, localService, default: false, voiceURI: name } as SpeechSynthesisVoice;
}

describe('Voice selection', () => {
  it('prefers a lighter English voice over a deep adult voice', () => {
    const chosen = pickKidsVoice([
      voice('Microsoft David Desktop'),
      voice('Microsoft Zira Desktop'),
      voice('Microsoft Mark'),
    ]);
    expect(chosen?.name).toBe('Microsoft Zira Desktop');
  });

  it('prefers an on-device youthful voice when one is installed', () => {
    const chosen = pickKidsVoice([
      voice('Microsoft Zira Desktop'),
      voice('English Child'),
    ]);
    expect(chosen?.name).toBe('English Child');
    expect(isChildVoiceName('English Child')).toBe(true);
    expect(isChildVoiceName('Microsoft Zira Desktop')).toBe(false);
  });

  it('stays with English when other languages are present', () => {
    const chosen = pickKidsVoice([
      voice('Microsoft Hortense', 'fr-FR'),
      voice('Microsoft David Desktop', 'en-US'),
    ]);
    expect(chosen?.lang.startsWith('en')).toBe(true);
  });

  it('prefers an on-device Android female voice over an on-device male voice', () => {
    const chosen = pickKidsVoice([
      voice('en-us-x-iom-local'),
      voice('en-us-x-sfg-local'),
    ]);
    expect(chosen?.name).toBe('en-us-x-sfg-local');
  });

  it('keeps the offline voice when a youthful voice needs a network', () => {
    const chosen = pickKidsVoice([
      voice('English Child', 'en-US', false),
      voice('en-us-x-sfg-local'),
    ]);
    expect(chosen?.name).toBe('en-us-x-sfg-local');
  });

  it('falls back when the saved voice is not on this device', () => {
    const voices = [
      voice('Microsoft David Desktop'),
      voice('Microsoft Zira Desktop'),
    ];
    expect(resolveVoice(voices, 'Saved Voice That Left')?.name).toBe('Microsoft Zira Desktop');
    expect(resolveVoice(voices, 'Microsoft David Desktop')?.name).toBe('Microsoft David Desktop');
  });

  it('keeps pitch gentle for both soft and deep voices', () => {
    expect(pitchForVoice(voice('Microsoft Zira Desktop'))).toBe(GENTLE_PITCH);
    expect(pitchForVoice(voice('en-us-x-iom-local'))).toBe(DEEP_VOICE_PITCH);
    expect(pitchForVoice(voice('English Child'))).toBe(GENTLE_PITCH);
    expect(DEEP_VOICE_PITCH).toBeLessThan(1.25);
  });
});

describe('Speech volume', () => {
  it('is full at the default Volume setting and scales evenly below it', () => {
    expect(speechVolumeFor(0.7)).toBe(1);
    expect(speechVolumeFor(1)).toBe(1);
    expect(speechVolumeFor(0.35)).toBeCloseTo(0.5);
    expect(speechVolumeFor(0.07)).toBeCloseTo(0.1);
  });

  it('stays silent at 0 and ignores bad values', () => {
    expect(speechVolumeFor(0)).toBe(0);
    expect(speechVolumeFor(-1)).toBe(0);
    expect(speechVolumeFor(Number.NaN)).toBe(0);
  });
});
