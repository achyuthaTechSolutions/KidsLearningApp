import { DAILY_GAME_TYPES, buildDailyQuestions } from '../learning-games/questions';
import { emptyDailyChallenge, type DailyChallengeRecord } from '../../services/storage';

export const DAILY_QUESTION_COUNT = DAILY_GAME_TYPES.length;

export { buildDailyQuestions };

export function normalizeDailyRecord(record: DailyChallengeRecord): DailyChallengeRecord {
  const answered = Math.min(DAILY_QUESTION_COUNT, Math.max(0, Math.floor(record.answered) || 0));
  const score = Math.min(answered, Math.max(0, Math.floor(record.score) || 0));
  const stars = Math.min(answered, Math.max(0, Math.floor(record.stars) || 0));
  return {
    date: record.date,
    answered,
    score,
    stars,
    completed: Boolean(record.completed) || answered >= DAILY_QUESTION_COUNT,
  };
}

export function freshDailyChallenge(date: string): DailyChallengeRecord {
  return normalizeDailyRecord(emptyDailyChallenge(date));
}
