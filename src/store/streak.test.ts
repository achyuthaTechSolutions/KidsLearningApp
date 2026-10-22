import { beforeEach, describe, expect, it } from 'vitest';
import { achievementsList, PERFECT_SCORE_STREAK } from '../data/achievements';
import { defaultProgress, loadDailyChallenge, loadProgress, saveDailyChallenge, todayDateKey } from '../services/storage';
import { useAppStore } from './useAppStore';

const perfectScore = achievementsList.find((achievement) => achievement.id === 'perfect-score');
const countingMaster = achievementsList.find((achievement) => achievement.id === 'all-numbers');

describe('Perfect Score streak', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ progress: { ...defaultProgress } });
  });

  it('unlocks only after 10 correct answers in a row', () => {
    expect(perfectScore?.condition({ ...defaultProgress, correctAnswers: 10, currentStreak: 0 })).toBe(false);
    expect(perfectScore?.condition({ ...defaultProgress, correctAnswers: 0, currentStreak: PERFECT_SCORE_STREAK })).toBe(true);

    for (let count = 0; count < PERFECT_SCORE_STREAK - 1; count += 1) {
      useAppStore.getState().recordAnswer(true);
    }
    expect(useAppStore.getState().progress.currentStreak).toBe(9);
    expect(useAppStore.getState().progress.achievementsEarned).not.toContain('perfect-score');

    useAppStore.getState().recordAnswer(true);
    expect(useAppStore.getState().progress.currentStreak).toBe(10);
    expect(useAppStore.getState().progress.achievementsEarned).toContain('perfect-score');
  });

  it('resets the streak after a wrong answer and keeps the earned badge', () => {
    for (let count = 0; count < PERFECT_SCORE_STREAK; count += 1) {
      useAppStore.getState().recordAnswer(true);
    }
    useAppStore.getState().recordAnswer(false);
    const progress = useAppStore.getState().progress;
    expect(progress.currentStreak).toBe(0);
    expect(progress.correctAnswers).toBe(PERFECT_SCORE_STREAK);
    expect(progress.achievementsEarned).toContain('perfect-score');
  });

  it('does not turn older correct answers into a streak on refresh', () => {
    const stored = { ...defaultProgress, correctAnswers: 25, totalAnswers: 25 };
    delete (stored as { currentStreak?: number }).currentStreak;
    localStorage.setItem('kids-learning-progress', JSON.stringify(stored));

    const loaded = loadProgress();
    expect(loaded.currentStreak).toBe(0);
    expect(loaded.correctAnswers).toBe(25);
    useAppStore.setState({ progress: loaded });
    useAppStore.getState().checkAchievements();
    expect(useAppStore.getState().progress.achievementsEarned).not.toContain('perfect-score');
  });

  it('keeps the current streak across a reload without counting those answers again', () => {
    useAppStore.getState().recordAnswer(true);
    useAppStore.getState().recordAnswer(true);
    useAppStore.getState().recordAnswer(true);

    const reloaded = loadProgress();
    useAppStore.setState({ progress: reloaded });
    expect(useAppStore.getState().progress.currentStreak).toBe(3);
    expect(useAppStore.getState().progress.correctAnswers).toBe(3);

    useAppStore.getState().checkAchievements();
    expect(useAppStore.getState().progress.correctAnswers).toBe(3);
    expect(useAppStore.getState().progress.achievementsEarned).not.toContain('perfect-score');
  });

  it('clears the streak and today challenge when progress is reset', () => {
    useAppStore.getState().recordAnswer(true);
    saveDailyChallenge({
      date: todayDateKey(),
      answered: 2,
      score: 2,
      completed: false,
      stars: 2,
    });

    useAppStore.getState().resetAllProgress();
    expect(useAppStore.getState().progress.currentStreak).toBe(0);
    expect(loadDailyChallenge().answered).toBe(0);
    expect(loadDailyChallenge().completed).toBe(false);
  });
});

describe('Counting Master', () => {
  it('requires every number from 0 to 20', () => {
    const tenNumbers = Array.from({ length: 10 }, (_, index) => index);
    const allNumbers = Array.from({ length: 21 }, (_, index) => index);
    expect(countingMaster?.condition({ ...defaultProgress, numbersExplored: tenNumbers })).toBe(false);
    expect(countingMaster?.condition({ ...defaultProgress, numbersExplored: allNumbers })).toBe(true);
  });
});
