import { achievementsList } from '../content/achievements';
import type { LearningProgress } from '../types';

export function exploreLetter(progress: LearningProgress, letter: string): LearningProgress | null {
  if (progress.lettersExplored.includes(letter)) return null;
  return {
    ...progress,
    lettersExplored: [...progress.lettersExplored, letter],
    lastActivity: 'keyboard',
  };
}

export function exploreNumber(progress: LearningProgress, num: number): LearningProgress | null {
  if (progress.numbersExplored.includes(num)) return null;
  return {
    ...progress,
    numbersExplored: [...progress.numbersExplored, num],
    lastActivity: 'numbers',
  };
}

export function discoverAnimal(progress: LearningProgress, animal: string): LearningProgress | null {
  if (progress.animalsDiscovered.includes(animal)) return null;
  return {
    ...progress,
    animalsDiscovered: [...progress.animalsDiscovered, animal],
    lastActivity: 'animals',
  };
}

export function learnWord(progress: LearningProgress, word: string): LearningProgress | null {
  if (progress.wordsLearned.includes(word)) return null;
  return {
    ...progress,
    wordsLearned: [...progress.wordsLearned, word],
    lastActivity: 'vocabulary',
  };
}

export function completeGame(progress: LearningProgress): LearningProgress {
  return {
    ...progress,
    gamesCompleted: progress.gamesCompleted + 1,
    lastActivity: 'games',
  };
}

export function recordAnswer(progress: LearningProgress, correct: boolean): LearningProgress {
  const previousStreak = progress.currentStreak ?? 0;
  return {
    ...progress,
    totalAnswers: progress.totalAnswers + 1,
    correctAnswers: progress.correctAnswers + (correct ? 1 : 0),
    currentStreak: correct ? previousStreak + 1 : 0,
  };
}

export function recordMusicActivity(progress: LearningProgress): LearningProgress {
  return {
    ...progress,
    musicActivities: progress.musicActivities + 1,
    lastActivity: 'music',
  };
}

export function unlockNewAchievements(progress: LearningProgress): LearningProgress {
  const earned = achievementsList
    .filter((achievement) => achievement.condition(progress) && !progress.achievementsEarned.includes(achievement.id))
    .map((achievement) => achievement.id);
  if (earned.length === 0) return progress;
  return {
    ...progress,
    achievementsEarned: [...progress.achievementsEarned, ...earned],
  };
}

/** Applies an optional progress change, then the same achievement pass the web store runs. */
export function commitProgress(progress: LearningProgress, next: LearningProgress | null): LearningProgress {
  const base = next ?? progress;
  return unlockNewAchievements(base);
}
