import { create } from 'zustand';
import type { LearningProgress, AppSettings } from '../types';
import { loadProgress, saveProgress, loadSettings, saveSettings, defaultProgress, resetDailyChallenge, resetDinoScores } from '../services/storage';
import { achievementsList } from '../data/achievements';
import { animalData } from '../data/animals';
import { vocabularyData } from '../data/vocabulary';

// Only real catalogue entries count, so games cannot inflate the learning totals.
const animalNames = new Set(animalData.map((animal) => animal.name));
const vocabularyWords = new Set(vocabularyData.map((item) => item.word));

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
  /** Counts one finished round of a Play game, and remembers `levelId` once if given. */
  completeGameRound: (gameId: string, levelId?: string) => void;
  /** Remembers a unique level, letter or place for a game without counting a round. */
  recordGameLevel: (gameId: string, levelId: string) => void;
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
      if (!animalNames.has(animal) || state.progress.animalsDiscovered.includes(animal)) return state;
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
      if (!vocabularyWords.has(word) || state.progress.wordsLearned.includes(word)) return state;
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

  completeGameRound: (gameId, levelId) => {
    set((state) => {
      const levels = state.progress.gameLevels[gameId] ?? [];
      const newProgress = {
        ...state.progress,
        gamesCompleted: state.progress.gamesCompleted + 1,
        gameRounds: { ...state.progress.gameRounds, [gameId]: (state.progress.gameRounds[gameId] ?? 0) + 1 },
        gameLevels: levelId && !levels.includes(levelId)
          ? { ...state.progress.gameLevels, [gameId]: [...levels, levelId] }
          : state.progress.gameLevels,
        lastActivity: 'games',
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
    get().checkAchievements();
  },

  recordGameLevel: (gameId, levelId) => {
    set((state) => {
      const levels = state.progress.gameLevels[gameId] ?? [];
      if (levels.includes(levelId)) return state;
      const newProgress = {
        ...state.progress,
        gameLevels: { ...state.progress.gameLevels, [gameId]: [...levels, levelId] },
        lastActivity: 'games',
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
    resetDinoScores();
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
