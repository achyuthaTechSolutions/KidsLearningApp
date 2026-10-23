import { describe, expect, it } from 'vitest';
import { LEARNING_STAGES, parseStage, stageForAge, stageYears, storiesForStage, storySuitsStage } from './stages';

describe('Learning stages', () => {
  it('match the parent-account age bands exactly', () => {
    // Same values as `AgeBand` in the Expo app's src/auth/contract.ts. Change both together.
    expect(LEARNING_STAGES).toEqual(['3-4', '5-6', '7-8']);
  });

  it('place every age from 3 to 8 in exactly one stage, including the boundaries', () => {
    expect([3, 4, 5, 6, 7, 8].map(stageForAge)).toEqual(['3-4', '3-4', '5-6', '5-6', '7-8', '7-8']);
    for (let age = 3; age <= 8; age += 1) {
      expect(LEARNING_STAGES.filter((stage) => age >= stageYears[stage][0] && age <= stageYears[stage][1]), String(age)).toHaveLength(1);
    }
    expect(stageForAge(4.99)).toBe('3-4');
    expect(stageForAge(5)).toBe('5-6');
  });

  it('leave unknown and out-of-range ages without a stage, instead of guessing', () => {
    for (const age of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, -1, 0, 2, 2.9, 9, 12]) expect(stageForAge(age), String(age)).toBeUndefined();
  });

  it('accept only canonical stage values, so old or foreign values never reclassify a child', () => {
    expect(LEARNING_STAGES.map(parseStage)).toEqual(LEARNING_STAGES);
    for (const value of ['3-5', '5-7', '7-9', '3–4', ' 3-4', '34', 'all', '', null, undefined, 4, {}]) expect(parseStage(value), String(value)).toBeUndefined();
  });

  it('match stories whose age range overlaps the stage, at both edges', () => {
    expect(storySuitsStage({ ageRange: [3, 6] }, '7-8')).toBe(false);
    expect(storySuitsStage({ ageRange: [4, 7] }, '7-8')).toBe(true);
    expect(storySuitsStage({ ageRange: [5, 9] }, '3-4')).toBe(false);
    expect(storySuitsStage({ ageRange: [2, 3] }, '3-4')).toBe(true);
    expect(storySuitsStage({ ageRange: [9, 10] }, '7-8')).toBe(false);
  });

  it('show every story for "all" or an unknown stage', () => {
    const stories = [{ ageRange: [3, 4] as [number, number] }, { ageRange: [9, 10] as [number, number] }];
    expect(storiesForStage(stories, 'all')).toHaveLength(2);
    expect(storiesForStage(stories, parseStage('3-5'))).toHaveLength(2);
    expect(storiesForStage(stories, '3-4')).toHaveLength(1);
  });
});
