import { letterOrder } from '../content/alphabet';
import { animalData } from '../content/animals';
import { numberData } from '../content/numbers';
import { vocabularyData } from '../content/vocabulary';
import type { LearningProgress } from '../types';

export const LETTER_TOTAL = letterOrder.length;
export const NUMBER_TOTAL = numberData.length;
export const ANIMAL_TOTAL = animalData.length;
export const WORD_TOTAL = vocabularyData.length;

export const LEARNING_TOTAL = LETTER_TOTAL + NUMBER_TOTAL + ANIMAL_TOTAL + WORD_TOTAL;

export interface LearningProgressSummary {
  letters: number;
  numbers: number;
  animals: number;
  words: number;
  explored: number;
  total: number;
  percent: number;
}

function capped(count: number, total: number): number {
  return Math.min(Math.max(count, 0), total);
}

export function overallLearningProgress(progress: LearningProgress): LearningProgressSummary {
  const letters = capped(progress.lettersExplored.length, LETTER_TOTAL);
  const numbers = capped(progress.numbersExplored.length, NUMBER_TOTAL);
  const animals = capped(progress.animalsDiscovered.length, ANIMAL_TOTAL);
  const words = capped(progress.wordsLearned.length, WORD_TOTAL);
  const explored = letters + numbers + animals + words;
  const total = LEARNING_TOTAL;
  const percent = total === 0 ? 0 : Math.round((explored / total) * 100);
  return { letters, numbers, animals, words, explored, total, percent };
}
