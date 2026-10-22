import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  generateQuestion,
  QUESTIONS_PER_GAME,
  spokenQuizLines,
  type QuizGameType,
  type QuizQuestion,
  type WorldKey,
} from '@kids/learning-core';
import { useAppStore } from '../store/useAppStore';
import { useLearning } from '../hooks/useLearning';
import { ActivityCard, BigButton, Body, ChoiceButton, FeedbackBurst, Hero, Screen, StarRow, Title } from '../ui/components';
import { usePalette } from '../ui/theme';

const gameList: { type: QuizGameType; title: string; description: string; emoji: string; world: WorldKey }[] = [
  { type: 'find-letter', title: 'Find the Letter', description: 'Identify the letter by its sound', emoji: '🔤', world: 'green' },
  { type: 'guess-animal', title: 'Guess the Animal', description: 'Which animal makes this sound?', emoji: '🐾', world: 'orange' },
  { type: 'count', title: 'Count the Objects', description: 'How many objects do you see?', emoji: '🔢', world: 'sun' },
  { type: 'match', title: 'Match the Word', description: 'Find the word that starts with this letter', emoji: '🎯', world: 'pink' },
  { type: 'listen', title: 'Listen and Choose', description: 'Listen to the word and find it', emoji: '👂', world: 'blue' },
];

export default function GamesScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { say, sayLines, success, mistake, settings } = useLearning();
  const recordAnswer = useAppStore((state) => state.recordAnswer);
  const incrementGamesCompleted = useAppStore((state) => state.incrementGamesCompleted);
  const [gameType, setGameType] = useState<QuizGameType | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [number, setNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const ask = (type: QuizGameType) => {
    const next = generateQuestion(type);
    setQuestion(next);
    setPicked(null);
    if (settings.speechEnabled) sayLines(spokenQuizLines(next));
  };

  const start = (type: QuizGameType) => {
    setGameType(type);
    setNumber(1);
    setScore(0);
    setDone(false);
    ask(type);
  };

  useEffect(() => () => {
    // Leaving the games screen drops any queued instruction.
  }, []);

  if (!gameType) {
    return (
      <Screen>
        <Hero world="teal" emoji="🎮" title="Learning Games" subtitle="Every round has five questions." />
        <ActivityCard title="Dino Dash" subtitle="Run, jump, and catch letters" emoji="🦖" world="green" onPress={() => router.push('/dino')} />
        {gameList.map((game) => (
          <ActivityCard key={game.type} title={game.title} subtitle={game.description} emoji={game.emoji} world={game.world} onPress={() => start(game.type)} />
        ))}
      </Screen>
    );
  }

  const active = gameList.find((game) => game.type === gameType);

  if (done) {
    const title = score >= 4 ? 'Amazing!' : score >= 3 ? 'Great job!' : 'Good try!';
    return (
      <Screen>
        <View style={[styles.done, { backgroundColor: palette.surface, borderColor: '#F4B400' }]}>
          <Title>{title}</Title>
          <Body>You got {score} out of {QUESTIONS_PER_GAME} correct.</Body>
          <StarRow earned={score} total={QUESTIONS_PER_GAME} label={`${score} of ${QUESTIONS_PER_GAME} stars`} />
          <BigButton label="Play again" emoji="🔁" onPress={() => start(gameType)} />
          <BigButton label="Choose a game" world="teal" onPress={() => setGameType(null)} />
        </View>
      </Screen>
    );
  }

  const correct = picked !== null && question ? picked === question.correctAnswer : false;

  return (
    <Screen>
      <Hero world={active?.world ?? 'teal'} emoji={active?.emoji ?? '🎮'} title={active?.title ?? 'Game'} subtitle={`Question ${number} of ${QUESTIONS_PER_GAME}`} />
      <Text accessibilityLabel={`Score ${score}`} style={[styles.score, { color: palette.text }]}>Score {score}</Text>
      {question ? (
        <>
          <Title>{question.prompt}</Title>
          {question.emoji && question.type === 'count' ? <Text style={styles.objects}>{question.emoji.repeat(Number(question.correctAnswer))}</Text> : null}
          {question.type === 'listen' ? (
            <BigButton
              label="Replay the word"
              emoji="🔊"
              world="blue"
              onPress={() => question.spokenWord && say(question.spokenWord)}
            />
          ) : null}
          <View style={styles.choices}>
            {question.options.map((option) => (
              <ChoiceButton
                key={option}
                label={option}
                disabled={picked !== null}
                selected={picked === option}
                correct={picked !== null && option === question.correctAnswer}
                wrong={picked === option && option !== question.correctAnswer}
                onPress={() => {
                  if (picked) return;
                  setPicked(option);
                  const isCorrect = option === question.correctAnswer;
                  recordAnswer(isCorrect);
                  if (isCorrect) {
                    setScore((current) => current + 1);
                    success();
                    say('Correct! Well done!');
                  } else {
                    mistake();
                    say(`Good try! The answer is ${question.correctAnswer}.`);
                  }
                }}
              />
            ))}
          </View>
          <FeedbackBurst show={picked !== null} message={correct ? 'That is right.' : `The answer is ${question.correctAnswer}.`} />
          {picked ? (
            <BigButton
              label={number >= QUESTIONS_PER_GAME ? 'See my stars' : 'Next question'}
              world="green"
              onPress={() => {
                if (number >= QUESTIONS_PER_GAME) {
                  setDone(true);
                  incrementGamesCompleted();
                  say(score >= 4 ? `Amazing! You got ${score} out of ${QUESTIONS_PER_GAME}!` : `Good try! You got ${score} out of ${QUESTIONS_PER_GAME}!`);
                } else {
                  setNumber((current) => current + 1);
                  ask(gameType);
                }
              }}
            />
          ) : null}
        </>
      ) : null}
      <BigButton label="Back to games" world="slate" onPress={() => setGameType(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: { fontFamily: 'Fredoka_700Bold', fontSize: 18 },
  objects: { fontSize: 28, lineHeight: 40 },
  choices: { gap: 10 },
  done: { borderWidth: 3, borderRadius: 28, padding: 18, gap: 12 },
});
