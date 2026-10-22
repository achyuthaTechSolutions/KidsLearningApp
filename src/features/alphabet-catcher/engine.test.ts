import { describe, expect, it } from 'vitest';
import { alphabetData } from '../../data/alphabet';
import { mulberry32 } from '../learning-games/questions';
import {
  catchLetter, catcherProfiles, catcherStars, createCatcherGame, createCatcherRound, fallY, nextCatcherRound,
} from './engine';

describe('Alphabet Catcher rounds', () => {
  it('offers the profile number of distinct choices including the target', () => {
    for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
      for (let seed = 1; seed <= 30; seed += 1) {
        const round = createCatcherRound(difficulty, 'upper', false, mulberry32(seed));
        expect(round.choices).toHaveLength(catcherProfiles[difficulty].choices);
        expect(new Set(round.choices.map((choice) => choice.letter)).size).toBe(round.choices.length);
        expect(round.choices.map((choice) => choice.letter)).toContain(round.target);
      }
    }
  });

  it('shows lowercase letters in lowercase mode', () => {
    const round = createCatcherRound('beginner', 'lower', false, mulberry32(2));
    for (const choice of round.choices) expect(choice.shown).toBe(choice.letter.toLowerCase());
  });

  it('never puts two letters with the same sound together in phonics mode', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const round = createCatcherRound('advanced', 'upper', true, mulberry32(seed));
      const sounds = round.choices.map((choice) => alphabetData[choice.letter].phonetic);
      expect(new Set(sounds).size).toBe(sounds.length);
    }
  });

  it('does not repeat the previous target', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      expect(createCatcherRound('beginner', 'upper', false, mulberry32(seed), 'A').target).not.toBe('A');
    }
  });
});

describe('Alphabet Catcher game', () => {
  it('accepts either case, counts a catch once, and finishes after the round length', () => {
    const random = mulberry32(8);
    let game = createCatcherGame('beginner', 'mixed', false, 3, random);
    for (let n = 1; n <= 3; n += 1) {
      const wrong = game.round.choices.find((choice) => choice.letter !== game.round.target)!;
      const missed = catchLetter(game, wrong.letter);
      expect(missed.result).toBe('wrong');
      game = missed.game;
      const caught = catchLetter(game, game.round.target.toLowerCase());
      expect(caught.result).toBe('correct');
      game = caught.game;
      expect(catchLetter(game, game.round.target).result).toBe('ignored');
      game = nextCatcherRound(game, random);
    }
    expect(game.finished).toBe(true);
    expect(game.mistakes).toBe(3);
    expect(game.firstTry).toBe(0);
    expect(catcherStars(game)).toBe(1);
  });

  it('will not move on before the letter is caught', () => {
    const game = createCatcherGame('beginner', 'upper', false, 5, mulberry32(1));
    expect(nextCatcherRound(game)).toBe(game);
  });

  it('loops falling letters back to the top', () => {
    expect(fallY(0, 0.1, 0)).toBeCloseTo(-0.15);
    expect(fallY(12.5, 0.1, 0)).toBeCloseTo(-0.15);
    expect(fallY(5, 0.1, 0)).toBeCloseTo(0.35);
  });
});
