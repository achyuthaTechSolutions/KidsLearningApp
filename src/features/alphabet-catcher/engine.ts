import { alphabetData, letterOrder } from '../../data/alphabet';
import { grow } from '../learning-games/adaptive';
import { pick, shuffle, type Random } from '../learning-games/random';

export type LetterCase = 'upper' | 'lower' | 'mixed';
export type CatcherMotion = 'still' | 'falling';

export interface CatcherProfile {
  choices: number;
  /** Fall speed in stage heights per second. Kept slow on purpose. */
  fallSpeed: number;
}

/**
 * Choices and fall speed for an endless level: 3 letters at level 1, one more every
 * two levels up to 8; falling a little faster each level, up to a gentle limit.
 */
export function catcherProfile(level: number): CatcherProfile {
  return {
    choices: Math.min(8, 3 + Math.floor((Math.max(1, level) - 1) / 2)),
    fallSpeed: grow(level, 0.07, 0.008, 0.16),
  };
}

export interface CatcherChoice {
  /** The letter as shown, e.g. "b" or "B". */
  shown: string;
  /** The uppercase letter, used to check the answer. */
  letter: string;
}

export interface CatcherRound {
  target: string;
  /** How the target is shown in the prompt. */
  targetShown: string;
  choices: CatcherChoice[];
}

function show(letter: string, letterCase: LetterCase, random: Random): string {
  if (letterCase === 'upper') return letter;
  if (letterCase === 'lower') return letter.toLowerCase();
  return random() < 0.5 ? letter : letter.toLowerCase();
}

/**
 * A target and distinct choices. In phonics mode no two choices share a sound,
 * so C and K ("kuh") are never on screen together.
 */
export function createCatcherRound(
  level: number,
  letterCase: LetterCase,
  phonics: boolean,
  random: Random = Math.random,
  previous?: string,
): CatcherRound {
  const pool = letterOrder.filter((letter) => letter !== previous);
  const target = pick(pool, random);
  const sound = alphabetData[target].phonetic;
  const distractors = shuffle(letterOrder.filter((letter) => letter !== target && (!phonics || alphabetData[letter].phonetic !== sound)), random);
  const picked: string[] = [];
  for (const letter of distractors) {
    if (picked.length >= catcherProfile(level).choices - 1) break;
    if (phonics && picked.some((other) => alphabetData[other].phonetic === alphabetData[letter].phonetic)) continue;
    picked.push(letter);
  }
  const choices = shuffle([target, ...picked], random).map((letter) => ({ letter, shown: show(letter, letterCase, random) }));
  return { target, targetShown: choices.find((choice) => choice.letter === target)?.shown ?? target, choices };
}

export function catcherPrompt(round: CatcherRound, phonics: boolean): string {
  if (phonics) return `Catch the letter that says "${alphabetData[round.target].phonetic}"!`;
  return `Catch the letter ${round.target}!`;
}

/** An endless game: letters keep coming until the child stops. */
export interface CatcherGame {
  /** The endless level the current letters were made for. */
  level: number;
  letterCase: LetterCase;
  phonics: boolean;
  /** Letter number, from 1. */
  number: number;
  round: CatcherRound;
  /** True after the right letter is caught, until the next round starts. */
  caught: boolean;
  /** Letters caught so far. */
  caughtCount: number;
  firstTry: number;
  mistakes: number;
  roundMistakes: number;
}

export function createCatcherGame(level: number, letterCase: LetterCase, phonics: boolean, random: Random = Math.random): CatcherGame {
  return {
    level, letterCase, phonics,
    number: 1,
    round: createCatcherRound(level, letterCase, phonics, random),
    caught: false,
    caughtCount: 0,
    firstTry: 0,
    mistakes: 0,
    roundMistakes: 0,
  };
}

export type CatchResult = 'correct' | 'wrong' | 'ignored';

/** Checks a pick. Once caught, further taps are ignored so one catch counts once. */
export function catchLetter(game: CatcherGame, letter: string): { game: CatcherGame; result: CatchResult } {
  if (game.caught) return { game, result: 'ignored' };
  if (letter.toUpperCase() !== game.round.target) {
    return { game: { ...game, mistakes: game.mistakes + 1, roundMistakes: game.roundMistakes + 1 }, result: 'wrong' };
  }
  return {
    game: { ...game, caught: true, caughtCount: game.caughtCount + 1, firstTry: game.firstTry + (game.roundMistakes === 0 ? 1 : 0) },
    result: 'correct',
  };
}

/** The next letter, made for `level` (the level after the last catch). */
export function nextCatcherRound(game: CatcherGame, level = game.level, random: Random = Math.random): CatcherGame {
  if (!game.caught) return game;
  return {
    ...game,
    level,
    number: game.number + 1,
    round: createCatcherRound(level, game.letterCase, game.phonics, random, game.round.target),
    caught: false,
    roundMistakes: 0,
  };
}

/** Stars when the child stops: first-try catches out of all catches. */
export function catcherStars(game: CatcherGame): number {
  if (game.caughtCount === 0) return 1;
  const ratio = game.firstTry / game.caughtCount;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

/** Fall position for a choice, looping back to the top so nothing is ever missed. */
export function fallY(elapsed: number, speed: number, offset: number): number {
  const span = 1.25;
  return ((elapsed * speed + offset) % span) - 0.15;
}
