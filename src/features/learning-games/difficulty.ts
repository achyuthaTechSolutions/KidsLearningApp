import type { GameDifficulty } from '../../types';
import type { PillOption } from '../../components/ui/PillPicker';

export type { GameDifficulty };

export const difficultyOptions: PillOption<GameDifficulty>[] = [
  { value: 'beginner', label: 'Beginner', emoji: '🐣' },
  { value: 'intermediate', label: 'Explorer', emoji: '🦊' },
  { value: 'advanced', label: 'Champion', emoji: '🦁' },
];

/** Suggested ages only. Parents choose the level that fits their child. */
export const difficultyHints: Record<GameDifficulty, string> = {
  beginner: 'Big buttons, few choices, slow and gentle. Often fits ages 3 to 4.',
  intermediate: 'A few more choices and short sequences. Often fits ages 5 to 6.',
  advanced: 'Longer sequences and bigger puzzles. Often fits ages 7 to 8.',
};

export function byDifficulty<T>(difficulty: GameDifficulty, values: Record<GameDifficulty, T>): T {
  return values[difficulty];
}
