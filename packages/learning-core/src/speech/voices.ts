export const CHILD_VOICE = /child|kid|boy|girl|junior/i;
const SOFT_VOICE = /zira|aria|jenny|sonia|libby|hazel|susan|samantha|karen|moira|tessa|veena|heera|ana|female|woman|sfg|tpf|gba/i;
const DEEP_VOICE = /david|mark|guy|george|ravi|male|\biom\b|iob|gbb|rjs/i;

/** A small lift keeps speech clear. It is not a cartoon pitch. */
export const GENTLE_PITCH = 1.08;
export const DEEP_VOICE_PITCH = 1.14;

export const RECOMMENDED_VOICE_LABEL = 'Soft voice (recommended)';
export const VOICE_PREVIEW_TEXT = "Hello! Let's learn something fun today.";

export interface ScorableVoice {
  name: string;
  lang: string;
  localService?: boolean;
}

export function isChildVoiceName(name: string): boolean {
  return CHILD_VOICE.test(name);
}

export function isEnglishVoice(lang: string): boolean {
  return lang.toLowerCase().replace('_', '-').startsWith('en');
}

function voiceScore(voice: ScorableVoice): number {
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

export function pickKidsVoice<T extends ScorableVoice>(voices: T[]): T | undefined {
  const english = voices.filter((voice) => isEnglishVoice(voice.lang));
  const pool = english.length > 0 ? english : voices;
  return [...pool].sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name))[0];
}

/** Uses the saved voice when this device still has it, otherwise the soft on-device fallback. */
export function resolveVoice<T extends ScorableVoice>(voices: T[], requestedName?: string | null): T | undefined {
  if (requestedName) {
    const match = voices.find((voice) => voice.name === requestedName);
    if (match) return match;
  }
  return pickKidsVoice(voices);
}

export function pitchForVoice(voice: Pick<ScorableVoice, 'name'> | undefined): number {
  if (voice && DEEP_VOICE.test(voice.name) && !isChildVoiceName(voice.name)) return DEEP_VOICE_PITCH;
  return GENTLE_PITCH;
}
