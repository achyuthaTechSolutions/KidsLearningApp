import { describe, expect, it } from 'vitest';
import { alphabetData } from '../../data/alphabet';
import { mulberry32 } from '../learning-games/questions';
import {
  catchLetter, catcherProfile, catcherStars, createCatcherGame, createCatcherRound, fallY, nextCatcherRound,
} from './engine';

describe('Alphabet Catcher rounds', () => {
  it('offers more letters as the level rises, from 3 up to 8, all distinct and including the target', () => {
    expect([1, 2, 3, 5, 7, 9, 11, 50].map((level) => catcherProfile(level).choices)).toEqual([3, 3, 4, 5, 6, 7, 8, 8]);
    expect(catcherProfile(20).fallSpeed).toBeGreaterThan(catcherProfile(1).fallSpeed);
    expect(catcherProfile(999).fallSpeed).toBe(0.16);
    for (const level of [1, 4, 7, 12, 40]) {
      for (let seed = 1; seed <= 30; seed += 1) {
        const round = createCatcherRound(level, 'upper', false, mulberry32(seed));
        expect(round.choices).toHaveLength(catcherProfile(level).choices);
        expect(new Set(round.choices.map((choice) => choice.letter)).size).toBe(round.choices.length);
        expect(round.choices.map((choice) => choice.letter)).toContain(round.target);
      }
    }
  });

  it('shows lowercase letters in lowercase mode', () => {
    const round = createCatcherRound(1, 'lower', false, mulberry32(2));
    for (const choice of round.choices) expect(choice.shown).toBe(choice.letter.toLowerCase());
  });

  it('never puts two letters with the same sound together in phonics mode', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const round = createCatcherRound(12, 'upper', true, mulberry32(seed));
      const sounds = round.choices.map((choice) => alphabetData[choice.letter].phonetic);
      expect(new Set(sounds).size).toBe(sounds.length);
    }
  });

  it('does not repeat the previous target', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      expect(createCatcherRound(1, 'upper', false, mulberry32(seed), 'A').target).not.toBe('A');
    }
  });
});

describe('Alphabet Catcher game', () => {
  it('accepts either case, counts a catch once, and keeps going with the next level', () => {
    const random = mulberry32(8);
    let game = createCatcherGame(1, 'mixed', false, random);
    for (let n = 1; n <= 3; n += 1) {
      const wrong = game.round.choices.find((choice) => choice.letter !== game.round.target)!;
      const missed = catchLetter(game, wrong.letter);
      expect(missed.result).toBe('wrong');
      game = missed.game;
      const caught = catchLetter(game, game.round.target.toLowerCase());
      expect(caught.result).toBe('correct');
      game = caught.game;
      expect(catchLetter(game, game.round.target).result).toBe('ignored');
      game = nextCatcherRound(game, n + 1, random);
    }
    expect(game.number).toBe(4);
    expect(game.level).toBe(4);
    expect(game.round.choices).toHaveLength(catcherProfile(4).choices);
    expect(game.caughtCount).toBe(3);
    expect(game.mistakes).toBe(3);
    expect(game.firstTry).toBe(0);
    expect(catcherStars(game)).toBe(1);
  });

  it('will not move on before the letter is caught', () => {
    const game = createCatcherGame(1, 'upper', false, mulberry32(1));
    expect(catcherStars(game)).toBe(1);
    expect(nextCatcherRound(game)).toBe(game);
  });

  it('loops falling letters back to the top', () => {
    expect(fallY(0, 0.1, 0)).toBeCloseTo(-0.15);
    expect(fallY(12.5, 0.1, 0)).toBeCloseTo(-0.15);
    expect(fallY(5, 0.1, 0)).toBeCloseTo(0.35);
  });
});
