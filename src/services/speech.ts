import {
  GENTLE_PITCH,
  isEnglishVoice,
  pitchForVoice,
  resolveVoice,
} from '../../packages/learning-core/src/speech/voices';
import { animalSpeech, letterSpeech, numberSpeech } from '../../packages/learning-core/src/speech/lines';

export {
  DEEP_VOICE_PITCH,
  GENTLE_PITCH,
  RECOMMENDED_VOICE_LABEL,
  VOICE_PREVIEW_TEXT,
  isChildVoiceName,
  isEnglishVoice,
  pickKidsVoice,
  pitchForVoice,
  resolveVoice,
} from '../../packages/learning-core/src/speech/voices';

let lastText = '';
let speakToken = 0;
let speechVolume = 1;

export function setSpeechVolume(volume: number): void {
  speechVolume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
}

function getSynth(): SpeechSynthesis | null {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis;
  }
  return null;
}

export function isSpeechAvailable(): boolean {
  return getSynth() !== null;
}

export function getVoices(): SpeechSynthesisVoice[] {
  const synth = getSynth();
  if (!synth) return [];
  return synth.getVoices().filter((voice) => isEnglishVoice(voice.lang));
}

/**
 * Device voices for a language such as "te" or "hi", on-device first. English uses
 * the soft-voice choice below instead, so a parent's English voice setting still wins.
 */
export function voicesForLanguage(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice[] {
  const code = lang.toLowerCase();
  return voices
    .filter((voice) => voice.lang.toLowerCase().replace('_', '-').split('-')[0] === code)
    .sort((a, b) => Number(b.localService !== false) - Number(a.localService !== false) || a.name.localeCompare(b.name));
}

/** True when this device can speak the language. Voices may load a moment after start-up. */
export function hasVoiceForLanguage(lang: string): boolean {
  if (lang === 'en') return isSpeechAvailable();
  const synth = getSynth();
  return synth ? voicesForLanguage(synth.getVoices(), lang).length > 0 : false;
}

export function speak(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    voice?: string;
    volume?: number;
    onEnd?: () => void;
    /** Language code such as "te" or "hi". Omitted or "en" keeps the English soft voice. */
    lang?: string;
    /** BCP 47 tag for the utterance, such as "te-IN". */
    langTag?: string;
    /** Called instead of speaking when no voice for `lang` is installed. */
    onUnavailable?: () => void;
  },
): void {
  const synth = getSynth();
  if (!synth) {
    // No speech on this device (some Android WebViews): report "done" so callers waiting on it carry on.
    options?.onUnavailable?.();
    options?.onEnd?.();
    return;
  }

  synth.cancel();
  lastText = text;
  const token = ++speakToken;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 0.9;
  utterance.volume = options?.volume ?? speechVolume;

  if (options?.onEnd) {
    // A blocked or failed utterance fires "error" instead of "end"; either way, report it once.
    // Speech that was cancelled or replaced stays silent, so it cannot trigger the next step.
    let ended = false;
    const end = () => {
      if (ended || token !== speakToken) return;
      ended = true;
      options.onEnd?.();
    };
    utterance.onend = end;
    utterance.onerror = end;
  }

  const otherLanguage = options?.lang && options.lang !== 'en' ? options.lang : undefined;
  if (options?.langTag) utterance.lang = options.langTag;

  let started = false;
  const begin = (voices: SpeechSynthesisVoice[]) => {
    if (token !== speakToken || started) return;
    started = true;
    if (otherLanguage) {
      // Never read Telugu or Hindi with an English voice: say so and let the text carry the story.
      const match = voicesForLanguage(voices, otherLanguage)[0];
      if (!match) {
        options?.onUnavailable?.();
        options?.onEnd?.();
        return;
      }
      utterance.voice = match;
      utterance.pitch = options?.pitch ?? GENTLE_PITCH;
      if (utterance.volume <= 0) return;
      synth.speak(utterance);
      return;
    }
    const voice = resolveVoice(voices, options?.voice);
    if (voice) utterance.voice = voice;
    utterance.pitch = options?.pitch ?? pitchForVoice(voice);
    if (utterance.volume <= 0) return;
    synth.speak(utterance);
  };

  const voices = synth.getVoices();
  if (voices.length > 0) {
    begin(voices);
    return;
  }

  const onVoices = () => {
    const ready = synth.getVoices();
    if (ready.length === 0) return;
    synth.removeEventListener('voiceschanged', onVoices);
    begin(ready);
  };
  synth.addEventListener('voiceschanged', onVoices);
  window.setTimeout(() => {
    synth.removeEventListener('voiceschanged', onVoices);
    if (token === speakToken) begin(synth.getVoices());
  }, 300);
}

export function cancelSpeech(): void {
  speakToken += 1;
  getSynth()?.cancel();
}

export function repeatLast(options?: { rate?: number; voice?: string }): void {
  if (lastText) speak(lastText, options);
}

export function speakLetter(letter: string, word: string, rate?: number): void {
  speak(letterSpeech(letter, word), { rate });
}

export function speakNumber(_num: number, word: string, description: string, rate?: number): void {
  speak(numberSpeech(word, description), { rate });
}

export function speakAnimal(name: string, description: string, sound: string, rate?: number): void {
  speak(animalSpeech(name, description, sound), { rate });
}
