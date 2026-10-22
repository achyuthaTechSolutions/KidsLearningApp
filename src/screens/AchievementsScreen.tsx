import { StyleSheet, Text, View } from 'react-native';
import {
  achievementsList,
  ANIMAL_TOTAL,
  LETTER_TOTAL,
  NUMBER_TOTAL,
  overallLearningProgress,
  WORD_TOTAL,
} from '@kids/learning-core';
import { useAppStore } from '../store/useAppStore';
import { Emoji, Hero, Screen } from '../ui/components';
import { usePalette } from '../ui/theme';

export default function AchievementsScreen() {
  const palette = usePalette();
  const progress = useAppStore((state) => state.progress);
  const summary = overallLearningProgress(progress);
  const earned = new Set(progress.achievementsEarned);
  return (
    <Screen>
      <Hero world="gold" emoji="🏆" title="My Achievements" subtitle={`${earned.size} of ${achievementsList.length} badges`} />
      <Text style={{ color: palette.muted, fontFamily: 'Nunito_700Bold' }}>
        Letters {summary.letters}/{LETTER_TOTAL} · Numbers {summary.numbers}/{NUMBER_TOTAL} · Animals {summary.animals}/{ANIMAL_TOTAL} · Words {summary.words}/{WORD_TOTAL}
      </Text>
      {achievementsList.map((badge) => {
        const unlocked = earned.has(badge.id);
        return (
          <View
            key={badge.id}
            accessibilityLabel={`${badge.title}. ${unlocked ? 'Earned' : 'Not yet'}. ${badge.description}`}
            style={[styles.badge, { backgroundColor: palette.surface, borderColor: unlocked ? '#F4B400' : palette.outline, opacity: unlocked ? 1 : 0.72 }]}
          >
            <Emoji emoji={badge.emoji} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: palette.text }]}>{badge.title}</Text>
              <Text style={{ color: palette.muted, fontFamily: 'Nunito_700Bold' }}>{badge.description}</Text>
            </View>
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', color: unlocked ? '#0F9D68' : palette.muted }}>{unlocked ? 'Earned' : 'Keep going'}</Text>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { minHeight: 84, borderRadius: 20, borderWidth: 2, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18 },
});
