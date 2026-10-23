import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, ButtonBase, IconButton, TextField, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { AddPhotoAlternateRounded, CheckCircleRounded, DeleteRounded, LockRounded } from '@mui/icons-material';
import PillPicker from '../../components/ui/PillPicker';
import ParentGate from '../../components/parent/ParentGate';
import { tactile, useWorld } from '../../components/ui/world';
import { fonts } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import type { GameDifficulty } from '../learning-games/difficulty';
import PuzzleBoard from '../puzzle-planet/PuzzleBoard';
import { createPuzzle, puzzleStars, sizeForDifficulty, sizeOptions, type PuzzleSize, type PuzzleState, type SizeOption } from '../puzzle-planet/engine';
import {
  MAX_NAME_LENGTH, MAX_PHOTOS, PhotoError, addPhoto, loadPhotos, photoErrorText, photoUrl, preparePhoto, savePhotos, type SavedPhoto,
} from './photos';

export default function PhotoPuzzle() {
  const theme = useTheme();
  const navigate = useNavigate();
  const pink = useWorld('pink');
  const green = useWorld('green');
  const { say, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [size, setSize] = useState<SizeOption>(String(sizeForDifficulty[settings.gameDifficulty]) as SizeOption);
  const [photos, setPhotos] = useState<SavedPhoto[]>(loadPhotos);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [solved, setSolved] = useState<PuzzleState | null>(null);
  const [round, setRound] = useState(0);
  const [celebrate, setCelebrate] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const chosen = photos.find((photo) => photo.id === chosenId) ?? photos[0];

  // One object URL per photo while it is being played, released afterwards.
  const picture = useMemo(() => (phase === 'play' && chosen ? photoUrl(chosen.dataUrl) : null), [phase, chosen]);
  useEffect(() => () => picture?.release(), [picture]);

  const closeGate = useCallback(() => setGateOpen(false), []);

  const chooseDifficulty = (value: GameDifficulty) => {
    setDifficulty(value);
    setSize(String(sizeForDifficulty[value]) as SizeOption);
  };

  const start = () => {
    if (!chosen) return;
    setPuzzle(createPuzzle({ id: chosen.id, name: chosen.name, emoji: '📸' }, Number(size) as PuzzleSize));
    setRound((count) => count + 1);
    setPhase('play');
    say(`Let's build the ${chosen.name} puzzle! Pick a piece, then put it where it belongs.`);
  };

  const finish = (state: PuzzleState) => {
    completeGameRound('photo-puzzle', `size-${state.size}`);
    setSolved(state);
    say(`You did it! You finished the ${state.picture.name} puzzle!`);
    window.setTimeout(() => {
      setCelebrate((count) => count + 1);
      setPhase('done');
    }, 900);
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      if (photos.length >= MAX_PHOTOS) throw new PhotoError('full');
      const dataUrl = await preparePhoto(file);
      const next = addPhoto(photos, dataUrl, name);
      if (!savePhotos(next)) throw new PhotoError('storage');
      setPhotos(next);
      setChosenId(next[next.length - 1].id);
      setName('');
      setMessage({ tone: 'success', text: `Added "${next[next.length - 1].name}". It is saved on this device only.` });
    } catch (error) {
      setMessage({ tone: 'error', text: photoErrorText[error instanceof PhotoError ? error.kind : 'unreadable'] });
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => {
    const next = photos.filter((photo) => photo.id !== id);
    if (savePhotos(next)) {
      setPhotos(next);
      setMessage({ tone: 'success', text: 'Photo deleted from this device.' });
    }
  };

  const removeAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    savePhotos([]);
    setPhotos([]);
    setConfirmClear(false);
    setMessage({ tone: 'success', text: 'All puzzle photos were deleted from this device.' });
  };

  if (phase === 'done' && solved) {
    return (
      <GameResults
        stars={puzzleStars(solved)}
        message={`You finished the ${solved.picture.name} puzzle!`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  if (phase === 'play' && puzzle && picture) {
    return (
      <PuzzleBoard
        key={round}
        initial={puzzle}
        src={picture.url}
        title="My Photo Puzzle"
        emoji="📸"
        world="pink"
        helper={difficulty !== 'advanced'}
        onBack={() => setPhase('intro')}
        onSolved={finish}
      />
    );
  }

  return (
    <GameIntro
      title="My Photo Puzzle"
      subtitle="Turn a family photo into a puzzle!"
      emoji="📸"
      world="pink"
      steps={[
        { emoji: '🔒', text: 'A grown-up adds a photo from this device.' },
        { emoji: '👆', text: 'Pick a photo, then tap Let\'s play!' },
        { emoji: '🧩', text: 'Put the pieces back together.' },
      ]}
      difficulty={difficulty}
      onDifficulty={chooseDifficulty}
      onStart={start}
      startDisabled={!chosen || managing}
      onHear={() => say('Pick one of your photos. It turns into a puzzle! Put the pieces back where they belong.')}
    >
      <PillPicker value={size} options={sizeOptions} onChange={setSize} world="pink" ariaLabel="Number of pieces" />

      <Box component="section" aria-labelledby="photo-picker-title" sx={{ p: { xs: 2, md: 3 }, borderRadius: '28px', bgcolor: 'background.paper', border: `3px solid ${pink.tint}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Typography id="photo-picker-title" variant="h3" component="h2" sx={{ fontSize: { xs: '1.25rem', md: '1.45rem' }, color: pink.text }}>
            {managing ? 'Grown-ups: manage photos' : 'Pick a photo'}
          </Typography>
          {managing ? (
            <Button variant="contained" onClick={() => { setManaging(false); setConfirmClear(false); setMessage(null); }}>Done</Button>
          ) : (
            <Button variant="outlined" startIcon={<LockRounded />} onClick={() => setGateOpen(true)}>Grown-ups: add or delete photos</Button>
          )}
        </Box>

        {managing && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Photos stay on this device. Each one is cropped to a square, made smaller, and saved without its original details, such as where it was taken. Nothing is uploaded or shared. Up to {MAX_PHOTOS} photos.
            </Alert>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Photo name (optional)"
                helperText="Pip says this name, for example “Grandma” or “our dog”."
                value={name}
                onChange={(event) => setName(event.target.value)}
                slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
                size="small"
                sx={{ flex: 1, minWidth: 220 }}
              />
              <Button
                variant="contained"
                startIcon={<AddPhotoAlternateRounded />}
                disabled={busy || photos.length >= MAX_PHOTOS}
                onClick={() => fileInput.current?.click()}
              >
                {busy ? 'Adding…' : 'Choose a photo'}
              </Button>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFile} data-testid="photo-file" />
            </Box>
          </>
        )}

        {message && <Alert severity={message.tone} sx={{ mb: 2 }} role="status">{message.text}</Alert>}

        {photos.length === 0 ? (
          <Typography sx={{ fontWeight: 800, textAlign: 'center', py: 3 }}>
            No photos yet. Ask a grown-up to add one!
          </Typography>
        ) : (
          <Box role={managing ? 'list' : 'radiogroup'} aria-label="Photos" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {photos.map((photo) => {
              const isChosen = chosen?.id === photo.id;
              const w = isChosen && !managing ? green : pink;
              const thumb = (
                <>
                  <Box component="img" src={photo.dataUrl} alt="" sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '14px', display: 'block' }} />
                  <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', overflowWrap: 'anywhere' }}>
                    {isChosen && !managing && <CheckCircleRounded aria-hidden sx={{ color: green.main, fontSize: 20 }} />}
                    {photo.name}
                  </Typography>
                </>
              );
              if (managing) {
                return (
                  <Box role="listitem" key={photo.id} sx={{ position: 'relative', p: 1, borderRadius: '18px', border: `2px solid ${alpha(pink.main, 0.35)}` }}>
                    {thumb}
                    <IconButton
                      aria-label={`Delete ${photo.name}`}
                      onClick={() => remove(photo.id)}
                      sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
                    >
                      <DeleteRounded />
                    </IconButton>
                  </Box>
                );
              }
              return (
                <ButtonBase
                  key={photo.id}
                  role="radio"
                  aria-checked={isChosen}
                  aria-label={photo.name}
                  onClick={() => setChosenId(photo.id)}
                  sx={[tactile(theme, w, { state: isChosen ? 'done' : 'idle', depth: 5, radius: 20 }), { p: 1, flexDirection: 'column', alignItems: 'stretch' }]}
                >
                  {thumb}
                </ButtonBase>
              );
            })}
          </Box>
        )}

        {managing && photos.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button color="error" variant={confirmClear ? 'contained' : 'outlined'} startIcon={<DeleteRounded />} onClick={removeAll}>
              {confirmClear ? 'Tap again to delete all photos' : 'Delete all photos'}
            </Button>
          </Box>
        )}
      </Box>

      <ParentGate
        open={gateOpen}
        title="Grown-ups only"
        description="Adding or deleting photos is for grown-ups. Photos stay on this device and are never uploaded."
        onClose={closeGate}
        onGranted={() => {
          setGateOpen(false);
          setManaging(true);
        }}
      />
    </GameIntro>
  );
}
