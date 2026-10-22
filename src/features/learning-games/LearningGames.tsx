import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Button, Chip, LinearProgress } from '@mui/material';
import { Replay, SportsEsports } from '@mui/icons-material';
import { useAppStore } from '../../store/useAppStore';
import { playSuccess, playError } from '../../services/audio';
import { cancelSpeech } from '../../services/speech';
import { generateQuestion, type QuizGameType, type QuizQuestion } from './questions';
import { replayQuizWord, speakQuizQuestion } from './quizSpeech';
import QuestionCard from './QuestionCard';

const QUESTIONS_PER_GAME = 5;

const gameList: { type: QuizGameType; title: string; description: string; emoji: string; color: string }[] = [
  { type: 'find-letter', title: 'Find the Letter', description: 'Identify the letter by its sound!', emoji: '🔤', color: '#6C5CE7' },
  { type: 'guess-animal', title: 'Guess the Animal', description: 'Which animal makes this sound?', emoji: '🐾', color: '#00B894' },
  { type: 'count', title: 'Count the Objects', description: 'How many objects do you see?', emoji: '🔢', color: '#FDCB6E' },
  { type: 'match', title: 'Match the Word', description: 'Find the word that starts with this letter!', emoji: '🎯', color: '#E17055' },
  { type: 'listen', title: 'Listen and Choose', description: 'Listen to the word and find it!', emoji: '👂', color: '#74B9FF' },
];

export default function LearningGames() {
  const [gameType, setGameType] = useState<QuizGameType | 'select'>('select');
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [questionNum, setQuestionNum] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [gameComplete, setGameComplete] = useState(false);

  const settings = useAppStore((s) => s.settings);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const incrementGamesCompleted = useAppStore((s) => s.incrementGamesCompleted);

  const speakQuestion = useCallback((next: QuizQuestion) => {
    if (!settings.speechEnabled) return;
    speakQuizQuestion(next, settings.speechRate, settings.selectedVoice);
  }, [settings.speechEnabled, settings.speechRate, settings.selectedVoice]);

  const nextQuestion = useCallback((type: QuizGameType) => {
    const next = generateQuestion(type);
    setQuestion(next);
    setAnswered(null);
    speakQuestion(next);
  }, [speakQuestion]);

  const startGame = (type: QuizGameType) => {
    setGameType(type);
    setQuestionNum(1);
    setScore(0);
    setGameComplete(false);
    nextQuestion(type);
  };

  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const handleAnswer = (answer: string) => {
    if (answered || !question) return;
    setAnswered(answer);
    const isCorrect = answer === question.correctAnswer;
    recordAnswer(isCorrect);

    if (isCorrect) {
      setScore((current) => current + 1);
      if (settings.soundEnabled) playSuccess(settings.volume * 0.3);
      if (settings.speechEnabled) {
        window.setTimeout(() => speakQuizQuestion({ ...question, type: 'match', prompt: 'Correct! Well done!', spokenWord: undefined }, settings.speechRate, settings.selectedVoice), 500);
      }
    } else {
      if (settings.soundEnabled) playError(settings.volume * 0.3);
      if (settings.speechEnabled) {
        window.setTimeout(() => speakQuizQuestion({ ...question, type: 'match', prompt: `Good try! The answer is ${question.correctAnswer}.`, spokenWord: undefined }, settings.speechRate, settings.selectedVoice), 500);
      }
    }
  };

  const handleNext = () => {
    if (gameType === 'select') return;
    if (questionNum >= QUESTIONS_PER_GAME) {
      setGameComplete(true);
      incrementGamesCompleted();
      if (settings.speechEnabled) {
        const message = score >= 4
          ? `Amazing! You got ${score} out of ${QUESTIONS_PER_GAME}!`
          : `Good try! You got ${score} out of ${QUESTIONS_PER_GAME}!`;
        speakQuizQuestion({ type: 'match', prompt: message, correctAnswer: '', options: [] }, settings.speechRate, settings.selectedVoice);
      }
    } else {
      setQuestionNum((current) => current + 1);
      nextQuestion(gameType);
    }
  };

  const handleReplay = () => {
    if (!question || !settings.speechEnabled) return;
    if (question.type === 'listen') replayQuizWord(question, settings.speechRate, settings.selectedVoice);
  };

  if (gameType === 'select') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Learning Games
          </Typography>
          <Typography variant="body1" color="text.secondary">Choose a game to play!</Typography>
        </Box>
        <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
          {gameList.map((game) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={game.type}>
              <Card sx={{ borderTop: `4px solid ${game.color}`, height: '100%' }}>
                <CardActionArea onClick={() => startGame(game.type)} sx={{ height: '100%' }} aria-label={game.title}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography aria-hidden="true" sx={{ fontSize: '3rem', mb: 1 }}>{game.emoji}</Typography>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: game.color }}>{game.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{game.description}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (gameComplete) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography aria-hidden="true" sx={{ fontSize: '4rem', mb: 2 }}>{score >= 4 ? '🏆' : score >= 3 ? '⭐' : '👍'}</Typography>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, fontSize: { xs: '1.8rem', md: '2rem' } }}>
          {score >= 4 ? 'Amazing!' : score >= 3 ? 'Great Job!' : 'Good Try!'}
        </Typography>
        <Typography variant="h3" sx={{ mb: 2, fontSize: { xs: '1.3rem', md: '1.5rem' } }}>
          You got {score} out of {QUESTIONS_PER_GAME} correct!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }} aria-label={`${score} stars`}>
          {Array.from({ length: QUESTIONS_PER_GAME }).map((_, index) => (
            <Typography key={index} aria-hidden="true" sx={{ fontSize: '2rem' }}>{index < score ? '⭐' : '☆'}</Typography>
          ))}
        </Box>
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<Replay />} onClick={() => startGame(gameType)} sx={{ borderRadius: 3 }}>
            Play Again
          </Button>
          <Button variant="outlined" startIcon={<SportsEsports />} onClick={() => { setGameType('select'); setGameComplete(false); }} sx={{ borderRadius: 3 }}>
            Choose Game
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip label={`Question ${questionNum} of ${QUESTIONS_PER_GAME}`} variant="outlined" />
          <Chip label={`Score ${score}`} color="primary" />
        </Box>
        <LinearProgress
          variant="determinate"
          value={(questionNum / QUESTIONS_PER_GAME) * 100}
          aria-label={`Question ${questionNum} of ${QUESTIONS_PER_GAME}`}
          sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
        />
      </Box>

      {question && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <QuestionCard
              question={question}
              answered={answered}
              onAnswer={handleAnswer}
              onReplay={handleReplay}
              onNext={answered ? handleNext : undefined}
              nextLabel={questionNum >= QUESTIONS_PER_GAME ? 'See Results' : 'Next Question'}
              speechEnabled={settings.speechEnabled}
            />
          </CardContent>
        </Card>
      )}

      <Box sx={{ textAlign: 'center' }}>
        <Button variant="text" onClick={() => setGameType('select')} sx={{ borderRadius: 3 }}>
          Back to Games
        </Button>
      </Box>
    </Box>
  );
}
