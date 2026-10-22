import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { builtInMelodies, drumSounds, fluteNotes, guitarNotes, pianoNotes, xylophoneNotes, worlds } from '@kids/learning-core';
import { useAppStore } from '../store/useAppStore';
import { useLearning } from '../hooks/useLearning';
import { playDrum, playInstrument } from '../services/audio';
import { Body, Emoji, Hero, Screen, Title } from '../ui/components';
import { usePalette } from '../ui/theme';

type Instrument = 'piano' | 'xylophone' | 'drums' | 'guitar' | 'flute';

const instruments: { id: Instrument; label: string; emoji: string }[] = [
  { id: 'piano', label: 'Piano', emoji: '🎹' },
  { id: 'xylophone', label: 'Xylophone', emoji: '🎵' },
  { id: 'drums', label: 'Drums', emoji: '🥁' },
  { id: 'guitar', label: 'Guitar', emoji: '🎸' },
  { id: 'flute', label: 'Flute', emoji: '🎶' },
];

const noteColors: Record<string, string> = {
  C: worlds.red.main,
  D: worlds.orange.main,
  E: worlds.sun.main,
  F: worlds.green.main,
  G: worlds.blue.main,
  A: worlds.violet.main,
  B: worlds.pink.main,
};

export default function MusicScreen() {
  const palette = usePalette();
  const { say, settings } = useLearning();
  const increment = useAppStore((state) => state.incrementMusicActivities);
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [active, setActive] = useState<string | null>(null);
  const [song, setSong] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopSong = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSong(null);
  };

  useEffect(() => () => stopSong(), []);

  const flash = (key: string) => {
    setActive(key);
    setTimeout(() => setActive((current) => (current === key ? null : current)), 180);
  };

  const play = (key: string) => {
    flash(key);
    const current = useAppStore.getState().settings;
    if (!current.soundEnabled || current.volume <= 0) return;
    increment();
    const volume = current.volume;
    if (instrument === 'piano') {
      const note = pianoNotes.find((item) => item.key === key);
      if (note) playInstrument('piano', note.frequency, volume);
    } else if (instrument === 'xylophone') {
      const note = xylophoneNotes.find((item) => item.key === key);
      if (note) playInstrument('xylophone', note.frequency, volume);
    } else if (instrument === 'drums') {
      const drum = drumSounds.find((item) => item.key === key);
      if (drum) playDrum(drum.type, volume);
    } else if (instrument === 'guitar') {
      const note = guitarNotes.find((item) => item.key === key);
      if (note) playInstrument('guitar', note.frequency, volume);
    } else {
      const note = fluteNotes.find((item) => item.key === key);
      if (note) playInstrument('flute', note.frequency, volume);
    }
  };

  const playSong = (index: number) => {
    if (song !== null) {
      stopSong();
      return;
    }
    setSong(index);
    const melody = builtInMelodies[index];
    say(`Playing ${melody.name}!`);
    const notes = new Map(pianoNotes.map((note) => [note.note, note]));
    let time = 0;
    melody.notes.forEach(({ note, duration }) => {
      const timer = setTimeout(() => {
        const target = notes.get(note);
        const current = useAppStore.getState().settings;
        if (target) flash(target.key);
        if (!current.soundEnabled || current.volume <= 0 || !target) return;
        playInstrument('piano', target.frequency, current.volume);
      }, time * 1000);
      timers.current.push(timer);
      time += duration;
    });
    timers.current.push(setTimeout(() => setSong(null), time * 1000));
  };

  const pads = instrument === 'piano'
    ? pianoNotes.map((note) => ({ key: note.key, label: note.label, color: note.isBlack ? '#2B2D42' : (noteColors[note.label] ?? '#FFFFFF'), light: !note.isBlack }))
    : instrument === 'xylophone'
      ? xylophoneNotes.map((note, index) => ({ key: note.key, label: note.label, color: Object.values(noteColors)[index % 7], light: true }))
      : instrument === 'drums'
        ? drumSounds.map((drum) => ({ key: drum.key, label: drum.name, color: worlds.violet.main, light: true }))
        : instrument === 'guitar'
          ? guitarNotes.map((note) => ({ key: note.key, label: note.label, color: noteColors[note.label] ?? worlds.orange.main, light: true }))
          : fluteNotes.map((note, index) => ({ key: note.key, label: note.label, color: Object.values(noteColors)[index % 7], light: true }));

  return (
    <Screen>
      <Hero world="blue" emoji="🎹" title="Music Studio" subtitle="Real instrument tones, made on this device." />
      <View style={styles.row}>
        {instruments.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: instrument === item.id }}
            accessibilityLabel={item.label}
            onPress={() => { stopSong(); setInstrument(item.id); say(item.label); }}
            style={[styles.chip, { backgroundColor: instrument === item.id ? worlds.blue.main : palette.surface, borderColor: palette.outline }]}
          >
            <Text style={{ color: instrument === item.id ? '#FFFFFF' : palette.text, fontFamily: 'Nunito_800ExtraBold' }}>{item.emoji} {item.label}</Text>
          </Pressable>
        ))}
      </View>
      {!settings.soundEnabled ? <Body>Sound is off. You can still tap the pads. Turn sound on in Parent Settings to hear them.</Body> : null}
      <View style={styles.pads}>
        {pads.map((pad) => (
          <Pressable
            key={`${instrument}-${pad.key}`}
            accessibilityRole="button"
            accessibilityLabel={`Play ${pad.label}`}
            onPress={() => play(pad.key)}
            style={[styles.pad, { backgroundColor: active === pad.key ? '#FFFFFF' : pad.color, borderColor: palette.outline }]}
          >
            <Text style={{ color: pad.light && active !== pad.key ? '#FFFFFF' : '#2B2D42', fontFamily: 'Fredoka_700Bold', fontSize: 18 }}>{pad.label}</Text>
          </Pressable>
        ))}
      </View>
      <Title>Songs</Title>
      {builtInMelodies.map((melody, index) => (
        <Pressable
          key={melody.name}
          accessibilityRole="button"
          accessibilityLabel={song === index ? `Stop ${melody.name}` : `Play ${melody.name}`}
          onPress={() => playSong(index)}
          style={[styles.song, { backgroundColor: palette.surface, borderColor: palette.outline }]}
        >
          <Emoji emoji={melody.name.includes('Twinkle') ? '⭐' : melody.name.includes('Lamb') ? '🐑' : '🎂'} size={28} />
          <Text style={{ flex: 1, color: palette.text, fontFamily: 'Fredoka_600SemiBold', fontSize: 18 }}>{song === index ? `Stop ${melody.name}` : melody.name}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 48, borderRadius: 16, borderWidth: 2, paddingHorizontal: 12, justifyContent: 'center' },
  pads: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pad: { minWidth: 72, minHeight: 72, borderRadius: 18, borderWidth: 2, borderBottomWidth: 5, alignItems: 'center', justifyContent: 'center', padding: 8 },
  song: { minHeight: 64, borderRadius: 18, borderWidth: 2, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
