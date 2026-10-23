import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowUpwardRounded, CheckCircleRounded, DeleteSweepRounded, LightbulbRounded, NavigateNext, PlayArrowRounded,
  RestartAltRounded, TurnLeftRounded, TurnRightRounded, UndoRounded,
} from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Illustration from '../../components/ui/Illustration';
import Confetti from '../../components/ui/Confetti';
import { tactile, useWorld } from '../../components/ui/world';
import { fonts } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { NO_LEVELS } from '../learning-games/catalog';
import { playConfirmation, playError, playNote, playSuccess } from '../../services/audio';
import { GameHeader } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { prefersReducedMotion } from '../learning-games/motion';
import type { GameDifficulty } from '../learning-games/difficulty';
import {
  commandLimit, hintFor, levelsFor, outcomeMessage, robotLevels, runProgram, sameCell,
  type Command, type Direction, type RobotLevel, type RobotState, type RunOutcome,
} from './engine';

const commandInfo: Record<Command, { label: string; short: string; Icon: typeof ArrowUpwardRounded }> = {
  forward: { label: 'Move forward', short: 'Forward', Icon: ArrowUpwardRounded },
  left: { label: 'Turn left', short: 'Left', Icon: TurnLeftRounded },
  right: { label: 'Turn right', short: 'Right', Icon: TurnRightRounded },
};
const rotation: Record<Direction, number> = { up: 0, right: 90, down: 180, left: 270 };

export default function RobotAdventure() {
  const theme = useTheme();
  const navigate = useNavigate();
  const teal = useWorld('teal');
  const green = useWorld('green');
  const orange = useWorld('orange');
  const { say, sound, settings } = useGameFeedback();
  const completed = useAppStore((s) => s.progress.gameLevels.robot) ?? NO_LEVELS;
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const reduced = prefersReducedMotion(settings.reducedMotion);

  const [phase, setPhase] = useState<'intro' | 'play'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [level, setLevel] = useState<RobotLevel>(robotLevels[0]);
  const [program, setProgram] = useState<Command[]>([]);
  const [robot, setRobot] = useState<RobotState>(robotLevels[0].start);
  const [starTaken, setStarTaken] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeCommand, setActiveCommand] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [failedAt, setFailedAt] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState('');
  const [hintText, setHintText] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const timers = useRef<number[]>([]);
  const runningRef = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const stopTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => () => stopTimers(), []);
  // On a phone the hint and result appear below the fold, under the bottom menu. Bring them into view.
  useEffect(() => {
    if (hintText || outcome) feedbackRef.current?.scrollIntoView?.({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }, [hintText, outcome, reduced]);

  const resetRobot = (target: RobotLevel = level) => {
    stopTimers();
    runningRef.current = false;
    setRunning(false);
    setRobot(target.start);
    setStarTaken(!target.star);
    setActiveCommand(null);
    setOutcome(null);
    setFailedAt(undefined);
    setHintText(null);
  };

  const openLevel = (target: RobotLevel) => {
    setLevel(target);
    setProgram([]);
    resetRobot(target);
    setPhase('play');
    setStatus(target.tip);
    say(`${target.title}. ${target.tip}`);
  };

  const add = (command: Command) => {
    if (runningRef.current || program.length >= commandLimit(level)) return;
    if (outcome) resetRobot();
    setHintText(null);
    sound((v) => playNote(command === 'forward' ? 660 : 520, 0.08, v * 0.2, 'triangle'));
    setProgram((current) => [...current, command]);
    setStatus(`${commandInfo[command].label} added. ${program.length + 1} commands.`);
  };

  const undo = () => {
    if (runningRef.current) return;
    resetRobot();
    setProgram((current) => current.slice(0, -1));
  };

  const clear = () => {
    if (runningRef.current) return;
    resetRobot();
    setProgram([]);
  };

  const go = () => {
    if (runningRef.current) return;
    const result = runProgram(level, program);
    resetRobot();
    runningRef.current = true;
    setRunning(true);
    const stepMs = reduced ? 380 : 620;
    result.steps.forEach((step, i) => {
      timers.current.push(window.setTimeout(() => {
        setRobot(step.robot);
        setStarTaken(step.star);
        setActiveCommand(step.command);
        sound((v) => playNote(440 + i * 30, 0.07, v * 0.15, 'sine'));
      }, (i + 1) * stepMs));
    });
    timers.current.push(window.setTimeout(() => {
      runningRef.current = false;
      setRunning(false);
      setOutcome(result.outcome);
      setFailedAt(result.failedAt);
      if (result.failedAt !== undefined) setActiveCommand(result.failedAt);
      const message = outcomeMessage(result.outcome, result.failedAt);
      setStatus(message);
      say(message);
      if (result.outcome === 'goal') {
        completeGameRound('robot', level.id);
        setCelebrate((count) => count + 1);
        sound((v) => playSuccess(v * 0.3));
      } else if (result.outcome === 'rock' || result.outcome === 'edge') {
        sound((v) => playError(v * 0.25));
      } else {
        sound((v) => playConfirmation(v * 0.15));
      }
    }, (result.steps.length + 1) * stepMs));
  };

  const hint = () => {
    if (runningRef.current) return;
    const advice = hintFor(level, program);
    const message = advice.kind === 'ready'
      ? 'Your plan works. Press Go!'
      : advice.kind === 'next'
        ? `Next, try ${commandInfo[advice.command].label.toLowerCase()}.`
        : `Try changing command ${advice.index + 1} to ${commandInfo[advice.command].label.toLowerCase()}.`;
    setHintText(message);
    setStatus(message);
    say(message);
  };

  const nextLevel = robotLevels[robotLevels.indexOf(level) + 1];

  if (phase === 'intro') {
    const group = levelsFor(difficulty);
    return (
      <GameIntro
        title="Little Robot Adventure"
        subtitle="Plan the robot's moves, then press Go!"
        emoji="🤖"
        world="teal"
        steps={[
          { emoji: '🤖', text: 'The robot walks the way its arrow points.' },
          { emoji: '🧩', text: 'Tap Forward, Left, and Right to build a plan.' },
          { emoji: '🏁', text: 'Press Go to watch it walk to the flag.' },
          { emoji: '⭐', text: 'On harder levels, grab the star on the way!' },
        ]}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onStart={() => openLevel(group.find((item) => !completed.includes(item.id)) ?? group[0])}
        onHear={() => say('Tap Forward, Left, and Right to make a plan for the robot. Then press Go and watch it walk to the flag.')}
        startLabel="Start next level"
      >
        <Grid container spacing={2} sx={{ mb: 1 }}>
          {group.map((item, index) => {
            const done = completed.includes(item.id);
            return (
              <Grid size={{ xs: 12, sm: 4 }} key={item.id}>
                <ButtonBase
                  onClick={() => openLevel(item)}
                  aria-label={`Level ${index + 1}, ${item.title}${done ? ', finished' : ''}`}
                  sx={[tactile(theme, done ? green : teal, { state: done ? 'done' : 'idle', depth: 5, radius: 22 }), { width: '100%', p: 2, flexDirection: 'column', gap: 0.5 }]}
                >
                  <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.1rem' }}>Level {index + 1}</Typography>
                  <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
                  {done && <CheckCircleRounded sx={{ color: green.main }} aria-hidden />}
                </ButtonBase>
              </Grid>
            );
          })}
        </Grid>
      </GameIntro>
    );
  }

  const limit = commandLimit(level);
  const success = outcome === 'goal';
  const bumped = outcome === 'rock' || outcome === 'edge';
  const cellSize = `min(${Math.floor(88 / level.width)}vw, ${Math.floor(400 / level.width)}px)`;

  return (
    <Page maxWidth={1000}>
      <GameHeader
        title={level.title}
        emoji="🤖"
        world="teal"
        backLabel="Levels"
        onBack={() => { resetRobot(); setPhase('intro'); }}
        progress={{ value: program.length, total: limit, label: `${program.length} of ${limit} commands${level.maxCommands ? ' allowed' : ''}` }}
      />

      <Typography sx={{ fontWeight: 800, mb: 2, textAlign: 'center' }}>{level.tip}</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' }, gap: 3, alignItems: 'start' }}>
        <Box
          role="grid"
          aria-label={`Board, ${level.width} by ${level.height}. Robot at column ${robot.x + 1}, row ${robot.y + 1}, facing ${robot.dir}.`}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${level.width}, ${cellSize})`,
            gridAutoRows: cellSize,
            gap: '4px',
            p: '8px',
            mx: 'auto',
            borderRadius: '24px',
            bgcolor: alpha(teal.main, 0.18),
            animation: bumped ? 'kl-shake 420ms ease-in-out' : 'none',
          }}
        >
          {Array.from({ length: level.height }, (_, y) => Array.from({ length: level.width }, (_, x) => {
            const cell = { x, y };
            const isRobot = robot.x === x && robot.y === y;
            const rock = level.rocks.some((item) => sameCell(cell, item));
            const goal = sameCell(cell, level.goal);
            const star = !starTaken && sameCell(cell, level.star);
            return (
              <Box
                key={`${x}-${y}`}
                role="gridcell"
                aria-label={rock ? 'Rock' : goal ? 'Flag' : star ? 'Star' : isRobot ? 'Robot' : 'Empty'}
                sx={{
                  position: 'relative',
                  borderRadius: '12px',
                  bgcolor: rock ? alpha(theme.palette.text.primary, 0.08) : 'background.paper',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: `calc(${cellSize} * 0.55)`,
                }}
              >
                {rock && <Illustration emoji="🪨" />}
                {goal && !isRobot && <Illustration emoji="🏁" />}
                {star && !isRobot && <Illustration emoji="⭐" />}
                {isRobot && (
                  <Box sx={{ position: 'relative', lineHeight: 1, transition: reduced ? 'none' : 'transform 300ms' }}>
                    <Illustration emoji="🤖" />
                    <Box
                      aria-hidden
                      sx={{
                        position: 'absolute', inset: '-18%', display: 'grid', placeItems: 'start center',
                        transform: `rotate(${rotation[robot.dir]}deg)`, transition: reduced ? 'none' : 'transform 250ms',
                      }}
                    >
                      <Box sx={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: `13px solid ${orange.main}`, mt: '-6px' }} />
                    </Box>
                  </Box>
                )}
              </Box>
            );
          }))}
        </Box>

        <Box>
          <Typography variant="h4" component="h2" sx={{ fontSize: '1.15rem', mb: 1 }}>Commands</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
            {(Object.keys(commandInfo) as Command[]).map((command) => {
              const { label, short, Icon } = commandInfo[command];
              return (
                <ButtonBase
                  key={command}
                  aria-label={label}
                  disabled={running || program.length >= limit}
                  onClick={() => add(command)}
                  sx={[tactile(theme, teal, { state: 'selected', depth: 6, radius: 22 }), { minHeight: 84, flexDirection: 'column', gap: 0.5, fontFamily: fonts.display, fontWeight: 700, fontSize: '1.05rem', '&.Mui-disabled': { opacity: 0.5, color: teal.onMain } }]}
                >
                  <Icon sx={{ fontSize: 36 }} />
                  {short}
                </ButtonBase>
              );
            })}
          </Box>

          <Typography variant="h4" component="h2" sx={{ fontSize: '1.15rem', mb: 1 }}>My plan</Typography>
          <Box
            component="ol"
            aria-label="Robot plan"
            sx={{ listStyle: 'none', m: 0, p: 1.5, minHeight: 72, borderRadius: '20px', border: `3px dashed ${alpha(teal.main, 0.4)}`, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
          >
            {program.length === 0 && <Typography component="li" color="text.secondary" sx={{ fontWeight: 700 }}>Tap a command to start your plan.</Typography>}
            {program.map((command, i) => {
              const { label, Icon } = commandInfo[command];
              const active = activeCommand === i;
              const failed = failedAt === i;
              return (
                <Box
                  component="li"
                  key={i}
                  aria-label={`${i + 1}. ${label}${failed ? ', bumped here' : ''}`}
                  sx={{
                    width: 48, height: 48, borderRadius: '14px', display: 'grid', placeItems: 'center', position: 'relative',
                    bgcolor: failed ? orange.main : active ? teal.main : teal.tint,
                    color: failed || active ? '#FFFFFF' : teal.text,
                    outline: active ? `3px solid ${teal.dark}` : 'none',
                  }}
                >
                  <Icon aria-hidden />
                  <Box component="span" aria-hidden sx={{ position: 'absolute', top: -8, right: -6, fontSize: '0.7rem', fontWeight: 900, bgcolor: 'background.paper', color: 'text.primary', borderRadius: '8px', px: 0.5 }}>{i + 1}</Box>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Button variant="contained" size="large" startIcon={<PlayArrowRounded />} onClick={go} disabled={running || program.length === 0} sx={{ fontSize: '1.2rem', px: 3 }}>
              {running ? 'Running…' : 'Go!'}
            </Button>
            <Button variant="outlined" startIcon={<UndoRounded />} onClick={undo} disabled={running || program.length === 0}>Undo</Button>
            <Button variant="outlined" startIcon={<DeleteSweepRounded />} onClick={clear} disabled={running || program.length === 0}>Clear</Button>
            <Button variant="outlined" startIcon={<RestartAltRounded />} onClick={() => resetRobot()} disabled={running}>Reset robot</Button>
            <Button variant="text" startIcon={<LightbulbRounded />} onClick={hint} disabled={running}>Hint</Button>
          </Box>

          <Box ref={feedbackRef} sx={{ scrollMarginBottom: '112px' }}>
          {hintText && (
            <Box data-testid="robot-hint" sx={{ mt: 2, p: 2, borderRadius: '20px', bgcolor: teal.tint, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbRounded sx={{ color: teal.text }} aria-hidden />
              <Typography sx={{ fontWeight: 900, color: teal.text }}>{hintText}</Typography>
            </Box>
          )}

          {outcome && (
            <Box sx={{ mt: 2, p: 2, borderRadius: '20px', bgcolor: success ? green.tint : orange.tint, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', animation: 'kl-rise-in 300ms ease-out both' }}>
              <Typography sx={{ fontWeight: 900, color: success ? green.text : orange.text, flex: 1, minWidth: 200 }}>
                {success ? '🎉 ' : ''}{outcomeMessage(outcome, failedAt)}
              </Typography>
              {success && nextLevel && (
                <Button variant="contained" color="success" endIcon={<NavigateNext />} onClick={() => openLevel(nextLevel)}>Next level</Button>
              )}
              {success && !nextLevel && (
                <Button variant="contained" color="success" onClick={() => navigate('/games')}>All levels done! Choose a game</Button>
              )}
            </Box>
          )}
          </Box>
        </Box>
      </Box>
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
