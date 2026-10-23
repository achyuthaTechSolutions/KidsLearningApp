import { afterEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../learning-games/questions';
import { checkRhythm, createRhythmPlayer, generateRhythm, rhythmProfiles, type Beat, type Tap } from './rhythm';

afterEach(() => vi.useRealTimers());

const pattern: Beat[] = [{ pad: 'drum', at: 0 }, { pad: 'clap', at: 1 }, { pad: 'drum', at: 3 }];
const options = { timed: true, beatMs: 600, tolerance: rhythmProfiles.intermediate.tolerance };
const taps = (times: number[], pads = pattern.map((beat) => beat.pad)): Tap[] => times.map((time, i) => ({ pad: pads[i], time }));

describe('Rhythm patterns', () => {
  it('fits each level: length, sounds, and gaps', () => {
    for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
      const profile = rhythmProfiles[difficulty];
      for (let seed = 1; seed <= 40; seed += 1) {
        const beats = generateRhythm(difficulty, mulberry32(seed));
        expect(beats.length).toBeGreaterThanOrEqual(profile.minBeats);
        expect(beats.length).toBeLessThanOrEqual(profile.maxBeats);
        expect(beats[0].at).toBe(0);
        for (const beat of beats) expect(profile.pads).toContain(beat.pad);
        for (let i = 1; i < beats.length; i++) expect(profile.gaps).toContain(beats[i].at - beats[i - 1].at);
        if (profile.pads.length > 1) expect(new Set(beats.map((beat) => beat.pad)).size).toBeGreaterThan(1);
      }
    }
  });
});

describe('Checking taps', () => {
  it('waits until every beat is tapped', () => {
    expect(checkRhythm(pattern, taps([0, 600]), options)).toEqual({ status: 'listening' });
  });

  it('spots the wrong sound straight away', () => {
    expect(checkRhythm(pattern, taps([0], ['clap']), options)).toEqual({ status: 'wrong-pad', index: 0 });
  });

  it('accepts taps that start any time and are a bit early or late', () => {
    expect(checkRhythm(pattern, taps([5000, 5600, 6800]), options)).toEqual({ status: 'match' });
    expect(checkRhythm(pattern, taps([0, 450, 1700]), options)).toEqual({ status: 'match' });
  });

  it('flags a gap that is far off', () => {
    expect(checkRhythm(pattern, taps([0, 1500, 2700]), options)).toEqual({ status: 'off-beat', index: 1 });
  });

  it('ignores timing in practice mode', () => {
    expect(checkRhythm(pattern, taps([0, 3000, 3100]), { ...options, timed: false })).toEqual({ status: 'match' });
  });

  it('is more forgiving at Beginner level', () => {
    const beginner = { ...options, beatMs: 700, tolerance: rhythmProfiles.beginner.tolerance };
    const simple: Beat[] = [{ pad: 'drum', at: 0 }, { pad: 'drum', at: 1 }];
    expect(checkRhythm(simple, [{ pad: 'drum', time: 0 }, { pad: 'drum', time: 1050 }], beginner)).toEqual({ status: 'match' });
    expect(checkRhythm(simple, [{ pad: 'drum', time: 0 }, { pad: 'drum', time: 1050 }], { ...options, tolerance: rhythmProfiles.advanced.tolerance })).toEqual({ status: 'off-beat', index: 1 });
  });
});

describe('Rhythm player', () => {
  it('plays beats in order at their times, then finishes once', () => {
    vi.useFakeTimers();
    const heard: string[] = [];
    const done = vi.fn();
    const player = createRhythmPlayer((beat, index) => heard.push(`${index}:${beat.pad}`));
    player.play(pattern, 600, done);
    vi.advanceTimersByTime(399);
    expect(heard).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(heard).toEqual(['0:drum']);
    vi.advanceTimersByTime(600);
    expect(heard).toEqual(['0:drum', '1:clap']);
    vi.advanceTimersByTime(5000);
    expect(heard).toEqual(['0:drum', '1:clap', '2:drum']);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('cancels the first playback when replayed', () => {
    vi.useFakeTimers();
    const heard: number[] = [];
    const player = createRhythmPlayer((_, index) => heard.push(index));
    player.play(pattern, 600, () => {});
    vi.advanceTimersByTime(500);
    player.play(pattern, 600, () => {});
    vi.advanceTimersByTime(10000);
    expect(heard).toEqual([0, 0, 1, 2]);
  });
});
