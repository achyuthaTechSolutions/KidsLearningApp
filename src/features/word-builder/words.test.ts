import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../learning-games/questions';
import { MAX_LETTERS, MIN_LETTERS, decoysFor, isNextLetter, pickWord, scrambleTiles, spellWords, wordLengthsFor } from './words';

describe('Word Builder words', () => {
  it('only uses short words made of letters, with plenty of each length', () => {
    for (const { word } of spellWords) {
      expect(word).toMatch(/^[A-Za-z]+$/);
      expect(word.length).toBeGreaterThanOrEqual(MIN_LETTERS);
      expect(word.length).toBeLessThanOrEqual(MAX_LETTERS);
    }
    expect(new Set(spellWords.map((item) => item.word.toUpperCase())).size).toBe(spellWords.length);
    for (const length of [3, 4, 5, 6]) expect(spellWords.filter((item) => item.word.length === length).length, `${length} letters`).toBeGreaterThanOrEqual(8);
  });

  it('get longer as the level rises, and add decoy letters from level 7', () => {
    expect([1, 2, 3, 5, 7, 9, 11, 13, 99].map(wordLengthsFor)).toEqual([[3], [3], [3, 4], [4], [4, 5], [5], [5, 6], [6], [6]]);
    expect([1, 6, 7, 10, 11, 15, 99].map(decoysFor)).toEqual([0, 0, 1, 1, 2, 3, 3]);
  });

  it('pick a word of the right length that was not used just before', () => {
    const random = mulberry32(2);
    const recent: string[] = [];
    for (let i = 0; i < 40; i += 1) {
      const level = 1 + (i % 14);
      const word = pickWord(level, recent, random);
      expect(wordLengthsFor(level)).toContain(word.word.length);
      expect(recent.slice(-6)).not.toContain(word.word);
      recent.push(word.word);
    }
  });

  it('scramble every letter without spelling the word, and add decoys that are not in it', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      for (const { word } of spellWords) {
        const upper = word.toUpperCase();
        const tiles = scrambleTiles(word, mulberry32(seed));
        expect(tiles.map((tile) => tile.letter).sort()).toEqual(upper.split('').sort());
        if (new Set(upper).size > 1) expect(tiles.map((tile) => tile.letter).join('')).not.toBe(upper);
        const withDecoys = scrambleTiles(word, mulberry32(seed), 2);
        expect(withDecoys).toHaveLength(upper.length + 2);
        expect(new Set(withDecoys.map((tile) => tile.id)).size).toBe(withDecoys.length);
        const extras = withDecoys.map((tile) => tile.letter).filter((letter) => !upper.includes(letter));
        expect(extras).toHaveLength(2);
      }
    }
  });

  it('accepts only the next letter of the word', () => {
    expect(isNextLetter('Cat', 0, 'C')).toBe(true);
    expect(isNextLetter('Cat', 1, 'a')).toBe(true);
    expect(isNextLetter('Cat', 1, 'T')).toBe(false);
  });
});
