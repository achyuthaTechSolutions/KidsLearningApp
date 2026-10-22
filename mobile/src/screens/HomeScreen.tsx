import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  achievementsList,
  activityPaths,
  ANIMAL_TOTAL,
  greetingForHour,
  LETTER_TOTAL,
  NUMBER_TOTAL,
  overallLearningProgress,
  sectionForPath,
  WORD_TOTAL,
  DAILY_QUESTION_COUNT,
  normalizeDailyRecord,
} from '@kids/learning-core';
import { ActivityCard, Body, Emoji, Mascot, Screen, Title } from '../ui/components';
import { usePalette, worldColors } from '../ui/theme';
import { useAppStore } from '../store/useAppStore';
import { useLearning } from '../hooks/useLearning';

const cards = [
  { path: '/keyboard', title: 'Keyboard Explorer', subtitle: 'Tap a key and hear a word', emoji: '⌨️', world: 'violet' as const },
  { path: '/alphabet', title: 'Alphabet World', subtitle: 'All 26 letters', emoji: '🔤', world: 'green' as const, kind: 'letters' as const },
  { path: '/numbers', title: 'Number World', subtitle: 'Count from 0 to 20', emoji: '🔢', world: 'sun' as const, kind: 'numbers' as const },
  { path: '/animals', title: 'Animal Kingdom', subtitle: 'Hear what animals say', emoji: '🦁', world: 'orange' as const, kind: 'animals' as const },
  { path: '/words', title: 'My First Words', subtitle: 'Fruits, cars, colours and more', emoji: '📚', world: 'pink' as const, kind: 'words' as const },
  { path: '/music', title: 'Music Studio', subtitle: 'Piano, drums, guitar and flute', emoji: '🎹', world: 'blue' as const },
  { path: '/games', title: 'Learning Games', subtitle: 'Guess, count, and match', emoji: '🎮', world: 'teal' as const },
  { path: '/dino', title: 'Dino Dash', subtitle: 'Run, jump, and catch letters', emoji: '🦖', world: 'green' as const },
  { path: '/achievements', title: 'My badges', subtitle: 'Stars you have earned', emoji: '🏆', world: 'gold' as const },
];

export default function HomeScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { say } = useLearning();
  const progress = useAppStore((state) => state.progress);
  const daily = normalizeDailyRecord(useAppStore((state) => state.daily));
  const summary = overallLearningProgress(progress);
  const continuePath = (progress.lastActivity && activityPaths[progress.lastActivity]) || '/keyboard';
  const continueSection = sectionForPath(continuePath);
  const violet = worldColors('violet');
  const badges = progress.achievementsEarned.length;

  const go = (path: string, spoken: string) => {
    router.push(path as never);
    say(spoken);
  };

  const dailyText = daily.completed
    ? `All done today! You earned ${daily.stars} ${daily.stars === 1 ? 'star' : 'stars'}.`
    : daily.answered > 0
      ? `${daily.answered} of ${DAILY_QUESTION_COUNT} done. Keep going!`
      : 'Five fresh questions are waiting.';

  const progressFor = (kind?: 'letters' | 'numbers' | 'animals' | 'words') => {
    if (kind === 'letters') return { value: summary.letters, total: LETTER_TOTAL };
    if (kind === 'numbers') return { value: summary.numbers, total: NUMBER_TOTAL };
    if (kind === 'animals') return { value: summary.animals, total: ANIMAL_TOTAL };
    if (kind === 'words') return { value: summary.words, total: WORD_TOTAL };
    return undefined;
  };

  return (
    <Screen>
      <View style={[styles.welcome, { backgroundColor: violet.main, borderBottomColor: violet.dark }]}>
        <Mascot />
        <View style={styles.welcomeCopy}>
          <Text style={styles.bubble}>{greetingForHour(new Date().getHours())}! I'm Pip. What shall we learn today?</Text>
          <Title light>Ready to explore?</Title>
          <Body light>{summary.explored} of {summary.total} things discovered.</Body>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Continue learning in ${continueSection.label}`}
        onPress={() => go(continuePath, `Let's keep going in ${continueSection.label}`)}
        style={[styles.continue, { backgroundColor: palette.surface }]}
      >
        <Text style={styles.play}>▶</Text>
        <View style={styles.welcomeCopy}>
          <Text style={[styles.continueTitle, { color: violet.dark }]}>Continue learning</Text>
          <Text style={{ color: palette.muted, fontFamily: 'Nunito_700Bold' }}>{continueSection.emoji} {continueSection.label}</Text>
        </View>
      </Pressable>

      <View accessibilityRole="list" style={styles.stats}>
        <Stat emoji="🔤" label="Letters" value={summary.letters} total={LETTER_TOTAL} />
        <Stat emoji="🔢" label="Numbers" value={summary.numbers} total={NUMBER_TOTAL} />
        <Stat emoji="🐾" label="Animals" value={summary.animals} total={ANIMAL_TOTAL} />
        <Stat emoji="📖" label="Words" value={summary.words} total={WORD_TOTAL} />
        <Stat emoji="🏆" label="Badges" value={badges} total={achievementsList.length} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Daily Learning Challenge. ${dailyText}`}
        onPress={() => go('/daily', 'Daily Learning Challenge')}
        style={styles.daily}
      >
        <Emoji emoji="🌟" size={42} />
        <View style={styles.welcomeCopy}>
          <Text style={styles.dailyTitle}>Daily Challenge</Text>
          <Text style={styles.dailyBody}>{dailyText}</Text>
        </View>
      </Pressable>

      {cards.map((card) => (
        <ActivityCard
          key={card.path}
          title={card.path === '/achievements' ? card.title : card.title}
          subtitle={card.path === '/achievements' ? `${badges} of ${achievementsList.length} earned` : card.subtitle}
          emoji={card.emoji}
          world={card.world}
          progress={progressFor(card.kind)}
          onPress={() => go(card.path, card.title)}
        />
      ))}
    </Screen>
  );
}

function Stat({ emoji, label, value, total }: { emoji: string; label: string; value: number; total: number }) {
  const palette = usePalette();
  return (
    <View accessibilityLabel={`${label} ${value} of ${total}`} style={[styles.stat, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
      <Emoji emoji={emoji} size={24} />
      <Text style={[styles.statValue, { color: palette.text }]}>{value}/{total}</Text>
      <Text style={{ color: palette.muted, fontFamily: 'Nunito_700Bold' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { borderRadius: 28, borderBottomWidth: 7, padding: 16, gap: 8 },
  welcomeCopy: { flex: 1, gap: 4 },
  bubble: { backgroundColor: '#FFFFFF', color: '#2B2D42', borderRadius: 16, padding: 10, fontFamily: 'Nunito_800ExtraBold', overflow: 'hidden' },
  continue: { minHeight: 76, borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  continueTitle: { fontFamily: 'Fredoka_700Bold', fontSize: 20 },
  play: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#0F9D68', color: '#FFFFFF', textAlign: 'center', lineHeight: 48, fontSize: 22, overflow: 'hidden' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { minWidth: 104, borderWidth: 2, borderRadius: 16, padding: 8 },
  statValue: { fontFamily: 'Fredoka_700Bold', fontSize: 18 },
  daily: { borderRadius: 24, borderBottomWidth: 7, borderBottomColor: '#A82539', backgroundColor: '#E23E57', padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  dailyTitle: { color: '#FFFFFF', fontFamily: 'Fredoka_700Bold', fontSize: 22 },
  dailyBody: { color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold' },
});
