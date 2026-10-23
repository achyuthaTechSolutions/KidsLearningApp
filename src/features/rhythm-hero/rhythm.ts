import { grow } from '../learning-games/adaptive';
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

/**
 * A rhythm for an endless level. Rhythms start with 2–3 drum beats and grow by a beat
 * every two levels (up to 7–9). A second sound comes in at level 4 and a third at
 * level 7; half-beat gaps from level 7. The beat quickens and the timing window
 * narrows a little each level, both with gentle limits.
 */
export function rhythmProfile(level: number): RhythmProfile {
  const at = Math.max(1, Math.floor(level));
  const minBeats = Math.min(7, 2 + Math.floor((at - 1) / 2));
  return {
    minBeats,
    maxBeats: Math.min(9, minBeats + 1 + Math.floor((at - 1) / 6)),
    pads: at <= 3 ? ['drum'] : at <= 6 ? ['drum', 'clap'] : ['drum', 'clap', 'bell'],
    gaps: at <= 3 ? [1] : at <= 6 ? [1, 1, 2] : at <= 9 ? [0.5, 1, 1, 2] : [0.5, 0.5, 1, 2],
    beatMs: grow(at, 720, -20, 460),
    tolerance: { ratio: grow(at, 0.6, -0.025, 0.32), minMs: grow(at, 320, -15, 170) },
  };
}

export function generateRhythm(level: number, random: Random = Math.random): Beat[] {
  const profile = rhythmProfile(level);
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
