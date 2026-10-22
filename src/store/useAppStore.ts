import { create } from 'zustand';
import {
  commitProgress,
  completeGame,
  discoverAnimal,
  exploreLetter,
  exploreNumber,
  learnWord,
  recordAnswer as applyAnswer,
  recordMusicActivity,
} from '../../packages/learning-core/src/progress/actions';
import type { LearningProgress, AppSettings } from '../types';
import { loadProgress, saveProgress, loadSettings, saveSettings, defaultProgress, resetDailyChallenge, resetDinoScores } from '../services/storage';

interface AppState {
  progress: LearningProgress;
  settings: AppSettings;
  updateProgress: (updates: Partial<LearningProgress>) => void;
  addLetterExplored: (letter: string) => void;
  addNumberExplored: (num: number) => void;
  addAnimalDiscovered: (animal: string) => void;
  addWordLearned: (word: string) => void;
  incrementGamesCompleted: () => void;
  recordAnswer: (correct: boolean) => void;
  incrementMusicActivities: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetAllProgress: () => void;
  checkAchievements: () => void;
}

function writeProgress(current: LearningProgress, next: LearningProgress | null): LearningProgress | null {
  const committed = commitProgress(current, next);
  if (committed === current) return null;
  saveProgress(committed);
  return committed;
}

export const useAppStore = create<AppState>((set) => ({
  progress: loadProgress(),
  settings: loadSettings(),

  updateProgress: (updates) => {
    set((state) => {
      const committed = writeProgress(state.progress, { ...state.progress, ...updates });
      if (!committed) return state;
      return { progress: committed };
    });
  },

  addLetterExplored: (letter) => {
    set((state) => {
      const committed = writeProgress(state.progress, exploreLetter(state.progress, letter));
      if (!committed) return state;
      return { progress: committed };
    });
  },

  addNumberExplored: (num) => {
    set((state) => {
      const committed = writeProgress(state.progress, exploreNumber(state.progress, num));
      if (!committed) return state;
      return { progress: committed };
    });
  },

  addAnimalDiscovered: (animal) => {
    set((state) => {
      const committed = writeProgress(state.progress, discoverAnimal(state.progress, animal));
      if (!committed) return state;
      return { progress: committed };
    });
  },

  addWordLearned: (word) => {
    set((state) => {
      const committed = writeProgress(state.progress, learnWord(state.progress, word));
      if (!committed) return state;
      return { progress: committed };
    });
  },

  incrementGamesCompleted: () => {
    set((state) => {
      const committed = writeProgress(state.progress, completeGame(state.progress));
      if (!committed) return state;
      return { progress: committed };
    });
  },

  recordAnswer: (correct) => {
    set((state) => {
      const committed = writeProgress(state.progress, applyAnswer(state.progress, correct));
      if (!committed) return state;
      return { progress: committed };
    });
  },

  incrementMusicActivities: () => {
    set((state) => {
      const committed = writeProgress(state.progress, recordMusicActivity(state.progress));
      if (!committed) return state;
      return { progress: committed };
    });
  },

  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      saveSettings(newSettings);
      return { settings: newSettings };
    });
  },

  resetAllProgress: () => {
    const progress = { ...defaultProgress };
    saveProgress(progress);
    resetDailyChallenge();
    resetDinoScores();
    set({ progress });
  },

  checkAchievements: () => {
    set((state) => {
      const committed = writeProgress(state.progress, null);
      if (!committed) return state;
      return { progress: committed };
    });
  },
}));
