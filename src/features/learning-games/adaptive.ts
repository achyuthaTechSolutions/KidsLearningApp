import type { GameDifficulty } from './difficulty';

/*
 * Endless levels that follow the child. Every game keeps one level number per child,
 * starting from the parent's difficulty choice. Three answers in a row right on the
 * first try move up a level; two answers in a row that needed help move down one, so
 * a child is never stuck on something too hard. There is no top level: games keep
 * growing (more choices, bigger numbers, faster) as the level rises.
 */

export interface Adaptive {
  level: number;
  /** First-try answers in a row. */
  streak: number;
  /** Answers in a row that took more than one try. */
  struggles: number;
}

export type LevelChange = 'up' | 'down' | null;

export const UP_AFTER = 3;
export const DOWN_AFTER = 2;
export const MAX_SAVED_LEVEL = 999;

/** Where each difficulty starts: Beginner at 1, Explorer at 4, Champion at 7. */
export const startLevel: Record<GameDifficulty, number> = { beginner: 1, intermediate: 4, advanced: 7 };

export function createAdaptive(level: number): Adaptive {
  return { level: clampLevel(level), streak: 0, struggles: 0 };
}

export function clampLevel(level: number): number {
  return Number.isFinite(level) ? Math.min(MAX_SAVED_LEVEL, Math.max(1, Math.floor(level))) : 1;
}

/** Records one answered question: right first time, or right after help or retries. */
export function recordAnswer(state: Adaptive, firstTry: boolean): { state: Adaptive; change: LevelChange } {
  if (firstTry) {
    const streak = state.streak + 1;
    if (streak >= UP_AFTER) return { state: { level: state.level + 1, streak: 0, struggles: 0 }, change: 'up' };
    return { state: { ...state, streak, struggles: 0 }, change: null };
  }
  const struggles = state.struggles + 1;
  if (struggles >= DOWN_AFTER && state.level > 1) return { state: { level: state.level - 1, streak: 0, struggles: 0 }, change: 'down' };
  return { state: { ...state, streak: 0, struggles: struggles >= DOWN_AFTER ? 0 : struggles }, change: null };
}

/** The difficulty band a level is in: 1–3 Beginner, 4–6 Explorer, 7 and up Champion. */
export function bandOf(level: number): GameDifficulty {
  if (level <= 3) return 'beginner';
  if (level <= 6) return 'intermediate';
  return 'advanced';
}

/**
 * A value that grows with the level and levels off at `max`: `from` at level 1, then
 * `step` more each level. Use it for choices, number ranges, and speed.
 */
export function grow(level: number, from: number, step: number, max: number): number {
  const value = from + step * (clampLevel(level) - 1);
  return step >= 0 ? Math.min(max, value) : Math.max(max, value);
}

/** Saved level for a game, or the start for the chosen difficulty when there is none. */
export function resumeLevel(saved: number | undefined, difficulty: GameDifficulty): number {
  return saved ? clampLevel(saved) : startLevel[difficulty];
}
