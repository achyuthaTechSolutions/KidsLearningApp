import { letterOrder } from '../../data/alphabet';
import { grow } from '../learning-games/adaptive';
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
const TARGET_CHANCE = 0.45;

export interface BalloonProfile {
  /** Wrong balloons per target. Few at first, so the sky stays readable. */
  distractors: number;
  maxBalloons: number;
  /** Rising speed in stage heights per second, before a little random spread. */
  speed: number;
  /** Seconds between new balloons. */
  spawnEvery: number;
  /** Highest number in Numbers mode. */
  maxNumber: number;
}

/** What an endless level looks like. Each value grows with the level up to a safe limit. */
export function balloonProfile(level: number): BalloonProfile {
  const steps = Math.max(1, level) - 1;
  return {
    distractors: Math.min(6, 2 + Math.floor(steps / 2)),
    maxBalloons: Math.min(8, 4 + Math.floor(steps / 3)),
    speed: grow(level, 0.13, 0.02, 0.42),
    spawnEvery: grow(level, 1.2, -0.05, 0.6),
    maxNumber: grow(level, 5, 2, 20),
  };
}
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
  /** The endless level: how many balloons, how fast, and which numbers. */
  level: number;
  /** Wrong pops while looking for the current target. */
  targetMisses: number;
  targetsDone: number;
  /** Targets finished without a wrong pop. */
  firstTryTargets: number;
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

export function valuesFor(mode: BalloonMode, level = 1): string[] {
  if (mode === 'letters') return letterOrder;
  if (mode === 'numbers') return Array.from({ length: balloonProfile(level).maxNumber }, (_, index) => String(index + 1));
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

function pickDistractors(mode: BalloonMode, level: number, target: string, random: () => number): string[] {
  return shuffle(valuesFor(mode, level).filter((value) => value !== target), random).slice(0, balloonProfile(level).distractors);
}

function chooseTarget(game: Pick<BalloonGame, 'mode' | 'targetsUsed' | 'level'>, random: () => number) {
  const pool = valuesFor(game.mode, game.level);
  // Fresh targets first; once every one has had a turn, start the list again.
  const fresh = pool.filter((value) => !game.targetsUsed.includes(value));
  const choices = fresh.length > 0 ? fresh : pool;
  const target = choices[pickIndex(choices.length, random)];
  return { target, distractors: pickDistractors(game.mode, game.level, target, random), restart: fresh.length === 0 };
}

export function createBalloonGame(mode: BalloonMode, level = 1, random: () => number = Math.random): BalloonGame {
  const { target, distractors } = chooseTarget({ mode, targetsUsed: [], level }, random);
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
    level,
    targetMisses: 0,
    targetsDone: 0,
    firstTryTargets: 0,
  };
}

/** Moves the game to a new endless level: new balloons follow it, and the wrong ones are picked again. */
export function withLevel(game: BalloonGame, level: number, random: () => number = Math.random): BalloonGame {
  if (level === game.level) return game;
  return { ...game, level, distractors: pickDistractors(game.mode, level, game.target, random) };
}

export function speedFor(game: BalloonGame, random: () => number): number {
  return balloonProfile(game.level).speed + random() * 0.06;
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
  const profile = balloonProfile(game.level);
  const balloons = game.balloons
    .map((balloon) => ({ ...balloon, y: balloon.y - balloon.speed * dt }))
    .filter((balloon) => balloon.y > ESCAPE_Y);
  let next: BalloonGame = { ...game, balloons, spawnIn: game.spawnIn - dt };
  if (next.spawnIn <= 0 && next.balloons.length < profile.maxBalloons) {
    next = { ...spawnBalloon(next, random), spawnIn: profile.spawnEvery };
  }
  return next;
}

/**
 * Pops a balloon. A wrong one counts a miss. The third right pop finishes the
 * target: `targetDone` is set, with `firstTry` true when no wrong balloon was popped
 * for it, and a new target begins.
 */
export function popBalloon(
  game: BalloonGame,
  id: number,
  random: () => number = Math.random,
): { game: BalloonGame; result: PopResult; balloon?: Balloon; newTarget: boolean; targetDone: boolean; firstTry: boolean } {
  const balloon = game.balloons.find((item) => item.id === id);
  if (!balloon) return { game, result: 'missing', newTarget: false, targetDone: false, firstTry: false };
  if (balloon.value !== game.target) {
    return { game: { ...game, misses: game.misses + 1, targetMisses: game.targetMisses + 1 }, result: 'wrong', balloon, newTarget: false, targetDone: false, firstTry: false };
  }

  const balloons = game.balloons.filter((item) => item.id !== id);
  const pops = game.pops + 1;
  const targetPops = game.targetPops + 1;
  if (targetPops < POPS_PER_TARGET) {
    return { game: { ...game, balloons, pops, targetPops }, result: 'correct', balloon, newTarget: false, targetDone: false, firstTry: false };
  }
  const firstTry = game.targetMisses === 0;
  const { target, distractors, restart } = chooseTarget(game, random);
  return {
    game: {
      ...game,
      // Old balloons drift away so the new target starts on a clear sky.
      balloons: balloons.map((item) => ({ ...item, speed: Math.max(item.speed, 0.5) })),
      pops,
      target,
      distractors,
      targetsUsed: restart ? [target] : [...game.targetsUsed, target],
      targetPops: 0,
      targetMisses: 0,
      targetsDone: game.targetsDone + 1,
      firstTryTargets: game.firstTryTargets + (firstTry ? 1 : 0),
      spawnIn: 0.9,
    },
    result: 'correct',
    balloon,
    newTarget: true,
    targetDone: true,
    firstTry,
  };
}

/** Stars when the child stops: targets finished without a wrong pop, out of all targets. */
export function balloonStars(game: Pick<BalloonGame, 'targetsDone' | 'firstTryTargets'>): number {
  if (game.targetsDone === 0) return 1;
  const ratio = game.firstTryTargets / game.targetsDone;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}
