import { useState, type ReactNode, type Ref } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { worlds } from '@kids/learning-core';
import { useLocale } from '../i18n';
import { authColors, controls, space, usePalette } from './theme';

export function AuthScaffold({
  title,
  body,
  onBack,
  children,
}: {
  title?: string;
  body?: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { t, titleFont, bodyFont } = useLocale();
  const background = palette.mode === 'dark' ? palette.background : authColors.cream;
  return (
    <KeyboardAvoidingView
      testID="auth-keyboard"
      style={[styles.fill, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        testID="auth-scroll"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxl }]}
      >
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={onBack} style={styles.back}>
            <Text style={[styles.link, { fontFamily: bodyFont, color: authColors.primary }]}>{t('back')}</Text>
          </Pressable>
        ) : null}
        {title ? <Text style={[styles.title, { fontFamily: titleFont, color: palette.text }]}>{title}</Text> : null}
        {body ? <Text style={[styles.body, { fontFamily: bodyFont, color: palette.muted }]}>{body}</Text> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  onToggleSecure,
  showLabel,
  hideLabel,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  showLabel?: string;
  hideLabel?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: Ref<TextInputInstance>;
  testID?: string;
}) {
  const palette = usePalette();
  const { bodyFont } = useLocale();
  const errorColor = palette.mode === 'dark' ? worlds.red.inkDark : authColors.error;
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { fontFamily: bodyFont, color: palette.text }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: palette.surface, borderColor: error ? errorColor : palette.outline }]}>
        <TextInput
          ref={inputRef}
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          importantForAutofill="yes"
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={!onSubmitEditing}
          style={[styles.input, { fontFamily: bodyFont, color: palette.text }]}
        />
        {onToggleSecure && showLabel && hideLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={secureTextEntry ? showLabel : hideLabel}
            onPress={onToggleSecure}
            style={styles.eye}
          >
            <Text style={[styles.link, { fontFamily: bodyFont, color: authColors.primary }]}>{secureTextEntry ? showLabel : hideLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { fontFamily: bodyFont, color: errorColor }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, busy }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  const { titleFont } = useLocale();
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={busy ? label : label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, inactive ? styles.inactive : null, pressed && !inactive ? styles.pressed : null]}
    >
      {busy ? <ActivityIndicator color="#FFFFFF" /> : null}
      <Text style={[styles.primaryLabel, { fontFamily: titleFont }]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const palette = usePalette();
  const { titleFont } = useLocale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, { backgroundColor: palette.surface, borderColor: authColors.primary }, pressed ? styles.pressed : null]}
    >
      <Text style={[styles.secondaryLabel, { fontFamily: titleFont, color: authColors.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const { bodyFont } = useLocale();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress} style={styles.back}>
      <Text style={[styles.link, { fontFamily: bodyFont, color: authColors.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function CheckboxField({ label, checked, onChange, error }: { label: string; checked: boolean; onChange: (checked: boolean) => void; error?: string }) {
  const palette = usePalette();
  const { bodyFont } = useLocale();
  const errorColor = palette.mode === 'dark' ? worlds.red.inkDark : authColors.error;
  return (
    <View style={styles.field}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.checkRow}
      >
        <View style={[styles.box, { borderColor: authColors.primary, backgroundColor: checked ? authColors.primary : palette.surface }]}>
          {checked ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={[styles.checkLabel, { fontFamily: bodyFont, color: palette.text }]}>{label}</Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { fontFamily: bodyFont, color: errorColor }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function LanguageSelector() {
  const { locale, setLocale, t, bodyFont } = useLocale();
  const palette = usePalette();
  const options = [
    { id: 'en' as const, label: t('langEnglish') },
    { id: 'te' as const, label: t('langTelugu') },
    { id: 'hi' as const, label: t('langHindi') },
  ];
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { fontFamily: bodyFont, color: palette.text }]}>{t('language')}</Text>
      <View style={styles.wrap}>
        {options.map((option) => {
          const selected = locale === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => setLocale(option.id)}
              style={[styles.chip, { backgroundColor: selected ? authColors.primary : palette.surface, borderColor: authColors.primary }]}
            >
              <Text style={{ fontFamily: bodyFont, color: selected ? '#FFFFFF' : palette.text, fontSize: 16 }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ChoiceCard({ label, selected, onPress, children }: { label: string; selected?: boolean; onPress: () => void; children?: ReactNode }) {
  const palette = usePalette();
  const { bodyFont } = useLocale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, { backgroundColor: selected ? '#EEEAFF' : palette.surface, borderColor: selected ? authColors.primary : palette.outline }]}
    >
      {children}
      <Text style={[styles.choiceLabel, { fontFamily: bodyFont, color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export function BannerError({ message }: { message?: string }) {
  const palette = usePalette();
  const { bodyFont } = useLocale();
  if (!message) return null;
  const errorColor = palette.mode === 'dark' ? worlds.red.inkDark : authColors.error;
  return (
    <View style={[styles.banner, { backgroundColor: palette.mode === 'dark' ? palette.surface : authColors.errorSoft, borderColor: errorColor }]}>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ fontFamily: bodyFont, color: errorColor, fontSize: 16, lineHeight: 22 }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: space.lg, gap: space.md },
  title: { fontSize: 32, lineHeight: 40 },
  body: { fontSize: 16, lineHeight: 24 },
  back: { minHeight: controls.minTouch, justifyContent: 'center', alignSelf: 'flex-start' },
  link: { fontSize: 16, lineHeight: 22 },
  field: { gap: space.sm },
  label: { fontSize: 16, lineHeight: 22 },
  inputRow: { minHeight: controls.input, borderWidth: 2, borderRadius: 18, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minHeight: controls.input, paddingHorizontal: space.lg, fontSize: 18 },
  eye: { minHeight: controls.minTouch, justifyContent: 'center', paddingRight: space.md },
  error: { fontSize: 15, lineHeight: 21 },
  primary: {
    minHeight: controls.button,
    borderRadius: 18,
    backgroundColor: authColors.primary,
    borderBottomWidth: 5,
    borderBottomColor: authColors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  primaryLabel: { color: '#FFFFFF', fontSize: 18, textAlign: 'center', flexShrink: 1 },
  secondary: {
    minHeight: controls.button,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  secondaryLabel: { fontSize: 18, textAlign: 'center', flexShrink: 1 },
  inactive: { opacity: 0.55 },
  pressed: { transform: [{ translateY: 2 }] },
  checkRow: { minHeight: controls.minTouch, flexDirection: 'row', alignItems: 'center', gap: space.md },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#FFFFFF', fontSize: 18, lineHeight: 22 },
  checkLabel: { flex: 1, fontSize: 16, lineHeight: 22 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: controls.minTouch, borderRadius: 16, borderWidth: 2, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' },
  choice: { minHeight: 64, borderRadius: 18, borderWidth: 2, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  choiceLabel: { flex: 1, fontSize: 18, lineHeight: 24 },
  banner: { borderWidth: 2, borderRadius: 18, padding: space.md },
});
