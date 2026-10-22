import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../learning-games/questions';
import {
  MAX_BALLOONS, POPS_PER_TARGET, ROUND_POPS, TARGETS_PER_ROUND,
  balloonColors, balloonStars, createBalloonGame, popBalloon, spawnBalloon, stepBalloons, targetPhrase,
  type BalloonGame,
} from './engine';

function withTargetBalloon(game: BalloonGame): BalloonGame {
  let next = game;
  const random = mulberry32(7);
  while (!next.balloons.some((balloon) => balloon.value === next.target)) next = spawnBalloon(next, random);
  return next;
}

describe('Balloon Pop engine', () => {
  it('always puts a target balloon on an empty sky', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const random = mulberry32(seed);
      const game = spawnBalloon(createBalloonGame('letters', random), random);
      expect(game.balloons).toHaveLength(1);
      expect(game.balloons[0].value).toBe(game.target);
    }
  });

  it('only shows the target or its few distractors', () => {
    const random = mulberry32(3);
    let game = createBalloonGame('numbers', random);
    for (let i = 0; i < 400; i += 1) game = stepBalloons(game, 0.1, random);
    const allowed = [game.target, ...game.distractors];
    expect(game.balloons.length).toBeGreaterThan(0);
    expect(game.balloons.length).toBeLessThanOrEqual(MAX_BALLOONS);
    for (const balloon of game.balloons) expect(allowed).toContain(balloon.value);
  });

  it('paints colour balloons in the colour they name', () => {
    const random = mulberry32(11);
    let game = createBalloonGame('colors', random);
    for (let i = 0; i < 100; i += 1) game = stepBalloons(game, 0.1, random);
    for (const balloon of game.balloons) expect(balloonColors[balloon.color].name).toBe(balloon.value);
    expect(targetPhrase('colors', 'Red')).toBe('Pop the red balloons!');
  });

  it('counts a wrong tap as a miss and keeps the balloon', () => {
    const random = mulberry32(5);
    let game = createBalloonGame('letters', random);
    game = { ...game, balloons: [{ id: 99, value: game.distractors[0], color: 0, x: 0.5, y: 0.5, speed: 0.2, sway: 0 }] };
    const { game: after, result } = popBalloon(game, 99, random);
    expect(result).toBe('wrong');
    expect(after.misses).toBe(1);
    expect(after.balloons).toHaveLength(1);
  });

  it('changes the target after enough pops and finishes the round', () => {
    const random = mulberry32(21);
    let game = createBalloonGame('letters', random);
    const targets = new Set<string>();
    for (let pop = 1; pop <= ROUND_POPS; pop += 1) {
      targets.add(game.target);
      game = withTargetBalloon(game);
      const balloon = game.balloons.find((item) => item.value === game.target);
      const outcome = popBalloon(game, balloon!.id, random);
      expect(outcome.result).toBe('correct');
      expect(outcome.newTarget).toBe(pop % POPS_PER_TARGET === 0 && pop < ROUND_POPS);
      game = outcome.game;
    }
    expect(game.finished).toBe(true);
    expect(game.pops).toBe(ROUND_POPS);
    expect(targets.size).toBe(TARGETS_PER_ROUND);
  });

  it('gives at least one star', () => {
    expect(balloonStars(0)).toBe(3);
    expect(balloonStars(4)).toBe(2);
    expect(balloonStars(40)).toBe(1);
  });
});
