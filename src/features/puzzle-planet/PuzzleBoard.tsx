import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Box, Button, ButtonBase, FormControlLabel, Switch, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { RestartAltRounded, UndoRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Confetti from '../../components/ui/Confetti';
import { useWorld } from '../../components/ui/world';
import type { WorldKey } from '../../theme/tokens';
import { playConfirmation, playError, playNote, playSuccess } from '../../services/audio';
import { GameHeader } from '../learning-games/GameChrome';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { createPuzzle, isSolved, pieceLabel, piecePosition, placePiece, undoPiece, type PuzzleState } from './engine';

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

interface Props {
  initial: PuzzleState;
  /** Picture to cut into pieces: a bundled illustration or a family photo. */
  src: string;
  title: string;
  emoji: string;
  world?: WorldKey;
  helper?: boolean;
  /** Extra header items, such as the endless level and a Finish button. */
  actions?: ReactNode;
  onBack: () => void;
  onSolved: (state: PuzzleState) => void;
}

/**
 * The playable board shared by Puzzle Planet and My Photo Puzzle. Pieces can be
 * dragged, tapped then placed, or picked with Enter. Each piece only fits its own
 * space and then locks; Undo takes the last one back.
 */
export default function PuzzleBoard({ initial, src, title, emoji, world = 'orange', helper = true, actions, onBack, onSolved }: Props) {
  const theme = useTheme();
  const accent = useWorld(world);
  const green = useWorld('green');
  const { say, sound } = useGameFeedback();
  const [puzzle, setPuzzle] = useState<PuzzleState>(initial);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongSlot, setWrongSlot] = useState<number | null>(null);
  const [showPicture, setShowPicture] = useState(helper);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);
  const dragRef = useRef<Drag | null>(null);
  const solvedRef = useRef(false);

  const tryPlace = (pieceId: number, slot: number) => {
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
      if (solvedRef.current) return;
      solvedRef.current = true;
      setCelebrate((count) => count + 1);
      sound((v) => playSuccess(v * 0.3));
      onSolved(state);
      return;
    }
    sound((v) => playNote(700 + state.history.length * 40, 0.1, v * 0.22, 'triangle'));
    setStatus(`Piece placed. ${state.tray.length} left.`);
  };

  const tapPiece = (pieceId: number) => {
    setSelected((current) => (current === pieceId ? null : pieceId));
    sound((v) => playConfirmation(v * 0.1));
    setStatus('Piece picked up. Now tap the space where it belongs.');
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
    dragRef.current = { pieceId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moving: false };
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

  // Inline style, not sx: a photo's URL then stays out of generated CSS classes.
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
        title={title}
        emoji={emoji}
        world={world}
        backLabel="Back"
        onBack={onBack}
        progress={{ value: puzzle.history.length, total: puzzle.size, label: `${puzzle.history.length} of ${puzzle.size} pieces placed` }}
        actions={actions}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' }, gap: 3, alignItems: 'start' }}>
        <Box sx={{ mx: 'auto' }}>
          <Box
            role="grid"
            aria-label={`Puzzle board for ${puzzle.picture.name}`}
            sx={{
              position: 'relative',
              width: boardSize,
              height: boardSize,
              display: 'grid',
              gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
              gridTemplateRows: `repeat(${puzzle.rows}, 1fr)`,
              borderRadius: '20px',
              overflow: 'hidden',
              border: `4px solid ${accent.main}`,
              bgcolor: 'background.paper',
            }}
          >
            {showPicture && (
              <Box
                aria-hidden
                style={{ backgroundImage: `url("${src}")` }}
                sx={{ position: 'absolute', inset: 0, backgroundSize: '100% 100%', opacity: 0.18, filter: 'grayscale(0.6)', pointerEvents: 'none' }}
              />
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
                  style={filled ? pieceStyle(slot) : undefined}
                  sx={{
                    position: 'relative',
                    border: filled ? 'none' : `2px dashed ${alpha(accent.main, 0.45)}`,
                    animation: wrongSlot === slot ? 'kl-shake 420ms ease-in-out' : filled ? 'kl-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
                    bgcolor: wrongSlot === slot ? alpha(accent.main, 0.2) : 'transparent',
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
          <Box role="group" aria-label="Puzzle pieces" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, borderRadius: '20px', bgcolor: accent.tint, minHeight: 100 }}>
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
                  style={pieceStyle(pieceId)}
                  sx={{
                    width: pieceW,
                    height: pieceH,
                    minWidth: 56,
                    minHeight: 56,
                    borderRadius: '10px',
                    bgcolor: 'background.paper',
                    border: `3px solid ${isSelected ? green.main : alpha(accent.main, 0.5)}`,
                    boxShadow: isSelected ? `0 0 0 4px ${alpha(green.main, 0.35)}` : `0 4px 0 ${alpha(accent.main, 0.4)}`,
                    transform: isSelected ? 'translateY(-4px) scale(1.05)' : 'none',
                    opacity: dragging ? 0.3 : 1,
                    touchAction: 'none',
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
          style={pieceStyle(drag.pieceId)}
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
          }}
        />
      )}
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
