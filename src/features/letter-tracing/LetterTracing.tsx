import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { CheckCircleRounded, DeleteSweepRounded, NavigateNext, PlayCircleRounded, SkipNextRounded, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Illustration from '../../components/ui/Illustration';
import PillPicker from '../../components/ui/PillPicker';
import Confetti from '../../components/ui/Confetti';
import { useWorld } from '../../components/ui/world';
import { alphabetData } from '../../data/alphabet';
import { useAppStore } from '../../store/useAppStore';
import { NO_LEVELS } from '../learning-games/catalog';
import { playConfirmation, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import type { GameDifficulty } from '../learning-games/difficulty';
import TracingSurface from './TracingSurface';
import { strokesFor } from './strokes';
import { pickTracingLetters, type LetterCase, type Order, type TraceScore } from './tracing';


const caseOptions = [
  { value: 'upper' as const, label: 'Big ABC' },
  { value: 'lower' as const, label: 'Small abc' },
  { value: 'both' as const, label: 'Both Aa' },
];
const orderOptions = [
  { value: 'next' as const, label: 'In order' },
  { value: 'surprise' as const, label: 'Surprise me', emoji: '🎁' },
];

function strokeHint(letter: string): string {
  const count = strokesFor(letter).length;
  return count === 1 ? 'Start at the green dot and follow the path in one line.' : `Start at dot 1. This letter has ${count} lines.`;
}

export default function LetterTracing() {
  const navigate = useNavigate();
  const green = useWorld('green');
  const { say, sound, settings } = useGameFeedback();
  const traced = useAppStore((s) => s.progress.gameLevels.tracing) ?? NO_LEVELS;
  const recordGameLevel = useAppStore((s) => s.recordGameLevel);
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const addLetterExplored = useAppStore((s) => s.addLetterExplored);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [letterCase, setLetterCase] = useState<LetterCase>('upper');
  const [order, setOrder] = useState<Order>('next');
  const [letters, setLetters] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [demo, setDemo] = useState(0);
  const [score, setScore] = useState<TraceScore | null>(null);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);

  const letter = letters[index];
  const content = letter ? alphabetData[letter.toUpperCase()] : undefined;
  const complete = letter ? done.includes(`${index}`) : false;

  const introText = 'Trace the letter with your finger or mouse. Start at the green dot and follow the dotted path.';

  const announceLetter = (next: string) => {
    const info = alphabetData[next.toUpperCase()];
    const name = next === next.toUpperCase() ? `big ${next}` : `small ${next}`;
    say(`Let's trace ${name}. ${next.toUpperCase()} is for ${info.word}. ${strokeHint(next)}`);
  };

  const start = () => {
    const next = pickTracingLetters(letterCase, order, traced);
    setLetters(next);
    setIndex(0);
    setDone([]);
    setAttempt((count) => count + 1);
    setScore(null);
    setDemo(0);
    setPhase('play');
    announceLetter(next[0]);
  };

  const handleScore = (next: TraceScore) => {
    setScore(next);
    if (!letter || complete || !next.complete) {
      if (!next.complete && next.strokes.some((value) => value > 0.3)) setStatus('Keep going. Follow the dotted path.');
      return;
    }
    setDone((items) => [...items, `${index}`]);
    recordGameLevel('tracing', letter);
    addLetterExplored(letter.toUpperCase());
    setCelebrate((count) => count + 1);
    sound((v) => playConfirmation(v * 0.3));
    const message = `Great tracing! ${letter.toUpperCase()} is for ${content?.word}.`;
    setStatus(message);
    say(message);
  };

  const goNext = () => {
    if (index + 1 >= letters.length) {
      completeGameRound('tracing');
      setPhase('done');
      setCelebrate((count) => count + 1);
      sound((v) => playSuccess(v * 0.3));
      say(`You traced ${done.length} ${done.length === 1 ? 'letter' : 'letters'}! Wonderful writing!`);
      return;
    }
    setIndex(index + 1);
    setAttempt((count) => count + 1);
    setScore(null);
    setDemo(0);
    setStatus('');
    announceLetter(letters[index + 1]);
  };

  const clear = () => {
    setAttempt((count) => count + 1);
    setScore(null);
    setStatus('Cleared. Try again from the green dot.');
  };

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Letter Tracing"
        subtitle="Follow the dotted path to write each letter."
        emoji="✏️"
        world="green"
        steps={[
          { emoji: '🟢', text: 'Put your finger on the green dot.' },
          { emoji: '✏️', text: 'Follow the dotted path to the end.' },
          { emoji: '🔢', text: 'Some letters have more lines. Do them in number order.' },
          { emoji: '🎉', text: 'Trace five letters to finish the round!' },
        ]}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onStart={start}
        onHear={() => say(introText)}
      >
        <Typography variant="h4" component="h2" sx={{ textAlign: 'center', mb: 1, fontSize: '1.15rem' }}>Letters</Typography>
        <PillPicker value={letterCase} options={caseOptions} onChange={setLetterCase} world="green" ariaLabel="Big or small letters" />
        <PillPicker value={order} options={orderOptions} onChange={setOrder} world="green" ariaLabel="Letter order" />
      </GameIntro>
    );
  }

  if (phase === 'done') {
    return (
      <GameResults
        stars={done.length >= letters.length ? 3 : done.length >= 3 ? 2 : 1}
        message={`You traced ${done.length} ${done.length === 1 ? 'letter' : 'letters'}!`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  if (!letter || !content) return null;

  const coverage = score ? Math.round((score.strokes.reduce((sum, value) => sum + value, 0) / Math.max(1, score.strokes.length)) * 100) : 0;

  return (
    <Page maxWidth={900}>
      <GameHeader
        title="Letter Tracing"
        emoji="✏️"
        world="green"
        backLabel="Back"
        onBack={() => setPhase('intro')}
        score={done.length}
        scoreLabel={`${done.length} letters traced`}
        progress={{ value: done.length, total: letters.length, label: `Letter ${index + 1} of ${letters.length}` }}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' }, gap: { xs: 2, md: 3 }, alignItems: 'start' }}>
        <Box sx={{ textAlign: 'center', p: { xs: 2, md: 3 }, borderRadius: '28px', bgcolor: green.tint }}>
          <Typography variant="h1" component="h2" aria-label={`Letter ${letter}`} sx={{ fontSize: { xs: '4rem', md: '5.5rem' }, color: green.text, lineHeight: 1 }}>
            {letter}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
            <Illustration emoji={content.emoji} size="2.4rem" />
            <Typography sx={{ fontWeight: 900, fontSize: '1.25rem' }}>{content.uppercase} is for {content.word}</Typography>
          </Box>
          <Typography sx={{ mt: 1.5, fontWeight: 700 }}>{strokeHint(letter)}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
            <Button variant="outlined" startIcon={<VolumeUpRounded />} onClick={() => announceLetter(letter)}>Hear it</Button>
            <Button variant="outlined" startIcon={<PlayCircleRounded />} onClick={() => { setDemo((count) => count + 1); say(`Watch. ${strokeHint(letter)}`); }}>Show me</Button>
            <Button variant="outlined" startIcon={<DeleteSweepRounded />} onClick={clear}>Clear</Button>
          </Box>
        </Box>

        <Box>
          <TracingSurface key={`${index}-${attempt}`} letter={letter} difficulty={difficulty} demo={demo} onScore={handleScore} disabled={complete} />
          <Box sx={{ mt: 2, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {complete ? (
              <>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 900, fontSize: '1.2rem', color: green.text }}>
                  <CheckCircleRounded /> Letter traced!
                </Typography>
                <Button variant="contained" color="success" endIcon={<NavigateNext />} onClick={goNext} sx={{ fontSize: '1.1rem', px: 3 }}>
                  {index + 1 >= letters.length ? 'See Results' : 'Next Letter'}
                </Button>
              </>
            ) : (
              <>
                <Typography sx={{ fontWeight: 800 }} aria-hidden>
                  {score ? `Path covered: ${coverage}%` : 'Trace on the dotted path.'}
                </Typography>
                <Button variant="text" startIcon={<SkipNextRounded />} onClick={skip}>
                  Skip this letter
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );

  function skip() {
    // Skipping is always allowed. The letter is not counted as traced.
    if (index + 1 >= letters.length && done.length === 0) {
      setPhase('intro');
      return;
    }
    goNext();
  }
}
