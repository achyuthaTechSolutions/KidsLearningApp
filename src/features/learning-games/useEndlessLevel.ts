import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { bandOf, createAdaptive, recordAnswer, resumeLevel, startLevel, type Adaptive, type LevelChange } from './adaptive';
import type { GameDifficulty } from './difficulty';

/**
 * A game's endless level for this child. Before play, `planned` is where the game will
 * start: the saved level, or the start of the difficulty a grown-up picks. During play,
 * `record` moves the level up or down and saves it, so the next game carries on.
 */
/** `gameId` is a catalog id, or `quiz-<type>` for the quiz games. */
export function useEndlessLevel(gameId: string, defaultDifficulty: GameDifficulty) {
  const saved = useAppStore((s) => s.progress.gameSkill?.[gameId]);
  const setGameSkill = useAppStore((s) => s.setGameSkill);
  const recordGameLevel = useAppStore((s) => s.recordGameLevel);
  const [planned, setPlanned] = useState(() => resumeLevel(saved, defaultDifficulty));
  const adaptive = useRef<Adaptive>(createAdaptive(planned));
  const [level, setLevel] = useState(planned);
  const [lastChange, setLastChange] = useState<{ change: Exclude<LevelChange, null>; level: number; at: number } | null>(null);

  /** A grown-up picked a difficulty: start at its first level. */
  const pickDifficulty = useCallback((difficulty: GameDifficulty) => setPlanned(startLevel[difficulty]), []);

  const begin = useCallback(() => {
    adaptive.current = createAdaptive(planned);
    setLevel(planned);
    setLastChange(null);
    setGameSkill(gameId, planned);
    return planned;
  }, [gameId, planned, setGameSkill]);

  /** One answered question. Returns the new level when it changed. */
  const record = useCallback((firstTry: boolean): { change: LevelChange; level: number } => {
    const { state, change } = recordAnswer(adaptive.current, firstTry);
    adaptive.current = state;
    if (change) {
      setLevel(state.level);
      setPlanned(state.level);
      setGameSkill(gameId, state.level);
      setLastChange({ change, level: state.level, at: Date.now() });
      if (change === 'up') recordGameLevel(gameId, `level-${state.level}`);
    }
    return { change, level: state.level };
  }, [gameId, recordGameLevel, setGameSkill]);

  return { planned, difficulty: bandOf(planned), pickDifficulty, level, begin, record, lastChange };
}
