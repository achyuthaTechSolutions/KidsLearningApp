import { describe, expect, it } from 'vitest';
import { bandOf, clampLevel, createAdaptive, grow, recordAnswer, resumeLevel, startLevel, type Adaptive } from './adaptive';

const answer = (state: Adaptive, results: boolean[]) => results.reduce((current, firstTry) => recordAnswer(current, firstTry).state, state);

describe('Endless levels', () => {
  it('go up after three first-try answers in a row, with no top level', () => {
    let state = createAdaptive(1);
    expect(recordAnswer(state, true).change).toBeNull();
    state = answer(state, [true, true]);
    const third = recordAnswer(state, true);
    expect(third.change).toBe('up');
    expect(third.state.level).toBe(2);
    expect(answer(createAdaptive(40), [true, true, true]).level).toBe(41);
  });

  it('go down after two answers in a row that needed help, but never below 1', () => {
    const state = answer(createAdaptive(5), [false]);
    const second = recordAnswer(state, false);
    expect(second.change).toBe('down');
    expect(second.state.level).toBe(4);
    expect(recordAnswer(answer(createAdaptive(1), [false]), false).change).toBeNull();
    expect(answer(createAdaptive(1), [false, false, false, false]).level).toBe(1);
  });

  it('reset the streak on a struggle, and the struggles on a first try', () => {
    expect(answer(createAdaptive(3), [true, true, false, true, true]).level).toBe(3);
    expect(answer(createAdaptive(3), [false, true, false]).level).toBe(3);
  });

  it('start from the difficulty, or carry on from the saved level', () => {
    expect(startLevel).toEqual({ beginner: 1, intermediate: 4, advanced: 7 });
    expect(resumeLevel(undefined, 'intermediate')).toBe(4);
    expect(resumeLevel(12, 'beginner')).toBe(12);
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(Number.NaN)).toBe(1);
    expect(clampLevel(5000)).toBe(999);
  });

  it('map levels to bands and grow values up to a limit', () => {
    expect([1, 3, 4, 6, 7, 50].map(bandOf)).toEqual(['beginner', 'beginner', 'intermediate', 'intermediate', 'advanced', 'advanced']);
    expect(grow(1, 3, 1, 6)).toBe(3);
    expect(grow(3, 3, 1, 6)).toBe(5);
    expect(grow(20, 3, 1, 6)).toBe(6);
    expect(grow(1, 8, -0.5, 3)).toBe(8);
    expect(grow(30, 8, -0.5, 3)).toBe(3);
  });
});
