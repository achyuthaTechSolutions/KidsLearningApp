import { describe, it, expect, beforeEach } from 'vitest';
import { loadProgress, saveProgress, loadSettings, saveSettings, resetProgress, defaultProgress, defaultSettings, saveDailyChallenge, loadDailyChallenge, resetDailyChallenge, setStorageMirror, restoreMirroredStorage, emptyDailyChallenge } from './storage';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
    setStorageMirror(null);
  });

  it('returns default progress when nothing is stored', () => {
    const progress = loadProgress();
    expect(progress).toEqual(defaultProgress);
  });

  it('saves and loads progress', () => {
    const progress = { ...defaultProgress, lettersExplored: ['A', 'B'] };
    saveProgress(progress);
    const loaded = loadProgress();
    expect(loaded.lettersExplored).toEqual(['A', 'B']);
  });

  it('returns default settings when nothing is stored', () => {
    const settings = loadSettings();
    expect(settings).toEqual(defaultSettings);
  });

  it('saves and loads settings', () => {
    const settings = { ...defaultSettings, speechEnabled: false };
    saveSettings(settings);
    const loaded = loadSettings();
    expect(loaded.speechEnabled).toBe(false);
  });

  it('resets progress to defaults', () => {
    saveProgress({ ...defaultProgress, lettersExplored: ['A'] });
    resetProgress();
    const loaded = loadProgress();
    expect(loaded.lettersExplored).toEqual([]);
  });

  it('handles malformed stored data gracefully', () => {
    localStorage.setItem('kids-learning-progress', 'not json');
    const progress = loadProgress();
    expect(progress).toEqual(defaultProgress);
  });

  it('restores progress, settings, and the daily challenge from the device copy', async () => {
    const saved = new Map<string, string>();
    setStorageMirror({
      get: async (key) => saved.get(key) ?? null,
      set: async (key, value) => { saved.set(key, value); },
      remove: async (key) => { saved.delete(key); },
    });

    saveProgress({ ...defaultProgress, lettersExplored: ['A'] });
    saveSettings({ ...defaultSettings, volume: 0.4 });
    saveDailyChallenge({ date: '2026-10-22', answered: 2, score: 2, completed: false, stars: 2 });
    localStorage.clear();
    await restoreMirroredStorage();

    expect(loadProgress().lettersExplored).toEqual(['A']);
    expect(loadSettings().volume).toBe(0.4);
    expect(loadDailyChallenge('2026-10-22')).toEqual({
      date: '2026-10-22',
      answered: 2,
      score: 2,
      completed: false,
      stars: 2,
    });

    resetDailyChallenge();
    expect(saved.has('kids-learning-daily')).toBe(false);
    expect(loadDailyChallenge('2026-10-22')).toEqual(emptyDailyChallenge('2026-10-22'));
    setStorageMirror(null);
  });
});
