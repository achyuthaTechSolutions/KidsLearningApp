import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DAILY_KEY,
  DINO_KEY,
  PROGRESS_KEY,
  SETTINGS_KEY,
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
  type AppSettings,
  type DailyChallengeRecord,
  type DinoRecord,
  type LearningProgress,
} from '@kids/learning-core';

export interface SavedLearning {
  progress: LearningProgress;
  settings: AppSettings;
  daily: DailyChallengeRecord;
  dino: DinoRecord;
}

async function read(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or unavailable. The in-memory session still works.
  }
}

export async function loadSavedLearning(today = todayDateKey()): Promise<SavedLearning> {
  const [progress, settings, daily, dino] = await Promise.all([
    read(PROGRESS_KEY),
    read(SETTINGS_KEY),
    read(DAILY_KEY),
    read(DINO_KEY),
  ]);
  return {
    progress: parseProgress(progress),
    settings: parseSettings(settings),
    daily: parseDaily(daily, today),
    dino: parseDino(dino),
  };
}

export async function saveProgress(progress: LearningProgress): Promise<void> {
  await write(PROGRESS_KEY, progress);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await write(SETTINGS_KEY, settings);
}

export async function saveDaily(record: DailyChallengeRecord): Promise<void> {
  await write(DAILY_KEY, record);
}

export async function saveDino(record: DinoRecord): Promise<void> {
  await write(DINO_KEY, record);
}

export async function clearDaily(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DAILY_KEY);
  } catch {
    // The next load treats a missing record as a fresh day.
  }
}

export async function clearDinoScores(): Promise<DinoRecord> {
  const current = parseDino(await read(DINO_KEY));
  const next = resetDinoScoresRecord(current);
  await saveDino(next);
  return next;
}

export function freshSavedLearning(): SavedLearning {
  return {
    progress: { ...defaultProgress },
    settings: { ...defaultSettings },
    daily: emptyDailyChallenge(todayDateKey()),
    dino: { ...defaultDinoRecord },
  };
}
