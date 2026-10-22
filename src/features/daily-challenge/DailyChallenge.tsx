import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { HomeRounded, SportsEsportsRounded, StarRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Confetti from '../../components/ui/Confetti';
import Mascot from '../../components/ui/Mascot';
import StarRow from '../../components/ui/StarRow';
import { useWorld } from '../../components/ui/world';
import { worlds } from '../../theme/tokens';
import QuestionCard from '../learning-games/QuestionCard';
import type { QuizQuestion } from '../learning-games/questions';
import { replayQuizWord, speakQuizQuestion } from '../learning-games/quizSpeech';
import { useAppStore } from '../../store/useAppStore';
import { playError, playSuccess } from '../../services/audio';
import { speak } from '../../services/speech';
import { loadDailyChallenge, saveDailyChallenge, todayDateKey } from '../../services/storage';
import { DAILY_QUESTION_COUNT, buildDailyQuestions, freshDailyChallenge, normalizeDailyRecord } from './dailySelection';
import Illustration from '../../components/ui/Illustration';

function formatChallengeDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function DailyChallenge() {
  const navigate = useNavigate();
  const settings = useAppStore((s) => s.settings);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const incrementGamesCompleted = useAppStore((s) => s.incrementGamesCompleted);
  const today = todayDateKey();
  const [record, setRecord] = useState(() => normalizeDailyRecord(loadDailyChallenge(today)));
  const [review, setReview] = useState<{ question: QuizQuestion; answer: string } | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const red = useWorld('red');
  const gold = useWorld('gold');

  if (record.date !== today) {
    setReview(null);
    setRecord(freshDailyChallenge(today));
  }

  const questions = useMemo(() => buildDailyQuestions(record.date), [record.date]);
  const activeQuestion = review?.question ?? questions[record.answered] ?? null;
  const answeredChoice = review?.answer ?? null;
  const displayNumber = review ? record.answered : Math.min(record.answered + 1, DAILY_QUESTION_COUNT);

  useEffect(() => {
    if (review || record.completed || !settings.speechEnabled) return;
    const question = questions[record.answered];
    if (!question) return;
    speakQuizQuestion(question, settings.speechRate, settings.selectedVoice);
  }, [questions, record.answered, record.completed, record.date, review, settings.speechEnabled, settings.speechRate, settings.selectedVoice]);

  const handleAnswer = (answer: string) => {
    if (review || record.completed || !activeQuestion) return;
    const correct = answer === activeQuestion.correctAnswer;
    recordAnswer(correct);
    const next = normalizeDailyRecord({
      ...record,
      answered: record.answered + 1,
      score: record.score + (correct ? 1 : 0),
      stars: record.score + (correct ? 1 : 0),
      completed: record.answered + 1 >= questions.length,
    });
    saveDailyChallenge(next);
    setRecord(next);
    setReview({ question: activeQuestion, answer });
    if (next.completed && !record.completed) incrementGamesCompleted();
    if (correct) setCelebrate((count) => count + 1);

    if (settings.soundEnabled) {
      if (correct) playSuccess(settings.volume * 0.3);
      else playError(settings.volume * 0.3);
    }
    if (settings.speechEnabled) {
      const message = correct ? 'Correct! Well done!' : `Good try! The answer is ${activeQuestion.correctAnswer}.`;
      window.setTimeout(() => speak(message, { rate: settings.speechRate, voice: settings.selectedVoice || undefined }), 500);
    }
  };

  const handleNext = () => {
    setReview(null);
  };

  const handleReplay = () => {
    if (!settings.speechEnabled || !activeQuestion) return;
    replayQuizWord(activeQuestion, settings.speechRate, settings.selectedVoice);
  };

  const header = (
    <Box
      component="header"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: '28px', md: '36px' },
        background: `linear-gradient(120deg, ${red.main} 0%, ${worlds.orange.main} 60%, ${worlds.sun.main} 140%)`,
        color: '#FFFFFF',
        px: { xs: 2.5, md: 4 },
        py: { xs: 2.5, md: 3 },
        mb: 3,
        boxShadow: `0 8px 0 ${alpha(red.dark, 0.6)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box aria-hidden sx={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', right: -60, top: -100, bgcolor: alpha('#FFFFFF', 0.14) }} />
      <Box aria-hidden sx={{ fontSize: { xs: '2.6rem', md: '3.2rem' }, lineHeight: 1, animation: 'kl-wiggle 3s ease-in-out infinite' }}><Illustration emoji="🌟" /></Box>
      <Box sx={{ position: 'relative', flex: 1, minWidth: 200 }}>
        <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.6rem', md: '2.2rem' }, color: 'inherit' }}>
          Daily Learning Challenge
        </Typography>
        <Typography sx={{ fontWeight: 800, opacity: 0.95, color: 'inherit' }}>{formatChallengeDate(record.date)}</Typography>
      </Box>
      <Box
        role="img"
        aria-label={`${record.stars} of ${DAILY_QUESTION_COUNT} stars today`}
        sx={{ position: 'relative', display: 'flex', gap: 0.25, bgcolor: alpha('#000000', 0.15), borderRadius: '999px', px: 1.25, py: 0.75 }}
      >
        {Array.from({ length: DAILY_QUESTION_COUNT }, (_, i) => (
          <StarRounded key={i} aria-hidden sx={{ fontSize: 30, color: i < record.stars ? worlds.gold.light : alpha('#FFFFFF', 0.35), transition: 'color 300ms' }} />
        ))}
      </Box>
    </Box>
  );

  if (record.completed && !review) {
    return (
      <Page maxWidth={760}>
        {header}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            borderRadius: '40px',
            bgcolor: 'background.paper',
            border: `3px solid ${gold.main}`,
            boxShadow: `0 10px 0 ${gold.main}`,
            px: { xs: 2.5, md: 5 },
            py: { xs: 3.5, md: 4.5 },
          }}
        >
          <Box aria-hidden sx={{ position: 'absolute', left: '50%', top: -260, width: 620, height: 440, transform: 'translateX(-50%)', borderRadius: '50%', bgcolor: gold.tint }} />
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Mascot size={140} mood="cheer" label="Pip the owl cheering" />
          </Box>
          <Typography variant="h2" component="p" sx={{ position: 'relative', fontSize: { xs: '1.9rem', md: '2.4rem' }, color: gold.text }}>
            Finished for today
          </Typography>
          <Typography variant="h4" component="p" sx={{ position: 'relative', mt: 1, mb: 2 }}>
            You earned {record.stars} of {DAILY_QUESTION_COUNT} stars
          </Typography>
          <StarRow earned={record.stars} total={DAILY_QUESTION_COUNT} size={52} label={`${record.stars} stars earned`} />
          <Typography variant="body1" color="text.secondary" sx={{ position: 'relative', mt: 2.5, mb: 3 }}>
            Today&apos;s challenge is saved on this device. A new set arrives tomorrow.
          </Typography>
          <Box sx={{ position: 'relative', display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<HomeRounded />} onClick={() => navigate('/')} sx={{ fontSize: '1.1rem', px: 3 }}>
              Back to Home
            </Button>
            <Button variant="outlined" startIcon={<SportsEsportsRounded />} onClick={() => navigate('/games')} sx={{ fontSize: '1.1rem', px: 3 }}>
              More Games
            </Button>
          </Box>
        </Box>
      </Page>
    );
  }

  return (
    <Page maxWidth={820}>
      {header}

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.75 }}>
          Question {displayNumber} of {DAILY_QUESTION_COUNT}
        </Typography>
        <Box
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={DAILY_QUESTION_COUNT}
          aria-valuenow={record.answered}
          aria-label={`Daily progress, ${record.answered} of ${DAILY_QUESTION_COUNT} questions answered`}
          sx={{ display: 'grid', gridTemplateColumns: `repeat(${DAILY_QUESTION_COUNT}, 1fr)`, gap: 1 }}
        >
          {Array.from({ length: DAILY_QUESTION_COUNT }, (_, i) => (
            <Box
              key={i}
              sx={{
                height: 14,
                borderRadius: '999px',
                bgcolor: i < record.answered ? red.main : i === record.answered ? alpha(red.main, 0.35) : red.tint,
                boxShadow: i < record.answered ? `inset 0 -3px 0 ${alpha('#000000', 0.15)}` : 'none',
                transition: 'background-color 300ms',
              }}
            />
          ))}
        </Box>
      </Box>

      {activeQuestion && (
        <Box
          key={`${record.answered}-${activeQuestion.prompt}`}
          sx={{
            borderRadius: { xs: '28px', md: '36px' },
            bgcolor: 'background.paper',
            border: `3px solid ${red.tint}`,
            boxShadow: `0 8px 0 ${red.tint}`,
            p: { xs: 2, md: 4 },
            mb: 3,
            animation: 'kl-rise-in 320ms ease-out both',
          }}
        >
          <QuestionCard
            question={activeQuestion}
            answered={answeredChoice}
            onAnswer={handleAnswer}
            onReplay={handleReplay}
            onNext={review ? handleNext : undefined}
            nextLabel={record.completed ? 'See Stars' : 'Next Question'}
            speechEnabled={settings.speechEnabled}
          />
        </Box>
      )}
      <Confetti fire={celebrate} />
    </Page>
  );
}
