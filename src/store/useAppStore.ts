import { create } from 'zustand';
import type { LearningProgress, AppSettings } from '../types';
import { loadProgress, saveProgress, loadSettings, saveSettings, defaultProgress, resetDailyChallenge } from '../services/storage';
import { achievementsList } from '../data/achievements';

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

export const useAppStore = create<AppState>((set, get) => ({
  progress: loadProgress(),
  settings: loadSettings(),

  updateProgress: (updates) => {
    set((state) => {
      const newProgress = { ...state.progress, ...updates };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
  },

  addLetterExplored: (letter) => {
    set((state) => {
      if (state.progress.lettersExplored.includes(letter)) return state;
      const newProgress = {
        ...state.progress,
        lettersExplored: [...state.progress.lettersExplored, letter],
        lastActivity: 'keyboard',
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
  },

  addNumberExplored: (num) => {
    set((state) => {
      if (state.progress.numbersExplored.includes(num)) return state;
      const newProgress = {
        ...state.progress,
        numbersExplored: [...state.progress.numbersExplored, num],
        lastActivity: 'numbers',
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
  },

  addAnimalDiscovered: (animal) => {
    set((state) => {
      if (state.progress.animalsDiscovered.includes(animal)) return state;
      const newProgress = {
        ...state.progress,
        animalsDiscovered: [...state.progress.animalsDiscovered, animal],
        lastActivity: 'animals',
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
  },

  addWordLearned: (word) => {
    set((state) => {
      if (state.progress.wordsLearned.includes(word)) return state;
      const newProgress = {
        ...state.progress,
        wordsLearned: [...state.progress.wordsLearned, word],
        lastActivity: 'vocabulary',
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
  },

  incrementGamesCompleted: () => {
    set((state) => {
      const newProgress = {
        ...state.progress,
        gamesCompleted: state.progress.gamesCompleted + 1,
        lastActivity: 'games',
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
  },

  recordAnswer: (correct) => {
    set((state) => {
      const previousStreak = state.progress.currentStreak ?? 0;
      const newProgress = {
        ...state.progress,
        totalAnswers: state.progress.totalAnswers + 1,
        correctAnswers: state.progress.correctAnswers + (correct ? 1 : 0),
        currentStreak: correct ? previousStreak + 1 : 0,
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
  },

  incrementMusicActivities: () => {
    set((state) => {
      const newProgress = {
        ...state.progress,
        musicActivities: state.progress.musicActivities + 1,
        lastActivity: 'music',
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
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
    set({ progress });
  },

  checkAchievements: () => {
    set((state) => {
      const earned = achievementsList
        .filter((a) => a.condition(state.progress) && !state.progress.achievementsEarned.includes(a.id))
        .map((a) => a.id);

      if (earned.length === 0) return state;

      const newProgress = {
        ...state.progress,
        achievementsEarned: [...state.progress.achievementsEarned, ...earned],
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
  },
}));
