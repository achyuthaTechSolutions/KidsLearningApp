import { create } from 'zustand';
import {
  commitProgress,
  completeGame,
  defaultProgress,
  discoverAnimal,
  emptyDailyChallenge,
  exploreLetter,
  exploreNumber,
  learnWord,
  recordAnswer as applyAnswer,
  recordMusicActivity,
  todayDateKey,
  type AppSettings,
  type DailyChallengeRecord,
  type DinoRecord,
  type LearningProgress,
} from '@kids/learning-core';
import {
  clearDaily,
  clearDinoScores,
  freshSavedLearning,
  loadSavedLearning,
  saveDaily,
  saveDino,
  saveProgress,
  saveSettings,
} from '../services/persistence';
import { setSpeechVolume } from '../services/speech';

interface AppState {
  ready: boolean;
  progress: LearningProgress;
  settings: AppSettings;
  daily: DailyChallengeRecord;
  dino: DinoRecord;
  hydrate: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addLetterExplored: (letter: string) => void;
  addNumberExplored: (num: number) => void;
  addAnimalDiscovered: (animal: string) => void;
  addWordLearned: (word: string) => void;
  incrementGamesCompleted: () => void;
  recordAnswer: (correct: boolean) => void;
  incrementMusicActivities: () => void;
  checkAchievements: () => void;
  resetAllProgress: () => Promise<void>;
  setDaily: (record: DailyChallengeRecord) => void;
  setDino: (record: DinoRecord) => void;
}

const initial = freshSavedLearning();

function persistProgress(current: LearningProgress, next: LearningProgress | null): LearningProgress | null {
  const committed = commitProgress(current, next);
  if (committed === current) return null;
  void saveProgress(committed);
  return committed;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  progress: initial.progress,
  settings: initial.settings,
  daily: initial.daily,
  dino: initial.dino,

  hydrate: async () => {
    try {
      const saved = await loadSavedLearning();
      setSpeechVolume(saved.settings.volume);
      set({ ...saved, ready: true });
    } catch {
      set({ ready: true });
    }
  },

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    setSpeechVolume(settings.volume);
    set({ settings });
    void saveSettings(settings);
  },

  addLetterExplored: (letter) => {
    const committed = persistProgress(get().progress, exploreLetter(get().progress, letter));
    if (committed) set({ progress: committed });
  },

  addNumberExplored: (num) => {
    const committed = persistProgress(get().progress, exploreNumber(get().progress, num));
    if (committed) set({ progress: committed });
  },

  addAnimalDiscovered: (animal) => {
    const committed = persistProgress(get().progress, discoverAnimal(get().progress, animal));
    if (committed) set({ progress: committed });
  },

  addWordLearned: (word) => {
    const committed = persistProgress(get().progress, learnWord(get().progress, word));
    if (committed) set({ progress: committed });
  },

  incrementGamesCompleted: () => {
    const committed = persistProgress(get().progress, completeGame(get().progress));
    if (committed) set({ progress: committed });
  },

  recordAnswer: (correct) => {
    const committed = persistProgress(get().progress, applyAnswer(get().progress, correct));
    if (committed) set({ progress: committed });
  },

  incrementMusicActivities: () => {
    const committed = persistProgress(get().progress, recordMusicActivity(get().progress));
    if (committed) set({ progress: committed });
  },

  checkAchievements: () => {
    const committed = persistProgress(get().progress, null);
    if (committed) set({ progress: committed });
  },

  resetAllProgress: async () => {
    const progress = { ...defaultProgress };
    const daily = emptyDailyChallenge(todayDateKey());
    await saveProgress(progress);
    await clearDaily();
    const dino = await clearDinoScores();
    set({ progress, daily, dino });
  },

  setDaily: (record) => {
    set({ daily: record });
    void saveDaily(record);
  },

  setDino: (record) => {
    set({ dino: record });
    void saveDino(record);
  },
}));
