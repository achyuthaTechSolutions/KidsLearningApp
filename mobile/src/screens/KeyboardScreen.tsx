import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { alphabetData, letterOrder, numberData, punctuationData, specialKeyData } from '@kids/learning-core';
import { useAppStore } from '../store/useAppStore';
import { useLearning } from '../hooks/useLearning';
import { Body, Emoji, FeedbackBurst, Hero, Screen, Title } from '../ui/components';
import { usePalette, worldColors } from '../ui/theme';

type Mode = 'free' | 'letters' | 'numbers' | 'guess' | 'find';

const rows = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const specials = ['Space', 'Enter', 'Backspace', 'Shift', 'Tab', 'Escape'];

const modes: { id: Mode; label: string }[] = [
  { id: 'free', label: 'Explore' },
  { id: 'letters', label: 'Letters' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'guess', label: 'Guess' },
  { id: 'find', label: 'Find' },
];

function contentFor(key: string) {
  const upper = key.toUpperCase();
  if (alphabetData[upper] && key.length === 1 && /[a-z]/i.test(key)) {
    const letter = alphabetData[upper];
    return { title: `${letter.uppercase} ${letter.lowercase}`, subtitle: letter.description, emoji: letter.emoji, speech: `Letter ${upper}. ${upper} is for ${letter.word}. ${letter.word} starts with the sound ${upper}.` };
  }
  if (/^\d$/.test(key)) {
    const number = numberData[Number(key)];
    return { title: number.word, subtitle: number.description, emoji: number.emoji, speech: `${number.word}! ${number.description}` };
  }
  const named = key === ' ' ? ' ' : key;
  const special = specialKeyData[named] ?? specialKeyData[key] ?? punctuationData[key];
  if (special) return { title: special.name, subtitle: special.description, emoji: special.emoji, speech: `${special.name}. ${special.description}` };
  return { title: `Key ${key}`, subtitle: 'This is a key on the keyboard.', emoji: '⌨️', speech: `Key ${key}` };
}

export default function KeyboardScreen() {
  const palette = usePalette();
  const { say, chime, settings, success } = useLearning();
  const addLetterExplored = useAppStore((state) => state.addLetterExplored);
  const addNumberExplored = useAppStore((state) => state.addNumberExplored);
  const [mode, setMode] = useState<Mode>('free');
  const [content, setContent] = useState<ReturnType<typeof contentFor> | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [hardware, setHardware] = useState(false);
  const lastTap = useRef(0);

  const newTarget = (nextMode: Mode) => {
    if (nextMode === 'guess') {
      const letter = letterOrder[Math.floor(Math.random() * letterOrder.length)];
      setTarget(letter);
      setResult(null);
      const letterContent = alphabetData[letter];
      say(`Can you press the letter ${letter}? ${letter} is for ${letterContent.word}!`);
    } else if (nextMode === 'find') {
      const keys = [...letterOrder, '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Space', 'Enter'];
      const key = keys[Math.floor(Math.random() * keys.length)];
      setTarget(key);
      setResult(null);
      say(`Find the ${key} key!`);
    } else {
      setTarget(null);
      setResult(null);
    }
  };

  useEffect(() => {
    newTarget(mode);
    return () => {
      // Speech from this screen should not follow the child into the next one.
    };
  }, [mode]);

  const pressKey = (raw: string) => {
    const now = Date.now();
    if (now - lastTap.current < 180) return;
    lastTap.current = now;
    const key = raw === 'Space' ? ' ' : raw;
    const display = key === ' ' ? 'Space' : key;
    const next = contentFor(key.length === 1 ? key.toLowerCase() : key);
    setPressed(display);
    setContent(next);
    chime();
    say(next.speech);
    const upper = key.toUpperCase();
    if (alphabetData[upper] && key.length === 1 && /[a-z]/i.test(key)) addLetterExplored(upper);
    if (/^\d$/.test(key)) addNumberExplored(Number(key));

    if ((mode === 'guess' || mode === 'find') && target) {
      const found = display.toUpperCase() === target.toUpperCase() || upper === target.toUpperCase();
      if (found) {
        setResult('correct');
        success();
        say(mode === 'guess' ? 'Correct! Well done!' : 'You found it! Great job!');
        setTimeout(() => newTarget(mode), 900);
      } else if (mode === 'guess') {
        setResult('wrong');
        say('Try again!');
        setTimeout(() => setResult(null), 900);
      }
    }
  };

  return (
    <Screen>
      <Hero world="violet" emoji="⌨️" title="Keyboard Explorer" subtitle="Tap a key. A connected keyboard is optional." />
      <View style={styles.modes}>
        {modes.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === item.id }}
            accessibilityLabel={item.label}
            onPress={() => setMode(item.id)}
            style={[styles.mode, { backgroundColor: mode === item.id ? worldColors('violet').main : palette.surface, borderColor: palette.outline }]}
          >
            <Text style={{ color: mode === item.id ? '#FFFFFF' : palette.text, fontFamily: 'Nunito_800ExtraBold' }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {target ? <Title>{mode === 'guess' ? `Press ${target}` : `Find ${target}`}</Title> : null}
      <FeedbackBurst show={result === 'correct'} message="You found the right key!" />
      <FeedbackBurst show={result === 'wrong'} message="Try another key." />
      {content ? (
        <View style={[styles.stage, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <Emoji emoji={content.emoji} size={64} label={content.title} />
          <Title>{content.title}</Title>
          <Body>{content.subtitle}</Body>
          <Pressable accessibilityRole="button" accessibilityLabel="Repeat" onPress={() => content && say(content.speech)} style={styles.repeat}>
            <Text style={styles.repeatText}>Hear it again</Text>
          </Pressable>
        </View>
      ) : (
        <Body>Pick a key to see its picture and hear its name.</Body>
      )}
      {rows.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => {
            const hidden = (mode === 'letters' && /\d/.test(key)) || (mode === 'numbers' && /[a-z]/.test(key));
            if (hidden) return null;
            const label = key.toUpperCase();
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={alphabetData[label] ? `Letter ${label}` : `Number ${label}`}
                onPress={() => pressKey(key)}
                style={[styles.key, { backgroundColor: pressed?.toUpperCase() === label ? worldColors('violet').light : palette.surface, borderColor: palette.outline }]}
              >
                <Text style={[styles.keyText, { color: palette.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.row}>
        {specials.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={specialKeyData[key === 'Space' ? ' ' : key]?.name ?? key}
            onPress={() => pressKey(key)}
            style={[styles.wide, { backgroundColor: palette.surface, borderColor: palette.outline }]}
          >
            <Text style={{ color: palette.text, fontFamily: 'Nunito_800ExtraBold' }}>{key}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={hardware ? 'Hardware keyboard listening' : 'Use a connected keyboard'} onPress={() => setHardware(true)} style={styles.repeat}>
        <Text style={styles.repeatText}>{hardware ? 'A connected keyboard can press keys too' : 'Use a connected keyboard'}</Text>
      </Pressable>
      {hardware ? <TextInput
        value=""
        onChangeText={() => undefined}
        autoFocus
        showSoftInputOnFocus={false}
        autoCorrect={false}
        autoCapitalize="none"
        caretHidden
        importantForAccessibility="no"
        accessibilityElementsHidden
        onKeyPress={(event) => {
          if (!hardware) return;
          const key = event.nativeEvent.key;
          if (!key || key === 'Unidentified') return;
          pressKey(key === ' ' ? 'Space' : key);
        }}
        style={styles.hidden}
      /> : null}
      {!settings.speechEnabled ? <Body>Speech is off. The picture and words still show the answer.</Body> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mode: { minHeight: 44, borderRadius: 14, borderWidth: 2, paddingHorizontal: 12, justifyContent: 'center' },
  stage: { borderWidth: 2, borderRadius: 24, padding: 16, alignItems: 'flex-start', gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  key: { minWidth: 44, minHeight: 52, borderRadius: 12, borderWidth: 2, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  keyText: { fontFamily: 'Fredoka_700Bold', fontSize: 20 },
  wide: { minHeight: 48, borderRadius: 12, borderWidth: 2, paddingHorizontal: 12, justifyContent: 'center' },
  repeat: { minHeight: 48, justifyContent: 'center' },
  repeatText: { fontFamily: 'Nunito_800ExtraBold', color: '#4B2FCB', fontSize: 16 },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
