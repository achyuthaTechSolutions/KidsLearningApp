import { playDrum, playFlute, playGuitar, playNote } from '../../services/audio';
import type { GameDifficulty } from '../learning-games/difficulty';
import { shuffle, type Random } from '../learning-games/random';

export type SafariCategory = 'instruments' | 'animals';
export type SynthInstrument = 'piano' | 'drum' | 'guitar' | 'flute' | 'clap';

/**
 * Where a sound comes from. The app has no recorded audio files, so it is honest about it:
 * "synth" sounds are the same on-device instrument sounds Music Studio plays, and
 * "spoken" sounds are Pip saying the animal noise with the device voice. Spoken sounds
 * are labelled as Pip pretending, never as recordings.
 */
export type SoundSource =
  | { kind: 'synth'; instrument: SynthInstrument }
  | { kind: 'spoken'; text: string };

export interface SafariSound {
  id: string;
  name: string;
  category: SafariCategory;
  emoji: string;
  source: SoundSource;
  explanation: string;
  /** Sounds that are easy to confuse with this one. They only appear together at Champion level. */
  similar: string[];
}

export const safariSounds: SafariSound[] = [
  { id: 'piano', name: 'Piano', category: 'instruments', emoji: '🎹', source: { kind: 'synth', instrument: 'piano' }, explanation: 'A piano makes soft, ringing notes when you press its keys.', similar: ['guitar'] },
  { id: 'drum', name: 'Drum', category: 'instruments', emoji: '🥁', source: { kind: 'synth', instrument: 'drum' }, explanation: 'A drum goes boom and tap when you hit it.', similar: ['clap'] },
  { id: 'guitar', name: 'Guitar', category: 'instruments', emoji: '🎸', source: { kind: 'synth', instrument: 'guitar' }, explanation: 'A guitar makes twangy notes when you pluck its strings.', similar: ['piano'] },
  { id: 'flute', name: 'Flute', category: 'instruments', emoji: '🪈', source: { kind: 'synth', instrument: 'flute' }, explanation: 'A flute makes a breathy, whistly sound when you blow into it.', similar: [] },
  { id: 'clap', name: 'Clapping', category: 'instruments', emoji: '👏', source: { kind: 'synth', instrument: 'clap' }, explanation: 'Clapping hands make a quick, sharp sound.', similar: ['drum'] },
  { id: 'cow', name: 'Cow', category: 'animals', emoji: '🐄', source: { kind: 'spoken', text: 'Moo! Moooo!' }, explanation: 'Cows say moo.', similar: [] },
  { id: 'cat', name: 'Cat', category: 'animals', emoji: '🐱', source: { kind: 'spoken', text: 'Meow! Meow!' }, explanation: 'Cats say meow.', similar: [] },
  { id: 'dog', name: 'Dog', category: 'animals', emoji: '🐕', source: { kind: 'spoken', text: 'Woof! Woof woof!' }, explanation: 'Dogs say woof.', similar: [] },
  { id: 'duck', name: 'Duck', category: 'animals', emoji: '🦆', source: { kind: 'spoken', text: 'Quack! Quack quack!' }, explanation: 'Ducks say quack.', similar: [] },
  { id: 'sheep', name: 'Sheep', category: 'animals', emoji: '🐑', source: { kind: 'spoken', text: 'Baa! Baaa!' }, explanation: 'Sheep say baa.', similar: [] },
  { id: 'pig', name: 'Pig', category: 'animals', emoji: '🐷', source: { kind: 'spoken', text: 'Oink! Oink oink!' }, explanation: 'Pigs say oink.', similar: [] },
  { id: 'frog', name: 'Frog', category: 'animals', emoji: '🐸', source: { kind: 'spoken', text: 'Ribbit! Ribbit!' }, explanation: 'Frogs say ribbit.', similar: [] },
  { id: 'owl', name: 'Owl', category: 'animals', emoji: '🦉', source: { kind: 'spoken', text: 'Hoo! Hoo hoo!' }, explanation: 'Owls say hoo at night.', similar: [] },
  { id: 'lion', name: 'Lion', category: 'animals', emoji: '🦁', source: { kind: 'spoken', text: 'Roar! Roooar!' }, explanation: 'Lions roar very loudly.', similar: [] },
  { id: 'horse', name: 'Horse', category: 'animals', emoji: '🐴', source: { kind: 'spoken', text: 'Neigh! Neeeigh!' }, explanation: 'Horses say neigh.', similar: [] },
];

export const safariChoices: Record<GameDifficulty, number> = { beginner: 2, intermediate: 3, advanced: 4 };
export const SAFARI_ROUNDS = 6;

export interface SafariQuestion {
  sound: SafariSound;
  choices: SafariSound[];
}

export function soundsFor(category: SafariCategory): SafariSound[] {
  return safariSounds.filter((sound) => sound.category === category);
}

/** One sound and its picture choices. Below Champion level, look-alike sounds are kept apart. */
export function createSafariQuestion(category: SafariCategory, difficulty: GameDifficulty, random: Random = Math.random, previous?: string): SafariQuestion {
  const pool = soundsFor(category);
  const answers = pool.filter((sound) => sound.id !== previous);
  const sound = answers[Math.min(answers.length - 1, Math.floor(random() * answers.length))];
  const distractors = shuffle(pool.filter((other) => other.id !== sound.id && (difficulty === 'advanced' || !sound.similar.includes(other.id))), random)
    .slice(0, safariChoices[difficulty] - 1);
  return { sound, choices: shuffle([sound, ...distractors], random) };
}

export type AudioOutput = {
  piano: (frequency: number, duration: number, volume: number) => void;
  drum: (type: string, volume: number) => void;
  guitar: (frequency: number, volume: number) => void;
  flute: (frequency: number, volume: number) => void;
};

export const deviceAudio: AudioOutput = {
  piano: (frequency, duration, volume) => playNote(frequency, duration, volume),
  drum: playDrum,
  guitar: playGuitar,
  flute: playFlute,
};

/** Each instrument as a short, recognisable phrase: [delay ms, play]. */
export function phraseFor(instrument: SynthInstrument, volume: number, out: AudioOutput): [number, () => void][] {
  switch (instrument) {
    case 'piano': return [523.25, 659.25, 783.99, 1046.5].map((f, i) => [i * 260, () => out.piano(f, 0.45, volume * 0.6)]);
    case 'drum': return ['kick', 'snare', 'kick', 'kick', 'snare'].map((type, i) => [i * 240, () => out.drum(type, volume * 0.7)]);
    case 'guitar': return [196, 246.94, 293.66, 392].map((f, i) => [i * 240, () => out.guitar(f, volume * 0.6)]);
    case 'flute': return [783.99, 880, 987.77].map((f, i) => [i * 380, () => out.flute(f, volume * 0.6)]);
    default: return [0, 1, 2, 3].map((i) => [i * 300, () => out.drum('clap', volume * 0.7)]);
  }
}

/**
 * Plays one synth phrase at a time. Starting a new one cancels the old one, so
 * replays never pile up. Returns false when the sound could not be played.
 */
export function createPhrasePlayer(out: AudioOutput = deviceAudio) {
  let timers: ReturnType<typeof setTimeout>[] = [];
  const stop = () => {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
  };
  const play = (instrument: SynthInstrument, volume: number, onDone?: () => void): boolean => {
    stop();
    try {
      const phrase = phraseFor(instrument, volume, out);
      for (const [delay, note] of phrase) {
        timers.push(setTimeout(() => {
          try {
            note();
          } catch {
            // A note that fails is skipped. The game can still be played by sight.
          }
        }, delay));
      }
      const end = phrase[phrase.length - 1][0] + 400;
      timers.push(setTimeout(() => onDone?.(), end));
      return true;
    } catch {
      stop();
      return false;
    }
  };
  return { play, stop };
}
