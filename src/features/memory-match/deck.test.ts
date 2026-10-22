import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../learning-games/questions';
import { createDeck, isPair, memoryStars, pairsForLevel, picturesFor, type MemoryLevel, type MemoryTheme } from './deck';

describe('Memory Match deck', () => {
  it('has every theme big enough for the hardest level', () => {
    for (const theme of ['animals', 'fruits', 'vehicles'] as MemoryTheme[]) {
      const names = new Set(picturesFor(theme).map((picture) => picture.name));
      expect(names.size).toBeGreaterThanOrEqual(pairsForLevel.hard);
    }
  });

  it('deals exactly two of each picture', () => {
    for (const level of ['easy', 'medium', 'hard'] as MemoryLevel[]) {
      const deck = createDeck('animals', level, mulberry32(4));
      expect(deck).toHaveLength(pairsForLevel[level] * 2);
      expect(new Set(deck.map((card) => card.id)).size).toBe(deck.length);
      const counts = new Map<string, number>();
      for (const card of deck) counts.set(card.name, (counts.get(card.name) ?? 0) + 1);
      expect([...counts.values()].every((count) => count === 2)).toBe(true);
    }
  });

  it('matches two different cards with the same picture only', () => {
    const deck = createDeck('fruits', 'easy', mulberry32(9));
    const [first] = deck;
    const twin = deck.find((card) => card.name === first.name && card.id !== first.id)!;
    const other = deck.find((card) => card.name !== first.name)!;
    expect(isPair(first, twin)).toBe(true);
    expect(isPair(first, first)).toBe(false);
    expect(isPair(first, other)).toBe(false);
  });

  it('rewards fewer turns with more stars', () => {
    expect(memoryStars(4, 4)).toBe(3);
    expect(memoryStars(8, 4)).toBe(2);
    expect(memoryStars(20, 4)).toBe(1);
  });
});
