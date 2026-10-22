import AsyncStorage from '@react-native-async-storage/async-storage';
import { PERFECT_SCORE_STREAK, PROGRESS_KEY } from '@kids/learning-core';
import { useAppStore } from './useAppStore';

describe('mobile progress', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.setState(useAppStore.getInitialState());
    await useAppStore.getState().hydrate();
  });

  it('keeps a fresh day and unlocks a streak badge after ten correct answers', async () => {
    for (let count = 0; count < PERFECT_SCORE_STREAK; count += 1) {
      useAppStore.getState().recordAnswer(true);
    }
    expect(useAppStore.getState().progress.achievementsEarned).toContain('perfect-score');
    const stored = await AsyncStorage.getItem(PROGRESS_KEY);
    expect(stored).toContain('perfect-score');

    useAppStore.getState().addLetterExplored('A');
    useAppStore.getState().addLetterExplored('A');
    expect(useAppStore.getState().progress.lettersExplored).toEqual(['A']);
  });

  it('ignores malformed saved progress and can reset', async () => {
    await AsyncStorage.setItem(PROGRESS_KEY, '{not json');
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().progress.lettersExplored).toEqual([]);
    useAppStore.getState().addNumberExplored(3);
    await useAppStore.getState().resetAllProgress();
    expect(useAppStore.getState().progress.numbersExplored).toEqual([]);
    expect(useAppStore.getState().settings.speechEnabled).toBe(true);
  });
});
