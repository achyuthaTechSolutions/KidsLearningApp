import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../../store/useAppStore';
import { defaultProgress, defaultSettings, loadProgress, loadSettings } from '../../services/storage';
import { achievementsList } from '../../data/achievements';
import { recipes } from '../little-chef/recipes';
import { destinations } from '../space-explorer/destinations';
import { ADVENTURE_GAME_IDS } from './catalog';

const earned = (progress: typeof defaultProgress, id: string) => achievementsList.find((item) => item.id === id)!.condition(progress);

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ progress: { ...defaultProgress, gameRounds: {}, gameLevels: {} } });
});

describe('Game progress in the store', () => {
  it('counts rounds, remembers each level once, and saves to this device', () => {
    const { completeGameRound } = useAppStore.getState();
    completeGameRound('robot', 'straight');
    completeGameRound('robot', 'straight');
    completeGameRound('robot', 'corner');
    const { progress } = useAppStore.getState();
    expect(progress.gameRounds.robot).toBe(3);
    expect(progress.gameLevels.robot).toEqual(['straight', 'corner']);
    expect(progress.gamesCompleted).toBe(3);
    expect(loadProgress().gameLevels.robot).toEqual(['straight', 'corner']);
  });

  it('records a level without counting a round', () => {
    const { recordGameLevel } = useAppStore.getState();
    recordGameLevel('tracing', 'A');
    recordGameLevel('tracing', 'A');
    const { progress } = useAppStore.getState();
    expect(progress.gameLevels.tracing).toEqual(['A']);
    expect(progress.gameRounds.tracing).toBeUndefined();
    expect(progress.gamesCompleted).toBe(0);
  });

  it('only counts real words and animals toward the learning totals', () => {
    const { addWordLearned, addAnimalDiscovered } = useAppStore.getState();
    addWordLearned('Banana');
    addWordLearned('Cat');
    addAnimalDiscovered('Elephant');
    addAnimalDiscovered('Giraffe');
    const { progress } = useAppStore.getState();
    expect(progress.wordsLearned).toEqual(['Banana']);
    expect(progress.animalsDiscovered).toEqual(['Elephant']);
  });

  it('keeps other progress when one game updates', () => {
    useAppStore.setState({ progress: { ...defaultProgress, lettersExplored: ['A'], gameRounds: { chef: 2 }, gameLevels: { chef: ['smoothie'] } } });
    useAppStore.getState().completeGameRound('space', 'moon');
    const { progress } = useAppStore.getState();
    expect(progress.lettersExplored).toEqual(['A']);
    expect(progress.gameRounds).toEqual({ chef: 2, space: 1 });
    expect(progress.gameLevels).toEqual({ chef: ['smoothie'], space: ['moon'] });
  });
});

describe('Saved data from older or damaged versions', () => {
  it('loads progress saved before games had their own records', () => {
    const { gameRounds: _rounds, gameLevels: _levels, ...older } = { ...defaultProgress, lettersExplored: ['B'] };
    localStorage.setItem('kids-learning-progress', JSON.stringify(older));
    const progress = loadProgress();
    expect(progress.lettersExplored).toEqual(['B']);
    expect(progress.gameRounds).toEqual({});
    expect(progress.gameLevels).toEqual({});
  });

  it('drops damaged game records instead of crashing', () => {
    localStorage.setItem('kids-learning-progress', JSON.stringify({
      ...defaultProgress,
      gameRounds: { robot: 2, chef: 'lots', space: -1, puzzle: 2.7 },
      gameLevels: { robot: ['a', 'a', 5, 'b'], chef: 'nope' },
    }));
    const progress = loadProgress();
    expect(progress.gameRounds).toEqual({ robot: 2, puzzle: 2 });
    expect(progress.gameLevels).toEqual({ robot: ['a', 'b'] });
    localStorage.setItem('kids-learning-progress', JSON.stringify({ ...defaultProgress, gameRounds: [1, 2], gameLevels: null }));
    expect(loadProgress().gameRounds).toEqual({});
    expect(loadProgress().gameLevels).toEqual({});
  });

  it('defaults the game level setting, and ignores unknown values', () => {
    expect(loadSettings().gameDifficulty).toBe('beginner');
    localStorage.setItem('kids-learning-settings', JSON.stringify({ ...defaultSettings, gameDifficulty: 'expert' }));
    expect(loadSettings().gameDifficulty).toBe('beginner');
    localStorage.setItem('kids-learning-settings', JSON.stringify({ ...defaultSettings, gameDifficulty: 'advanced' }));
    expect(loadSettings().gameDifficulty).toBe('advanced');
  });
});

describe('Game achievements', () => {
  it('unlock only when their real conditions are met', () => {
    const base = { ...defaultProgress, gameRounds: {}, gameLevels: {} };
    expect(earned({ ...base, gameLevels: { tracing: 'ABCDEFGHI'.split('') } }, 'letter-tracer')).toBe(false);
    expect(earned({ ...base, gameLevels: { tracing: 'ABCDEFGHIJ'.split('') } }, 'letter-tracer')).toBe(true);
    expect(earned({ ...base, gameLevels: { robot: ['straight', 'corner', 'made-up'] } }, 'robot-coder')).toBe(false);
    expect(earned({ ...base, gameLevels: { robot: ['straight', 'corner', 'rock'] } }, 'robot-coder')).toBe(true);
    expect(earned({ ...base, gameLevels: { chef: recipes.slice(1).map((r) => r.id) } }, 'master-chef')).toBe(false);
    expect(earned({ ...base, gameLevels: { chef: recipes.map((r) => r.id) } }, 'master-chef')).toBe(true);
    expect(earned({ ...base, gameLevels: { space: destinations.map((d) => d.id) } }, 'space-explorer')).toBe(true);
    expect(earned({ ...base, gameRounds: Object.fromEntries(ADVENTURE_GAME_IDS.slice(0, 4).map((id) => [id, 3])) }, 'game-adventurer')).toBe(false);
    expect(earned({ ...base, gameRounds: Object.fromEntries(ADVENTURE_GAME_IDS.slice(0, 5).map((id) => [id, 1])) }, 'game-adventurer')).toBe(true);
  });

  it('are awarded once through the store', () => {
    for (const id of ['straight', 'corner', 'rock', 'rock']) useAppStore.getState().completeGameRound('robot', id);
    const { achievementsEarned } = useAppStore.getState().progress;
    expect(achievementsEarned.filter((id) => id === 'robot-coder')).toHaveLength(1);
  });
});
