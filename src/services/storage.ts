import type { LearningProgress, AppSettings } from '../types';

const PROGRESS_KEY = 'kids-learning-progress';
const SETTINGS_KEY = 'kids-learning-settings';
const DAILY_KEY = 'kids-learning-daily';
const DINO_KEY = 'kids-learning-dino';
const STORAGE_KEYS = [PROGRESS_KEY, SETTINGS_KEY, DAILY_KEY, DINO_KEY];

export interface StorageMirror {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

let storageMirror: StorageMirror | null = null;

export function setStorageMirror(mirror: StorageMirror | null): void {
  storageMirror = mirror;
}

function writeMirror(key: string, value: string | null): void {
  if (!storageMirror) return;
  const task = value === null ? storageMirror.remove(key) : storageMirror.set(key, value);
  void task.catch(() => {
    // The on-device copy is a backup. localStorage remains the copy the app reads.
  });
}

export async function restoreMirroredStorage(): Promise<void> {
  if (!storageMirror) return;
  for (const key of STORAGE_KEYS) {
    if (localStorage.getItem(key)) continue;
    try {
      const value = await storageMirror.get(key);
      if (value) localStorage.setItem(key, value);
    } catch {
      // Keep the empty local defaults when the device copy cannot be read.
    }
  }
}

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

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  try {
    localStorage.setItem(key, raw);
  } catch {
    // Storage full or unavailable
  }
  writeMirror(key, raw);
}

export function loadProgress(): LearningProgress {
  const stored = safeGet(PROGRESS_KEY, defaultProgress);
  const streak = stored.currentStreak;
  const currentStreak = typeof streak === 'number' && Number.isFinite(streak) && streak > 0
    ? Math.floor(streak)
    : 0;
  return { ...defaultProgress, ...stored, currentStreak };
}

export function saveProgress(progress: LearningProgress): void {
  safeSet(PROGRESS_KEY, progress);
}

export function loadSettings(): AppSettings {
  return safeGet(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(settings: AppSettings): void {
  safeSet(SETTINGS_KEY, settings);
}

export function resetProgress(): void {
  safeSet(PROGRESS_KEY, defaultProgress);
}

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

export function loadDailyChallenge(today = todayDateKey()): DailyChallengeRecord {
  const stored = safeGet<Partial<DailyChallengeRecord>>(DAILY_KEY, emptyDailyChallenge(today));
  if (stored.date !== today) return emptyDailyChallenge(today);
  return {
    date: today,
    answered: asCount(stored.answered),
    score: asCount(stored.score),
    completed: Boolean(stored.completed),
    stars: asCount(stored.stars),
  };
}

export function saveDailyChallenge(record: DailyChallengeRecord): void {
  safeSet(DAILY_KEY, record);
}

export function resetDailyChallenge(): void {
  try {
    localStorage.removeItem(DAILY_KEY);
  } catch {
    // Storage unavailable
  }
  writeMirror(DAILY_KEY, null);
}

export interface DinoRecord {
  bestScore: number;
  bestLevel: number;
  color: string;
}

export const defaultDinoRecord: DinoRecord = { bestScore: 0, bestLevel: 1, color: 'green' };

export function loadDinoRecord(): DinoRecord {
  const stored = safeGet<Partial<DinoRecord>>(DINO_KEY, defaultDinoRecord);
  return {
    bestScore: asCount(stored.bestScore),
    bestLevel: Math.max(1, asCount(stored.bestLevel)),
    color: typeof stored.color === 'string' ? stored.color : defaultDinoRecord.color,
  };
}

export function saveDinoRecord(record: DinoRecord): void {
  safeSet(DINO_KEY, record);
}

/** Clears Dino Dash scores but keeps the dinosaur color a child picked. */
export function resetDinoScores(): void {
  saveDinoRecord({ ...defaultDinoRecord, color: loadDinoRecord().color });
}
