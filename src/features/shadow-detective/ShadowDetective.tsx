import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { NavigateNext, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Confetti from '../../components/ui/Confetti';
import { resolveWorld, tactile, useWorld } from '../../components/ui/world';
import { fonts } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playNote, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import type { GameDifficulty } from '../learning-games/difficulty';
import {
  SHADOW_ROUNDS, chooseShadow, createShadowRound, isRoundDone, shadowThemes,
  type ShadowItem, type ShadowRound, type ShadowTheme,
} from './engine';

const optionWorlds = ['blue', 'pink', 'violet', 'teal'] as const;

export default function ShadowDetective() {
  const theme = useTheme();
  const navigate = useNavigate();
  const slate = useWorld('slate');
  const green = useWorld('green');
  const { say, sound, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const addWordLearned = useAppStore((s) => s.addWordLearned);
  const addAnimalDiscovered = useAppStore((s) => s.addAnimalDiscovered);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [shadowTheme, setShadowTheme] = useState<ShadowTheme>('animals');
  const [round, setRound] = useState<ShadowRound | null>(null);
  const [number, setNumber] = useState(1);
  const [found, setFound] = useState(0);
  const [shaking, setShaking] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);

  const prompt = (next: ShadowRound) => (next.shadows.length > 1 ? 'Whose shadows are these? Find both!' : 'Whose shadow is this?');

  const begin = (next: ShadowRound) => {
    setRound(next);
    setStatus(prompt(next));
    say(prompt(next));
  };

  const start = () => {
    setNumber(1);
    setFound(0);
    setPhase('play');
    begin(createShadowRound(shadowTheme, difficulty));
  };

  const choose = (item: ShadowItem) => {
    if (!round) return;
    const { round: next, result } = chooseShadow(round, item.id);
    if (result === 'ignored') return;
    setRound(next);
    if (result === 'no-match') {
      setShaking(item.id);
      window.setTimeout(() => setShaking(null), 450);
      sound((v) => playNote(330, 0.15, v * 0.15, 'sine'));
      const message = `That is a ${item.name.toLowerCase()}. Its shadow looks different. Try another one!`;
      setStatus(message);
      say(message);
      return;
    }
    setFound((count) => count + 1);
    // The store only counts names that are in the word and animal lists.
    addWordLearned(item.name);
    addAnimalDiscovered(item.name);
    const done = isRoundDone(next);
    sound((v) => (done ? playConfirmation(v * 0.3) : playNote(784, 0.12, v * 0.2, 'triangle')));
    if (done) setCelebrate((count) => count + 1);
    const message = done
      ? `Yes! ${next.shadows.map((shadow) => `The ${shadow.name.toLowerCase()} matches its shadow.`).join(' ')}`
      : `Yes, the ${item.name.toLowerCase()}! Now find the other one.`;
    setStatus(message);
    say(message);
  };

  const goNext = () => {
    if (!round) return;
    if (number >= SHADOW_ROUNDS) {
      completeGameRound('shadow', `${shadowTheme}-${difficulty}`);
      setPhase('done');
      setCelebrate((count) => count + 1);
      sound((v) => playSuccess(v * 0.3));
      say('Case closed! You are a super shadow detective!');
      return;
    }
    setNumber(number + 1);
    begin(createShadowRound(shadowTheme, difficulty, Math.random, round.choices.map((item) => item.id)));
  };

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Shadow Detective"
        subtitle="Look closely at the shape. Who made that shadow?"
        emoji="🔦"
        world="slate"
        steps={[
          { emoji: '🔦', text: 'Look at the dark shadow shape.' },
          { emoji: '🔍', text: 'Find the picture with the same shape.' },
          { emoji: '🔁', text: 'Not quite? Just try another one.' },
        ]}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onStart={start}
        onHear={() => say('Look at the shadow. Then tap the picture that has the same shape. You can try as many times as you like.')}
      >
        <PillPicker value={shadowTheme} options={shadowThemes} onChange={setShadowTheme} world="slate" ariaLabel="Shadow theme" scroll />
      </GameIntro>
    );
  }

  if (phase === 'done') {
    return (
      <GameResults stars={3} message={`You matched ${found} shadows!`} celebrate={celebrate} onPlayAgain={start} onChooseGame={() => navigate('/games')} />
    );
  }

  if (!round) return null;
  const done = isRoundDone(round);
  const dark = theme.palette.mode === 'dark';

  return (
    <Page maxWidth={860}>
      <GameHeader
        title="Shadow Detective"
        emoji="🔦"
        world="slate"
        backLabel="Back"
        onBack={() => setPhase('intro')}
        score={found}
        scoreLabel={`${found} shadows matched`}
        progress={{ value: number - (done ? 0 : 1), total: SHADOW_ROUNDS, label: `Shadow ${number} of ${SHADOW_ROUNDS}` }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
        <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '1.35rem', md: '1.7rem' } }}>{prompt(round)}</Typography>
        <RoundIconButton label="Hear it again" world="slate" size={48} disabled={!settings.speechEnabled} onClick={() => say(prompt(round))}>
          <VolumeUpRounded />
        </RoundIconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {round.shadows.map((shadow) => {
          const matched = round.matched.includes(shadow.id);
          return (
            <Box
              key={shadow.id}
              role="img"
              aria-label={matched ? `Shadow solved: ${shadow.name}` : 'A shadow to solve'}
              sx={{
                width: { xs: 150, md: 190 },
                height: { xs: 150, md: 190 },
                borderRadius: '32px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: matched ? green.tint : dark ? alpha('#FFFFFF', 0.08) : '#FFF7E0',
                border: `3px ${matched ? 'solid' : 'dashed'} ${matched ? green.main : alpha(slate.main, 0.5)}`,
                position: 'relative',
              }}
            >
              <Illustration
                emoji={shadow.emoji}
                size="70%"
                sx={{
                  filter: matched ? 'none' : dark ? 'brightness(0) invert(0.85)' : 'brightness(0)',
                  opacity: matched ? 1 : 0.85,
                  transition: 'filter 400ms, opacity 400ms',
                  animation: matched ? 'kl-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
                }}
              />
              {matched && (
                <Typography aria-hidden sx={{ position: 'absolute', bottom: 8, fontFamily: fonts.display, fontWeight: 700, color: green.text }}>{shadow.name}</Typography>
              )}
            </Box>
          );
        })}
      </Box>

      <Box role="group" aria-label="Pictures" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${Math.min(4, round.choices.length)}, 1fr)` }, gap: 2, maxWidth: 700, mx: 'auto' }}>
        {round.choices.map((item, index) => {
          const matched = round.matched.includes(item.id);
          const tried = round.tried.includes(item.id);
          const w = resolveWorld(matched ? 'green' : optionWorlds[index % optionWorlds.length], theme.palette.mode);
          return (
            <ButtonBase
              key={item.id}
              aria-label={`${item.name}${matched ? ', matched' : tried ? ', not this one' : ''}`}
              disabled={matched || tried || done}
              onClick={() => choose(item)}
              sx={[
                tactile(theme, w, { state: matched ? 'done' : 'idle', depth: 6, radius: 24 }),
                {
                  flexDirection: 'column',
                  gap: 0.75,
                  py: 2,
                  minHeight: 140,
                  opacity: tried ? 0.4 : 1,
                  animation: shaking === item.id ? 'kl-shake 420ms ease-in-out' : 'none',
                },
              ]}
            >
              <Illustration emoji={item.emoji} size="64px" />
              <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.15rem', color: w.text, textDecoration: tried ? 'line-through' : 'none' }}>
                {item.name}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      {done && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" color="success" size="large" endIcon={<NavigateNext />} onClick={goNext} sx={{ fontSize: '1.15rem', px: 4 }}>
            {number >= SHADOW_ROUNDS ? 'See Results' : 'Next Shadow'}
          </Button>
        </Box>
      )}
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
