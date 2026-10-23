import { describe, expect, it } from 'vitest';
import { thirstyCrow } from '../content/thirstyCrow';
import { newRunId, playerReducer, startPlayback } from './player';
import { emptyStoryProgress, savePlayback, type LearningEvent, type StoryProgressData, type StoryRecord } from './progress';
import { eventKey, isLegacyRunId, mergeProgress, namespaceLegacyRunIds, pendingBatches, retainEvents } from './sync';

const event = (runId: string, activityId: string, extra: Partial<LearningEvent> = {}): LearningEvent => ({
  runId, storyId: 'thirsty-crow', activityId, objectives: ['counting'], tries: 1, solved: true, clean: true, hint: false, demo: false, day: '2026-10-23', ...extra,
});
const record = (extra: Partial<StoryRecord> = {}): StoryRecord => ({ completedRuns: [], completedVersions: [], lastLang: 'en', startedAt: 100, updatedAt: 100, ...extra });
const data = (stories: Record<string, StoryRecord>, events: LearningEvent[] = []): StoryProgressData => ({ schema: 1, stories, events });

describe('Run and event identity', () => {
  it('gives runs started in the same millisecond different ids', () => {
    let n = 0;
    const randoms = [0.1, 0.2];
    const ids = [newRunId('thirsty-crow', 1_700_000_000_000, () => randoms[n++]), newRunId('thirsty-crow', 1_700_000_000_000, () => randoms[n++])];
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[0]).toMatch(/^thirsty-crow-1700000000000-[0-9a-z]{8}$/);
    expect(startPlayback(thirstyCrow).runId).not.toBe(startPlayback(thirstyCrow).runId);
    expect(playerReducer(thirstyCrow, startPlayback(thirstyCrow, 'r1'), { type: 'restart' }).runId).toMatch(/^thirsty-crow-\d+-[0-9a-z]{8}$/);
  });

  it('recognises only old-style run ids as legacy', () => {
    expect(isLegacyRunId('thirsty-crow-1761200000000', 'thirsty-crow')).toBe(true);
    expect(isLegacyRunId('thirsty-crow-1761200000000-k3j9x0aa', 'thirsty-crow')).toBe(false);
    expect(isLegacyRunId('lion-mouse-1761200000000', 'thirsty-crow')).toBe(false);
    expect(isLegacyRunId('run-a', 'thirsty-crow')).toBe(false);
  });

  it('renames legacy runs everywhere at once, and only once', () => {
    const legacy = 'thirsty-crow-1761200000000';
    const before = data({ 'thirsty-crow': record({ completedRuns: [legacy], playback: { ...startPlayback(thirstyCrow, legacy) } }) }, [event(legacy, 'can-reach')]);
    const after = namespaceLegacyRunIds(before, 'dev42');
    const renamed = `${legacy}-dev42`;
    expect(after.events[0].runId).toBe(renamed);
    expect(after.stories['thirsty-crow'].completedRuns).toEqual([renamed]);
    expect(after.stories['thirsty-crow'].playback!.runId).toBe(renamed);
    expect(namespaceLegacyRunIds(after, 'dev42')).toEqual(after);
    expect(namespaceLegacyRunIds(after, 'other')).toEqual(after);
  });
});

describe('Retention', () => {
  const events = ['a', 'b', 'c', 'd'].map((id) => event('r', id));
  const acked = new Set([eventKey(events[0]), eventKey(events[2])]);

  it('drops only acknowledged events, oldest first', () => {
    expect(retainEvents(events, acked, 3)).toEqual({ events: [events[1], events[2], events[3]], overLimit: false });
    expect(retainEvents(events, acked, 2)).toEqual({ events: [events[1], events[3]], overLimit: false });
  });

  it('never drops unacknowledged events, and says when they exceed the limit', () => {
    expect(retainEvents(events, acked, 1)).toEqual({ events: [events[1], events[3]], overLimit: true });
    expect(retainEvents(events, new Set(), 1)).toEqual({ events, overLimit: true });
    expect(retainEvents(events, acked, 10)).toEqual({ events, overLimit: false });
  });

  it('uploads only unacknowledged events, in order and in batches', () => {
    const many = Array.from({ length: 5 }, (_, i) => event('r', `x${i}`));
    expect(pendingBatches(many, new Set([eventKey(many[1])]), 2)).toEqual([[many[0], many[2]], [many[3], many[4]]]);
    expect(pendingBatches(many, new Set(many.map(eventKey)), 2)).toEqual([]);
  });
});

describe('Merging progress from two devices', () => {
  const phone = data(
    { 'thirsty-crow': record({ completedRuns: ['run-p'], completedVersions: [1], updatedAt: 300, lastLang: 'te', startedAt: 150 }) },
    [event('run-p', 'can-reach'), event('shared', 'count')],
  );
  const tablet = data(
    {
      'thirsty-crow': record({ completedRuns: ['run-t'], completedVersions: [1, 2], updatedAt: 200, lastLang: 'hi', startedAt: 120 }),
      'lion-mouse': record({ updatedAt: 250 }),
    },
    [event('shared', 'count', { clean: false }), event('run-t', 'can-reach')],
  );

  it('keeps every event once, every completion once, and the newest resume point', () => {
    const merged = mergeProgress(phone, tablet);
    expect(merged.events.map(eventKey)).toEqual(['run-p/can-reach', 'shared/count', 'run-t/can-reach']);
    expect(merged.events[1].clean).toBe(true);
    const crow = merged.stories['thirsty-crow'];
    expect(crow.completedRuns.sort()).toEqual(['run-p', 'run-t']);
    expect(crow.completedVersions).toEqual([1, 2]);
    expect(crow.lastLang).toBe('te');
    expect(crow.startedAt).toBe(120);
    expect(crow.updatedAt).toBe(300);
    expect(merged.stories['lion-mouse']).toEqual(tablet.stories['lion-mouse']);
  });

  it('gives the same stories whichever side merges, and merging again changes nothing', () => {
    const a = mergeProgress(phone, tablet);
    const b = mergeProgress(tablet, phone);
    expect(new Set(a.events.map(eventKey))).toEqual(new Set(b.events.map(eventKey)));
    expect(a.stories['thirsty-crow'].lastLang).toBe(b.stories['thirsty-crow'].lastLang);
    expect(mergeProgress(a, tablet)).toEqual(a);
    expect(mergeProgress(a, a)).toEqual(a);
  });

  it('keeps an old-version resume point without resuming it in the new version', () => {
    const old = savePlayback(emptyStoryProgress, { ...startPlayback(thirstyCrow, 'old'), version: thirstyCrow.version - 1, lineIndex: 2 }, 'en', 500);
    const merged = mergeProgress(phone, old);
    expect(merged.stories['thirsty-crow'].playback!.version).toBe(thirstyCrow.version - 1);
    expect(merged.stories['thirsty-crow'].completedRuns.sort()).toEqual(['run-p']);
  });
});
