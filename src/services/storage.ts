import {
  DAILY_KEY,
  DINO_KEY,
  PROGRESS_KEY,
  SETTINGS_KEY,
  STORAGE_KEYS,
  defaultDinoRecord,
  defaultProgress,
  defaultSettings,
  emptyDailyChallenge,
  parseDaily,
  parseDino,
  parseProgress,
  parseSettings,
  resetDinoScoresRecord,
  todayDateKey,
  type DailyChallengeRecord,
  type DinoRecord,
} from '../../packages/learning-core/src/progress/model';
import type { AppSettings, LearningProgress } from '../types';

export {
  defaultDinoRecord,
  defaultProgress,
  defaultSettings,
  emptyDailyChallenge,
  todayDateKey,
};
export type { DailyChallengeRecord, DinoRecord };

const MIRROR_KEYS = [...STORAGE_KEYS];

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
  for (const key of MIRROR_KEYS) {
    if (localStorage.getItem(key)) continue;
    try {
      const value = await storageMirror.get(key);
      if (value) localStorage.setItem(key, value);
    } catch {
      // Keep the empty local defaults when the device copy cannot be read.
    }
  }
}

function safeGetRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
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
  return parseProgress(safeGetRaw(PROGRESS_KEY));
}

export function saveProgress(progress: LearningProgress): void {
  safeSet(PROGRESS_KEY, progress);
}

export function loadSettings(): AppSettings {
  return parseSettings(safeGetRaw(SETTINGS_KEY));
}

export function saveSettings(settings: AppSettings): void {
  safeSet(SETTINGS_KEY, settings);
}

export function resetProgress(): void {
  safeSet(PROGRESS_KEY, defaultProgress);
}

export function loadDailyChallenge(today = todayDateKey()): DailyChallengeRecord {
  return parseDaily(safeGetRaw(DAILY_KEY), today);
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

export function loadDinoRecord(): DinoRecord {
  return parseDino(safeGetRaw(DINO_KEY));
}

export function saveDinoRecord(record: DinoRecord): void {
  safeSet(DINO_KEY, record);
}

/** Clears Dino Dash scores but keeps the dinosaur color a child picked. */
export function resetDinoScores(): void {
  saveDinoRecord(resetDinoScoresRecord(loadDinoRecord()));
}
