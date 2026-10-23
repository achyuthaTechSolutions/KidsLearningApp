import { describe, expect, it } from 'vitest';
import { illustrationFor } from '../../data/illustrations';
import { mulberry32 } from '../learning-games/questions';
import { chooseShadow, createShadowRound, isRoundDone, itemsFor, shadowItems, shadowProfiles, shadowThemes } from './engine';

describe('Shadow Detective data', () => {
  it('has unique items with bundled pictures, and enough per theme', () => {
    expect(new Set(shadowItems.map((item) => item.id)).size).toBe(shadowItems.length);
    expect(new Set(shadowItems.map((item) => item.emoji)).size).toBe(shadowItems.length);
    for (const item of shadowItems) expect(illustrationFor(item.emoji), item.name).toBeTruthy();
    for (const { value } of shadowThemes) expect(itemsFor(value).length, value).toBeGreaterThanOrEqual(shadowProfiles.advanced.choices + 1);
  });
});

describe('Shadow Detective rounds', () => {
  it('uses the level choice and shadow counts, and every shadow has its picture', () => {
    for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
      for (let seed = 1; seed <= 20; seed += 1) {
        const round = createShadowRound('animals', difficulty, mulberry32(seed));
        expect(round.choices).toHaveLength(shadowProfiles[difficulty].choices);
        expect(round.shadows).toHaveLength(shadowProfiles[difficulty].shadows);
        expect(new Set(round.choices.map((item) => item.id)).size).toBe(round.choices.length);
        for (const shadow of round.shadows) expect(round.choices).toContainEqual(shadow);
      }
    }
  });

  it('greys out wrong picks without ending the round, and finishes when all shadows match', () => {
    let round = createShadowRound('nature', 'advanced', mulberry32(4));
    const wrong = round.choices.find((item) => !round.shadows.includes(item))!;
    const missed = chooseShadow(round, wrong.id);
    expect(missed.result).toBe('no-match');
    round = missed.round;
    expect(chooseShadow(round, wrong.id).result).toBe('ignored');
    round = chooseShadow(round, round.shadows[0].id).round;
    expect(isRoundDone(round)).toBe(false);
    round = chooseShadow(round, round.shadows[1].id).round;
    expect(isRoundDone(round)).toBe(true);
    expect(chooseShadow(round, round.shadows[0].id).result).toBe('ignored');
  });

  it('avoids items from the last round when it can', () => {
    const first = createShadowRound('vehicles', 'beginner', mulberry32(1));
    const avoid = first.choices.map((item) => item.id);
    const next = createShadowRound('vehicles', 'beginner', mulberry32(2), avoid);
    expect(next.choices.some((item) => avoid.includes(item.id))).toBe(false);
  });
});
