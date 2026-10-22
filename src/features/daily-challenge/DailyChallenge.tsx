import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material';
import { Home, SportsEsports } from '@mui/icons-material';
import QuestionCard from '../learning-games/QuestionCard';
import type { QuizQuestion } from '../learning-games/questions';
import { replayQuizWord, speakQuizQuestion } from '../learning-games/quizSpeech';
import { useAppStore } from '../../store/useAppStore';
import { playError, playSuccess } from '../../services/audio';
import { speak } from '../../services/speech';
import { loadDailyChallenge, saveDailyChallenge, todayDateKey } from '../../services/storage';
import { DAILY_QUESTION_COUNT, buildDailyQuestions, freshDailyChallenge, normalizeDailyRecord } from './dailySelection';

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

  if (record.completed && !review) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 700, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Daily Learning Challenge
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{formatChallengeDate(record.date)}</Typography>
        <Typography sx={{ fontSize: '4rem', mb: 1 }} aria-hidden="true">{record.stars >= 4 ? '🌟' : '⭐'}</Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Finished for today</Typography>
        <Typography variant="h4" sx={{ mb: 2 }}>
          You earned {record.stars} of {DAILY_QUESTION_COUNT} stars
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 3 }} aria-label={`${record.stars} stars earned`}>
          {Array.from({ length: DAILY_QUESTION_COUNT }).map((_, index) => (
            <Typography key={index} sx={{ fontSize: '2rem' }} aria-hidden="true">{index < record.stars ? '⭐' : '☆'}</Typography>
          ))}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Today&apos;s challenge is saved on this device. A new set arrives tomorrow.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<Home />} onClick={() => navigate('/')} sx={{ borderRadius: 3 }}>
            Back to Home
          </Button>
          <Button variant="outlined" startIcon={<SportsEsports />} onClick={() => navigate('/games')} sx={{ borderRadius: 3 }}>
            More Games
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Daily Learning Challenge
        </Typography>
        <Typography variant="body1" color="text.secondary">{formatChallengeDate(record.date)}</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip label={`Question ${displayNumber} of ${DAILY_QUESTION_COUNT}`} variant="outlined" />
          <Chip label={`Stars ${record.stars}`} color="primary" />
        </Box>
        <LinearProgress
          variant="determinate"
          value={(record.answered / DAILY_QUESTION_COUNT) * 100}
          aria-label={`Daily progress, ${record.answered} of ${DAILY_QUESTION_COUNT} questions answered`}
          sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
        />
      </Box>

      {activeQuestion && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <QuestionCard
              question={activeQuestion}
              answered={answeredChoice}
              onAnswer={handleAnswer}
              onReplay={handleReplay}
              onNext={review ? handleNext : undefined}
              nextLabel={record.completed ? 'See Stars' : 'Next Question'}
              speechEnabled={settings.speechEnabled}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
