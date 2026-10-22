import * as Speech from 'expo-speech';
import {
  isEnglishVoice,
  pitchForVoice,
  RECOMMENDED_VOICE_LABEL,
  resolveVoice,
  type ScorableVoice,
} from '@kids/learning-core';

export interface InstalledVoice extends ScorableVoice {
  identifier: string;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voice?: string | null;
  volume?: number;
  onEnd?: () => void;
}

let token = 0;
let lastText = '';
let voices: InstalledVoice[] = [];
let speechVolume = 1;

export { RECOMMENDED_VOICE_LABEL };

export function setSpeechVolume(volume: number): void {
  speechVolume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
}

export async function refreshVoices(): Promise<InstalledVoice[]> {
  try {
    const available = await Speech.getAvailableVoicesAsync();
    const english = available.filter((voice) => isEnglishVoice(voice.language));
    const pool = english.length > 0 ? english : available;
    voices = pool.map((voice) => ({
      name: voice.name,
      lang: voice.language,
      identifier: voice.identifier,
      localService: true,
    }));
  } catch {
    voices = [];
  }
  return voices;
}

export function getInstalledVoices(): InstalledVoice[] {
  return voices;
}

export function isSpeechAvailable(): boolean {
  return true;
}

export function speak(text: string, options?: SpeakOptions): void {
  const mine = ++token;
  lastText = text;
  const volume = options?.volume ?? speechVolume;
  void Speech.stop();
  if (volume <= 0 || !text) return;
  const voice = resolveVoice(voices, options?.voice);
  Speech.speak(text, {
    language: voice?.lang ?? 'en-US',
    rate: options?.rate ?? 0.9,
    pitch: options?.pitch ?? pitchForVoice(voice),
    volume,
    voice: voice?.identifier,
    useApplicationAudioSession: true,
    onDone: () => {
      if (mine !== token) return;
      options?.onEnd?.();
    },
    onStopped: () => {
      // A newer line replaced this one. Do not continue the old queue.
    },
    onError: () => {
      if (mine !== token) return;
    },
  });
}

export function speakLines(lines: string[], options?: SpeakOptions): void {
  const [first, ...rest] = lines;
  if (!first) return;
  speak(first, {
    ...options,
    onEnd: rest.length > 0 ? () => speakLines(rest, options) : options?.onEnd,
  });
}

export function cancelSpeech(): void {
  token += 1;
  void Speech.stop();
}

export function repeatLast(options?: SpeakOptions): void {
  if (lastText) speak(lastText, options);
}

export function speechQueueToken(): number {
  return token;
}
