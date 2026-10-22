import { beforeEach, describe, expect, it } from 'vitest';
import { defaultDinoRecord, loadDinoRecord, resetDinoScores, saveDinoRecord, setStorageMirror } from './storage';

describe('Dino Dash record', () => {
  beforeEach(() => {
    localStorage.clear();
    setStorageMirror(null);
  });

  it('starts at level 1 with a green dino', () => {
    expect(loadDinoRecord()).toEqual(defaultDinoRecord);
  });

  it('saves and loads the best score, level, and colour', () => {
    saveDinoRecord({ bestScore: 1234, bestLevel: 7, color: 'pink' });
    expect(loadDinoRecord()).toEqual({ bestScore: 1234, bestLevel: 7, color: 'pink' });
  });

  it('ignores damaged values', () => {
    localStorage.setItem('kids-learning-dino', JSON.stringify({ bestScore: -5, bestLevel: 'x', color: 3 }));
    expect(loadDinoRecord()).toEqual(defaultDinoRecord);
  });

  it('reset clears scores but keeps the chosen colour', () => {
    saveDinoRecord({ bestScore: 900, bestLevel: 5, color: 'purple' });
    resetDinoScores();
    expect(loadDinoRecord()).toEqual({ bestScore: 0, bestLevel: 1, color: 'purple' });
  });
});
