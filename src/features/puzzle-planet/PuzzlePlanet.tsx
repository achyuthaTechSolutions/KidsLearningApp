import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import PillPicker from '../../components/ui/PillPicker';
import { useWorld } from '../../components/ui/world';
import { illustrationFor } from '../../data/illustrations';
import { useAppStore } from '../../store/useAppStore';
import { GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { useEndlessLevel } from '../learning-games/useEndlessLevel';
import EndlessControls from '../learning-games/EndlessControls';
import LevelUpBanner from '../learning-games/LevelUpBanner';
import { bandOf } from '../learning-games/adaptive';
import { pick } from '../learning-games/random';
import PuzzleBoard from './PuzzleBoard';
import {
  createPuzzle, piecesFor, puzzleFirstTry, puzzleId, puzzlePictures, puzzleThemes,
  type PuzzlePicture, type PuzzleState, type PuzzleTheme,
} from './engine';

/** How long the solved picture stays before the next puzzle comes by itself. */
const NEXT_PUZZLE_MS = 3200;

/**
 * Endless Puzzle Planet: solved puzzles keep coming, and the board grows as the
 * child's level rises (4 pieces up to 25). The child stops with Finish.
 */
export default function PuzzlePlanet() {
  const navigate = useNavigate();
  const green = useWorld('green');
  const { say, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const endless = useEndlessLevel('puzzle', settings.gameDifficulty);

  const [phase, setPhase] = useState<'intro' | 'play' | 'solved' | 'done'>('intro');
  const [puzzleTheme, setPuzzleTheme] = useState<PuzzleTheme>('animals');
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [round, setRound] = useState(0);
  /** Puzzles solved this game, and those solved with at most one wrong try. */
  const [solved, setSolved] = useState({ count: 0, clean: 0 });
  const [celebrate, setCelebrate] = useState(0);
  const nextPuzzle = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(nextPuzzle.current), []);

  /** Deals a new puzzle for `level`, never the same picture twice in a row. */
  const deal = (level: number, previous?: PuzzlePicture) => {
    window.clearTimeout(nextPuzzle.current);
    const pictures = puzzlePictures[puzzleTheme].filter((item) => item.id !== previous?.id);
    const picture = pick(pictures, Math.random);
    setPuzzle(createPuzzle(picture, piecesFor(level)));
    setRound((count) => count + 1);
    setPhase('play');
    return picture;
  };

  const start = () => {
    setSolved({ count: 0, clean: 0 });
    const picture = deal(endless.begin());
    say(`Let's build the ${picture.name.toLowerCase()} puzzle! Pick a piece, then put it where it belongs.`);
  };

  const onSolved = (state: PuzzleState) => {
    completeGameRound('puzzle', puzzleId(state.picture, state.size));
    const clean = puzzleFirstTry(state);
    const after = endless.record(clean);
    setSolved((count) => ({ count: count.count + 1, clean: count.clean + (clean ? 1 : 0) }));
    const levelUp = after.change === 'up' ? ` Level up! Level ${after.level}!` : '';
    say(`You did it! It's a ${state.picture.name.toLowerCase()}!${levelUp} Here comes the next puzzle.`);
    window.setTimeout(() => setPhase((current) => (current === 'play' ? 'solved' : current)), 600);
    // The next puzzle comes by itself; the child can also tap Next puzzle.
    nextPuzzle.current = window.setTimeout(() => deal(after.level, state.picture), NEXT_PUZZLE_MS);
  };

  /** The game never ends by itself: the child stops when they like. */
  const finish = () => {
    window.clearTimeout(nextPuzzle.current);
    setCelebrate((count) => count + 1);
    setPhase('done');
    say(solved.count > 0 ? `You solved ${solved.count} puzzles and reached level ${endless.level}!` : 'See you next time!');
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
        difficulty={endless.difficulty}
        onDifficulty={endless.pickDifficulty}
        endlessLevel={endless.planned}
        onStart={start}
        onHear={() => say('Tap a piece to pick it up, then tap the space where it belongs. You can also drag the pieces.')}
      >
        <Typography sx={{ textAlign: 'center', fontWeight: 700, mb: 1.5 }}>Level {endless.planned}: {piecesFor(endless.planned)} pieces</Typography>
        <PillPicker value={puzzleTheme} options={puzzleThemes} onChange={setPuzzleTheme} world="orange" ariaLabel="Puzzle theme" scroll />
      </GameIntro>
    );
  }

  if (phase === 'done') {
    const ratio = solved.count ? solved.clean / solved.count : 0;
    return (
      <GameResults
        stars={ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1}
        message={`You solved ${solved.count} ${solved.count === 1 ? 'puzzle' : 'puzzles'} and reached Level ${endless.level}!`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  if (!puzzle) return null;
  return (
    <>
      {phase === 'solved' && (
        <Box data-testid="puzzle-solved" sx={{ maxWidth: 1000, mx: 'auto', mt: 2, px: 2 }}>
          <Box sx={{ p: 2, borderRadius: '24px', bgcolor: green.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap', animation: 'kl-rise-in 300ms ease-out both' }}>
            <Typography variant="h4" component="p" sx={{ color: green.text }}>Puzzle done!</Typography>
            <Button variant="contained" color="success" endIcon={<NavigateNext />} onClick={() => deal(endless.level, puzzle.picture)}>Next puzzle</Button>
          </Box>
        </Box>
      )}
      <PuzzleBoard
        key={round}
        initial={puzzle}
        src={illustrationFor(puzzle.picture.emoji) ?? ''}
        title="Puzzle Planet"
        emoji="🪐"
        helper={bandOf(endless.level) !== 'advanced'}
        actions={<EndlessControls level={endless.level} world="orange" onFinish={finish} />}
        onBack={() => {
          window.clearTimeout(nextPuzzle.current);
          setPhase('intro');
        }}
        onSolved={onSolved}
      />
      <LevelUpBanner change={endless.lastChange} world="orange" />
    </>
  );
}
