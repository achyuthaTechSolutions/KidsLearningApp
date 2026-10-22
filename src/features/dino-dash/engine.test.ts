import { describe, expect, it } from 'vitest';
import {
  DINO_X,
  OBSTACLE_SIZES,
  START_LIVES,
  createGame,
  nextLetter,
  obstacleKindsForLevel,
  pointsForLevel,
  speedForLevel,
  startGame,
  step,
  type GameInput,
  type GameState,
  type ObstacleKind,
} from './engine';
import { THEME_COUNT, rotateHue, themeForLevel } from './themes';

const idle: GameInput = { jumpHeld: false, jumpPressed: false, duckHeld: false };
const steady = () => 0.5;
const DT = 1 / 60;

/** A running game with no random spawns, so each test controls what is on screen. */
function quietGame(level = 1): GameState {
  const game = createGame(800);
  game.level = level;
  game.speed = speedForLevel(level);
  game.obstacleTimer = Number.POSITIVE_INFINITY;
  game.pickupTimer = Number.POSITIVE_INFINITY;
  startGame(game);
  return game;
}

function place(game: GameState, kind: ObstacleKind, x: number) {
  game.obstacles.push({ id: game.nextId++, kind, x, ...OBSTACLE_SIZES[kind] });
}

describe('Dino Dash levels', () => {
  it('gets faster every level but never passes a safe top speed', () => {
    let previous = 0;
    for (let level = 1; level <= 500; level++) {
      const speed = speedForLevel(level);
      expect(speed).toBeGreaterThanOrEqual(previous);
      expect(speed).toBeLessThanOrEqual(660);
      previous = speed;
    }
  });

  it('adds new obstacles gradually', () => {
    expect(obstacleKindsForLevel(1)).toEqual(['cactus-small', 'rock']);
    expect(obstacleKindsForLevel(3)).not.toContain('bird-low');
    expect(obstacleKindsForLevel(5)).toEqual(expect.arrayContaining(['bird-low', 'bird-high', 'cactus-group']));
    expect(pointsForLevel(1000)).toBe(1000);
  });

  it('moves to the next level once enough points are scored', () => {
    const game = quietGame();
    game.distance = pointsForLevel(1) * 10;
    const events = step(game, DT, idle, steady);
    expect(game.level).toBe(2);
    expect(game.speed).toBeCloseTo(speedForLevel(2));
    expect(events).toContainEqual({ type: 'levelUp', level: 2 });
  });

  it('does nothing until the game is started, and nothing while paused', () => {
    const game = createGame(800);
    expect(step(game, DT, { ...idle, jumpPressed: true, jumpHeld: true })).toEqual([]);
    startGame(game);
    game.status = 'paused';
    step(game, 1, idle);
    expect(game.distance).toBe(0);
  });
});

describe('Dino Dash jumping and ducking', () => {
  for (const level of [1, 60]) {
    for (const kind of ['cactus-small', 'cactus-tall', 'cactus-group', 'rock', 'bird-low'] as ObstacleKind[]) {
      it(`a held jump clears ${kind} at level ${level}`, () => {
        const game = quietGame(level);
        place(game, kind, DINO_X + 60 + game.speed * 0.12);
        let hits = 0;
        for (let frame = 0; frame < 90; frame++) {
          const events = step(game, DT, { jumpHeld: frame < 20, jumpPressed: frame === 0, duckHeld: false }, steady);
          hits += events.filter((event) => event.type === 'hit').length;
        }
        expect(hits).toBe(0);
        expect(game.dino.onGround).toBe(true);
      });
    }
  }

  it('a quick tap still jumps higher than the tallest cactus', () => {
    const game = quietGame();
    let highest = 0;
    for (let frame = 0; frame < 60; frame++) {
      step(game, DT, { jumpHeld: false, jumpPressed: frame === 0, duckHeld: false }, steady);
      highest = Math.max(highest, game.dino.lift);
    }
    expect(highest).toBeGreaterThan(OBSTACLE_SIZES['cactus-tall'].h);
  });

  it('ducking slips under the high bird, standing does not', () => {
    const ducking = quietGame(5);
    place(ducking, 'bird-high', DINO_X);
    expect(step(ducking, DT, { ...idle, duckHeld: true }, steady).some((e) => e.type === 'hit')).toBe(false);

    const standing = quietGame(5);
    place(standing, 'bird-high', DINO_X);
    expect(step(standing, DT, idle, steady).some((e) => e.type === 'hit')).toBe(true);
  });
});

describe('Dino Dash hearts and pickups', () => {
  it('a bump costs one heart, then gives a short safe time', () => {
    const game = quietGame();
    place(game, 'rock', DINO_X);
    step(game, DT, idle, steady);
    expect(game.lives).toBe(START_LIVES - 1);
    step(game, DT, idle, steady);
    expect(game.lives).toBe(START_LIVES - 1);
  });

  it('ends the run when the last heart is gone', () => {
    const game = quietGame();
    game.lives = 1;
    place(game, 'cactus-small', DINO_X);
    const events = step(game, DT, idle, steady);
    expect(game.status).toBe('over');
    expect(events).toContainEqual({ type: 'gameOver' });
  });

  it('collects letters in alphabet order and adds bonus points', () => {
    const game = quietGame();
    game.pickups.push({ id: 99, kind: 'letter', letter: nextLetter(0), x: DINO_X + 20, lift: 30, r: 20 });
    const events = step(game, DT, idle, steady);
    expect(events).toContainEqual({ type: 'letter', letter: 'A' });
    expect(game.lettersCollected).toBe(1);
    expect(nextLetter(game.lettersCollected)).toBe('B');
    expect(nextLetter(26)).toBe('A');
    expect(game.score).toBeGreaterThanOrEqual(25);
  });

  it('a heart pickup restores a heart but never goes above the start amount', () => {
    const game = quietGame();
    game.lives = START_LIVES;
    game.pickups.push({ id: 7, kind: 'heart', x: DINO_X + 20, lift: 30, r: 18 });
    step(game, DT, idle, steady);
    expect(game.lives).toBe(START_LIVES);
  });

  it('keeps spawning obstacles that fit the current level in a long run', () => {
    const game = createGame(800);
    startGame(game);
    game.lives = 1_000_000;
    let tick = 0;
    const random = () => ((tick = (tick * 9301 + 49297) % 233280) / 233280);
    for (let frame = 0; frame < 60 * 120; frame++) {
      step(game, DT, idle, random);
      for (const obstacle of game.obstacles) {
        expect(obstacleKindsForLevel(game.level)).toContain(obstacle.kind);
      }
    }
    expect(game.level).toBeGreaterThan(3);
  });
});

describe('Dino Dash worlds', () => {
  it('has a valid world for every level, forever', () => {
    for (let level = 1; level <= 300; level++) {
      const theme = themeForLevel(level);
      for (const value of Object.values(theme)) {
        if (typeof value === 'string' && value.startsWith('#')) expect(value).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });

  it('repeats the worlds with new colors after the first round', () => {
    const first = themeForLevel(1);
    const again = themeForLevel(1 + THEME_COUNT);
    expect(again.name).toBe(`${first.name} 2`);
    expect(again.skyTop).not.toBe(first.skyTop);
    expect(rotateHue('#7FD4FF', 0)).toBe('#7FD4FF');
  });
});
