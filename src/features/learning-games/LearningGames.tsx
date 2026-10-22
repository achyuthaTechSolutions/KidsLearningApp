import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Grid, Button, LinearProgress } from '@mui/material';
import { ReplayRounded, SportsEsportsRounded, ArrowBackRounded, StarRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import ActivityCard from '../../components/ui/ActivityCard';
import Confetti from '../../components/ui/Confetti';
import Mascot from '../../components/ui/Mascot';
import StarRow from '../../components/ui/StarRow';
import { useWorld } from '../../components/ui/world';
import { worlds, type WorldKey } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playSuccess, playError } from '../../services/audio';
import { cancelSpeech } from '../../services/speech';
import { generateQuestion, type QuizGameType, type QuizQuestion } from './questions';
import { replayQuizWord, speakQuizQuestion } from './quizSpeech';
import QuestionCard from './QuestionCard';
import Illustration from '../../components/ui/Illustration';

const QUESTIONS_PER_GAME = 5;

const gameList: { type: QuizGameType; title: string; description: string; emoji: string; world: WorldKey }[] = [
  { type: 'find-letter', title: 'Find the Letter', description: 'Identify the letter by its sound!', emoji: '🔤', world: 'green' },
  { type: 'guess-animal', title: 'Guess the Animal', description: 'Which animal makes this sound?', emoji: '🐾', world: 'orange' },
  { type: 'count', title: 'Count the Objects', description: 'How many objects do you see?', emoji: '🔢', world: 'sun' },
  { type: 'match', title: 'Match the Word', description: 'Find the word that starts with this letter!', emoji: '🎯', world: 'pink' },
  { type: 'listen', title: 'Listen and Choose', description: 'Listen to the word and find it!', emoji: '👂', world: 'blue' },
];

export default function LearningGames() {
  const [gameType, setGameType] = useState<QuizGameType | 'select'>('select');
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [questionNum, setQuestionNum] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const teal = useWorld('teal');
  const gold = useWorld('gold');

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
      setCelebrate((count) => count + 1);
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
      if (score >= 3) setCelebrate((count) => count + 1);
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

  const activeGame = gameList.find((game) => game.type === gameType);

  if (gameType === 'select') {
    return (
      <Page>
        <PageHero world="teal" title="Learning Games" subtitle="Pick a game. Every round has five questions." emoji="🎮" />
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {gameList.map((game, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={game.type}>
              <ActivityCard
                world={game.world}
                emoji={game.emoji}
                title={game.title}
                subtitle={game.description}
                delay={index * 60}
                onClick={() => startGame(game.type)}
              />
            </Grid>
          ))}
        </Grid>
      </Page>
    );
  }

  if (gameComplete) {
    const title = score >= 4 ? 'Amazing!' : score >= 3 ? 'Great Job!' : 'Good Try!';
    return (
      <Page maxWidth={720}>
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
            py: { xs: 3.5, md: 5 },
            mt: { xs: 1, md: 3 },
          }}
        >
          <Box aria-hidden sx={{ position: 'absolute', left: '50%', top: -260, width: 620, height: 440, transform: 'translateX(-50%)', borderRadius: '50%', bgcolor: gold.tint }} />
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Mascot size={150} mood={score >= 3 ? 'cheer' : 'happy'} label="Pip the owl celebrating" />
          </Box>
          <Typography variant="h1" component="h1" sx={{ position: 'relative', fontSize: { xs: '2.2rem', md: '2.8rem' }, color: gold.text }}>
            {title}
          </Typography>
          <Typography variant="h3" component="p" sx={{ position: 'relative', mt: 1, mb: 2.5, fontSize: { xs: '1.3rem', md: '1.55rem' } }}>
            You got {score} out of {QUESTIONS_PER_GAME} correct!
          </Typography>
          <StarRow earned={score} total={QUESTIONS_PER_GAME} size={52} label={`${score} stars`} />
          <Box sx={{ position: 'relative', mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<ReplayRounded />} onClick={() => startGame(gameType)} sx={{ fontSize: '1.1rem', px: 3 }}>
              Play Again
            </Button>
            <Button variant="outlined" startIcon={<SportsEsportsRounded />} onClick={() => { setGameType('select'); setGameComplete(false); }} sx={{ fontSize: '1.1rem', px: 3 }}>
              Choose Game
            </Button>
          </Box>
        </Box>
        <Confetti fire={celebrate} pieces={70} />
      </Page>
    );
  }

  const gameWorld = activeGame?.world ?? 'teal';

  return (
    <Page maxWidth={820}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => setGameType('select')}>
          Back to Games
        </Button>
        <Typography variant="h3" component="h1" sx={{ flex: 1, minWidth: 160, fontSize: { xs: '1.3rem', md: '1.6rem' }, color: teal.text }}>
          {activeGame && <Illustration emoji={activeGame.emoji} sx={{ mr: 1 }} />}{activeGame?.title}
        </Typography>
        <Box
          role="img"
          aria-label={`Score ${score}`}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.75, py: 0.75, borderRadius: '999px', bgcolor: gold.tint, color: gold.text, fontWeight: 900, fontSize: '1.1rem', border: `2px solid ${gold.main}` }}
        >
          <StarRounded aria-hidden sx={{ color: worlds.gold.main }} />
          {score}
        </Box>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 900 }}>Question {questionNum} of {QUESTIONS_PER_GAME}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(questionNum / QUESTIONS_PER_GAME) * 100}
          aria-label={`Question ${questionNum} of ${QUESTIONS_PER_GAME}`}
          sx={{ '& .MuiLinearProgress-bar': { bgcolor: worlds[gameWorld].main } }}
        />
      </Box>

      {question && (
        <Box
          key={`${questionNum}-${question.prompt}`}
          sx={{
            borderRadius: { xs: '28px', md: '36px' },
            bgcolor: 'background.paper',
            border: `3px solid ${teal.tint}`,
            boxShadow: `0 8px 0 ${teal.tint}`,
            p: { xs: 2, md: 4 },
            mb: 3,
            animation: 'kl-rise-in 320ms ease-out both',
          }}
        >
          <QuestionCard
            question={question}
            answered={answered}
            onAnswer={handleAnswer}
            onReplay={handleReplay}
            onNext={answered ? handleNext : undefined}
            nextLabel={questionNum >= QUESTIONS_PER_GAME ? 'See Results' : 'Next Question'}
            speechEnabled={settings.speechEnabled}
          />
        </Box>
      )}
      <Confetti fire={celebrate} />
    </Page>
  );
}
