import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../learning-games/questions';
import { MAX_LETTERS, MIN_LETTERS, WORDS_PER_ROUND, isNextLetter, pickSpellWords, scrambleTiles, spellWords } from './words';

describe('Word Builder words', () => {
  it('only uses short words made of letters', () => {
    expect(spellWords.length).toBeGreaterThanOrEqual(WORDS_PER_ROUND * 3);
    for (const { word } of spellWords) {
      expect(word).toMatch(/^[A-Za-z]+$/);
      expect(word.length).toBeGreaterThanOrEqual(MIN_LETTERS);
      expect(word.length).toBeLessThanOrEqual(MAX_LETTERS);
    }
    expect(new Set(spellWords.map((item) => item.word.toUpperCase())).size).toBe(spellWords.length);
  });

  it('picks different words, shortest first', () => {
    const words = pickSpellWords(WORDS_PER_ROUND, mulberry32(2));
    expect(new Set(words.map((item) => item.word)).size).toBe(WORDS_PER_ROUND);
    const lengths = words.map((item) => item.word.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
  });

  it('scrambles every letter without spelling the word', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      for (const { word } of spellWords) {
        const tiles = scrambleTiles(word, mulberry32(seed));
        const upper = word.toUpperCase();
        expect(tiles.map((tile) => tile.letter).sort()).toEqual(upper.split('').sort());
        if (new Set(upper).size > 1) expect(tiles.map((tile) => tile.letter).join('')).not.toBe(upper);
      }
    }
  });

  it('accepts only the next letter of the word', () => {
    expect(isNextLetter('Cat', 0, 'C')).toBe(true);
    expect(isNextLetter('Cat', 1, 'a')).toBe(true);
    expect(isNextLetter('Cat', 1, 'T')).toBe(false);
  });
});
