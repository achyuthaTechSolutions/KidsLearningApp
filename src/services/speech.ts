import {
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

export function speak(
  text: string,
  options?: { rate?: number; pitch?: number; voice?: string; volume?: number; onEnd?: () => void },
): void {
  const synth = getSynth();
  if (!synth) return;

  synth.cancel();
  lastText = text;
  const token = ++speakToken;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 0.9;
  utterance.volume = options?.volume ?? speechVolume;

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
  }

  let started = false;
  const begin = (voices: SpeechSynthesisVoice[]) => {
    if (token !== speakToken || started) return;
    started = true;
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
