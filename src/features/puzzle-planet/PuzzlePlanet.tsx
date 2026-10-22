import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PillPicker from '../../components/ui/PillPicker';
import { illustrationFor } from '../../data/illustrations';
import { useAppStore } from '../../store/useAppStore';
import { GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { pick } from '../learning-games/random';
import type { GameDifficulty } from '../learning-games/difficulty';
import PuzzleBoard from './PuzzleBoard';
import {
  createPuzzle, puzzleId, puzzlePictures, puzzleStars, puzzleThemes, sizeForDifficulty, sizeOptions,
  type PuzzleSize, type SizeOption, type PuzzleState, type PuzzleTheme,
} from './engine';

export default function PuzzlePlanet() {
  const navigate = useNavigate();
  const { say, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [puzzleTheme, setPuzzleTheme] = useState<PuzzleTheme>('animals');
  const [size, setSize] = useState<SizeOption>(String(sizeForDifficulty[settings.gameDifficulty]) as SizeOption);
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [solved, setSolved] = useState<PuzzleState | null>(null);
  const [round, setRound] = useState(0);
  const [celebrate, setCelebrate] = useState(0);

  const chooseDifficulty = (value: GameDifficulty) => {
    setDifficulty(value);
    setSize(String(sizeForDifficulty[value]) as SizeOption);
  };

  const start = () => {
    const picture = pick(puzzlePictures[puzzleTheme], Math.random);
    setPuzzle(createPuzzle(picture, Number(size) as PuzzleSize));
    setRound((count) => count + 1);
    setPhase('play');
    say(`Let's build the ${picture.name.toLowerCase()} puzzle! Pick a piece, then put it where it belongs.`);
  };

  const finish = (state: PuzzleState) => {
    completeGameRound('puzzle', puzzleId(state.picture, state.size));
    setSolved(state);
    say(`You did it! It's a ${state.picture.name.toLowerCase()}!`);
    window.setTimeout(() => {
      setCelebrate((count) => count + 1);
      setPhase('done');
    }, 900);
  };

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Puzzle Planet"
        subtitle="Put the picture pieces back together."
        emoji="🪐"
        world="orange"
        steps={[
          { emoji: '👆', text: 'Tap a piece to pick it up, or drag it.' },
          { emoji: '🧩', text: 'Tap the space where it belongs. It snaps in!' },
          { emoji: '🖼️', text: 'Use the faint picture as a helper.' },
        ]}
        difficulty={difficulty}
        onDifficulty={chooseDifficulty}
        onStart={start}
        onHear={() => say('Tap a piece to pick it up, then tap the space where it belongs. You can also drag the pieces.')}
      >
        <PillPicker value={puzzleTheme} options={puzzleThemes} onChange={setPuzzleTheme} world="orange" ariaLabel="Puzzle theme" scroll />
        <PillPicker value={size} options={sizeOptions} onChange={setSize} world="orange" ariaLabel="Number of pieces" />
      </GameIntro>
    );
  }

  if (phase === 'done' && solved) {
    return (
      <GameResults
        stars={puzzleStars(solved)}
        message={`You finished the ${solved.picture.name.toLowerCase()} puzzle!`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  if (!puzzle) return null;
  return (
    <PuzzleBoard
      key={round}
      initial={puzzle}
      src={illustrationFor(puzzle.picture.emoji) ?? ''}
      title="Puzzle Planet"
      emoji="🪐"
      helper={difficulty !== 'advanced'}
      onBack={() => setPhase('intro')}
      onSolved={finish}
    />
  );
}
