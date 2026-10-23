import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../learning-games/questions';
import {
  POPS_PER_TARGET,
  balloonColors, balloonProfile, balloonStars, createBalloonGame, popBalloon, spawnBalloon, stepBalloons, targetPhrase, valuesFor, withLevel,
  type BalloonGame,
} from './engine';

function withTargetBalloon(game: BalloonGame): BalloonGame {
  let next = game;
  const random = mulberry32(7);
  while (!next.balloons.some((balloon) => balloon.value === next.target)) next = spawnBalloon(next, random);
  return next;
}

function popTarget(game: BalloonGame, random: () => number) {
  const ready = withTargetBalloon(game);
  return popBalloon(ready, ready.balloons.find((item) => item.value === ready.target)!.id, random);
}

describe('Balloon Pop engine', () => {
  it('always puts a target balloon on an empty sky', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const random = mulberry32(seed);
      const game = spawnBalloon(createBalloonGame('letters', 1, random), random);
      expect(game.balloons).toHaveLength(1);
      expect(game.balloons[0].value).toBe(game.target);
    }
  });

  it('only shows the target or its few distractors, up to the level’s limit', () => {
    for (const level of [1, 6, 30]) {
      const random = mulberry32(3);
      let game = createBalloonGame('numbers', level, random);
      for (let i = 0; i < 400; i += 1) game = stepBalloons(game, 0.1, random);
      const allowed = [game.target, ...game.distractors];
      expect(game.balloons.length).toBeGreaterThan(0);
      expect(game.balloons.length).toBeLessThanOrEqual(balloonProfile(level).maxBalloons);
      for (const balloon of game.balloons) expect(allowed).toContain(balloon.value);
      expect(game.distractors).toHaveLength(balloonProfile(level).distractors);
    }
  });

  it('grows with the level: more wrong balloons, more at once, faster, bigger numbers, all within limits', () => {
    expect(balloonProfile(1)).toEqual({ distractors: 2, maxBalloons: 4, speed: 0.13, spawnEvery: 1.2, maxNumber: 5 });
    expect(balloonProfile(5).distractors).toBe(4);
    expect(balloonProfile(999)).toEqual({ distractors: 6, maxBalloons: 8, speed: 0.42, spawnEvery: 0.6, maxNumber: 20 });
    expect(valuesFor('numbers', 1)).toEqual(['1', '2', '3', '4', '5']);
    expect(valuesFor('numbers', 20)).toHaveLength(20);
  });

  it('paints colour balloons in the colour they name', () => {
    const random = mulberry32(11);
    let game = createBalloonGame('colors', 1, random);
    for (let i = 0; i < 100; i += 1) game = stepBalloons(game, 0.1, random);
    for (const balloon of game.balloons) expect(balloonColors[balloon.color].name).toBe(balloon.value);
    expect(targetPhrase('colors', 'Red')).toBe('Pop the red balloons!');
  });

  it('counts a wrong tap as a miss and keeps the balloon', () => {
    const random = mulberry32(5);
    let game = createBalloonGame('letters', 1, random);
    game = { ...game, balloons: [{ id: 99, value: game.distractors[0], color: 0, x: 0.5, y: 0.5, speed: 0.2, sway: 0 }] };
    const { game: after, result } = popBalloon(game, 99, random);
    expect(result).toBe('wrong');
    expect(after.misses).toBe(1);
    expect(after.targetMisses).toBe(1);
    expect(after.balloons).toHaveLength(1);
  });

  it('finishes a target after enough pops, says whether it was first try, and never ends', () => {
    const random = mulberry32(21);
    let game = createBalloonGame('letters', 1, random);
    for (let pop = 1; pop <= POPS_PER_TARGET * 30; pop += 1) {
      const outcome = popTarget(game, random);
      expect(outcome.result).toBe('correct');
      expect(outcome.targetDone).toBe(pop % POPS_PER_TARGET === 0);
      if (outcome.targetDone) expect(outcome.firstTry).toBe(true);
      game = outcome.game;
    }
    // 30 targets: more than the 26 letters, so the list starts again rather than stopping.
    expect(game.targetsDone).toBe(30);
    expect(game.firstTryTargets).toBe(30);
  });

  it('reports a target that needed a wrong pop as not first try', () => {
    const random = mulberry32(9);
    let game = createBalloonGame('letters', 1, random);
    game = { ...game, balloons: [{ id: 99, value: game.distractors[0], color: 0, x: 0.5, y: 0.5, speed: 0.2, sway: 0 }] };
    game = popBalloon(game, 99, random).game;
    let last;
    for (let pop = 0; pop < POPS_PER_TARGET; pop += 1) {
      last = popTarget(game, random);
      game = last.game;
    }
    expect(last!.targetDone).toBe(true);
    expect(last!.firstTry).toBe(false);
    expect(game.targetMisses).toBe(0);
  });

  it('moves to a new level with the right number of wrong balloons', () => {
    const random = mulberry32(4);
    const game = createBalloonGame('numbers', 1, random);
    const higher = withLevel(game, 9, random);
    expect(higher.level).toBe(9);
    expect(higher.distractors).toHaveLength(balloonProfile(9).distractors);
    expect(higher.distractors).not.toContain(higher.target);
    expect(withLevel(game, 1, random)).toBe(game);
  });

  it('gives at least one star', () => {
    expect(balloonStars({ targetsDone: 0, firstTryTargets: 0 })).toBe(1);
    expect(balloonStars({ targetsDone: 5, firstTryTargets: 5 })).toBe(3);
    expect(balloonStars({ targetsDone: 4, firstTryTargets: 2 })).toBe(2);
    expect(balloonStars({ targetsDone: 10, firstTryTargets: 1 })).toBe(1);
  });
});
