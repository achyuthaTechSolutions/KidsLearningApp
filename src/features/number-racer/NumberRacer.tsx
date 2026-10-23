import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowBackRounded, ArrowForwardRounded, PauseRounded, PlayArrowRounded, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Confetti from '../../components/ui/Confetti';
import { tactile, useWorld } from '../../components/ui/world';
import { fonts, worlds } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playError, playNote, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { isEditableTarget, prefersReducedMotion } from '../learning-games/motion';
import LevelUpBanner from '../learning-games/LevelUpBanner';
import EndlessControls from '../learning-games/EndlessControls';
import { useEndlessLevel } from '../learning-games/useEndlessLevel';
import {
  CAR_LINE, LANES, createRace, explanation, gateY, passGate, questionSpoken, questionText, raceStars, steer,
  type Race,
} from './engine';

const carColors = [
  { value: 'red' as const, label: 'Red car', body: worlds.red.main, dark: worlds.red.dark },
  { value: 'blue' as const, label: 'Blue car', body: worlds.blue.main, dark: worlds.blue.dark },
  { value: 'yellow' as const, label: 'Yellow car', body: worlds.sun.main, dark: worlds.sun.dark },
  { value: 'green' as const, label: 'Green car', body: worlds.green.main, dark: worlds.green.dark },
];
type CarColor = (typeof carColors)[number]['value'];

/** The car seen from above, so it drives up the road. */
function Car({ color, size = 64 }: { color: CarColor; size?: number }) {
  const { body, dark } = carColors.find((item) => item.value === color)!;
  return (
    <Box component="svg" viewBox="0 0 40 64" width={size * 0.62} height={size} aria-hidden sx={{ display: 'block', filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.35))' }}>
      <rect x="2" y="10" width="6" height="12" rx="2" fill="#20232B" />
      <rect x="32" y="10" width="6" height="12" rx="2" fill="#20232B" />
      <rect x="2" y="42" width="6" height="12" rx="2" fill="#20232B" />
      <rect x="32" y="42" width="6" height="12" rx="2" fill="#20232B" />
      <rect x="5" y="4" width="30" height="56" rx="12" fill={body} />
      <rect x="9" y="16" width="22" height="12" rx="4" fill="#CFE8FF" />
      <rect x="10" y="40" width="20" height="8" rx="3" fill="#CFE8FF" opacity="0.8" />
      <rect x="12" y="30" width="16" height="8" rx="3" fill={dark} />
      <circle cx="11" cy="6" r="2.5" fill="#FFF3B0" />
      <circle cx="29" cy="6" r="2.5" fill="#FFF3B0" />
    </Box>
  );
}

export default function NumberRacer() {
  const theme = useTheme();
  const navigate = useNavigate();
  const red = useWorld('red');
  const green = useWorld('green');
  const sun = useWorld('sun');
  const { say, sound, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const reduced = prefersReducedMotion(settings.reducedMotion);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const endless = useEndlessLevel('racer', settings.gameDifficulty);
  const [color, setColor] = useState<CarColor>('red');
  const [race, setRace] = useState<Race | null>(null);
  const [lane, setLane] = useState(1);
  const [elapsed, setElapsedState] = useState(0);
  const elapsedRef = useRef(0);
  const setElapsed = (seconds: number) => {
    elapsedRef.current = seconds;
    setElapsedState(seconds);
  };
  const [paused, setPaused] = useState(false);
  /** Shown while the car passes a gate, before the next one comes. */
  const [feedback, setFeedback] = useState<{ result: 'right' | 'wrong'; lane: number; correctLane: number; text: string } | null>(null);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);
  const raceRef = useRef<Race | null>(null);
  const laneRef = useRef(1);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // On a phone the road can start below the fold, with the car under the bottom menu.
  const controlsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase === 'play') controlsRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [phase]);

  const update = (next: Race) => {
    raceRef.current = next;
    setRace(next);
  };

  const announce = (next: Race) => {
    const spoken = questionSpoken(next.gate.question);
    setStatus(`${spoken} Lanes: ${next.gate.answers.join(', ')}.`);
    say(spoken);
  };

  const start = () => {
    window.clearTimeout(timer.current);
    const next = createRace(endless.begin());
    update(next);
    laneRef.current = 1;
    setLane(1);
    setElapsed(0);
    setFeedback(null);
    setPaused(false);
    setPhase('play');
    announce(next);
  };

  const moveTo = (target: number) => {
    if (!raceRef.current || feedback || paused) return;
    const next = Math.min(LANES - 1, Math.max(0, target));
    if (next === laneRef.current) return;
    laneRef.current = next;
    setLane(next);
    sound((v) => playNote(520 + next * 80, 0.06, v * 0.15, 'triangle'));
  };

  // The car reaches the gate: check the lane, show why, then send the next gate.
  const arrive = () => {
    const current = raceRef.current;
    if (!current) return;
    // A right answer counts toward the endless level first, so the next gate is made for the new level.
    const right = laneRef.current === current.gate.correctLane;
    const after = right ? endless.record(current.misses === 0) : null;
    const { race: next, result } = passGate(current, laneRef.current, after?.level ?? current.level);
    const why = explanation(current.gate.question);
    const text = result === 'right' ? `Zoom! ${why}` : `Oops! The answer is ${current.gate.question.answer}. ${why} Try again!`;
    setFeedback({ result, lane: laneRef.current, correctLane: current.gate.correctLane, text });
    const levelUp = after?.change === 'up' ? ` Level up! Level ${after.level}!` : '';
    setStatus(text + levelUp);
    say(text + levelUp);
    if (result === 'right') {
      setCelebrate((count) => count + 1);
      sound((v) => playConfirmation(v * 0.3));
    } else {
      sound((v) => playError(v * 0.2));
    }
    update(next);
    timer.current = window.setTimeout(() => {
      setFeedback(null);
      setElapsed(0);
      announce(next);
    }, result === 'right' ? (levelUp ? 2600 : 1600) : 2600);
  };

  /** The race never ends by itself: the child stops when they like. */
  const finish = () => {
    const current = raceRef.current;
    window.clearTimeout(timer.current);
    setFeedback(null);
    if (current && current.passed > 0) completeGameRound('racer', `level-${endless.level}`);
    setPhase('done');
    sound((v) => playSuccess(v * 0.3));
    say(current && current.passed > 0 ? `Great driving! You reached level ${endless.level}.` : 'See you next time!');
  };

  // One animation loop drives the gate down the road. It stops while paused, while
  // showing feedback, or when the app is hidden.
  const driving = phase === 'play' && !paused && !feedback && Boolean(race);
  const arriveRef = useRef(arrive);
  useEffect(() => {
    arriveRef.current = arrive;
  });
  useEffect(() => {
    if (!driving) return undefined;
    let frame = 0;
    let last = performance.now();
    // Pausing keeps the gate where it is: carry on from the time already driven.
    let seconds = elapsedRef.current;
    const tick = (now: number) => {
      seconds += Math.min(0.05, (now - last) / 1000);
      last = now;
      setElapsed(seconds);
      const current = raceRef.current;
      if (current && gateY(seconds, current, reduced) >= CAR_LINE) {
        arriveRef.current();
        return;
      }
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
  }, [driving, reduced]);

  // Arrow keys (or A and D) steer; 1, 2, and 3 pick a lane.
  const moveRef = useRef(moveTo);
  useEffect(() => {
    moveRef.current = moveTo;
  });
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') moveRef.current(steer(laneRef.current, -1));
      else if (key === 'arrowright' || key === 'd') moveRef.current(steer(laneRef.current, 1));
      else if (['1', '2', '3'].includes(key)) moveRef.current(Number(key) - 1);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Number Racer"
        subtitle="Steer into the lane with the right answer!"
        emoji="🏁"
        world="red"
        steps={[
          { emoji: '👀', text: 'Read the sign. It asks a number question.' },
          { emoji: '👆', text: 'Tap a lane, or use the arrows, to steer your car.' },
          { emoji: '🏁', text: 'Drive through the gate with the right answer!' },
        ]}
        difficulty={endless.difficulty}
        onDifficulty={endless.pickDifficulty}
        endlessLevel={endless.planned}
        onStart={start}
        onHear={() => say('Read the sign, then steer your car into the lane with the right answer. Tap a lane or use the arrows.')}
        startLabel="Start the race!"
      >
        <PillPicker value={color} options={carColors.map(({ value, label }) => ({ value, label }))} onChange={setColor} world="red" ariaLabel="Car colour" />
        <Box aria-hidden sx={{ display: 'flex', justifyContent: 'center' }}><Car color={color} size={84} /></Box>
      </GameIntro>
    );
  }

  if (phase === 'done' && race) {
    return (
      <GameResults
        stars={raceStars(race)}
        message={`You reached Level ${endless.level} and drove through ${race.passed} gates! ${race.firstTry} on the first try.`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  if (!race) return null;
  const { gate } = race;
  const y = feedback ? CAR_LINE : gateY(elapsed, race, reduced);
  const glow = race.misses >= 2;
  const question = gate.question;

  return (
    <Page maxWidth={760}>
      <GameHeader
        title="Number Racer"
        emoji="🏁"
        world="red"
        backLabel="Back"
        onBack={() => { window.clearTimeout(timer.current); setPhase('intro'); }}
        score={race.passed}
        scoreLabel={`${race.passed} gates passed`}
        actions={(
          <>
            <RoundIconButton label={paused ? 'Keep driving' : 'Pause'} world="red" filled={paused} onClick={() => setPaused(!paused)}>
              {paused ? <PlayArrowRounded /> : <PauseRounded />}
            </RoundIconButton>
            <EndlessControls level={endless.level} world="red" onFinish={finish} />
          </>
        )}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1.5, px: 2, py: 1, borderRadius: '24px', bgcolor: sun.tint, border: `3px solid ${sun.main}` }}>
        {question.kind === 'count' && (
          <Box aria-label={`${question.answer} to count`} role="img" sx={{ display: 'flex', gap: 0.5 }}>
            {Array.from({ length: question.answer }, (_, i) => <Illustration key={i} emoji={question.emoji} size="2rem" />)}
          </Box>
        )}
        <Typography data-testid="race-question" variant="h3" component="p" sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, color: sun.text, fontFamily: fonts.display }}>
          {questionText(question)}
        </Typography>
        <RoundIconButton label="Hear it again" world="sun" size={48} disabled={!settings.speechEnabled} onClick={() => say(questionSpoken(question))}>
          <VolumeUpRounded />
        </RoundIconButton>
      </Box>

      <Box
        role="group"
        aria-label="Road with three lanes"
        sx={{
          position: 'relative',
          // Short enough on a phone that the steer buttons stay above the bottom menu.
          height: { xs: 'clamp(260px, 38vh, 400px)', md: 460 },
          borderRadius: '28px',
          overflow: 'hidden',
          bgcolor: '#3A3F4B',
          border: `6px solid ${green.main}`,
          animation: feedback?.result === 'wrong' ? 'kl-shake 420ms ease-in-out' : 'none',
        }}
      >
        {[1, 2].map((divider) => (
          <Box
            key={divider}
            aria-hidden
            sx={{
              position: 'absolute', top: 0, bottom: 0, left: `${(divider / LANES) * 100}%`, width: 6, ml: '-3px',
              backgroundImage: 'repeating-linear-gradient(180deg, #F5F5F0 0 26px, transparent 26px 52px)',
              backgroundSize: '6px 52px',
              animation: driving ? `kl-road ${race.slow > 1 ? 0.9 : 0.6}s linear infinite` : 'none',
            }}
          />
        ))}

        {gate.answers.map((answer, index) => {
          const isRight = index === gate.correctLane;
          const passed = feedback && index === feedback.lane;
          const tone = feedback ? (isRight ? green : passed ? red : null) : glow && isRight ? green : null;
          return (
            <Box
              key={`${race.passed}-${race.misses}-${index}`}
              aria-hidden
              sx={{
                position: 'absolute', top: `${y * 100}%`, left: `${(index / LANES) * 100}%`, width: `${100 / LANES}%`,
                transform: 'translateY(-100%)', display: 'flex', justifyContent: 'center', pointerEvents: 'none',
              }}
            >
              <Box data-glow={glow && isRight && !feedback ? 'true' : undefined} sx={{
                minWidth: 72, px: 1.5, py: 0.5, borderRadius: '18px', textAlign: 'center',
                bgcolor: tone ? tone.main : '#FFFFFF', color: tone ? tone.onMain : '#2B2D42',
                border: '4px solid #2B2D42', fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '2.2rem', md: '2.6rem' }, lineHeight: 1.1,
                boxShadow: glow && isRight && !feedback ? `0 0 0 6px ${alpha(green.main, 0.45)}` : 'none',
              }}
              >
                {answer}
              </Box>
            </Box>
          );
        })}

        {gate.answers.map((answer, index) => (
          <ButtonBase
            key={`lane-${index}`}
            aria-label={`Lane ${index + 1}: ${answer}`}
            aria-pressed={lane === index}
            disabled={Boolean(feedback) || paused}
            onClick={() => moveTo(index)}
            sx={{ position: 'absolute', top: 0, bottom: 0, left: `${(index / LANES) * 100}%`, width: `${100 / LANES}%`, '&:focus-visible': { outline: `4px solid ${sun.main}`, outlineOffset: -6 } }}
          />
        ))}

        <Box
          data-testid="car"
          data-lane={lane}
          aria-hidden
          sx={{
            position: 'absolute', top: `${CAR_LINE * 100}%`, left: `${((lane + 0.5) / LANES) * 100}%`, transform: 'translate(-50%, 4px)',
            transition: reduced ? 'none' : 'left 180ms ease-out', pointerEvents: 'none',
          }}
        >
          <Car color={color} size={72} />
        </Box>

        {paused && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.background.default, 0.75) }}>
            <Button variant="contained" size="large" startIcon={<PlayArrowRounded />} onClick={() => setPaused(false)} sx={{ fontSize: '1.3rem' }}>Keep driving</Button>
          </Box>
        )}
      </Box>

      <Box ref={controlsRef} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1.5, scrollMarginBottom: '104px' }}>
        <ButtonBase aria-label="Steer left" disabled={Boolean(feedback) || paused} onClick={() => moveTo(steer(lane, -1))} sx={[tactile(theme, red, { state: 'selected', depth: 6, radius: 24 }), { minHeight: 64, gap: 1, fontFamily: fonts.display, fontWeight: 700, fontSize: '1.2rem', '&.Mui-disabled': { opacity: 0.5, color: red.onMain } }]}>
          <ArrowBackRounded sx={{ fontSize: 34 }} aria-hidden />Left
        </ButtonBase>
        <ButtonBase aria-label="Steer right" disabled={Boolean(feedback) || paused} onClick={() => moveTo(steer(lane, 1))} sx={[tactile(theme, red, { state: 'selected', depth: 6, radius: 24 }), { minHeight: 64, gap: 1, fontFamily: fonts.display, fontWeight: 700, fontSize: '1.2rem', '&.Mui-disabled': { opacity: 0.5, color: red.onMain } }]}>
          Right<ArrowForwardRounded sx={{ fontSize: 34 }} aria-hidden />
        </ButtonBase>
      </Box>

      {feedback && (
        <Box data-testid="race-feedback" sx={{ mt: 1.5, p: 2, borderRadius: '20px', bgcolor: feedback.result === 'right' ? green.tint : red.tint, textAlign: 'center', animation: 'kl-rise-in 300ms ease-out both' }}>
          <Typography variant="h4" component="p" sx={{ color: feedback.result === 'right' ? green.text : red.text, fontSize: { xs: '1.2rem', md: '1.4rem' } }}>{feedback.text}</Typography>
        </Box>
      )}
      <ScreenReaderStatus message={status} />
      <LevelUpBanner change={endless.lastChange} world="red" />
      <Confetti fire={celebrate} />
    </Page>
  );
}
