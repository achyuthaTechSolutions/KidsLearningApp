/** Shared helpers for games that take an injectable random source, so tests can use a seed. */
export type Random = () => number;

export function pickIndex(length: number, random: Random): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

export function pick<T>(items: readonly T[], random: Random): T {
  return items[pickIndex(items.length, random)];
}

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, random);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
