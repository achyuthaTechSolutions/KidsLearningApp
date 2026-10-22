import type { AppSettings, LearningProgress } from '../types';

export const PROGRESS_KEY = 'kids-learning-progress';
export const SETTINGS_KEY = 'kids-learning-settings';
export const DAILY_KEY = 'kids-learning-daily';
export const DINO_KEY = 'kids-learning-dino';
export const STORAGE_KEYS = [PROGRESS_KEY, SETTINGS_KEY, DAILY_KEY, DINO_KEY] as const;

export const defaultProgress: LearningProgress = {
  lettersExplored: [],
  numbersExplored: [],
  animalsDiscovered: [],
  wordsLearned: [],
  gamesCompleted: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  currentStreak: 0,
  musicActivities: 0,
  achievementsEarned: [],
  lastActivity: null,
};

export const defaultSettings: AppSettings = {
  speechEnabled: true,
  soundEnabled: true,
  volume: 0.7,
  speechRate: 0.9,
  theme: 'light',
  reducedMotion: false,
  selectedVoice: null,
};

export interface DailyChallengeRecord {
  date: string;
  answered: number;
  score: number;
  completed: boolean;
  stars: number;
}

export function todayDateKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function emptyDailyChallenge(date: string): DailyChallengeRecord {
  return { date, answered: 0, score: 0, completed: false, stars: 0 };
}

function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function readObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseProgress(raw: string | null): LearningProgress {
  const stored = readObject(raw);
  const merged = { ...defaultProgress, ...(stored ?? {}) } as LearningProgress;
  const streak = merged.currentStreak;
  const currentStreak = typeof streak === 'number' && Number.isFinite(streak) && streak > 0
    ? Math.floor(streak)
    : 0;
  return { ...defaultProgress, ...merged, currentStreak };
}

export function parseSettings(raw: string | null): AppSettings {
  const stored = readObject(raw);
  return { ...defaultSettings, ...(stored ?? {}) };
}

export function parseDaily(raw: string | null, today = todayDateKey()): DailyChallengeRecord {
  const stored = readObject(raw);
  const merged = { ...emptyDailyChallenge(today), ...(stored ?? {}) };
  if (merged.date !== today) return emptyDailyChallenge(today);
  return {
    date: today,
    answered: asCount(merged.answered),
    score: asCount(merged.score),
    completed: Boolean(merged.completed),
    stars: asCount(merged.stars),
  };
}

export interface DinoRecord {
  bestScore: number;
  bestLevel: number;
  color: string;
}

export const defaultDinoRecord: DinoRecord = { bestScore: 0, bestLevel: 1, color: 'green' };

export function parseDino(raw: string | null): DinoRecord {
  const stored = readObject(raw);
  const merged = { ...defaultDinoRecord, ...(stored ?? {}) };
  return {
    bestScore: asCount(merged.bestScore),
    bestLevel: Math.max(1, asCount(merged.bestLevel)),
    color: typeof merged.color === 'string' ? merged.color : defaultDinoRecord.color,
  };
}

export function resetDinoScoresRecord(current: DinoRecord): DinoRecord {
  return { ...defaultDinoRecord, color: current.color };
}
