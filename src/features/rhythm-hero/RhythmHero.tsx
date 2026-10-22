import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, ButtonBase, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { HearingRounded, NavigateNext, ReplayRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import Confetti from '../../components/ui/Confetti';
import { resolveWorld, tactile, useWorld } from '../../components/ui/world';
import { fonts, type WorldKey } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { isAudioAvailable, playDrum, playSuccess, playXylophone } from '../../services/audio';
import { cancelSpeech } from '../../services/speech';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { isEditableTarget } from '../learning-games/motion';
import type { GameDifficulty } from '../learning-games/difficulty';
import { PATTERNS_PER_ROUND, checkRhythm, createRhythmPlayer, generateRhythm, rhythmProfiles, type Beat, type Pad, type Tap } from './rhythm';

type Stage = 'ready' | 'playing' | 'your-turn' | 'success' | 'retry';

const pads: Record<Pad, { name: string; emoji: string; world: WorldKey; key: string }> = {
  drum: { name: 'Drum', emoji: '🥁', world: 'red', key: '1' },
  clap: { name: 'Clap', emoji: '👏', world: 'blue', key: '2' },
  bell: { name: 'Bell', emoji: '🔔', world: 'sun', key: '3' },
};
const modeOptions = [
  { value: 'practice' as const, label: 'Practice: just the order', emoji: '🐢' },
  { value: 'timed' as const, label: 'Keep the beat', emoji: '🎵' },
];

type Lit = { pad: Pad; index: number; id: number } | null;
let flashCount = 0;

/** Lights a pad for a moment. Each light clears itself unless a newer one replaced it. */
function lightPad(setLit: (update: Lit | ((current: Lit) => Lit)) => void, pad: Pad, index: number) {
  flashCount += 1;
  const id = flashCount;
  setLit({ pad, index, id });
  window.setTimeout(() => setLit((current) => (current?.id === id ? null : current)), 260);
}

/** Reads the latest parent settings at the moment a pad sounds. */
function soundFor(pad: Pad) {
  const { soundEnabled, volume } = useAppStore.getState().settings;
  if (soundEnabled && volume > 0) playPad(pad, volume);
}

function playPad(pad: Pad, volume: number) {
  try {
    if (pad === 'drum') playDrum('kick', volume * 0.8);
    else if (pad === 'clap') playDrum('clap', volume * 0.8);
    else playXylophone(1046.5, volume * 0.6);
  } catch {
    // Sound is a bonus here: the pads still light up.
  }
}

export default function RhythmHero() {
  const theme = useTheme();
  const navigate = useNavigate();
  const red = useWorld('red');
  const green = useWorld('green');
  const orange = useWorld('orange');
  const { say, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [mode, setMode] = useState<'practice' | 'timed'>(settings.gameDifficulty === 'beginner' ? 'practice' : 'timed');
  const [pattern, setPattern] = useState<Beat[]>([]);
  const [stage, setStage] = useState<Stage>('ready');
  const [taps, setTaps] = useState<Tap[]>([]);
  const [lit, setLit] = useState<Lit>(null);
  const [done, setDone] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');
  const [celebrate, setCelebrate] = useState(0);
  const flash = (pad: Pad, index: number) => lightPad(setLit, pad, index);

  const player = useMemo(() => createRhythmPlayer((beat, index) => {
    lightPad(setLit, beat.pad, index);
    soundFor(beat.pad);
  }), []);
  useEffect(() => () => player.stop(), [player]);

  const sound = soundFor;

  const profile = rhythmProfiles[difficulty];
  const soundOff = !settings.soundEnabled || settings.volume <= 0 || !isAudioAvailable();

  const listen = (target: Beat[] = pattern) => {
    cancelSpeech();
    setTaps([]);
    setStage('playing');
    setMessage('Listen and watch the pads…');
    player.play(target, profile.beatMs, () => {
      setStage('your-turn');
      setMessage('Your turn! Tap the pads in the same order.');
    });
  };

  const newPattern = () => {
    const next = generateRhythm(difficulty);
    setPattern(next);
    setAttempts(0);
    listen(next);
  };

  const start = () => {
    setDone(0);
    setFirstTry(0);
    setPhase('play');
    newPattern();
  };

  const tap = (pad: Pad) => {
    flash(pad, -1);
    sound(pad);
    if (stage !== 'your-turn') return;
    const next = [...taps, { pad, time: performance.now() }];
    setTaps(next);
    const result = checkRhythm(pattern, next, { timed: mode === 'timed', beatMs: profile.beatMs, tolerance: profile.tolerance });
    if (result.status === 'listening') return;
    if (result.status === 'match') {
      setStage('success');
      setDone((count) => count + 1);
      if (attempts === 0) setFirstTry((count) => count + 1);
      setCelebrate((count) => count + 1);
      const cheer = 'You got the rhythm!';
      setMessage(cheer);
      say(cheer);
      return;
    }
    setAttempts((count) => count + 1);
    setStage('retry');
    const hint = result.status === 'wrong-pad'
      ? `Beat ${result.index + 1} was the ${pads[pattern[result.index].pad].name.toLowerCase()}. Let's listen again!`
      : 'Right sounds! Now try to match the timing. Listen again.';
    setMessage(hint);
    say(hint);
  };

  const goNext = () => {
    if (done >= PATTERNS_PER_ROUND) {
      completeGameRound('rhythm', `${difficulty}-${mode}`);
      setPhase('done');
      setCelebrate((count) => count + 1);
      if (settings.soundEnabled) playSuccess(settings.volume * 0.3);
      say('You are a rhythm hero!');
      return;
    }
    newPattern();
  };

  // Number keys play the pads. One listener, reading the latest tap handler through a ref.
  const tapRef = useRef(tap);
  useEffect(() => {
    tapRef.current = tap;
  });
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;
      const pad = (Object.keys(pads) as Pad[]).find((item) => pads[item].key === event.key && profile.pads.includes(item));
      if (!pad) return;
      event.preventDefault();
      tapRef.current(pad);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, profile.pads]);

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Rhythm Hero"
        subtitle="Listen to the beat, then tap it back."
        emoji="🥁"
        world="red"
        steps={[
          { emoji: '👂', text: 'Listen and watch the pads light up.' },
          { emoji: '🥁', text: 'Tap the same pads in the same order.' },
          { emoji: '🐢', text: 'Practice mode only checks the order. No rush!' },
        ]}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onStart={start}
        onHear={() => say('Listen to the beat and watch the pads light up. Then tap the same pads in the same order.')}
      >
        <PillPicker value={mode} options={modeOptions} onChange={setMode} world="red" ariaLabel="Rhythm mode" />
        {soundOff && <Alert severity="info">Sound is off, so the pads will only light up. You can still play by watching!</Alert>}
      </GameIntro>
    );
  }

  if (phase === 'done') {
    return (
      <GameResults
        stars={firstTry >= PATTERNS_PER_ROUND - 1 ? 3 : firstTry >= 2 ? 2 : 1}
        message={`You copied ${PATTERNS_PER_ROUND} rhythms!`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  const listening = stage === 'playing';
  const unit = 44;

  return (
    <Page maxWidth={900}>
      <GameHeader
        title="Rhythm Hero"
        emoji="🥁"
        world="red"
        backLabel="Back"
        onBack={() => { player.stop(); setPhase('intro'); }}
        score={done}
        scoreLabel={`${done} rhythms copied`}
        progress={{ value: done, total: PATTERNS_PER_ROUND, label: `Rhythm ${Math.min(done + 1, PATTERNS_PER_ROUND)} of ${PATTERNS_PER_ROUND} · ${mode === 'timed' ? 'Keep the beat' : 'Practice'}` }}
      />

      <Box
        role="img"
        aria-label={`The rhythm: ${pattern.map((beat) => pads[beat.pad].name).join(', ')}`}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, p: 2, mb: 2, borderRadius: '24px', bgcolor: red.tint, overflowX: 'auto', minHeight: 84 }}
      >
        {pattern.map((beat, index) => {
          const gap = index === 0 ? 0 : (beat.at - pattern[index - 1].at) * unit;
          const played = listening ? lit?.index === index : index < taps.length;
          const w = resolveWorld(pads[beat.pad].world, theme.palette.mode);
          return (
            <Box key={index} aria-hidden sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {index > 0 && <Box sx={{ width: Math.max(8, gap - 36), height: 4, borderRadius: 2, bgcolor: alpha(red.main, 0.25) }} />}
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '1.6rem',
                  bgcolor: played ? w.main : 'background.paper',
                  border: `3px solid ${w.main}`,
                  transform: listening && lit?.index === index ? 'scale(1.2)' : 'none',
                  transition: 'transform 120ms, background-color 120ms',
                }}
              >
                <Illustration emoji={pads[beat.pad].emoji} />
              </Box>
            </Box>
          );
        })}
      </Box>

      <Typography variant="h3" component="p" sx={{ textAlign: 'center', fontSize: { xs: '1.3rem', md: '1.6rem' }, mb: 2, color: stage === 'success' ? green.text : stage === 'retry' ? orange.text : 'text.primary' }}>
        {message}
      </Typography>

      <Box role="group" aria-label="Rhythm pads" sx={{ display: 'grid', gridTemplateColumns: `repeat(${profile.pads.length}, 1fr)`, gap: 2, maxWidth: 640, mx: 'auto', mb: 3 }}>
        {profile.pads.map((pad) => {
          const info = pads[pad];
          const w = resolveWorld(info.world, theme.palette.mode);
          const active = lit?.pad === pad;
          return (
            <ButtonBase
              key={pad}
              aria-label={`${info.name} pad, key ${info.key}`}
              onPointerDown={(event) => { event.preventDefault(); tap(pad); }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  tap(pad);
                }
              }}
              sx={[
                tactile(theme, w, { state: 'selected', depth: 8, radius: 32 }),
                {
                  minHeight: { xs: 130, md: 160 },
                  flexDirection: 'column',
                  gap: 1,
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  touchAction: 'manipulation',
                  filter: active ? 'brightness(1.25)' : 'none',
                  transform: active ? 'translateY(4px) scale(0.98)' : 'none',
                  outline: active ? `5px solid ${alpha(w.main, 0.5)}` : 'none',
                },
              ]}
            >
              <Illustration emoji={info.emoji} size="56px" />
              {info.name}
              <Typography component="span" sx={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.85 }}>key {info.key}</Typography>
            </ButtonBase>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {(stage === 'ready' || stage === 'your-turn' || stage === 'retry') && (
          <Button variant="outlined" size="large" startIcon={stage === 'retry' ? <ReplayRounded /> : <HearingRounded />} onClick={() => listen()}>
            {stage === 'retry' ? 'Listen and try again' : 'Listen again'}
          </Button>
        )}
        {stage === 'success' && (
          <Button variant="contained" color="success" size="large" endIcon={<NavigateNext />} onClick={goNext} sx={{ fontSize: '1.1rem' }}>
            {done >= PATTERNS_PER_ROUND ? 'See Results' : 'Next Rhythm'}
          </Button>
        )}
      </Box>
      {soundOff && <Alert severity="info" sx={{ mt: 2 }}>Sound is off. Watch the pads light up, then copy them.</Alert>}
      <ScreenReaderStatus message={message} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
