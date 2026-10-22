import type { Attempt } from './activities';
import type { Playback } from './player';
import type { Lang, ObjectiveId, StoryManifest } from './types';

/**
 * Story progress has two separate parts:
 * - playback: where to resume, which can be thrown away safely;
 * - learning events: evidence of what a child practised and how it went.
 * Finishing a story is never treated as proof that its skills were learned.
 */
export interface StoryRecord {
  playback?: Playback;
  /** Run ids that reached the end. A run is counted once, however often the end screen shows. */
  completedRuns: string[];
  completedVersions: number[];
  lastLang: Lang;
  startedAt: number;
  updatedAt: number;
}

export interface LearningEvent {
  runId: string;
  storyId: string;
  activityId: string;
  objectives: ObjectiveId[];
  tries: number;
  solved: boolean;
  /** First try, without a hint or demonstration. */
  clean: boolean;
  hint: boolean;
  demo: boolean;
  day: string;
}

export interface StoryProgressData {
  schema: 1;
  stories: Record<string, StoryRecord>;
  events: LearningEvent[];
}

export const MAX_EVENTS = 500;
export const emptyStoryProgress: StoryProgressData = { schema: 1, stories: {}, events: [] };

export function dayKey(now: number): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Saves where the child is. Switching language keeps the same position. */
export function savePlayback(data: StoryProgressData, playback: Playback, lang: Lang, now: number): StoryProgressData {
  const existing = data.stories[playback.storyId];
  const record: StoryRecord = {
    completedRuns: existing?.completedRuns ?? [],
    completedVersions: existing?.completedVersions ?? [],
    startedAt: existing?.startedAt ?? now,
    playback,
    lastLang: lang,
    updatedAt: now,
  };
  let next: StoryProgressData = { ...data, stories: { ...data.stories, [playback.storyId]: record } };
  if (playback.finished && !record.completedRuns.includes(playback.runId)) {
    next = {
      ...next,
      stories: {
        ...next.stories,
        [playback.storyId]: {
          ...record,
          completedRuns: [...record.completedRuns, playback.runId].slice(-50),
          completedVersions: record.completedVersions.includes(playback.version) ? record.completedVersions : [...record.completedVersions, playback.version],
        },
      },
    };
  }
  return next;
}

/** Records how one activity went, once per run. A repeat for the same run is ignored. */
export function recordActivity(
  data: StoryProgressData,
  playback: Playback,
  activity: { id: string; objectives: ObjectiveId[] },
  attempt: Attempt,
  now: number,
): StoryProgressData {
  if (!attempt.solved) return data;
  if (data.events.some((event) => event.runId === playback.runId && event.activityId === activity.id)) return data;
  const event: LearningEvent = {
    runId: playback.runId,
    storyId: playback.storyId,
    activityId: activity.id,
    objectives: activity.objectives,
    tries: attempt.tries,
    solved: attempt.solved,
    clean: attempt.clean,
    hint: attempt.hintShown,
    demo: attempt.demoShown,
    day: dayKey(now),
  };
  return { ...data, events: [...data.events, event].slice(-MAX_EVENTS) };
}

export function isStarted(data: StoryProgressData, storyId: string): boolean {
  return Boolean(data.stories[storyId]);
}

export function isCompleted(data: StoryProgressData, storyId: string): boolean {
  return (data.stories[storyId]?.completedRuns.length ?? 0) > 0;
}

/** True when a saved position can be resumed in this version of the story. */
export function canResume(data: StoryProgressData, story: StoryManifest): boolean {
  const playback = data.stories[story.id]?.playback;
  return Boolean(playback && !playback.finished && playback.version === story.version && (playback.completedScenes.length > 0 || playback.lineIndex > 0));
}

export type ObjectiveLevel = 'practising' | 'succeeding' | 'mastered';

export interface ObjectiveSummary {
  objective: ObjectiveId;
  level: ObjectiveLevel;
  activities: number;
  clean: number;
  needsPractice: boolean;
}

/**
 * Mastery needs repeated, independent success: at least three clean solves
 * (first try, no hint or demonstration) across at least two different activities.
 * One lucky guess, or finishing a story, is never enough.
 */
export function summarizeObjectives(events: LearningEvent[]): ObjectiveSummary[] {
  const byObjective = new Map<ObjectiveId, LearningEvent[]>();
  for (const event of events) {
    for (const objective of event.objectives) byObjective.set(objective, [...(byObjective.get(objective) ?? []), event]);
  }
  return [...byObjective.entries()].map(([objective, list]) => {
    const clean = list.filter((event) => event.clean);
    const cleanActivities = new Set(clean.map((event) => event.activityId)).size;
    const level: ObjectiveLevel = clean.length >= 3 && cleanActivities >= 2 ? 'mastered' : clean.length >= 1 ? 'succeeding' : 'practising';
    const recent = list.slice(-4);
    const needsPractice = level !== 'mastered' && recent.filter((event) => event.demo || event.tries >= 3).length >= 2;
    return { objective, level, activities: new Set(list.map((event) => event.activityId)).size, clean: clean.length, needsPractice };
  });
}
