import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../learning-games/questions';
import { MAX_PAIRS, createDeck, isPair, memoryStars, pairsFor, picturesFor, type MemoryTheme } from './deck';

describe('Memory Match deck', () => {
  it('adds a pair every two levels, up to 8, never more than a theme has pictures', () => {
    expect([1, 2, 3, 5, 7, 9, 11, 500].map((level) => pairsFor(level, 'animals'))).toEqual([3, 3, 4, 5, 6, 7, 8, 8]);
    for (const theme of ['animals', 'fruits', 'vehicles'] as MemoryTheme[]) {
      const names = new Set(picturesFor(theme).map((picture) => picture.name));
      expect(pairsFor(500, theme)).toBe(Math.min(MAX_PAIRS, names.size));
      expect(names.size).toBeGreaterThanOrEqual(6);
    }
  });

  it('deals exactly two of each picture at every level', () => {
    for (const theme of ['animals', 'fruits', 'vehicles'] as MemoryTheme[]) for (const level of [1, 4, 7, 12, 99]) {
      const deck = createDeck(theme, level, mulberry32(4));
      expect(deck).toHaveLength(pairsFor(level, theme) * 2);
      expect(new Set(deck.map((card) => card.id)).size).toBe(deck.length);
      const counts = new Map<string, number>();
      for (const card of deck) counts.set(card.name, (counts.get(card.name) ?? 0) + 1);
      expect([...counts.values()].every((count) => count === 2)).toBe(true);
    }
  });

  it('matches two different cards with the same picture only', () => {
    const deck = createDeck('fruits', 1, mulberry32(9));
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
