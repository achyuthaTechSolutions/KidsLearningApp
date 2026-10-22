import { alphabetData, letterOrder } from '../../data/alphabet';
import type { GameDifficulty } from '../learning-games/difficulty';
import { pick, shuffle, type Random } from '../learning-games/random';

export type LetterCase = 'upper' | 'lower' | 'mixed';
export type CatcherMotion = 'still' | 'falling';

export interface CatcherProfile {
  choices: number;
  /** Fall speed in stage heights per second. Kept slow on purpose. */
  fallSpeed: number;
}

export const catcherProfiles: Record<GameDifficulty, CatcherProfile> = {
  beginner: { choices: 3, fallSpeed: 0.07 },
  intermediate: { choices: 4, fallSpeed: 0.095 },
  advanced: { choices: 6, fallSpeed: 0.12 },
};

export const ROUND_LENGTHS = [5, 10, 15] as const;
export const DEFAULT_ROUND_LENGTH = 10;

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
  difficulty: GameDifficulty,
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
    if (picked.length >= catcherProfiles[difficulty].choices - 1) break;
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

export interface CatcherGame {
  difficulty: GameDifficulty;
  letterCase: LetterCase;
  phonics: boolean;
  length: number;
  number: number;
  round: CatcherRound;
  /** True after the right letter is caught, until the next round starts. */
  caught: boolean;
  firstTry: number;
  mistakes: number;
  roundMistakes: number;
  finished: boolean;
}

export function createCatcherGame(
  difficulty: GameDifficulty,
  letterCase: LetterCase,
  phonics: boolean,
  length = DEFAULT_ROUND_LENGTH,
  random: Random = Math.random,
): CatcherGame {
  return {
    difficulty, letterCase, phonics, length,
    number: 1,
    round: createCatcherRound(difficulty, letterCase, phonics, random),
    caught: false,
    firstTry: 0,
    mistakes: 0,
    roundMistakes: 0,
    finished: false,
  };
}

export type CatchResult = 'correct' | 'wrong' | 'ignored';

/** Checks a pick. Once caught, further taps are ignored so one catch counts once. */
export function catchLetter(game: CatcherGame, letter: string): { game: CatcherGame; result: CatchResult } {
  if (game.caught || game.finished) return { game, result: 'ignored' };
  if (letter.toUpperCase() !== game.round.target) {
    return { game: { ...game, mistakes: game.mistakes + 1, roundMistakes: game.roundMistakes + 1 }, result: 'wrong' };
  }
  return { game: { ...game, caught: true, firstTry: game.firstTry + (game.roundMistakes === 0 ? 1 : 0) }, result: 'correct' };
}

export function nextCatcherRound(game: CatcherGame, random: Random = Math.random): CatcherGame {
  if (!game.caught) return game;
  if (game.number >= game.length) return { ...game, finished: true };
  return {
    ...game,
    number: game.number + 1,
    round: createCatcherRound(game.difficulty, game.letterCase, game.phonics, random, game.round.target),
    caught: false,
    roundMistakes: 0,
  };
}

export function catcherStars(game: CatcherGame): number {
  const ratio = game.firstTry / game.length;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

/** Fall position for a choice, looping back to the top so nothing is ever missed. */
export function fallY(elapsed: number, speed: number, offset: number): number {
  const span = 1.25;
  return ((elapsed * speed + offset) % span) - 0.15;
}
