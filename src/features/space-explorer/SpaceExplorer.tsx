import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, Chip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowBackRounded, CheckCircleRounded, LockRounded, MapRounded, NavigateNext, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import Mascot from '../../components/ui/Mascot';
import Confetti from '../../components/ui/Confetti';
import { tactile, useWorld } from '../../components/ui/world';
import { fonts } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { NO_LEVELS } from '../learning-games/catalog';
import { playError, playSuccess } from '../../services/audio';
import QuestionCard from '../learning-games/QuestionCard';
import { speakQuizQuestion } from '../learning-games/quizSpeech';
import type { QuizQuestion } from '../learning-games/questions';
import { GameHeader } from '../learning-games/GameChrome';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { difficultyOptions, type GameDifficulty } from '../learning-games/difficulty';
import { QUESTIONS_PER_STOP, buildActivity, destinations, isUnlocked, nextDestination, type Destination } from './destinations';

type View = 'map' | 'stop' | 'arrived';

export default function SpaceExplorer() {
  const theme = useTheme();
  const navigate = useNavigate();
  const blue = useWorld('blue');
  const green = useWorld('green');
  const violet = useWorld('violet');
  const { say, sound, settings } = useGameFeedback();
  const visited = useAppStore((s) => s.progress.gameLevels.space) ?? NO_LEVELS;
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const recordAnswer = useAppStore((s) => s.recordAnswer);

  const [view, setView] = useState<View>('map');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [destination, setDestination] = useState<Destination>(destinations[0]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);

  // Pictures in a prompt are for the eyes. Speech reads only the words.
  const spoken = (question: QuizQuestion): QuizQuestion => ({ ...question, prompt: question.prompt.replace(/\p{Extended_Pictographic}|\u{FE0F}/gu, '').trim() });
  const speak = (question: QuizQuestion) => {
    if (settings.speechEnabled) speakQuizQuestion(spoken(question), settings.speechRate, settings.selectedVoice);
  };

  const fly = (target: Destination) => {
    const next = buildActivity(target, difficulty);
    setDestination(target);
    setQuestions(next);
    setIndex(0);
    setAnswered(null);
    setView('stop');
    setStatus(`Blast off to ${target.name}! ${target.activityTitle}.`);
    say(`Blast off to ${target.name}! ${spoken(next[0]).prompt}`);
  };

  const answer = (option: string) => {
    const question = questions[index];
    if (!question || answered) return;
    setAnswered(option);
    const right = option === question.correctAnswer;
    recordAnswer(right);
    if (right) {
      setCelebrate((count) => count + 1);
      sound((v) => playSuccess(v * 0.2));
    } else {
      sound((v) => playError(v * 0.2));
    }
    const message = right ? 'Correct!' : `Good try! The answer is ${question.correctAnswer}.`;
    setStatus(message);
    say(message);
  };

  const goNext = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswered(null);
      speak(questions[index + 1]);
      return;
    }
    completeGameRound('space', destination.id);
    window.scrollTo({ top: 0 });
    setView('arrived');
    setCelebrate((count) => count + 1);
    sound((v) => playSuccess(v * 0.3));
    say(`You explored ${destination.name}! ${destination.fact}`);
  };

  if (view === 'map') {
    const upNext = nextDestination(visited);
    return (
      <Page maxWidth={900}>
        <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate('/games')} sx={{ mb: 2 }}>All Games</Button>
        <PageHero world="blue" title="Space Explorer" subtitle="Finish a short challenge at each stop to fly to the next one." emoji="🚀" progress={{ value: visited.filter((id) => destinations.some((item) => item.id === id)).length, total: destinations.length, label: 'Places explored' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<VolumeUpRounded />} onClick={() => say('Tap a planet to fly there. Finish its challenge to open the next one. You can visit places again any time.')}>Hear instructions</Button>
        </Box>
        <PillPicker value={difficulty} options={difficultyOptions} onChange={setDifficulty} world="blue" ariaLabel="Game level" />

        <Box
          component="ol"
          aria-label="Space map"
          sx={{
            listStyle: 'none', m: 0, p: { xs: 2, md: 3 }, borderRadius: '32px',
            display: 'grid', gap: 2,
            backgroundImage: `radial-gradient(${alpha('#FFFFFF', 0.5)} 1px, transparent 1.5px), ${theme.palette.mode === 'dark' ? 'linear-gradient(180deg, #0E1030, #1C1B4A)' : 'linear-gradient(180deg, #1B2A6B, #3B3F9E)'}`,
            backgroundSize: '26px 26px, 100% 100%',
          }}
        >
          {destinations.map((item, i) => {
            const open = isUnlocked(i, visited);
            const done = visited.includes(item.id);
            const w = done ? green : open ? blue : violet;
            return (
              <Box component="li" key={item.id}>
                <ButtonBase
                  onClick={() => (open ? fly(item) : say(`Visit ${destinations[i - 1].name} first to open ${item.name}.`))}
                  aria-label={`${item.name}. ${done ? 'Explored. Play again.' : open ? item.activityTitle : `Locked. Visit ${destinations[i - 1].name} first.`}`}
                  sx={[
                    tactile(theme, w, { state: done ? 'done' : 'idle', depth: 5, radius: 24 }),
                    { width: '100%', p: 2, gap: 2, justifyContent: 'flex-start', opacity: open ? 1 : 0.7, ml: { md: i % 2 ? '18%' : 0 }, maxWidth: { md: '82%' } },
                  ]}
                >
                  <Box aria-hidden sx={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '2.6rem', bgcolor: w.tint, flexShrink: 0, filter: open ? 'none' : 'grayscale(0.8)' }}>
                    <Illustration emoji={item.emoji} />
                  </Box>
                  <Box sx={{ textAlign: 'left', flex: 1 }}>
                    <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.25rem' }}>{item.name}</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>{open ? item.activityTitle : `Visit ${destinations[i - 1].name} first`}</Typography>
                    {!item.real && <Chip size="small" label="Make-believe" sx={{ mt: 0.5, fontWeight: 800 }} />}
                  </Box>
                  {done ? <CheckCircleRounded sx={{ color: green.main, fontSize: 32 }} aria-hidden /> : !open ? <LockRounded sx={{ fontSize: 30 }} aria-hidden /> : upNext?.id === item.id ? <Chip label="Next stop!" color="primary" sx={{ fontWeight: 900 }} /> : null}
                </ButtonBase>
              </Box>
            );
          })}
        </Box>
        <ScreenReaderStatus message={status} />
      </Page>
    );
  }

  if (view === 'arrived') {
    const following = nextDestination(visited);
    return (
      <Page maxWidth={720}>
        <Box sx={{ textAlign: 'center', p: { xs: 3, md: 5 }, borderRadius: '40px', bgcolor: 'background.paper', border: `3px solid ${blue.main}`, boxShadow: `0 10px 0 ${blue.main}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center', mb: 1 }}>
            <Mascot size={110} mood="cheer" />
            <Illustration emoji={destination.emoji} size="96px" />
          </Box>
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, color: blue.text }}>You explored {destination.name}!</Typography>
          <Chip label={destination.real ? 'True space fact' : 'Make-believe'} color={destination.real ? 'primary' : 'default'} sx={{ mt: 2, fontWeight: 900 }} />
          <Typography sx={{ mt: 1.5, fontSize: '1.2rem', fontWeight: 700 }}>{destination.fact}</Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {following && (
              <Button variant="contained" size="large" endIcon={<NavigateNext />} onClick={() => fly(following)}>Fly to {following.name}</Button>
            )}
            <Button variant="outlined" size="large" startIcon={<MapRounded />} onClick={() => { setView('map'); window.scrollTo({ top: 0 }); }}>Back to the map</Button>
          </Box>
          {!following && <Typography sx={{ mt: 2, fontWeight: 900, color: green.text }}>You visited every place in this galaxy!</Typography>}
        </Box>
        <Confetti fire={celebrate} pieces={70} />
      </Page>
    );
  }

  const question = questions[index];
  return (
    <Page maxWidth={820}>
      <GameHeader
        title={destination.name}
        emoji={destination.emoji}
        world="blue"
        backLabel="Map"
        onBack={() => setView('map')}
        progress={{ value: index + (answered ? 1 : 0), total: QUESTIONS_PER_STOP, label: `${destination.activityTitle} · ${index + 1} of ${QUESTIONS_PER_STOP}` }}
      />
      {question && (
        <Box key={index} sx={{ borderRadius: { xs: '28px', md: '36px' }, bgcolor: 'background.paper', border: `3px solid ${blue.tint}`, boxShadow: `0 8px 0 ${blue.tint}`, p: { xs: 2, md: 4 }, animation: 'kl-rise-in 320ms ease-out both' }}>
          <QuestionCard
            question={question}
            answered={answered}
            onAnswer={answer}
            onReplay={() => speak(question)}
            onNext={answered ? goNext : undefined}
            nextLabel={index + 1 >= QUESTIONS_PER_STOP ? 'Land!' : 'Next'}
            speechEnabled={settings.speechEnabled}
          />
        </Box>
      )}
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
