import type { LearningProgress, AppSettings, GameDifficulty } from '../types';
import { emptyStoryProgress, type StoryProgressData } from '../features/stories/engine/progress';
import { LANGUAGES } from '../features/stories/engine/types';

const PROGRESS_KEY = 'kids-learning-progress';
const SETTINGS_KEY = 'kids-learning-settings';
const DAILY_KEY = 'kids-learning-daily';
const DINO_KEY = 'kids-learning-dino';
const STORY_KEY = 'kids-learning-stories';
const STORAGE_KEYS = [PROGRESS_KEY, SETTINGS_KEY, DAILY_KEY, DINO_KEY, STORY_KEY];

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
  gameRounds: {},
  gameLevels: {},
  gameSkill: {},
};

export const defaultSettings: AppSettings = {
  speechEnabled: true,
  soundEnabled: true,
  volume: 0.7,
  speechRate: 0.9,
  theme: 'light',
  reducedMotion: false,
  selectedVoice: null,
  gameDifficulty: 'beginner',
  storyLanguage: 'en',
  storyNarration: true,
  storyCaptions: true,
  backgroundMusic: true,
};

const GAME_DIFFICULTIES: GameDifficulty[] = ['beginner', 'intermediate', 'advanced'];

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Keeps only whole, positive counts, so a damaged entry cannot break the store. */
export function cleanGameRounds(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([id, count]) => (typeof count === 'number' && Number.isFinite(count) && count > 0 ? [[id, Math.floor(count)]] : [])),
  );
}

/** Keeps only unique string ids per game. */
export function cleanGameLevels(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([id, levels]) => (Array.isArray(levels)
      ? [[id, [...new Set(levels.filter((level): level is string => typeof level === 'string'))]]]
      : [])),
  );
}

export function cleanGameSkill(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([id, level]) => (typeof level === 'number' && Number.isFinite(level) && level >= 1
      ? [[id, Math.min(999, Math.floor(level))]]
      : [])),
  );
}

export function loadProgress(): LearningProgress {
  const stored = safeGet(PROGRESS_KEY, defaultProgress);
  const streak = stored.currentStreak;
  const currentStreak = typeof streak === 'number' && Number.isFinite(streak) && streak > 0
    ? Math.floor(streak)
    : 0;
  return {
    ...defaultProgress,
    ...stored,
    currentStreak,
    gameRounds: cleanGameRounds(stored.gameRounds),
    gameLevels: cleanGameLevels(stored.gameLevels),
    gameSkill: cleanGameSkill(stored.gameSkill),
  };
}

export function saveProgress(progress: LearningProgress): void {
  safeSet(PROGRESS_KEY, progress);
}

export function loadSettings(): AppSettings {
  const stored = safeGet(SETTINGS_KEY, defaultSettings);
  return {
    ...stored,
    gameDifficulty: GAME_DIFFICULTIES.includes(stored.gameDifficulty) ? stored.gameDifficulty : defaultSettings.gameDifficulty,
    storyLanguage: LANGUAGES.includes(stored.storyLanguage) ? stored.storyLanguage : defaultSettings.storyLanguage,
    storyNarration: typeof stored.storyNarration === 'boolean' ? stored.storyNarration : defaultSettings.storyNarration,
    storyCaptions: typeof stored.storyCaptions === 'boolean' ? stored.storyCaptions : defaultSettings.storyCaptions,
    backgroundMusic: typeof stored.backgroundMusic === 'boolean' ? stored.backgroundMusic : defaultSettings.backgroundMusic,
  };
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

/**
 * Story playback positions and learning events. Damaged parts are dropped:
 * a bad story record restarts that story, and bad events are skipped.
 */
export function loadStoryProgress(): StoryProgressData {
  const stored = safeGet<Partial<StoryProgressData>>(STORY_KEY, emptyStoryProgress);
  const stories = isRecord(stored.stories)
    ? Object.fromEntries(Object.entries(stored.stories).filter(([, record]) => isRecord(record) && Array.isArray((record as { completedRuns?: unknown }).completedRuns)))
    : {};
  const events = Array.isArray(stored.events)
    ? stored.events.filter((event) => isRecord(event) && typeof event.activityId === 'string' && typeof event.runId === 'string' && Array.isArray(event.objectives))
    : [];
  return { schema: 1, stories: stories as StoryProgressData['stories'], events: events as StoryProgressData['events'] };
}

export function saveStoryProgress(data: StoryProgressData): void {
  safeSet(STORY_KEY, data);
}

export function resetStoryProgress(): void {
  try {
    localStorage.removeItem(STORY_KEY);
  } catch {
    // Storage unavailable
  }
  writeMirror(STORY_KEY, null);
}
