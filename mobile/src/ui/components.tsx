import { useEffect, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { rainbow, type WorldKey } from '@kids/learning-core';
import { useMotionEnabled, usePalette, worldColors } from './theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const palette = usePalette();
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fill}>{children}</View>
  );
  return <View style={[styles.fill, { backgroundColor: palette.background }]}>{body}</View>;
}

export function Emoji({ emoji, size = 42, label }: { emoji: string; size?: number; label?: string }) {
  return (
    <Text
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no'}
      accessibilityLabel={label}
      style={{ fontSize: size, lineHeight: size + 6 }}
    >
      {emoji}
    </Text>
  );
}

export function Mascot({ size = 92, label = 'Pip the owl' }: { size?: number; label?: string }) {
  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Ellipse cx="60" cy="78" rx="34" ry="28" fill="#F4B400" />
        <Circle cx="60" cy="52" r="34" fill="#F6C945" />
        <Path d="M28 40 L18 18 L48 34 Z" fill="#EE5A30" />
        <Path d="M92 40 L102 18 L72 34 Z" fill="#EE5A30" />
        <Circle cx="46" cy="50" r="12" fill="#FFFFFF" />
        <Circle cx="74" cy="50" r="12" fill="#FFFFFF" />
        <Circle cx="48" cy="52" r="5" fill="#2B2D42" />
        <Circle cx="76" cy="52" r="5" fill="#2B2D42" />
        <Path d="M54 64 L60 72 L66 64 Z" fill="#EE5A30" />
        <Ellipse cx="60" cy="86" rx="16" ry="12" fill="#FFE7A3" />
      </Svg>
    </View>
  );
}

export function Title({ children, light = false }: { children: ReactNode; light?: boolean }) {
  const palette = usePalette();
  return <Text style={[styles.title, { color: light ? '#FFFFFF' : palette.text }]}>{children}</Text>;
}

export function Body({ children, light = false }: { children: ReactNode; light?: boolean }) {
  const palette = usePalette();
  return <Text style={[styles.body, { color: light ? '#FFFFFF' : palette.muted }]}>{children}</Text>;
}

export function BigButton({
  label,
  emoji,
  world = 'violet',
  onPress,
  disabled,
  style,
}: {
  label: string;
  emoji?: string;
  world?: WorldKey;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = worldColors(world);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.main, borderBottomColor: colors.dark, opacity: disabled ? 0.55 : 1 },
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      {emoji ? <Text style={styles.buttonEmoji}>{emoji}</Text> : null}
      <Text style={[styles.buttonLabel, { color: colors.onMain }]}>{label}</Text>
    </Pressable>
  );
}

export function ActivityCard({
  title,
  subtitle,
  emoji,
  world,
  onPress,
  progress,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  world: WorldKey;
  onPress: () => void;
  progress?: { value: number; total: number };
}) {
  const colors = worldColors(world);
  const palette = usePalette();
  const progressLabel = progress ? `${progress.value} of ${progress.total}` : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={progressLabel ? `${title}. ${subtitle}. ${progressLabel}` : `${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.surface, borderColor: colors.main, borderBottomColor: colors.dark },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.cardIcon, { backgroundColor: colors.soft }]}>
        <Emoji emoji={emoji} size={36} />
      </View>
      <View style={styles.cardCopy}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: palette.muted }]}>{subtitle}</Text>
        {progress ? (
          <Text style={[styles.progress, { color: colors.ink }]}>
            {progress.value}/{progress.total}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function Hero({
  world,
  emoji,
  title,
  subtitle,
}: {
  world: WorldKey;
  emoji: string;
  title: string;
  subtitle: string;
}) {
  const colors = worldColors(world);
  return (
    <View style={[styles.hero, { backgroundColor: colors.main, borderBottomColor: colors.dark }]}>
      <Emoji emoji={emoji} size={48} />
      <View style={styles.cardCopy}>
        <Title light>{title}</Title>
        <Body light>{subtitle}</Body>
      </View>
    </View>
  );
}

export function StarRow({ earned, total, label }: { earned: number; total: number; label: string }) {
  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={styles.stars}>
      {Array.from({ length: total }, (_, index) => (
        <Text key={index} style={[styles.star, { opacity: index < earned ? 1 : 0.35 }]}>
          ⭐
        </Text>
      ))}
    </View>
  );
}

export function ChoiceButton({
  label,
  emoji,
  selected,
  correct,
  wrong,
  onPress,
  disabled,
}: {
  label: string;
  emoji?: string;
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const palette = usePalette();
  const background = correct ? '#E2F7EE' : wrong ? '#FFEBE3' : selected ? '#EEEAFF' : palette.surface;
  const border = correct ? '#0F9D68' : wrong ? '#EE5A30' : '#6C4EF5';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: background, borderColor: border },
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {emoji ? <Emoji emoji={emoji} size={28} /> : null}
      <Text style={[styles.choiceLabel, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export function letterWorld(index: number): WorldKey {
  return rainbow[index % rainbow.length];
}

export function FeedbackBurst({ show, message }: { show: boolean; message: string }) {
  const motion = useMotionEnabled();
  const palette = usePalette();
  useEffect(() => {
    // The message itself is the non-colour feedback. Motion only adds a short flourish.
  }, [show]);
  if (!show) return null;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
      {motion ? <Text style={styles.feedbackEmoji}>🎉</Text> : <Text style={styles.feedbackEmoji}>★</Text>}
      <Text style={[styles.feedbackText, { color: palette.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 36, gap: 14 },
  title: { fontFamily: 'Fredoka_700Bold', fontSize: 28, lineHeight: 34 },
  body: { fontFamily: 'Nunito_700Bold', fontSize: 16, lineHeight: 22 },
  button: {
    minHeight: 56,
    borderRadius: 18,
    borderBottomWidth: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  buttonEmoji: { fontSize: 22 },
  buttonLabel: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18 },
  card: {
    minHeight: 92,
    borderRadius: 22,
    borderWidth: 2,
    borderBottomWidth: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: 2 },
  cardTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20 },
  cardSubtitle: { fontFamily: 'Nunito_700Bold', fontSize: 14 },
  progress: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, marginTop: 2 },
  hero: {
    borderRadius: 28,
    borderBottomWidth: 7,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 4, minHeight: 44 },
  star: { fontSize: 32 },
  choice: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  choiceLabel: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 20 },
  feedback: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackEmoji: { fontSize: 28 },
  feedbackText: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 18 },
});
