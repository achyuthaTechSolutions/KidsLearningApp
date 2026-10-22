import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  buildDailyQuestions,
  DAILY_QUESTION_COUNT,
  normalizeDailyRecord,
  spokenQuizLines,
  todayDateKey,
  type QuizQuestion,
} from '@kids/learning-core';
import { useAppStore } from '../store/useAppStore';
import { useLearning } from '../hooks/useLearning';
import { BigButton, Body, ChoiceButton, FeedbackBurst, Hero, Screen, StarRow, Title } from '../ui/components';
import { usePalette } from '../ui/theme';

function dateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DailyScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { say, sayLines, success, mistake, settings } = useLearning();
  const recordAnswer = useAppStore((state) => state.recordAnswer);
  const incrementGamesCompleted = useAppStore((state) => state.incrementGamesCompleted);
  const daily = useAppStore((state) => state.daily);
  const setDaily = useAppStore((state) => state.setDaily);
  const today = todayDateKey();
  const record = normalizeDailyRecord(daily.date === today ? daily : { ...daily, date: today, answered: 0, score: 0, stars: 0, completed: false });
  const questions = buildDailyQuestions(record.date);
  const [review, setReview] = useState<{ question: QuizQuestion; answer: string } | null>(null);
  const active = review?.question ?? questions[record.answered] ?? null;
  const picked = review?.answer ?? null;

  const speakCurrent = (question: QuizQuestion) => {
    if (settings.speechEnabled) sayLines(spokenQuizLines(question));
  };

  if (record.completed && !review) {
    return (
      <Screen>
        <Hero world="red" emoji="🌟" title="Daily Challenge" subtitle={dateLabel(record.date)} />
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: '#F4B400' }]}>
          <Title>Finished for today</Title>
          <Body>You earned {record.stars} of {DAILY_QUESTION_COUNT} stars.</Body>
          <StarRow earned={record.stars} total={DAILY_QUESTION_COUNT} label={`${record.stars} of ${DAILY_QUESTION_COUNT} stars earned`} />
          <Body>Today's challenge is saved on this device. A new set arrives tomorrow.</Body>
          <BigButton label="Back to home" onPress={() => router.push('/')} />
          <BigButton label="More games" world="teal" onPress={() => router.push('/games')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Hero world="red" emoji="🌟" title="Daily Challenge" subtitle={`${dateLabel(record.date)} · ${Math.min(record.answered + (review ? 0 : 1), DAILY_QUESTION_COUNT)} of ${DAILY_QUESTION_COUNT}`} />
      <StarRow earned={record.stars} total={DAILY_QUESTION_COUNT} label={`${record.stars} of ${DAILY_QUESTION_COUNT} stars today`} />
      {active ? (
        <>
          <Title>{active.prompt}</Title>
          {active.type === 'listen' ? <BigButton label="Replay the word" emoji="🔊" world="blue" onPress={() => active.spokenWord && say(active.spokenWord)} /> : null}
          <View style={styles.choices}>
            {active.options.map((option) => (
              <ChoiceButton
                key={option}
                label={option}
                disabled={picked !== null}
                selected={picked === option}
                correct={picked !== null && option === active.correctAnswer}
                wrong={picked === option && option !== active.correctAnswer}
                onPress={() => {
                  if (review || record.completed) return;
                  const correct = option === active.correctAnswer;
                  recordAnswer(correct);
                  const next = normalizeDailyRecord({
                    ...record,
                    answered: record.answered + 1,
                    score: record.score + (correct ? 1 : 0),
                    stars: record.score + (correct ? 1 : 0),
                    completed: record.answered + 1 >= questions.length,
                  });
                  if (next.completed && !record.completed) incrementGamesCompleted();
                  setDaily(next);
                  setReview({ question: active, answer: option });
                  if (correct) success();
                  else mistake();
                  say(correct ? 'Correct! Well done!' : `Good try! The answer is ${active.correctAnswer}.`);
                }}
              />
            ))}
          </View>
          <FeedbackBurst show={picked !== null} message={picked === active.correctAnswer ? 'That is right.' : `The answer is ${active.correctAnswer}.`} />
          {review ? (
            <BigButton
              label={record.answered >= questions.length ? 'Finish' : 'Next question'}
              world="green"
              onPress={() => {
                setReview(null);
                const upcoming = questions[record.answered];
                if (upcoming) speakCurrent(upcoming);
              }}
            />
          ) : (
            <BigButton label="Hear the question" emoji="🔊" world="slate" onPress={() => speakCurrent(active)} />
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 3, borderRadius: 28, padding: 16, gap: 10 },
  choices: { gap: 10 },
});
