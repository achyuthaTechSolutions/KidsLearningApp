import type { LearningEvent, StoryProgressData, StoryRecord } from './progress';

/*
 * Rules a future progress sync must keep. No server exists and nothing calls these
 * yet; they pin the merge, identity, and retention rules in docs/stories/SYNC.md
 * down in tested code, so the client side can be built without redesigning them.
 */

/** Stable identity of a learning event. One per run and activity (see `recordActivity`). */
export const eventKey = (event: Pick<LearningEvent, 'runId' | 'activityId'>) => `${event.runId}/${event.activityId}`;

/** Run ids made before `newRunId` added a random part: `<storyId>-<milliseconds>`. */
const LEGACY_RUN_ID = /^.+-\d{10,}$/;

export function isLegacyRunId(runId: string, storyId: string): boolean {
  return runId.startsWith(`${storyId}-`) && LEGACY_RUN_ID.test(runId) && /^\d+$/.test(runId.slice(storyId.length + 1));
}

/**
 * Before the first upload, give old run ids this install's random id, so two devices
 * that started a story in the same millisecond cannot collide on the server. The same
 * rename is applied to events, completed runs, and the resume point, so nothing is
 * counted twice. Running it again changes nothing.
 */
export function namespaceLegacyRunIds(data: StoryProgressData, installId: string): StoryProgressData {
  const rename = (runId: string, storyId: string) => (isLegacyRunId(runId, storyId) ? `${runId}-${installId}` : runId);
  const stories: Record<string, StoryRecord> = {};
  for (const [storyId, record] of Object.entries(data.stories)) {
    stories[storyId] = {
      ...record,
      completedRuns: record.completedRuns.map((runId) => rename(runId, storyId)),
      ...(record.playback ? { playback: { ...record.playback, runId: rename(record.playback.runId, storyId) } } : {}),
    };
  }
  return { ...data, stories, events: data.events.map((event) => ({ ...event, runId: rename(event.runId, event.storyId) })) };
}

/**
 * Local event retention once sync is on. Events the server has acknowledged may be
 * dropped, oldest first, to stay under `limit`. Unacknowledged events are never
 * dropped; if they alone exceed the limit, `overLimit` is true so the app can tell
 * the parent that progress is waiting to sync, instead of losing it.
 */
export function retainEvents(events: LearningEvent[], acknowledged: ReadonlySet<string>, limit: number): { events: LearningEvent[]; overLimit: boolean } {
  let excess = events.length - limit;
  const kept = events.filter((event) => {
    if (excess > 0 && acknowledged.has(eventKey(event))) {
      excess -= 1;
      return false;
    }
    return true;
  });
  return { events: kept, overLimit: kept.length > limit };
}

/** Events not yet acknowledged, oldest first, in batches for upload. */
export function pendingBatches(events: LearningEvent[], acknowledged: ReadonlySet<string>, size: number): LearningEvent[][] {
  const pending = events.filter((event) => !acknowledged.has(eventKey(event)));
  const batches: LearningEvent[][] = [];
  for (let i = 0; i < pending.length; i += size) batches.push(pending.slice(i, i + size));
  return batches;
}

/**
 * Merges this device's progress with a copy from the server (or another device).
 * - Learning events: union by `eventKey`; the first copy wins, since an event never changes.
 * - Completed runs and versions: set union, so a run is counted once.
 * - Resume point: the newer `updatedAt` wins; on a tie, this device's copy stays.
 * The result is the same whichever copy is newer, and merging twice changes nothing.
 */
export function mergeProgress(local: StoryProgressData, remote: StoryProgressData): StoryProgressData {
  const seen = new Set(local.events.map(eventKey));
  const events = [...local.events, ...remote.events.filter((event) => !seen.has(eventKey(event)) && seen.add(eventKey(event)))];

  const stories: Record<string, StoryRecord> = { ...local.stories };
  for (const [storyId, theirs] of Object.entries(remote.stories)) {
    const ours = local.stories[storyId];
    if (!ours) {
      stories[storyId] = theirs;
      continue;
    }
    const newer = theirs.updatedAt > ours.updatedAt ? theirs : ours;
    stories[storyId] = {
      ...newer,
      completedRuns: [...new Set([...ours.completedRuns, ...theirs.completedRuns])],
      completedVersions: [...new Set([...ours.completedVersions, ...theirs.completedVersions])].sort((a, b) => a - b),
      startedAt: Math.min(ours.startedAt, theirs.startedAt),
      updatedAt: Math.max(ours.updatedAt, theirs.updatedAt),
    };
  }
  return { schema: 1, stories, events };
}
