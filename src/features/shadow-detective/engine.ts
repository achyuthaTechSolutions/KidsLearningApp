import type { GameDifficulty } from '../learning-games/difficulty';
import { shuffle, type Random } from '../learning-games/random';

export type ShadowTheme = 'animals' | 'food' | 'vehicles' | 'home' | 'nature' | 'mixed';

export interface ShadowItem {
  id: string;
  name: string;
  emoji: string;
  theme: Exclude<ShadowTheme, 'mixed'>;
}

/**
 * Hand-picked so every outline is easy to tell apart within its theme.
 * Round things that look alike as shadows (apple, orange, tomato, ball) are left out.
 */
export const shadowItems: ShadowItem[] = [
  { id: 'elephant', name: 'Elephant', emoji: '🐘', theme: 'animals' },
  { id: 'giraffe', name: 'Giraffe', emoji: '🦒', theme: 'animals' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', theme: 'animals' },
  { id: 'turtle', name: 'Turtle', emoji: '🐢', theme: 'animals' },
  { id: 'snail', name: 'Snail', emoji: '🐌', theme: 'animals' },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', theme: 'animals' },
  { id: 'whale', name: 'Whale', emoji: '🐋', theme: 'animals' },
  { id: 'banana', name: 'Banana', emoji: '🍌', theme: 'food' },
  { id: 'grapes', name: 'Grapes', emoji: '🍇', theme: 'food' },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', theme: 'food' },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', theme: 'food' },
  { id: 'corn', name: 'Corn', emoji: '🌽', theme: 'food' },
  { id: 'ice-cream', name: 'Ice cream', emoji: '🍦', theme: 'food' },
  { id: 'airplane', name: 'Airplane', emoji: '✈️', theme: 'vehicles' },
  { id: 'bicycle', name: 'Bicycle', emoji: '🚲', theme: 'vehicles' },
  { id: 'helicopter', name: 'Helicopter', emoji: '🚁', theme: 'vehicles' },
  { id: 'tractor', name: 'Tractor', emoji: '🚜', theme: 'vehicles' },
  { id: 'sailboat', name: 'Sailboat', emoji: '⛵', theme: 'vehicles' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', theme: 'vehicles' },
  { id: 'chair', name: 'Chair', emoji: '🪑', theme: 'home' },
  { id: 'umbrella', name: 'Umbrella', emoji: '☂️', theme: 'home' },
  { id: 'key', name: 'Key', emoji: '🔑', theme: 'home' },
  { id: 'scissors', name: 'Scissors', emoji: '✂️', theme: 'home' },
  { id: 'glasses', name: 'Glasses', emoji: '👓', theme: 'home' },
  { id: 'backpack', name: 'Backpack', emoji: '🎒', theme: 'home' },
  { id: 'tree', name: 'Tree', emoji: '🌳', theme: 'nature' },
  { id: 'cactus', name: 'Cactus', emoji: '🌵', theme: 'nature' },
  { id: 'mushroom', name: 'Mushroom', emoji: '🍄', theme: 'nature' },
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', theme: 'nature' },
  { id: 'moon', name: 'Moon', emoji: '🌙', theme: 'nature' },
  { id: 'star', name: 'Star', emoji: '⭐', theme: 'nature' },
];

export const shadowThemes: { value: ShadowTheme; label: string; emoji: string }[] = [
  { value: 'animals', label: 'Animals', emoji: '🐘' },
  { value: 'food', label: 'Food', emoji: '🍌' },
  { value: 'vehicles', label: 'Vehicles', emoji: '🚲' },
  { value: 'home', label: 'At home', emoji: '☂️' },
  { value: 'nature', label: 'Nature', emoji: '🌵' },
  { value: 'mixed', label: 'Mix', emoji: '🎁' },
];

export const shadowProfiles: Record<GameDifficulty, { shadows: number; choices: number }> = {
  beginner: { shadows: 1, choices: 2 },
  intermediate: { shadows: 1, choices: 4 },
  advanced: { shadows: 2, choices: 4 },
};

export const SHADOW_ROUNDS = 6;

export interface ShadowRound {
  /** Items shown as shadows, to be matched. */
  shadows: ShadowItem[];
  /** Pictures to choose from, including every shadow's item. */
  choices: ShadowItem[];
  /** Shadow ids already matched. */
  matched: string[];
  /** Choices tried that did not match, so they can be greyed out. */
  tried: string[];
}

export function itemsFor(theme: ShadowTheme): ShadowItem[] {
  return theme === 'mixed' ? shadowItems : shadowItems.filter((item) => item.theme === theme);
}

export function createShadowRound(theme: ShadowTheme, difficulty: GameDifficulty, random: Random = Math.random, avoid: string[] = []): ShadowRound {
  const { shadows, choices } = shadowProfiles[difficulty];
  const pool = itemsFor(theme);
  const fresh = pool.filter((item) => !avoid.includes(item.id));
  const picked = shuffle(fresh.length >= choices ? fresh : pool, random).slice(0, choices);
  return { shadows: picked.slice(0, shadows), choices: shuffle(picked, random), matched: [], tried: [] };
}

export type ShadowResult = 'match' | 'no-match' | 'ignored';

/** A choice matches any shadow that is still waiting. Wrong picks are just greyed out. */
export function chooseShadow(round: ShadowRound, itemId: string): { round: ShadowRound; result: ShadowResult } {
  if (round.matched.includes(itemId) || round.tried.includes(itemId) || isRoundDone(round)) return { round, result: 'ignored' };
  if (round.shadows.some((item) => item.id === itemId)) return { round: { ...round, matched: [...round.matched, itemId] }, result: 'match' };
  return { round: { ...round, tried: [...round.tried, itemId] }, result: 'no-match' };
}

export function isRoundDone(round: ShadowRound): boolean {
  return round.shadows.every((item) => round.matched.includes(item.id));
}
