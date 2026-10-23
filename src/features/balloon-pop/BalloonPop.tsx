import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, ButtonBase, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { PauseRounded, PlayArrowRounded, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import ActivityCard from '../../components/ui/ActivityCard';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Confetti from '../../components/ui/Confetti';
import { useWorld } from '../../components/ui/world';
import { fonts, type WorldKey } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playError, playNote, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { prefersReducedMotion } from '../learning-games/motion';
import PillPicker from '../../components/ui/PillPicker';
import { difficultyOptions } from '../learning-games/difficulty';
import { useEndlessLevel } from '../learning-games/useEndlessLevel';
import LevelUpBanner from '../learning-games/LevelUpBanner';
import EndlessControls from '../learning-games/EndlessControls';
import {
  balloonColors, balloonStars, colorIndex, createBalloonGame, popBalloon, stepBalloons, targetPhrase, valuePhrase, withLevel,
  type BalloonGame, type BalloonMode,
} from './engine';

type Status = 'menu' | 'playing' | 'paused' | 'done';

const modes: { mode: BalloonMode; title: string; subtitle: string; emoji: string; world: WorldKey }[] = [
  { mode: 'letters', title: 'Letter Balloons', subtitle: 'Pop the letter you hear!', emoji: '🔤', world: 'green' },
  { mode: 'numbers', title: 'Number Balloons', subtitle: 'Find and pop the number!', emoji: '🔢', world: 'sun' },
  { mode: 'colors', title: 'Colour Balloons', subtitle: 'Pop every balloon of one colour!', emoji: '🎨', world: 'pink' },
];

interface Burst {
  id: number;
  x: number;
  y: number;
  color: string;
}

function BalloonShape({ fill, dark }: { fill: string; dark: string }) {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%" aria-hidden focusable="false" style={{ display: 'block', overflow: 'visible' }}>
      <path d="M50 98 C 44 112, 58 120, 48 140" stroke="#8E9AB1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="48" rx="41" ry="47" fill={fill} />
      <ellipse cx="50" cy="52" rx="41" ry="43" fill={dark} opacity="0.18" />
      <ellipse cx="50" cy="46" rx="39" ry="44" fill={fill} />
      <path d="M43 93 L57 93 L50 102 Z" fill={dark} />
      <ellipse cx="33" cy="28" rx="8" ry="15" fill="#FFFFFF" opacity="0.38" transform="rotate(-28 33 28)" />
    </svg>
  );
}

export default function BalloonPop() {
  const theme = useTheme();
  const navigate = useNavigate();
  const sky = useWorld('blue');
  const { say, sound, settings } = useGameFeedback();
  const incrementGamesCompleted = useAppStore((s) => s.incrementGamesCompleted);
  const endless = useEndlessLevel('balloons', settings.gameDifficulty);

  const [status, setStatus] = useState<Status>('menu');
  const [game, setGame] = useState<BalloonGame | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [wobbling, setWobbling] = useState<number[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [celebrate, setCelebrate] = useState(0);
  const [clock, setClock] = useState(0);
  const gameRef = useRef<BalloonGame | null>(null);
  const reduced = prefersReducedMotion(settings.reducedMotion);

  const announceTarget = useCallback((next: BalloonGame) => {
    const phrase = targetPhrase(next.mode, next.target);
    setAnnouncement(phrase);
    say(phrase);
  }, [say]);

  const start = (mode: BalloonMode) => {
    const next = createBalloonGame(mode, endless.begin());
    gameRef.current = next;
    setGame(next);
    setBursts([]);
    setWobbling([]);
    setStatus('playing');
    announceTarget(next);
  };

  useEffect(() => {
    if (status !== 'playing') return undefined;
    let frame = 0;
    let last = performance.now();
    const speed = reduced ? 0.6 : 1;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const current = gameRef.current;
      if (current) {
        const next = stepBalloons(current, dt * speed);
        gameRef.current = next;
        setGame(next);
        setClock((value) => value + dt);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const onHidden = () => {
      if (document.hidden) setStatus('paused');
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [status, reduced]);

  const handlePop = (id: number) => {
    const current = gameRef.current;
    if (!current || status !== 'playing') return;
    const outcome = popBalloon(current, id);
    // A finished target counts toward the endless level; the sky follows the new level.
    const after = outcome.targetDone ? endless.record(outcome.firstTry) : null;
    const nextGame = after ? withLevel(outcome.game, after.level) : outcome.game;
    gameRef.current = nextGame;
    setGame(nextGame);
    const balloon = outcome.balloon;
    if (!balloon) return;

    if (outcome.result === 'wrong') {
      sound((v) => playError(v * 0.25));
      setWobbling((ids) => [...ids, id]);
      window.setTimeout(() => setWobbling((ids) => ids.filter((item) => item !== id)), 450);
      const hint = `That is ${valuePhrase(current.mode, balloon.value)}. ${targetPhrase(current.mode, current.target)}`;
      setAnnouncement(hint);
      say(hint);
      return;
    }

    const color = balloonColors[balloon.color];
    setBursts((items) => [...items, { id: balloon.id, x: balloon.x, y: balloon.y, color: color.fill }]);
    window.setTimeout(() => setBursts((items) => items.filter((item) => item.id !== balloon.id)), 500);
    sound((v) => playNote(880 + outcome.game.targetPops * 110, 0.12, v * 0.28, 'triangle'));

    if (outcome.newTarget) {
      sound((v) => playConfirmation(v * 0.25));
      setCelebrate((count) => count + 1);
      if (after?.change === 'up') {
        const phrase = `Level up! Level ${after.level}! ${targetPhrase(nextGame.mode, nextGame.target)}`;
        setAnnouncement(phrase);
        say(phrase);
      } else {
        announceTarget(nextGame);
      }
      return;
    }
    say(current.mode === 'colors' ? 'Pop!' : balloon.value);
  };

  /** The game never ends by itself: the child stops when they like. */
  const finish = () => {
    const current = gameRef.current;
    if (current && current.pops > 0) incrementGamesCompleted();
    setStatus('done');
    setCelebrate((count) => count + 1);
    sound((v) => playSuccess(v * 0.3));
    say(current && current.pops > 0 ? `Hooray! You popped ${current.pops} balloons and reached level ${endless.level}!` : 'See you next time!');
  };

  if (status === 'menu' || !game) {
    return (
      <Page>
        <PageHero world="blue" title="Balloon Pop" subtitle="Listen, look, and pop the right balloons!" emoji="🎈" />
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Box data-testid="endless-level" sx={{ mb: 2, mx: 'auto', maxWidth: 520, p: 1.5, borderRadius: '20px', bgcolor: sky.tint, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.5rem', color: sky.text }}>Level {endless.planned}</Typography>
            <Typography sx={{ fontWeight: 700 }}>The levels never end. Finish 3 balloons in a row with no wrong pops to go up a level!</Typography>
          </Box>
          <Typography variant="h4" component="h2" sx={{ mb: 1.25, fontSize: '1.15rem' }}>Start from</Typography>
          <PillPicker value={endless.difficulty} options={difficultyOptions} onChange={endless.pickDifficulty} world="blue" ariaLabel="Game level" />
        </Box>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {modes.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.mode}>
              <ActivityCard world={item.world} emoji={item.emoji} title={item.title} subtitle={item.subtitle} delay={index * 60} onClick={() => start(item.mode)} />
            </Grid>
          ))}
        </Grid>
      </Page>
    );
  }

  if (status === 'done') {
    return (
      <GameResults
        stars={balloonStars(game)}
        message={`You popped ${game.pops} balloons and reached Level ${endless.level}!`}
        celebrate={celebrate}
        onPlayAgain={() => start(game.mode)}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  const targetColor = game.mode === 'colors' ? balloonColors[colorIndex(game.target)] : null;
  const paused = status === 'paused';

  return (
    <Page maxWidth={960}>
      <GameHeader
        title="Balloon Pop"
        emoji="🎈"
        world="blue"
        backLabel="Back"
        onBack={() => setStatus('menu')}
        score={game.pops}
        scoreLabel={`${game.pops} balloons popped`}
        actions={(
          <>
            <RoundIconButton label={paused ? 'Keep playing' : 'Pause'} world="blue" filled={paused} onClick={() => setStatus(paused ? 'playing' : 'paused')}>
              {paused ? <PlayArrowRounded /> : <PauseRounded />}
            </RoundIconButton>
            <EndlessControls level={endless.level} world="blue" onFinish={finish} />
          </>
        )}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          mb: 1.5,
          px: 2,
          py: 1.25,
          borderRadius: '24px',
          bgcolor: sky.tint,
          flexWrap: 'wrap',
        }}
      >
        {targetColor ? (
          <Box aria-hidden sx={{ width: 40, height: 54 }}>
            <BalloonShape fill={targetColor.fill} dark={targetColor.dark} />
          </Box>
        ) : (
          <Box
            aria-hidden
            sx={{ minWidth: 56, height: 56, px: 1, borderRadius: '18px', display: 'grid', placeItems: 'center', bgcolor: sky.main, color: sky.onMain, fontFamily: fonts.display, fontWeight: 700, fontSize: '2rem' }}
          >
            {game.target}
          </Box>
        )}
        <Typography key={game.target} variant="h3" component="p" sx={{ fontSize: { xs: '1.35rem', md: '1.7rem' }, color: sky.text, animation: 'kl-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
          {targetPhrase(game.mode, game.target)}
        </Typography>
        <RoundIconButton label="Say it again" world="blue" size={48} disabled={!settings.speechEnabled} onClick={() => say(targetPhrase(game.mode, game.target))}>
          <VolumeUpRounded />
        </RoundIconButton>
      </Box>

      <Box
        role="group"
        aria-label="Balloon sky"
        sx={{
          position: 'relative',
          height: { xs: 440, sm: 480, md: 520 },
          overflow: 'hidden',
          borderRadius: { xs: '28px', md: '36px' },
          border: `3px solid ${alpha(sky.main, 0.35)}`,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, #1B2C55 0%, #24386B 70%, #2D4A3A 100%)`
            : `linear-gradient(180deg, #BFE3FF 0%, #E6F4FF 70%, #D7F5E3 100%)`,
          touchAction: 'manipulation',
          userSelect: 'none',
        }}
      >
        {[{ left: '8%', top: '12%', w: 110 }, { left: '62%', top: '22%', w: 140 }, { left: '30%', top: '48%', w: 90 }].map((cloud) => (
          <Box
            key={cloud.left}
            aria-hidden
            sx={{ position: 'absolute', left: cloud.left, top: cloud.top, width: cloud.w, height: cloud.w * 0.38, borderRadius: '999px', bgcolor: alpha('#FFFFFF', theme.palette.mode === 'dark' ? 0.08 : 0.7) }}
          />
        ))}

        {game.balloons.map((balloon) => {
          const color = balloonColors[balloon.color];
          const sway = reduced ? 0 : Math.sin(clock * 1.6 + balloon.sway) * 10;
          const label = game.mode === 'colors' ? `${color.name} balloon` : `Balloon with ${valuePhrase(game.mode, balloon.value)}`;
          return (
            <ButtonBase
              key={balloon.id}
              aria-label={label}
              disabled={paused}
              onPointerDown={(event) => {
                event.preventDefault();
                handlePop(balloon.id);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handlePop(balloon.id);
                }
              }}
              sx={{
                position: 'absolute',
                left: `${balloon.x * 100}%`,
                top: `${balloon.y * 100}%`,
                width: { xs: 78, sm: 92, md: 104 },
                aspectRatio: '100 / 140',
                transform: `translate(calc(-50% + ${sway}px), -50%)`,
                borderRadius: '50% 50% 45% 45%',
                display: 'block',
                filter: `drop-shadow(0 6px 6px ${alpha('#000000', 0.15)})`,
                '&.Mui-focusVisible': { outline: `4px solid ${theme.palette.text.primary}`, outlineOffset: 2 },
              }}
            >
              <Box sx={{ width: '100%', height: '100%', animation: wobbling.includes(balloon.id) ? 'kl-shake 420ms ease-in-out' : 'none' }}>
                <BalloonShape fill={color.fill} dark={color.dark} />
                {game.mode !== 'colors' && (
                  <Box
                    component="span"
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '33%',
                      transform: 'translateY(-50%)',
                      textAlign: 'center',
                      fontFamily: fonts.display,
                      fontWeight: 700,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      lineHeight: 1,
                      color: color.text,
                      textShadow: `0 2px 0 ${alpha(color.dark, 0.5)}`,
                    }}
                  >
                    {balloon.value}
                  </Box>
                )}
              </Box>
            </ButtonBase>
          );
        })}

        {bursts.map((burst) => (
          <Box
            key={burst.id}
            aria-hidden
            sx={{
              position: 'absolute',
              left: `${burst.x * 100}%`,
              top: `${burst.y * 100}%`,
              width: 110,
              height: 110,
              pointerEvents: 'none',
              borderRadius: '50%',
              border: `6px dotted ${burst.color}`,
              animation: 'kl-burst 480ms ease-out both',
            }}
          />
        ))}

        {paused && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.background.default, 0.7) }}>
            <ButtonBase
              onClick={() => setStatus('playing')}
              sx={{ px: 4, py: 2, borderRadius: '999px', bgcolor: sky.main, color: sky.onMain, fontFamily: fonts.display, fontWeight: 700, fontSize: '1.5rem', gap: 1 }}
            >
              <PlayArrowRounded sx={{ fontSize: 36 }} /> Keep playing
            </ButtonBase>
          </Box>
        )}
      </Box>

      <Box aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {announcement}
      </Box>
      <LevelUpBanner change={endless.lastChange} world="blue" />
      <Confetti fire={celebrate} />
    </Page>
  );
}
