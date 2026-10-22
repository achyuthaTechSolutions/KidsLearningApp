import { beforeEach, describe, expect, it } from 'vitest';
import {
  emptyDailyChallenge,
  loadDailyChallenge,
  saveDailyChallenge,
  todayDateKey,
} from '../../services/storage';
import { DAILY_QUESTION_COUNT, normalizeDailyRecord } from './dailySelection';

describe('Daily challenge persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps completion and stars for the same day', () => {
    saveDailyChallenge({
      date: '2026-10-22',
      answered: DAILY_QUESTION_COUNT,
      score: 4,
      completed: true,
      stars: 4,
    });

    expect(loadDailyChallenge('2026-10-22')).toMatchObject({
      answered: DAILY_QUESTION_COUNT,
      score: 4,
      completed: true,
      stars: 4,
    });
    expect(normalizeDailyRecord(loadDailyChallenge('2026-10-22')).stars).toBe(4);
  });

  it('starts a fresh challenge on a new day', () => {
    saveDailyChallenge({
      date: '2026-10-22',
      answered: DAILY_QUESTION_COUNT,
      score: 5,
      completed: true,
      stars: 5,
    });

    expect(loadDailyChallenge('2026-10-23')).toEqual(emptyDailyChallenge('2026-10-23'));
  });

  it('does not treat a reload as extra answers', () => {
    saveDailyChallenge({ date: '2026-10-22', answered: 2, score: 1, completed: false, stars: 1 });
    const first = normalizeDailyRecord(loadDailyChallenge('2026-10-22'));
    const second = normalizeDailyRecord(loadDailyChallenge('2026-10-22'));
    expect(second).toEqual(first);
    expect(second.answered).toBe(2);
    expect(second.stars).toBe(1);
  });

  it('uses the local calendar day', () => {
    expect(todayDateKey(new Date(2026, 9, 22))).toBe('2026-10-22');
  });
});
