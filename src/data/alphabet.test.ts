import { describe, it, expect } from 'vitest';
import { alphabetData, letterOrder } from './alphabet';

describe('Alphabet Data', () => {
  it('contains all 26 letters', () => {
    expect(letterOrder).toHaveLength(26);
    expect(Object.keys(alphabetData)).toHaveLength(26);
  });

  it('has all required fields for every letter', () => {
    for (const letter of letterOrder) {
      const d = alphabetData[letter];
      expect(d).toBeDefined();
      expect(d.letter).toBe(letter);
      expect(d.uppercase).toBe(letter);
      expect(d.lowercase).toBe(letter.toLowerCase());
      expect(d.word).toBeTruthy();
      expect(d.description).toBeTruthy();
      expect(d.phonetic).toBeTruthy();
      expect(d.emoji).toBeTruthy();
    }
  });

  it('descriptions follow the pattern "X is for Word!"', () => {
    for (const letter of letterOrder) {
      const d = alphabetData[letter];
      expect(d.description).toMatch(new RegExp(`^${letter} is for .+!$`));
    }
  });

  it('letter order matches A-Z sequence', () => {
    expect(letterOrder.join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });
});
