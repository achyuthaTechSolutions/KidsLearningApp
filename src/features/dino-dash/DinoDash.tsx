import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  PlayArrowRounded, PauseRounded, ReplayRounded, KeyboardArrowUpRounded, KeyboardArrowDownRounded, EmojiEventsRounded,
} from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Illustration from '../../components/ui/Illustration';
import Confetti from '../../components/ui/Confetti';
import RoundIconButton from '../../components/ui/RoundIconButton';
import { tactile, useWorld } from '../../components/ui/world';
import { fonts, worlds, type WorldKey } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playError, playNote, playSuccess } from '../../services/audio';
import { cancelSpeech, speak } from '../../services/speech';
import { loadDinoRecord, saveDinoRecord, type DinoRecord } from '../../services/storage';
import {
  DINO_X, GROUND_Y, VIEW_HEIGHT, createGame, startGame, step,
  type GameEvent, type GameInput, type GameState, type GameStatus,
} from './engine';
import { dinoColors, drawGame, type Particle } from './draw';
import { themeForLevel } from './themes';

interface Summary {
  score: number;
  level: number;
  letters: number;
  newBest: boolean;
}

function viewFor(width: number) {
  const aspect = width >= 700 ? 2.7 : width >= 460 ? 2.1 : 1.5;
  return { cssW: width, cssH: Math.round(width / aspect), viewW: Math.round(VIEW_HEIGHT * aspect) };
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

interface HoldButtonProps {
  label: string;
  icon: ReactNode;
  world: WorldKey;
  onDown: () => void;
  onUp: () => void;
}

/** A big button that acts while held, for jumping and ducking on touch screens. */
function HoldButton({ label, icon, world, onDown, onUp }: HoldButtonProps) {
  const theme = useTheme();
  const w = useWorld(world);
  return (
    <ButtonBase
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onContextMenu={(e) => e.preventDefault()}
      sx={[
        tactile(theme, w, { state: 'selected', depth: 6, radius: 26 }),
        { flex: 1, minHeight: { xs: 72, md: 80 }, gap: 1, fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '1.3rem', md: '1.5rem' }, touchAction: 'none', userSelect: 'none' },
      ]}
    >
      {icon}
      {label}
    </ButtonBase>
  );
}

export default function DinoDash() {
  const theme = useTheme();
  const green = useWorld('green');
  const blue = useWorld('blue');
  const gold = useWorld('gold');
  const settings = useAppStore((s) => s.settings);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [record, setRecord] = useState<DinoRecord>(loadDinoRecord);
  const recordRef = useRef(record);
  useEffect(() => {
    recordRef.current = record;
  }, [record]);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [banner, setBanner] = useState<{ level: number; name: string; emoji: string } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [celebrate, setCelebrate] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(viewFor(800));
  const gameRef = useRef<GameState>(createGame(viewFor(800).viewW));
  const inputRef = useRef<GameInput>({ jumpHeld: false, jumpPressed: false, duckHeld: false });
  const particlesRef = useRef<Particle[]>([]);
  const bannerTimer = useRef<number | undefined>(undefined);

  const color = dinoColors.find((c) => c.id === record.color) ?? dinoColors[0];
  const colorRef = useRef(color);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  const sound = useCallback((play: (volume: number) => void) => {
    const current = settingsRef.current;
    if (current.soundEnabled && current.volume > 0) play(current.volume);
  }, []);

  const say = useCallback((text: string) => {
    const current = settingsRef.current;
    if (!current.speechEnabled) return;
    cancelSpeech();
    speak(text, { rate: current.speechRate });
  }, []);

  const burst = useCallback((x: number, y: number, colors: string[], count: number, spread = 220) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: -Math.random() * spread * 0.9,
        life: 0.5 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
        color: colors[i % colors.length],
      });
    }
  }, []);

  const handleEvents = useCallback((events: GameEvent[], game: GameState) => {
    const feetY = GROUND_Y - game.dino.lift;
    for (const event of events) {
      if (event.type === 'jump') {
        sound((v) => playNote(620, 0.12, v * 0.22, 'triangle'));
        burst(DINO_X + 24, GROUND_Y, ['rgba(255,255,255,0.9)', 'rgba(0,0,0,0.15)'], 6, 120);
      } else if (event.type === 'hit') {
        sound((v) => playError(v * 0.3));
        setAnnouncement(`Bump! ${event.livesLeft} ${event.livesLeft === 1 ? 'heart' : 'hearts'} left.`);
      } else if (event.type === 'letter') {
        sound((v) => playConfirmation(v * 0.3));
        burst(DINO_X + 30, feetY - 40, [worlds.sun.main, worlds.pink.main, worlds.blue.main, '#FFFFFF'], 16);
        say(event.letter);
        setAnnouncement(`You caught the letter ${event.letter}.`);
      } else if (event.type === 'heart') {
        sound((v) => playSuccess(v * 0.25));
        burst(DINO_X + 30, feetY - 40, [worlds.red.main, '#FFFFFF'], 14);
        setAnnouncement(`Extra heart! ${event.lives} hearts.`);
      } else if (event.type === 'levelUp') {
        const world = themeForLevel(event.level);
        sound((v) => playSuccess(v * 0.3));
        setBanner({ level: event.level, name: world.name, emoji: world.emoji });
        setCelebrate((count) => count + 1);
        window.clearTimeout(bannerTimer.current);
        bannerTimer.current = window.setTimeout(() => setBanner(null), 2400);
        say(`Level ${event.level}! ${world.name}!`);
        setAnnouncement(`Level ${event.level}, ${world.name}.`);
      } else if (event.type === 'gameOver') {
        const best = recordRef.current;
        const newBest = game.score > best.bestScore;
        const next: DinoRecord = {
          ...best,
          bestScore: Math.max(best.bestScore, game.score),
          bestLevel: Math.max(best.bestLevel, game.level),
        };
        saveDinoRecord(next);
        setRecord(next);
        setSummary({ score: game.score, level: game.level, letters: game.lettersCollected, newBest });
        setStatus('over');
        if (newBest) setCelebrate((count) => count + 1);
        say(newBest ? `New best score! You reached level ${game.level}!` : `Great run! You reached level ${game.level}!`);
        setAnnouncement(`Run over. Score ${game.score}, level ${game.level}.`);
      }
    }
  }, [burst, say, sound]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const resize = () => {
      const next = viewFor(Math.max(260, Math.floor(wrap.clientWidth)));
      viewRef.current = next;
      gameRef.current.viewWidth = next.viewW;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(next.cssW * dpr);
      canvas.height = Math.round(next.cssH * dpr);
      canvas.style.height = `${next.cssH}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const began = last;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const game = gameRef.current;
      const events = step(game, dt, inputRef.current);
      inputRef.current.jumpPressed = false;
      if (events.length) handleEvents(events, game);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 700 * dt;
        p.life -= dt;
        return p.life > 0;
      });

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const view = viewRef.current;
        const scale = canvas.width / view.viewW;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        drawGame(ctx, game, {
          theme: themeForLevel(game.level),
          color: colorRef.current,
          time: (now - began) / 1000,
          particles: particlesRef.current,
          showHud: game.status !== 'ready',
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(bannerTimer.current);
      cancelSpeech();
    };
  }, [handleEvents]);

  const begin = useCallback(() => {
    const game = createGame(viewRef.current.viewW);
    startGame(game);
    gameRef.current = game;
    inputRef.current = { jumpHeld: false, jumpPressed: false, duckHeld: false };
    particlesRef.current = [];
    setSummary(null);
    setBanner(null);
    setStatus('running');
    setAnnouncement(`Go! Level 1, ${themeForLevel(1).name}.`);
    sound((v) => playNote(523.25, 0.15, v * 0.25, 'triangle'));
  }, [sound]);

  const pause = useCallback(() => {
    const game = gameRef.current;
    if (game.status !== 'running') return;
    game.status = 'paused';
    inputRef.current = { jumpHeld: false, jumpPressed: false, duckHeld: false };
    setStatus('paused');
    setAnnouncement('Paused.');
  }, []);

  const resume = useCallback(() => {
    const game = gameRef.current;
    if (game.status !== 'paused') return;
    startGame(game);
    setStatus('running');
  }, []);

  const pressJump = useCallback(() => {
    const game = gameRef.current;
    if (game.status === 'ready' || game.status === 'over') {
      begin();
      return;
    }
    if (game.status === 'paused') {
      resume();
      return;
    }
    if (!inputRef.current.jumpHeld) inputRef.current.jumpPressed = true;
    inputRef.current.jumpHeld = true;
  }, [begin, resume]);

  const releaseJump = useCallback(() => {
    inputRef.current.jumpHeld = false;
  }, []);

  const setDuck = useCallback((down: boolean) => {
    inputRef.current.duckHeld = down && gameRef.current.status === 'running';
  }, []);

  useEffect(() => {
    const jumpKeys = [' ', 'ArrowUp', 'w', 'W'];
    const duckKeys = ['ArrowDown', 's', 'S'];
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (jumpKeys.includes(e.key)) {
        e.preventDefault();
        if (!e.repeat) pressJump();
      } else if (duckKeys.includes(e.key)) {
        e.preventDefault();
        setDuck(true);
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameRef.current.status === 'running') pause();
        else if (gameRef.current.status === 'paused') resume();
      } else if (e.key === 'Enter' && (gameRef.current.status === 'ready' || gameRef.current.status === 'over')) {
        e.preventDefault();
        begin();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (jumpKeys.includes(e.key)) releaseJump();
      if (duckKeys.includes(e.key)) setDuck(false);
    };
    const onHide = () => {
      inputRef.current.jumpHeld = false;
      inputRef.current.duckHeld = false;
      if (document.visibilityState === 'hidden' || !document.hasFocus()) pause();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [begin, pause, pressJump, releaseJump, resume, setDuck]);

  const chooseColor = (id: string) => {
    const next = { ...record, color: id };
    saveDinoRecord(next);
    setRecord(next);
    sound((v) => playConfirmation(v * 0.25));
  };

  return (
    <Page maxWidth={1100}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Box aria-hidden sx={{ fontSize: { xs: '2.4rem', md: '3rem' }, lineHeight: 1, animation: 'kl-wiggle 3s ease-in-out infinite' }}>
          <Illustration emoji="🦖" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, color: green.text }}>Dino Dash</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Jump the cactuses, catch the letters, and visit a new world every level.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.75, py: 0.75, borderRadius: '999px', bgcolor: gold.tint, color: gold.text, fontWeight: 900, border: `2px solid ${alpha(worlds.gold.main, 0.6)}` }}>
            <EmojiEventsRounded sx={{ fontSize: 20, color: worlds.gold.main }} aria-hidden />
            Best {record.bestScore}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1.75, py: 0.75, borderRadius: '999px', bgcolor: green.tint, color: green.text, fontWeight: 900, border: `2px solid ${alpha(worlds.green.main, 0.5)}` }}>
            Top level {record.bestLevel}
          </Box>
        </Box>
      </Box>

      <Box
        ref={wrapRef}
        sx={{
          position: 'relative',
          borderRadius: { xs: '24px', md: '32px' },
          overflow: 'hidden',
          border: `4px solid ${theme.palette.mode === 'dark' ? '#433F6E' : '#FFFFFF'}`,
          boxShadow: `0 8px 0 ${alpha(worlds.green.dark, 0.35)}, 0 20px 40px ${alpha(worlds.violet.dark, 0.18)}`,
          bgcolor: '#7FD4FF',
          mb: 2.5,
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Dino Dash game scene"
          onPointerDown={(e) => { e.preventDefault(); pressJump(); }}
          onPointerUp={releaseJump}
          onPointerCancel={releaseJump}
          onPointerLeave={releaseJump}
          onContextMenu={(e) => e.preventDefault()}
          style={{ display: 'block', width: '100%', touchAction: 'none', cursor: 'pointer' }}
        />

        {status !== 'running' && (
          <Box
            aria-hidden
            sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: alpha('#15142B', status === 'ready' ? 0.08 : 0.28), pointerEvents: 'none' }}
          >
            <Box sx={{ px: 2.5, py: 1, borderRadius: '999px', bgcolor: alpha('#FFFFFF', 0.92), color: '#2B2D42', fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '1rem', md: '1.3rem' }, boxShadow: '0 4px 0 rgba(0,0,0,0.12)', animation: 'kl-float 2.6s ease-in-out infinite' }}>
              {status === 'paused' ? 'Paused · tap to keep going' : status === 'over' ? 'Tap to run again' : 'Tap or press Space to start'}
            </Box>
          </Box>
        )}

        {banner && status === 'running' && (
          <Box
            key={banner.level}
            aria-hidden
            sx={{
              position: 'absolute',
              left: '50%',
              top: { xs: '30%', md: '28%' },
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: { xs: 2, md: 3 },
              py: { xs: 1, md: 1.5 },
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              color: worlds.violet.dark,
              boxShadow: `0 6px 0 ${worlds.violet.main}`,
              border: `3px solid ${worlds.violet.main}`,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              animation: 'kl-pop-in 480ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
          >
            <Box sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, lineHeight: 1 }}><Illustration emoji={banner.emoji} /></Box>
            <Box>
              <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '1.3rem', md: '1.8rem' }, lineHeight: 1 }}>
                Level {banner.level}!
              </Typography>
              <Typography component="span" sx={{ display: 'block', fontWeight: 800, fontSize: { xs: '0.85rem', md: '1rem' } }}>{banner.name}</Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Box role="status" aria-live="polite" sx={{ position: 'absolute', width: '1px', height: '1px', m: '-1px', p: 0, border: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        {announcement}
      </Box>

      {status === 'running' || status === 'paused' ? (
        <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, alignItems: 'center' }}>
          <HoldButton label="Jump" icon={<KeyboardArrowUpRounded sx={{ fontSize: 34 }} />} world="green" onDown={pressJump} onUp={releaseJump} />
          <HoldButton label="Duck" icon={<KeyboardArrowDownRounded sx={{ fontSize: 34 }} />} world="blue" onDown={() => setDuck(true)} onUp={() => setDuck(false)} />
          <RoundIconButton label={status === 'paused' ? 'Keep going' : 'Pause'} world="violet" filled={status === 'paused'} size={64} onClick={status === 'paused' ? resume : pause}>
            {status === 'paused' ? <PlayArrowRounded /> : <PauseRounded />}
          </RoundIconButton>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: summary ? '1fr 1fr' : '1fr' },
            gap: 2,
            p: { xs: 2, md: 3 },
            borderRadius: '28px',
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'divider',
            animation: 'kl-rise-in 320ms ease-out both',
          }}
        >
          {summary && (
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, color: summary.newBest ? gold.text : green.text }}>
                {summary.newBest ? 'New best score!' : 'Great run!'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' }, mt: 1.5 }}>
                {[
                  { label: 'Score', value: summary.score, w: gold },
                  { label: 'Level', value: summary.level, w: green },
                  { label: 'Letters', value: summary.letters, w: blue },
                ].map((item) => (
                  <Box key={item.label} sx={{ px: 2, py: 1, borderRadius: '18px', bgcolor: item.w.tint, color: item.w.text, textAlign: 'center', minWidth: 88 }}>
                    <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.1 }}>{item.value}</Typography>
                    <Typography component="span" sx={{ display: 'block', fontWeight: 800, fontSize: '0.85rem' }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          <Box>
            <Typography variant="h4" component="h2" sx={{ mb: 1.25, textAlign: { xs: 'center', md: summary ? 'left' : 'center' } }}>
              Pick your dino
            </Typography>
            <Box role="radiogroup" aria-label="Dino colour" sx={{ display: 'flex', gap: 1.25, justifyContent: { xs: 'center', md: summary ? 'flex-start' : 'center' }, flexWrap: 'wrap', mb: 2 }}>
              {dinoColors.map((option) => {
                const selected = option.id === color.id;
                return (
                  <ButtonBase
                    key={option.id}
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${option.name} dino`}
                    onClick={() => chooseColor(option.id)}
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: option.body,
                      border: `4px solid ${selected ? '#FFFFFF' : option.belly}`,
                      boxShadow: selected ? `0 0 0 4px ${option.body}, 0 4px 0 ${option.dark}` : `0 4px 0 ${option.dark}`,
                      transform: selected ? 'scale(1.1)' : 'none',
                      transition: 'transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <Box aria-hidden sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: option.spikes }} />
                  </ButtonBase>
                );
              })}
            </Box>
            <Button variant="contained" color="success" fullWidth startIcon={summary ? <ReplayRounded /> : <PlayArrowRounded />} onClick={begin} sx={{ fontSize: '1.25rem', py: 1.5 }}>
              {summary ? 'Run again' : 'Start running'}
            </Button>
            <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary', textAlign: 'center' }}>
              Tap the scene or press Space or ↑ to jump. Hold for a bigger jump. Press ↓ to duck under high birds. You have three hearts.
            </Typography>
          </Box>
        </Box>
      )}

      <Confetti fire={celebrate} />
    </Page>
  );
}
