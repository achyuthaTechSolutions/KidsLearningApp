import { letterOrder } from '../../data/alphabet';
import { worlds } from '../../theme/tokens';

export type BalloonMode = 'letters' | 'numbers' | 'colors';

export interface BalloonColor {
  name: string;
  fill: string;
  dark: string;
  /** Label color on the balloon. */
  text: string;
}

export const balloonColors: BalloonColor[] = [
  { name: 'Red', fill: worlds.red.main, dark: worlds.red.dark, text: worlds.red.onMain },
  { name: 'Blue', fill: worlds.blue.main, dark: worlds.blue.dark, text: worlds.blue.onMain },
  { name: 'Green', fill: worlds.green.main, dark: worlds.green.dark, text: worlds.green.onMain },
  { name: 'Yellow', fill: worlds.sun.main, dark: worlds.sun.dark, text: worlds.sun.onMain },
  { name: 'Purple', fill: worlds.violet.main, dark: worlds.violet.dark, text: worlds.violet.onMain },
  { name: 'Orange', fill: worlds.orange.main, dark: worlds.orange.dark, text: worlds.orange.onMain },
  { name: 'Pink', fill: worlds.pink.main, dark: worlds.pink.dark, text: worlds.pink.onMain },
];

/** Correct pops before the target changes. */
export const POPS_PER_TARGET = 3;
/** Targets in one round, so a round is POPS_PER_TARGET × TARGETS_PER_ROUND pops. */
export const TARGETS_PER_ROUND = 4;
export const ROUND_POPS = POPS_PER_TARGET * TARGETS_PER_ROUND;
export const MAX_BALLOONS = 6;
export const SPAWN_EVERY = 1.05;
/** Distractors per target. A small set keeps the screen readable for young children. */
const DISTRACTORS = 3;
const TARGET_CHANCE = 0.45;
/** Balloon centers, as a fraction of the stage width. */
const LANES = [0.12, 0.31, 0.5, 0.69, 0.88];
/** Positions are fractions of the stage height: 0 is the top, 1 the bottom. */
const START_Y = 1.18;
const ESCAPE_Y = -0.28;

export interface Balloon {
  id: number;
  value: string;
  color: number;
  x: number;
  y: number;
  speed: number;
  sway: number;
}

export interface BalloonGame {
  mode: BalloonMode;
  balloons: Balloon[];
  nextId: number;
  spawnIn: number;
  target: string;
  distractors: string[];
  targetsUsed: string[];
  targetPops: number;
  pops: number;
  misses: number;
  finished: boolean;
}

export type PopResult = 'correct' | 'wrong' | 'missing';

function pickIndex(length: number, random: () => number): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, random);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function valuesFor(mode: BalloonMode): string[] {
  if (mode === 'letters') return letterOrder;
  if (mode === 'numbers') return Array.from({ length: 10 }, (_, index) => String(index + 1));
  return balloonColors.map((color) => color.name);
}

export function colorIndex(name: string): number {
  return balloonColors.findIndex((color) => color.name === name);
}

export function targetPhrase(mode: BalloonMode, target: string): string {
  if (mode === 'letters') return `Pop the letter ${target}!`;
  if (mode === 'numbers') return `Pop the number ${target}!`;
  return `Pop the ${target.toLowerCase()} balloons!`;
}

export function valuePhrase(mode: BalloonMode, value: string): string {
  if (mode === 'letters') return `letter ${value}`;
  if (mode === 'numbers') return `number ${value}`;
  return value.toLowerCase();
}

function chooseTarget(game: Pick<BalloonGame, 'mode' | 'targetsUsed'>, random: () => number) {
  const pool = valuesFor(game.mode);
  const fresh = pool.filter((value) => !game.targetsUsed.includes(value));
  const target = (fresh.length > 0 ? fresh : pool)[pickIndex((fresh.length > 0 ? fresh : pool).length, random)];
  const distractors = shuffle(pool.filter((value) => value !== target), random).slice(0, DISTRACTORS);
  return { target, distractors };
}

export function createBalloonGame(mode: BalloonMode, random: () => number = Math.random): BalloonGame {
  const { target, distractors } = chooseTarget({ mode, targetsUsed: [] }, random);
  return {
    mode,
    balloons: [],
    nextId: 1,
    spawnIn: 0,
    target,
    distractors,
    targetsUsed: [target],
    targetPops: 0,
    pops: 0,
    misses: 0,
    finished: false,
  };
}

/** Balloons rise a little faster with each new target. */
export function speedFor(game: BalloonGame, random: () => number): number {
  const level = game.targetsUsed.length - 1;
  return 0.15 + level * 0.018 + random() * 0.06;
}

export function spawnBalloon(game: BalloonGame, random: () => number = Math.random): BalloonGame {
  const targetShowing = game.balloons.some((balloon) => balloon.value === game.target);
  const value = !targetShowing || random() < TARGET_CHANCE
    ? game.target
    : game.distractors[pickIndex(game.distractors.length, random)];
  const busy = game.balloons.filter((balloon) => balloon.y > 0.7).map((balloon) => balloon.x);
  const open = LANES.filter((lane) => !busy.includes(lane));
  const lanes = open.length > 0 ? open : LANES;
  const color = game.mode === 'colors' ? colorIndex(value) : pickIndex(balloonColors.length, random);
  const balloon: Balloon = {
    id: game.nextId,
    value,
    color,
    x: lanes[pickIndex(lanes.length, random)],
    y: START_Y,
    speed: speedFor(game, random),
    sway: random() * Math.PI * 2,
  };
  return { ...game, balloons: [...game.balloons, balloon], nextId: game.nextId + 1 };
}

/** Moves balloons up by `dt` seconds, lets escaped ones go, and adds new ones. */
export function stepBalloons(game: BalloonGame, dt: number, random: () => number = Math.random): BalloonGame {
  if (game.finished) return game;
  const balloons = game.balloons
    .map((balloon) => ({ ...balloon, y: balloon.y - balloon.speed * dt }))
    .filter((balloon) => balloon.y > ESCAPE_Y);
  let next: BalloonGame = { ...game, balloons, spawnIn: game.spawnIn - dt };
  if (next.spawnIn <= 0 && next.balloons.length < MAX_BALLOONS) {
    next = { ...spawnBalloon(next, random), spawnIn: SPAWN_EVERY };
  }
  return next;
}

export function popBalloon(
  game: BalloonGame,
  id: number,
  random: () => number = Math.random,
): { game: BalloonGame; result: PopResult; balloon?: Balloon; newTarget: boolean } {
  const balloon = game.balloons.find((item) => item.id === id);
  if (!balloon || game.finished) return { game, result: 'missing', newTarget: false };
  if (balloon.value !== game.target) {
    return { game: { ...game, misses: game.misses + 1 }, result: 'wrong', balloon, newTarget: false };
  }

  const balloons = game.balloons.filter((item) => item.id !== id);
  const pops = game.pops + 1;
  const targetPops = game.targetPops + 1;
  if (targetPops < POPS_PER_TARGET) {
    return { game: { ...game, balloons, pops, targetPops }, result: 'correct', balloon, newTarget: false };
  }
  if (game.targetsUsed.length >= TARGETS_PER_ROUND) {
    return { game: { ...game, balloons, pops, targetPops, finished: true }, result: 'correct', balloon, newTarget: false };
  }
  const { target, distractors } = chooseTarget(game, random);
  return {
    game: {
      ...game,
      // Old balloons drift away so the new target starts on a clear sky.
      balloons: balloons.map((item) => ({ ...item, speed: Math.max(item.speed, 0.5) })),
      pops,
      target,
      distractors,
      targetsUsed: [...game.targetsUsed, target],
      targetPops: 0,
      spawnIn: 0.9,
    },
    result: 'correct',
    balloon,
    newTarget: true,
  };
}

/** Three stars for a careful round, never fewer than one. */
export function balloonStars(misses: number): number {
  if (misses <= 2) return 3;
  if (misses <= 6) return 2;
  return 1;
}
