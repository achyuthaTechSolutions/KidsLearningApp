import { useRef, useState, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, FormControlLabel, Switch, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { RestartAltRounded, UndoRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PillPicker from '../../components/ui/PillPicker';
import Confetti from '../../components/ui/Confetti';
import { useWorld } from '../../components/ui/world';
import { illustrationFor } from '../../data/illustrations';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playError, playNote, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { pick } from '../learning-games/random';
import type { GameDifficulty } from '../learning-games/difficulty';
import {
  createPuzzle, isSolved, pieceLabel, piecePosition, placePiece, puzzleId, puzzlePictures, puzzleThemes, sizeForDifficulty, undoPiece,
  type PuzzleSize, type PuzzleState, type PuzzleTheme,
} from './engine';

const sizeOptions = [
  { value: '4' as const, label: '4 pieces' },
  { value: '6' as const, label: '6 pieces' },
  { value: '12' as const, label: '12 pieces' },
];
const DRAG_START = 8;

interface Drag {
  pieceId: number;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moving: boolean;
}

export default function PuzzlePlanet() {
  const theme = useTheme();
  const navigate = useNavigate();
  const orange = useWorld('orange');
  const green = useWorld('green');
  const { say, sound, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [puzzleTheme, setPuzzleTheme] = useState<PuzzleTheme>('animals');
  const [size, setSize] = useState<'4' | '6' | '12'>(String(sizeForDifficulty[settings.gameDifficulty]) as '4' | '6' | '12');
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongSlot, setWrongSlot] = useState<number | null>(null);
  const [showPicture, setShowPicture] = useState(true);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);
  const dragRef = useRef<Drag | null>(null);

  const chooseDifficulty = (value: GameDifficulty) => {
    setDifficulty(value);
    setSize(String(sizeForDifficulty[value]) as '4' | '6' | '12');
    setShowPicture(value !== 'advanced');
  };

  const start = (pictureTheme = puzzleTheme) => {
    const picture = pick(puzzlePictures[pictureTheme], Math.random);
    const next = createPuzzle(picture, Number(size) as PuzzleSize);
    setPuzzle(next);
    setSelected(null);
    setPhase('play');
    const message = `Let's build the ${picture.name.toLowerCase()} puzzle! Pick a piece, then put it where it belongs.`;
    setStatus(message);
    say(message);
  };

  const tryPlace = (pieceId: number, slot: number) => {
    if (!puzzle) return;
    const { state, result } = placePiece(puzzle, pieceId, slot);
    setPuzzle(state);
    if (result === 'wrong') {
      setWrongSlot(slot);
      window.setTimeout(() => setWrongSlot(null), 450);
      sound((v) => playError(v * 0.2));
      setStatus('Not that spot. Look at the picture and try another place.');
      say('Hmm, not there. Try another spot!');
      return;
    }
    if (result !== 'placed') return;
    setSelected(null);
    if (isSolved(state)) {
      completeGameRound('puzzle', puzzleId(state.picture, state.size));
      setCelebrate((count) => count + 1);
      sound((v) => playSuccess(v * 0.3));
      say(`You did it! It's a ${state.picture.name.toLowerCase()}!`);
      window.setTimeout(() => setPhase('done'), 900);
      return;
    }
    sound((v) => playNote(700 + state.history.length * 40, 0.1, v * 0.22, 'triangle'));
    setStatus(`Piece placed. ${state.tray.length} left.`);
  };

  const tapPiece = (pieceId: number) => {
    setSelected((current) => (current === pieceId ? null : pieceId));
    sound((v) => playConfirmation(v * 0.1));
    if (puzzle) setStatus(`Piece picked up. Now tap the space where it belongs.`);
  };

  const tapSlot = (slot: number) => {
    if (selected === null) {
      setStatus('First pick a piece from the tray.');
      return;
    }
    tryPlace(selected, slot);
  };

  // Dragging is optional: a short tap still works as pick-then-place.
  const onPieceDown = (event: PointerEvent<HTMLElement>, pieceId: number) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const next = { pieceId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moving: false };
    dragRef.current = next;
  };
  const onPieceMove = (event: PointerEvent<HTMLElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const moving = current.moving || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > DRAG_START;
    const next = { ...current, x: event.clientX, y: event.clientY, moving };
    dragRef.current = next;
    if (moving) setDrag(next);
  };
  const onPieceUp = (event: PointerEvent<HTMLElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDrag(null);
    if (!current.moving) {
      tapPiece(current.pieceId);
      return;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slot]');
    const slot = target ? Number(target.getAttribute('data-slot')) : NaN;
    if (Number.isFinite(slot)) tryPlace(current.pieceId, slot);
  };
  const onPieceCancel = () => {
    dragRef.current = null;
    setDrag(null);
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
        onStart={() => start()}
        onHear={() => say('Tap a piece to pick it up, then tap the space where it belongs. You can also drag the pieces.')}
      >
        <PillPicker value={puzzleTheme} options={puzzleThemes} onChange={setPuzzleTheme} world="orange" ariaLabel="Puzzle theme" scroll />
        <PillPicker value={size} options={sizeOptions} onChange={setSize} world="orange" ariaLabel="Number of pieces" />
      </GameIntro>
    );
  }

  if (phase === 'done' && puzzle) {
    return (
      <GameResults
        stars={puzzle.mistakes <= 1 ? 3 : puzzle.mistakes <= puzzle.size / 2 ? 2 : 1}
        message={`You finished the ${puzzle.picture.name.toLowerCase()} puzzle!`}
        celebrate={celebrate}
        onPlayAgain={() => start()}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  if (!puzzle) return null;
  const src = illustrationFor(puzzle.picture.emoji) ?? '';
  const pieceStyle = (pieceId: number) => {
    const position = piecePosition(pieceId, puzzle.cols, puzzle.rows);
    return {
      backgroundImage: `url("${src}")`,
      backgroundSize: `${puzzle.cols * 100}% ${puzzle.rows * 100}%`,
      backgroundPosition: `${position.x}% ${position.y}%`,
      backgroundRepeat: 'no-repeat',
    };
  };
  // Small enough on phones that the board and the piece tray fit on one screen.
  const boardSize = 'min(80vw, 420px, 44vh)';
  const pieceW = `calc(${boardSize} / ${puzzle.cols} * 0.62)`;
  const pieceH = `calc(${boardSize} / ${puzzle.rows} * 0.62)`;

  return (
    <Page maxWidth={1000}>
      <GameHeader
        title="Puzzle Planet"
        emoji="🪐"
        world="orange"
        backLabel="Back"
        onBack={() => setPhase('intro')}
        progress={{ value: puzzle.history.length, total: puzzle.size, label: `${puzzle.history.length} of ${puzzle.size} pieces placed` }}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' }, gap: 3, alignItems: 'start' }}>
        <Box sx={{ mx: 'auto' }}>
          <Box
            role="grid"
            aria-label={`Puzzle board for the ${puzzle.picture.name}`}
            sx={{
              position: 'relative',
              width: boardSize,
              height: boardSize,
              display: 'grid',
              gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
              gridTemplateRows: `repeat(${puzzle.rows}, 1fr)`,
              borderRadius: '20px',
              overflow: 'hidden',
              border: `4px solid ${orange.main}`,
              bgcolor: 'background.paper',
            }}
          >
            {showPicture && (
              <Box aria-hidden sx={{ position: 'absolute', inset: 0, backgroundImage: `url("${src}")`, backgroundSize: '100% 100%', opacity: 0.18, filter: 'grayscale(0.6)', pointerEvents: 'none' }} />
            )}
            {Array.from({ length: puzzle.size }, (_, slot) => {
              const filled = puzzle.placed[slot] !== undefined;
              return (
                <ButtonBase
                  key={slot}
                  data-slot={slot}
                  role="gridcell"
                  aria-label={filled ? `Space ${pieceLabel(slot, puzzle.cols)}, done` : `Empty space, ${pieceLabel(slot, puzzle.cols)}`}
                  disabled={filled}
                  onClick={() => tapSlot(slot)}
                  sx={{
                    position: 'relative',
                    border: filled ? 'none' : `2px dashed ${alpha(orange.main, 0.45)}`,
                    animation: wrongSlot === slot ? 'kl-shake 420ms ease-in-out' : filled ? 'kl-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
                    bgcolor: wrongSlot === slot ? alpha(orange.main, 0.2) : 'transparent',
                    ...(filled ? pieceStyle(slot) : {}),
                  }}
                />
              );
            })}
          </Box>
        </Box>

        <Box>
          <Typography variant="h4" component="h2" sx={{ fontSize: '1.15rem', mb: 1 }}>
            {selected === null ? 'Pick a piece' : 'Now tap where it goes'}
          </Typography>
          <Box role="group" aria-label="Puzzle pieces" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, borderRadius: '20px', bgcolor: orange.tint, minHeight: 100 }}>
            {puzzle.tray.map((pieceId) => {
              const isSelected = selected === pieceId;
              const dragging = drag?.pieceId === pieceId && drag.moving;
              return (
                <ButtonBase
                  key={pieceId}
                  aria-label={`Piece from ${pieceLabel(pieceId, puzzle.cols)}${isSelected ? ', picked up' : ''}`}
                  aria-pressed={isSelected}
                  onPointerDown={(event) => onPieceDown(event, pieceId)}
                  onPointerMove={onPieceMove}
                  onPointerUp={onPieceUp}
                  onPointerCancel={onPieceCancel}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      tapPiece(pieceId);
                    }
                  }}
                  sx={{
                    width: pieceW,
                    height: pieceH,
                    minWidth: 56,
                    minHeight: 56,
                    borderRadius: '10px',
                    bgcolor: 'background.paper',
                    border: `3px solid ${isSelected ? green.main : alpha(orange.main, 0.5)}`,
                    boxShadow: isSelected ? `0 0 0 4px ${alpha(green.main, 0.35)}` : `0 4px 0 ${alpha(orange.main, 0.4)}`,
                    transform: isSelected ? 'translateY(-4px) scale(1.05)' : 'none',
                    opacity: dragging ? 0.3 : 1,
                    touchAction: 'none',
                    ...pieceStyle(pieceId),
                  }}
                />
              );
            })}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Tip: each piece fits only one space. Look for matching colours and edges.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="outlined" startIcon={<UndoRounded />} onClick={() => setPuzzle(undoPiece(puzzle))} disabled={puzzle.history.length === 0}>Undo</Button>
            <Button variant="outlined" startIcon={<RestartAltRounded />} onClick={() => { setPuzzle(createPuzzle(puzzle.picture, puzzle.size)); setSelected(null); }}>Start over</Button>
            <FormControlLabel control={<Switch checked={showPicture} onChange={(event) => setShowPicture(event.target.checked)} />} label="Picture helper" />
          </Box>

        </Box>
      </Box>

      {drag?.moving && (
        <Box
          aria-hidden
          sx={{
            position: 'fixed',
            left: drag.x,
            top: drag.y,
            width: pieceW,
            height: pieceH,
            transform: 'translate(-50%, -50%) scale(1.08)',
            pointerEvents: 'none',
            zIndex: theme.zIndex.modal,
            borderRadius: '10px',
            border: `3px solid ${green.main}`,
            bgcolor: 'background.paper',
            boxShadow: `0 10px 24px ${alpha('#000000', 0.25)}`,
            ...pieceStyle(drag.pieceId),
          }}
        />
      )}
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
