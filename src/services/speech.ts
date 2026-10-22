let lastText = '';
let speakToken = 0;
let speechVolume = 1;

const CHILD_VOICE = /child|kid|boy|girl|junior/i;
const SOFT_VOICE = /zira|aria|jenny|sonia|libby|hazel|susan|samantha|karen|moira|tessa|veena|heera|ana|female|woman|sfg|tpf|gba/i;
const DEEP_VOICE = /david|mark|guy|george|ravi|male|\biom\b|iob|gbb|rjs/i;

/** A small lift keeps speech clear. It is not a cartoon pitch. */
export const GENTLE_PITCH = 1.08;
export const DEEP_VOICE_PITCH = 1.14;

export const RECOMMENDED_VOICE_LABEL = 'Soft voice (recommended)';
export const VOICE_PREVIEW_TEXT = "Hello! Let's learn something fun today.";

export function isChildVoiceName(name: string): boolean {
  return CHILD_VOICE.test(name);
}

export function isEnglishVoice(lang: string): boolean {
  return lang.toLowerCase().replace('_', '-').startsWith('en');
}

function voiceScore(voice: Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'localService'>): number {
  let value = 0;
  const onDevice = voice.localService !== false;
  value += onDevice ? 80 : -40;
  if (isChildVoiceName(voice.name)) value += onDevice ? 100 : 10;
  if (SOFT_VOICE.test(voice.name)) value += 45;
  if (DEEP_VOICE.test(voice.name)) value -= 50;
  const lang = voice.lang.toLowerCase().replace('_', '-');
  if (lang.startsWith('en-us')) value += 8;
  else if (lang.startsWith('en')) value += 4;
  return value;
}

export function pickKidsVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((voice) => isEnglishVoice(voice.lang));
  const pool = english.length > 0 ? english : voices;
  return [...pool].sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name))[0];
}

/** Uses the saved voice when this device still has it, otherwise the soft on-device fallback. */
export function resolveVoice(
  voices: SpeechSynthesisVoice[],
  requestedName?: string | null,
): SpeechSynthesisVoice | undefined {
  if (requestedName) {
    const match = voices.find((voice) => voice.name === requestedName);
    if (match) return match;
  }
  return pickKidsVoice(voices);
}

export function pitchForVoice(voice: Pick<SpeechSynthesisVoice, 'name'> | undefined): number {
  if (voice && DEEP_VOICE.test(voice.name) && !isChildVoiceName(voice.name)) return DEEP_VOICE_PITCH;
  return GENTLE_PITCH;
}

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
  speak(`Letter ${letter}. ${letter} is for ${word}. ${word} starts with the sound ${letter}.`, { rate });
}

export function speakNumber(_num: number, word: string, description: string, rate?: number): void {
  speak(`${word}! ${description}`, { rate });
}

export function speakAnimal(name: string, description: string, sound: string, rate?: number): void {
  speak(`${name}! ${description} ${name} says ${sound}!`, { rate });
}
