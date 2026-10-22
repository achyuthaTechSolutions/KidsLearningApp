import type { GameDifficulty } from '../learning-games/difficulty';
import { pick, type Random } from '../learning-games/random';

export type Pad = 'drum' | 'clap' | 'bell';

export interface Beat {
  pad: Pad;
  /** When the beat sounds, in beats from the start. */
  at: number;
}

export interface RhythmProfile {
  minBeats: number;
  maxBeats: number;
  pads: Pad[];
  /** Gaps between beats, in beats. */
  gaps: number[];
  beatMs: number;
  /** Timing window: a tap is on time within max(minMs, ratio × the expected gap). */
  tolerance: { ratio: number; minMs: number };
}

export const rhythmProfiles: Record<GameDifficulty, RhythmProfile> = {
  beginner: { minBeats: 2, maxBeats: 3, pads: ['drum'], gaps: [1], beatMs: 700, tolerance: { ratio: 0.6, minMs: 320 } },
  intermediate: { minBeats: 4, maxBeats: 6, pads: ['drum', 'clap'], gaps: [1, 1, 2], beatMs: 600, tolerance: { ratio: 0.45, minMs: 240 } },
  advanced: { minBeats: 5, maxBeats: 8, pads: ['drum', 'clap', 'bell'], gaps: [0.5, 1, 1, 2], beatMs: 520, tolerance: { ratio: 0.38, minMs: 190 } },
};

export const PATTERNS_PER_ROUND = 5;

export function generateRhythm(difficulty: GameDifficulty, random: Random = Math.random): Beat[] {
  const profile = rhythmProfiles[difficulty];
  const count = profile.minBeats + Math.floor(random() * (profile.maxBeats - profile.minBeats + 1));
  const beats: Beat[] = [];
  let at = 0;
  for (let i = 0; i < count; i++) {
    beats.push({ pad: pick(profile.pads, random), at });
    at += pick(profile.gaps, random);
  }
  // Two-sound levels always use both sounds, so the child has to listen for which one.
  if (profile.pads.length > 1 && new Set(beats.map((beat) => beat.pad)).size === 1) {
    const other = profile.pads.find((pad) => pad !== beats[0].pad)!;
    beats[beats.length - 1] = { ...beats[beats.length - 1], pad: other };
  }
  return beats;
}

export interface Tap {
  pad: Pad;
  /** Milliseconds, from any clock. Only the gaps between taps matter. */
  time: number;
}

export type RhythmCheck =
  | { status: 'listening' }
  | { status: 'wrong-pad'; index: number }
  | { status: 'off-beat'; index: number }
  | { status: 'match' };

/**
 * Compares taps so far with the pattern. Pads must be in the right order. In timed mode
 * each gap between taps must be close to the pattern's gap; in practice mode timing is ignored.
 * Only the gaps matter, so a child can start whenever they are ready.
 */
export function checkRhythm(pattern: Beat[], taps: Tap[], options: { timed: boolean; beatMs: number; tolerance: RhythmProfile['tolerance'] }): RhythmCheck {
  for (let i = 0; i < taps.length && i < pattern.length; i++) {
    if (taps[i].pad !== pattern[i].pad) return { status: 'wrong-pad', index: i };
  }
  if (taps.length < pattern.length) return { status: 'listening' };
  if (options.timed) {
    for (let i = 1; i < pattern.length; i++) {
      const expected = (pattern[i].at - pattern[i - 1].at) * options.beatMs;
      const actual = taps[i].time - taps[i - 1].time;
      const allowed = Math.max(options.tolerance.minMs, options.tolerance.ratio * expected);
      if (Math.abs(actual - expected) > allowed) return { status: 'off-beat', index: i };
    }
  }
  return { status: 'match' };
}

/** Milliseconds from the start for each beat of a pattern. */
export function beatTimes(pattern: Beat[], beatMs: number): number[] {
  return pattern.map((beat) => Math.round(beat.at * beatMs));
}

/**
 * Plays a pattern once through `onBeat`, then calls `onDone`. Starting again, or
 * calling stop, cancels whatever was still scheduled, so playbacks never overlap.
 */
export function createRhythmPlayer(onBeat: (beat: Beat, index: number) => void) {
  let timers: ReturnType<typeof setTimeout>[] = [];
  const stop = () => {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
  };
  const play = (pattern: Beat[], beatMs: number, onDone: () => void) => {
    stop();
    const times = beatTimes(pattern, beatMs);
    pattern.forEach((beat, index) => {
      timers.push(setTimeout(() => onBeat(beat, index), 400 + times[index]));
    });
    timers.push(setTimeout(onDone, 400 + (times[times.length - 1] ?? 0) + beatMs));
  };
  return { play, stop };
}
