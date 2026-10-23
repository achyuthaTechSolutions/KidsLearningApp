import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBackRounded, StarRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Confetti from '../../components/ui/Confetti';
import Illustration from '../../components/ui/Illustration';
import { useWorld } from '../../components/ui/world';
import { worlds, type WorldKey } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playSuccess, playError } from '../../services/audio';
import { cancelSpeech } from '../../services/speech';
import { generateQuestion, quizLevel, type QuizGameType, type QuizQuestion } from './questions';
import { replayQuizWord, speakQuizQuestion } from './quizSpeech';
import QuestionCard from './QuestionCard';
import { GameResults } from './GameChrome';
import { useEndlessLevel } from './useEndlessLevel';
import LevelUpBanner from './LevelUpBanner';
import EndlessControls from './EndlessControls';

interface Props {
  type: QuizGameType;
  title: string;
  emoji: string;
  world: WorldKey;
  onExit: () => void;
}

/**
 * One endless quiz game. Questions keep coming at the child's level for this quiz:
 * more choices, bigger counts, and longer patterns as the level rises.
 */
export default function QuizRound({ type, title, emoji, world, onExit }: Props) {
  const teal = useWorld('teal');
  const gold = useWorld('gold');
  const settings = useAppStore((s) => s.settings);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const incrementGamesCompleted = useAppStore((s) => s.incrementGamesCompleted);
  const endless = useEndlessLevel(`quiz-${type}`, settings.gameDifficulty);

  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [questionNum, setQuestionNum] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const levelRef = useRef(endless.planned);

  const speakQuestion = useCallback((next: QuizQuestion) => {
    if (!settings.speechEnabled) return;
    speakQuizQuestion(next, settings.speechRate, settings.selectedVoice);
  }, [settings.speechEnabled, settings.speechRate, settings.selectedVoice]);

  const nextQuestion = useCallback(() => {
    const next = generateQuestion(type, Math.random, quizLevel(levelRef.current));
    setQuestion(next);
    setAnswered(null);
    setQuestionNum((count) => count + 1);
    speakQuestion(next);
  }, [speakQuestion, type]);

  const start = useCallback(() => {
    levelRef.current = endless.begin();
    setQuestionNum(0);
    setScore(0);
    setDone(false);
    nextQuestion();
  }, [endless, nextQuestion]);

  // Start once when the quiz opens. `start` changes as the level moves, so guard it.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
  }, [start]);

  useEffect(() => () => cancelSpeech(), []);

  const say = (prompt: string) => {
    if (!question || !settings.speechEnabled) return;
    window.setTimeout(() => speakQuizQuestion({ ...question, type: 'match', prompt, spokenWord: undefined }, settings.speechRate, settings.selectedVoice), 500);
  };

  const handleAnswer = (answer: string) => {
    if (answered || !question) return;
    setAnswered(answer);
    const isCorrect = answer === question.correctAnswer;
    recordAnswer(isCorrect);
    const after = endless.record(isCorrect);
    levelRef.current = after.level;
    const levelUp = after.change === 'up' ? ` Level up! Level ${after.level}!` : '';
    const why = question.explanation ? ` ${question.explanation}` : '';
    if (isCorrect) {
      setScore((current) => current + 1);
      setCelebrate((count) => count + 1);
      if (settings.soundEnabled) playSuccess(settings.volume * 0.3);
      say(`Correct! Well done!${why}${levelUp}`);
    } else {
      if (settings.soundEnabled) playError(settings.volume * 0.3);
      say(`Good try! The answer is ${question.correctAnswer}.${why}`);
    }
  };

  /** The quiz never ends by itself: the child stops when they like. */
  const finish = () => {
    const answeredCount = questionNum - (answered ? 0 : 1);
    if (answeredCount > 0) incrementGamesCompleted();
    setDone(true);
    if (score > 0) setCelebrate((count) => count + 1);
    if (settings.speechEnabled) {
      speakQuizQuestion({ type: 'match', prompt: `You got ${score} right and reached level ${endless.level}!`, correctAnswer: '', options: [] }, settings.speechRate, settings.selectedVoice);
    }
  };

  const handleReplay = () => {
    if (!question || !settings.speechEnabled) return;
    if (question.type === 'listen') replayQuizWord(question, settings.speechRate, settings.selectedVoice);
  };

  if (done) {
    const answeredCount = questionNum - (answered ? 0 : 1);
    const ratio = answeredCount > 0 ? score / answeredCount : 0;
    return (
      <GameResults
        stars={ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1}
        message={`You got ${score} of ${answeredCount} right and reached Level ${endless.level}!`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={onExit}
      />
    );
  }

  return (
    <Page maxWidth={820}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={onExit}>
          Back to Games
        </Button>
        <Typography variant="h3" component="h1" sx={{ flex: 1, minWidth: 160, fontSize: { xs: '1.3rem', md: '1.6rem' }, color: teal.text }}>
          <Illustration emoji={emoji} sx={{ mr: 1 }} />{title}
        </Typography>
        <Box
          role="img"
          aria-label={`Score ${score}`}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.75, py: 0.75, borderRadius: '999px', bgcolor: gold.tint, color: gold.text, fontWeight: 900, fontSize: '1.1rem', border: `2px solid ${gold.main}` }}
        >
          <StarRounded aria-hidden sx={{ color: worlds.gold.main }} />
          {score}
        </Box>
        <EndlessControls level={endless.level} world={world} onFinish={finish} />
      </Box>

      <Typography variant="body2" sx={{ fontWeight: 900, mb: 2 }}>Question {questionNum}</Typography>

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
            onNext={answered ? nextQuestion : undefined}
            nextLabel="Next Question"
            speechEnabled={settings.speechEnabled}
          />
        </Box>
      )}
      <LevelUpBanner change={endless.lastChange} world={world} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
