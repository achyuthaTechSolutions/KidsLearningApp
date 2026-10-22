import { describe, expect, it } from 'vitest';
import { defaultProgress } from './storage';
import { animalData } from '../data/animals';
import { numberData } from '../data/numbers';
import { vocabularyData } from '../data/vocabulary';
import {
  ANIMAL_TOTAL,
  LETTER_TOTAL,
  NUMBER_TOTAL,
  WORD_TOTAL,
  overallLearningProgress,
} from './progressStats';

describe('Learning progress totals', () => {
  it('matches the content each learning area teaches', () => {
    expect(LETTER_TOTAL).toBe(26);
    expect(NUMBER_TOTAL).toBe(21);
    expect(numberData[0].value).toBe(0);
    expect(numberData[NUMBER_TOTAL - 1].value).toBe(20);
    expect(ANIMAL_TOTAL).toBe(animalData.length);
    expect(WORD_TOTAL).toBe(vocabularyData.length);
  });

  it('counts letters, numbers, animals, and words together', () => {
    const summary = overallLearningProgress({
      ...defaultProgress,
      lettersExplored: ['A'],
      numbersExplored: [0, 1],
      animalsDiscovered: ['Cat'],
      wordsLearned: ['Sun'],
    });

    expect(summary).toMatchObject({
      letters: 1,
      numbers: 2,
      animals: 1,
      words: 1,
      explored: 5,
      total: LETTER_TOTAL + NUMBER_TOTAL + ANIMAL_TOTAL + WORD_TOTAL,
    });
    expect(summary.percent).toBe(Math.round((5 / summary.total) * 100));
  });

  it('does not let one area count past its total', () => {
    const summary = overallLearningProgress({
      ...defaultProgress,
      lettersExplored: Array.from({ length: 40 }, (_, index) => String(index)),
    });
    expect(summary.letters).toBe(LETTER_TOTAL);
    expect(summary.explored).toBe(LETTER_TOTAL);
    expect(summary.percent).toBeLessThanOrEqual(100);
  });

  it('starts at zero when nothing has been explored', () => {
    const summary = overallLearningProgress(defaultProgress);
    expect(summary.explored).toBe(0);
    expect(summary.percent).toBe(0);
  });
});
