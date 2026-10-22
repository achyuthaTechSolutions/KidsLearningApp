import { animalData } from '../../data/animals';
import { vocabularyData } from '../../data/vocabulary';

export type MemoryTheme = 'animals' | 'fruits' | 'vehicles';
export type MemoryLevel = 'easy' | 'medium' | 'hard';

export interface MemoryPicture {
  name: string;
  emoji: string;
}

export interface MemoryCard extends MemoryPicture {
  id: number;
}

export const pairsForLevel: Record<MemoryLevel, number> = { easy: 3, medium: 4, hard: 6 };

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

/** Two cards for each of `pairs` different pictures, shuffled. */
export function createDeck(theme: MemoryTheme, level: MemoryLevel, random: () => number = Math.random): MemoryCard[] {
  const pictures = shuffle(picturesFor(theme), random).slice(0, pairsForLevel[level]);
  const cards = pictures.flatMap((picture) => [picture, picture]);
  return shuffle(cards, random).map((picture, id) => ({ ...picture, id }));
}

export function isPair(a: MemoryCard, b: MemoryCard): boolean {
  return a.id !== b.id && a.name === b.name;
}

/** A turn is two flips. A perfect memory needs one turn per pair. */
export function memoryStars(turns: number, pairs: number): number {
  if (turns <= pairs + 2) return 3;
  if (turns <= pairs * 2 + 1) return 2;
  return 1;
}
