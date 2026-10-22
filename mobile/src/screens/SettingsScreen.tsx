import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  createParentChallenge,
  isChildVoiceName,
  isParentAnswer,
  RECOMMENDED_VOICE_LABEL,
  VOICE_PREVIEW_TEXT,
} from '@kids/learning-core';
import { useAppStore } from '../store/useAppStore';
import { useLearning } from '../hooks/useLearning';
import { getInstalledVoices, refreshVoices, speak } from '../services/speech';
import { BigButton, Body, Hero, Screen, Title } from '../ui/components';
import { usePalette } from '../ui/theme';

const volumes = [0, 0.3, 0.7, 1];
const rates = [0.6, 0.9, 1.1, 1.4];

function nearest(value: number, options: number[]): number {
  return options.reduce((best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best));
}
const themes = ['light', 'dark', 'system'] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const palette = usePalette();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const resetAllProgress = useAppStore((state) => state.resetAllProgress);
  const { say } = useLearning();
  const [voices, setVoices] = useState(getInstalledVoices());
  const [gate, setGate] = useState<ReturnType<typeof createParentChallenge> | null>(null);
  const [answer, setAnswer] = useState('');
  const [gateError, setGateError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    void refreshVoices().then(setVoices);
  }, []);

  const missingVoice = Boolean(settings.selectedVoice && !voices.some((voice) => voice.name === settings.selectedVoice));

  return (
    <Screen>
      <Hero world="slate" emoji="⚙️" title="Parent Settings" subtitle="Sound, speech, and progress stay on this device." />
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
        <Title>Sound and speech</Title>
        <Row label="Speech" value={settings.speechEnabled} onChange={(speechEnabled) => updateSettings({ speechEnabled })} />
        <Row label="Sound effects" value={settings.soundEnabled} onChange={(soundEnabled) => updateSettings({ soundEnabled })} />
        <Body>Volume</Body>
        <View style={styles.row}>
          {volumes.map((volume) => (
            <Choice key={volume} label={volume === 0 ? 'Off' : `${Math.round(volume * 100)}%`} selected={nearest(settings.volume, volumes) === volume} onPress={() => updateSettings({ volume })} />
          ))}
        </View>
        <Body>Speech speed</Body>
        <View style={styles.row}>
          {rates.map((rate) => (
            <Choice key={rate} label={rate < 0.8 ? 'Slow' : rate < 1 ? 'Gentle' : rate < 1.2 ? 'Normal' : 'Fast'} selected={nearest(settings.speechRate, rates) === rate} onPress={() => updateSettings({ speechRate: rate })} />
          ))}
        </View>
        <Body>Voice</Body>
        <Choice label={RECOMMENDED_VOICE_LABEL} selected={!settings.selectedVoice} onPress={() => updateSettings({ selectedVoice: null })} />
        {missingVoice ? <Body>The saved voice is not on this device. A soft voice is used instead.</Body> : null}
        {voices.map((voice) => (
          <Choice
            key={voice.identifier}
            label={isChildVoiceName(voice.name) ? `${voice.name} (youthful)` : voice.name}
            selected={settings.selectedVoice === voice.name}
            onPress={() => updateSettings({ selectedVoice: voice.name })}
          />
        ))}
        {voices.length === 0 ? <Body>No English voice list is available yet. Speech still uses the device voice.</Body> : null}
        <BigButton
          label="Preview voice"
          emoji="🔊"
          onPress={() => {
            if (!settings.speechEnabled) return;
            speak(VOICE_PREVIEW_TEXT, { rate: settings.speechRate, voice: settings.selectedVoice, volume: settings.volume });
          }}
        />
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
        <Title>Appearance</Title>
        <View style={styles.row}>
          {themes.map((theme) => (
            <Choice key={theme} label={theme === 'system' ? 'Match device' : theme === 'light' ? 'Light' : 'Dark'} selected={settings.theme === theme} onPress={() => updateSettings({ theme })} />
          ))}
        </View>
        <Row label="Reduced motion" value={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
        <Title>Progress</Title>
        <Body>Reset clears explored lessons, scores, the streak, badges, today's challenge, and Dino Dash scores. Sound settings stay.</Body>
        {resetDone ? <Body>Progress is cleared on this device.</Body> : null}
        {!gate && !confirming ? <BigButton label="Reset all progress" world="orange" onPress={() => { setGate(createParentChallenge()); setAnswer(''); setGateError(false); }} /> : null}
        {gate && !confirming ? (
          <View style={{ gap: 8 }}>
            <Body>A grown-up question: {gate.prompt}</Body>
            <TextInput
              accessibilityLabel="Parent answer"
              keyboardType="number-pad"
              value={answer}
              onChangeText={setAnswer}
              style={[styles.input, { color: palette.text, borderColor: palette.outline }]}
            />
            {gateError ? <Body>That answer does not match. Try the question again.</Body> : null}
            <BigButton
              label="Continue"
              onPress={() => {
                if (!isParentAnswer(gate, answer)) {
                  setGateError(true);
                  setGate(createParentChallenge());
                  setAnswer('');
                  return;
                }
                setConfirming(true);
              }}
            />
            <BigButton label="Cancel" world="slate" onPress={() => setGate(null)} />
          </View>
        ) : null}
        {confirming ? (
          <View style={{ gap: 8 }}>
            <Body>Reset learning progress on this device?</Body>
            <BigButton
              label="Yes, reset"
              world="orange"
              onPress={() => {
                void resetAllProgress().then(() => {
                  setConfirming(false);
                  setGate(null);
                  setResetDone(true);
                  say('Progress reset.');
                });
              }}
            />
            <BigButton label="Keep progress" world="green" onPress={() => { setConfirming(false); setGate(null); }} />
          </View>
        ) : null}
        <BigButton label="Privacy" world="slate" onPress={() => router.push('/privacy')} />
      </View>
    </Screen>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const palette = usePalette();
  return (
    <View style={styles.switchRow}>
      <Text style={{ flex: 1, color: palette.text, fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>{label}</Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} />
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.choice, { backgroundColor: selected ? '#6C4EF5' : palette.surface, borderColor: palette.outline }]}
    >
      <Text style={{ color: selected ? '#FFFFFF' : palette.text, fontFamily: 'Nunito_800ExtraBold' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderRadius: 24, padding: 14, gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
  choice: { minHeight: 44, borderRadius: 14, borderWidth: 2, paddingHorizontal: 12, justifyContent: 'center' },
  input: { minHeight: 52, borderWidth: 2, borderRadius: 14, paddingHorizontal: 12, fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
});
