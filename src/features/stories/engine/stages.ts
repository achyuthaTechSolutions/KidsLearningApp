import type { StoryManifest } from './types';

/**
 * Learning stages: the one age grouping shared by Story Time and the parent-account
 * contract (`AgeBand` in the Expo app's `src/auth/contract.ts`). A parent picks the
 * stage for a child profile; stories keep their own exact `ageRange` in years.
 * See docs/stories/AGE_STAGES.md.
 */
export const LEARNING_STAGES = ['3-4', '5-6', '7-8'] as const;
export type LearningStage = (typeof LEARNING_STAGES)[number];

/** Whole years each stage covers, inclusive. */
export const stageYears: Record<LearningStage, readonly [number, number]> = {
  '3-4': [3, 4],
  '5-6': [5, 6],
  '7-8': [7, 8],
};

/**
 * The stage for an age in whole years, or undefined when the age is unknown or
 * outside 3 to 8. Callers treat undefined as "no stage": show every story.
 */
export function stageForAge(age: number | null | undefined): LearningStage | undefined {
  if (typeof age !== 'number' || !Number.isFinite(age)) return undefined;
  const years = Math.floor(age);
  return LEARNING_STAGES.find((stage) => years >= stageYears[stage][0] && years <= stageYears[stage][1]);
}

/**
 * Reads a stored or received stage. Only the exact canonical values are accepted.
 * Anything else, including the older Story Time filter values "3-5", "5-7", and
 * "7-9", is unknown rather than guessed, so no child is silently reclassified.
 */
export function parseStage(value: unknown): LearningStage | undefined {
  return typeof value === 'string' && (LEARNING_STAGES as readonly string[]).includes(value) ? (value as LearningStage) : undefined;
}

/** A story suits a stage when its age range overlaps the stage's years. */
export function storySuitsStage(story: Pick<StoryManifest, 'ageRange'>, stage: LearningStage): boolean {
  const [low, high] = stageYears[stage];
  return story.ageRange[0] <= high && story.ageRange[1] >= low;
}

/** Stories for a stage. `all` (or an unknown stage) shows every story. */
export function storiesForStage<T extends Pick<StoryManifest, 'ageRange'>>(stories: T[], stage: LearningStage | 'all' | undefined): T[] {
  return stage && stage !== 'all' ? stories.filter((story) => storySuitsStage(story, stage)) : stories;
}
