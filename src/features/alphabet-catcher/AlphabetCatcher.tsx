import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, FormControlLabel, Switch, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { NavigateNext, PauseRounded, PlayArrowRounded, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Confetti from '../../components/ui/Confetti';
import { resolveWorld, tactile, useWorld } from '../../components/ui/world';
import { fonts, rainbow } from '../../theme/tokens';
import { alphabetData } from '../../data/alphabet';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playError, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { isEditableTarget, prefersReducedMotion } from '../learning-games/motion';
import { useEndlessLevel } from '../learning-games/useEndlessLevel';
import LevelUpBanner from '../learning-games/LevelUpBanner';
import EndlessControls from '../learning-games/EndlessControls';
import {
  catchLetter, catcherProfile, catcherPrompt, catcherStars, createCatcherGame, fallY, nextCatcherRound,
  type CatcherGame, type CatcherMotion, type LetterCase,
} from './engine';

const caseOptions = [
  { value: 'upper' as const, label: 'Big ABC' },
  { value: 'lower' as const, label: 'Small abc' },
  { value: 'mixed' as const, label: 'Mixed Aa' },
];
const motionOptions = [
  { value: 'still' as const, label: 'Letters stay still', emoji: '🧘' },
  { value: 'falling' as const, label: 'Letters fall slowly', emoji: '🍂' },
];

export default function AlphabetCatcher() {
  const theme = useTheme();
  const navigate = useNavigate();
  const violet = useWorld('violet');
  const green = useWorld('green');
  const { say, sound, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const addLetterExplored = useAppStore((s) => s.addLetterExplored);
  const reduced = prefersReducedMotion(settings.reducedMotion);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const endless = useEndlessLevel('alphabet-catcher', settings.gameDifficulty);
  /** The level the next letter is made for, after the last catch. */
  const nextLevel = useRef(1);
  const [letterCase, setLetterCase] = useState<LetterCase>('upper');
  const [motion, setMotion] = useState<CatcherMotion>('still');
  const [phonics, setPhonics] = useState(false);
  const [game, setGame] = useState<CatcherGame | null>(null);
  const [paused, setPaused] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);
  const gameRef = useRef<CatcherGame | null>(null);

  const speakRound = (next: CatcherGame) => say(catcherPrompt(next.round, next.phonics));

  const update = (next: CatcherGame) => {
    gameRef.current = next;
    setGame(next);
  };

  const start = () => {
    const level = endless.begin();
    nextLevel.current = level;
    const next = createCatcherGame(level, letterCase, phonics);
    update(next);
    setElapsed(0);
    setPaused(false);
    setPhase('play');
    setStatus(catcherPrompt(next.round, next.phonics));
    speakRound(next);
  };

  const choose = (letter: string) => {
    const current = gameRef.current;
    if (!current || paused) return;
    const { game: next, result } = catchLetter(current, letter);
    if (result === 'ignored') return;
    update(next);
    const info = alphabetData[current.round.target];
    if (result === 'wrong') {
      setShaking(letter);
      window.setTimeout(() => setShaking(null), 450);
      sound((v) => playError(v * 0.25));
      const hint = `That is ${letter}. ${catcherPrompt(current.round, current.phonics)}`;
      setStatus(hint);
      say(hint);
      return;
    }
    addLetterExplored(current.round.target);
    setCelebrate((count) => count + 1);
    sound((v) => playConfirmation(v * 0.3));
    const after = endless.record(current.roundMistakes === 0);
    nextLevel.current = after.level;
    const levelUp = after.change === 'up' ? ` Level up! Level ${after.level}!` : '';
    const cheer = `You caught ${current.round.target}! ${current.round.target} is for ${info.word}.${levelUp}`;
    setStatus(cheer);
    say(cheer);
  };

  const goNext = () => {
    const current = gameRef.current;
    if (!current) return;
    const next = nextCatcherRound(current, nextLevel.current);
    update(next);
    setElapsed(0);
    setStatus(catcherPrompt(next.round, next.phonics));
    speakRound(next);
  };

  /** The game never ends by itself: the child stops when they like. */
  const finish = () => {
    const current = gameRef.current;
    if (current && current.caughtCount > 0) completeGameRound('alphabet-catcher', `level-${endless.level}`);
    setPhase('done');
    setCelebrate((count) => count + 1);
    sound((v) => playSuccess(v * 0.3));
    say(current && current.caughtCount > 0 ? `You caught ${current.caughtCount} letters and reached level ${endless.level}! Super catching!` : 'See you next time!');
  };

  // Falling letters: one animation loop that stops while paused, caught, or hidden.
  const falling = phase === 'play' && motion === 'falling' && !paused && Boolean(game && !game.caught);
  useEffect(() => {
    if (!falling) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setElapsed((value) => value + Math.min(0.05, (now - last) / 1000));
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const onHidden = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [falling]);

  // Typing a letter picks it. One listener, read through a ref so it is never re-added.
  const chooseRef = useRef(choose);
  useEffect(() => {
    chooseRef.current = choose;
  });
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;
      if (!/^[a-z]$/i.test(event.key)) return;
      const current = gameRef.current;
      if (!current?.round.choices.some((choice) => choice.letter === event.key.toUpperCase())) return;
      chooseRef.current(event.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Alphabet Catcher"
        subtitle="Listen for the letter, then catch it!"
        emoji="🔤"
        world="violet"
        steps={[
          { emoji: '👂', text: 'Listen. Pip will name a letter.' },
          { emoji: '👆', text: 'Tap that letter, or press it on the keyboard.' },
          { emoji: '🔁', text: 'Tap the speaker any time to hear it again.' },
        ]}
        difficulty={endless.difficulty}
        onDifficulty={endless.pickDifficulty}
        endlessLevel={endless.planned}
        onStart={start}
        onHear={() => say('Listen to Pip, then tap the letter you hear. You can tap the speaker to hear it again.')}
      >
        <PillPicker value={letterCase} options={caseOptions} onChange={setLetterCase} world="violet" ariaLabel="Letter case" />
        <PillPicker value={motion} options={motionOptions} onChange={setMotion} world="violet" ariaLabel="How letters move" />
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <FormControlLabel
            control={<Switch checked={phonics} onChange={(event) => setPhonics(event.target.checked)} />}
            label="Phonics mode: hear the letter's sound instead of its name"
          />
        </Box>
      </GameIntro>
    );
  }

  if (phase === 'done' && game) {
    return (
      <GameResults
        stars={catcherStars(game)}
        message={`You caught ${game.caughtCount} letters and reached Level ${endless.level}! ${game.firstTry} on the first try.`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  if (!game) return null;
  const { round } = game;
  const info = alphabetData[round.target];
  const profile = catcherProfile(game.level);
  const isFalling = motion === 'falling';
  const columns = round.choices.length <= 3 ? 3 : round.choices.length === 4 ? 2 : 3;

  const letterButton = (choice: (typeof round.choices)[number], index: number, extra: object = {}) => {
    const caughtThis = game.caught && choice.letter === round.target;
    const w = resolveWorld(caughtThis ? 'green' : rainbow[index % rainbow.length], theme.palette.mode);
    return (
      <ButtonBase
        key={choice.letter}
        aria-label={`Letter ${choice.shown}`}
        disabled={game.caught || paused}
        onClick={() => choose(choice.letter)}
        sx={[
          tactile(theme, w, { state: 'selected', depth: 6, radius: 28 }),
          {
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: { xs: '3rem', md: '3.8rem' },
            lineHeight: 1,
            animation: shaking === choice.letter ? 'kl-shake 420ms ease-in-out' : caughtThis ? 'kl-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
            opacity: game.caught && !caughtThis ? 0.4 : 1,
            '&.Mui-disabled': { color: w.onMain },
          },
          extra,
        ]}
      >
        {choice.shown}
      </ButtonBase>
    );
  };

  return (
    <Page maxWidth={900}>
      <GameHeader
        title="Alphabet Catcher"
        emoji="🔤"
        world="violet"
        backLabel="Back"
        onBack={() => setPhase('intro')}
        score={game.caughtCount}
        scoreLabel={`${game.caughtCount} letters caught`}
        actions={(
          <>
            {isFalling && (
              <RoundIconButton label={paused ? 'Keep playing' : 'Pause'} world="violet" filled={paused} onClick={() => setPaused(!paused)}>
                {paused ? <PlayArrowRounded /> : <PauseRounded />}
              </RoundIconButton>
            )}
            <EndlessControls level={endless.level} world="violet" onFinish={finish} />
          </>
        )}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2, px: 2, py: 1.5, borderRadius: '24px', bgcolor: violet.tint, flexWrap: 'wrap' }}>
        {!game.phonics && (
          <Box aria-hidden sx={{ minWidth: 60, height: 60, px: 1, borderRadius: '18px', display: 'grid', placeItems: 'center', bgcolor: violet.main, color: violet.onMain, fontFamily: fonts.display, fontWeight: 700, fontSize: '2.2rem' }}>
            {round.targetShown}
          </Box>
        )}
        <Typography key={`${game.number}`} variant="h3" component="p" sx={{ fontSize: { xs: '1.35rem', md: '1.7rem' }, color: violet.text, animation: 'kl-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
          {catcherPrompt(round, game.phonics)}
        </Typography>
        <RoundIconButton label="Hear it again" world="violet" size={52} disabled={!settings.speechEnabled} onClick={() => speakRound(game)}>
          <VolumeUpRounded />
        </RoundIconButton>
      </Box>

      {isFalling ? (
        <Box
          role="group"
          aria-label="Falling letters"
          sx={{
            position: 'relative',
            height: { xs: 380, md: 440 },
            overflow: 'hidden',
            borderRadius: '32px',
            border: `3px solid ${alpha(violet.main, 0.3)}`,
            background: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, #221E4A, #2B2660)' : 'linear-gradient(180deg, #EFEAFF, #FFFFFF)',
          }}
        >
          {round.choices.map((choice, index) => {
            const lane = (index + 0.5) / round.choices.length;
            const y = game.caught ? 0.4 : fallY(elapsed, profile.fallSpeed * (reduced ? 0.6 : 1), (index * 0.37) % 1);
            return letterButton(choice, index, {
              position: 'absolute',
              left: `${lane * 100}%`,
              top: `${y * 100}%`,
              transform: 'translateX(-50%)',
              width: { xs: 76, md: 96 },
              height: { xs: 76, md: 96 },
            });
          })}
          {paused && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.background.default, 0.75) }}>
              <Button variant="contained" size="large" startIcon={<PlayArrowRounded />} onClick={() => setPaused(false)} sx={{ fontSize: '1.3rem' }}>Keep playing</Button>
            </Box>
          )}
        </Box>
      ) : (
        <Box role="group" aria-label="Letters" sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: { xs: 1.5, md: 2 }, maxWidth: 640, mx: 'auto' }}>
          {round.choices.map((choice, index) => letterButton(choice, index, { aspectRatio: '1 / 1', minHeight: 88 }))}
        </Box>
      )}

      {game.caught && (
        <Box sx={{ mt: 2.5, p: 2, borderRadius: '24px', bgcolor: green.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap', animation: 'kl-rise-in 300ms ease-out both' }}>
          <Illustration emoji={info.emoji} size="3rem" />
          <Typography variant="h4" component="p" aria-hidden sx={{ color: green.text }}>
            {round.target} {round.target.toLowerCase()} is for {info.word}!
          </Typography>
          <Button variant="contained" color="success" endIcon={<NavigateNext />} onClick={goNext} sx={{ fontSize: '1.1rem', px: 3 }}>
            Next Letter
          </Button>
        </Box>
      )}
      <ScreenReaderStatus message={status} />
      <LevelUpBanner change={endless.lastChange} world="violet" />
      <Confetti fire={celebrate} />
    </Page>
  );
}
