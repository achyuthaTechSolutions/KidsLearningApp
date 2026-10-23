import { animalData } from '../../data/animals';
import { vocabularyData } from '../../data/vocabulary';

export type MemoryTheme = 'animals' | 'fruits' | 'vehicles';

export interface MemoryPicture {
  name: string;
  emoji: string;
}

export interface MemoryCard extends MemoryPicture {
  id: number;
}

/** Most pairs on one board: 16 cards still fit a phone screen in a 4 × 4 grid. */
export const MAX_PAIRS = 8;

/** Pairs for an endless level: 3 at level 1, one more every two levels, up to 8 (or the pictures a theme has). */
export function pairsFor(level: number, theme: MemoryTheme): number {
  const available = new Set(picturesFor(theme).map((picture) => picture.name)).size;
  return Math.min(MAX_PAIRS, available, 3 + Math.floor((Math.max(1, level) - 1) / 2));
}

export function picturesFor(theme: MemoryTheme): MemoryPicture[] {
  if (theme === 'animals') return animalData.map(({ name, emoji }) => ({ name, emoji }));
  const category = theme === 'fruits' ? ['fruits', 'vegetables'] : ['vehicles'];
  return vocabularyData
    .filter((item) => category.includes(item.category))
    .map(({ word, emoji }) => ({ name: word, emoji }));
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Two cards for each of the level's different pictures, shuffled. */
export function createDeck(theme: MemoryTheme, level: number, random: () => number = Math.random): MemoryCard[] {
  const unique = [...new Map(picturesFor(theme).map((picture) => [picture.name, picture])).values()];
  const pictures = shuffle(unique, random).slice(0, pairsFor(level, theme));
  const cards = pictures.flatMap((picture) => [picture, picture]);
  return shuffle(cards, random).map((picture, id) => ({ ...picture, id }));
}

export function isPair(a: MemoryCard, b: MemoryCard): boolean {
  return a.id !== b.id && a.name === b.name;
}

/**
 * A turn is two flips. A perfect memory needs one turn per pair. A board cleared in
 * three-star turns counts as "first try" for the endless level.
 */
export function memoryStars(turns: number, pairs: number): number {
  if (turns <= pairs + 2) return 3;
  if (turns <= pairs * 2 + 1) return 2;
  return 1;
}
