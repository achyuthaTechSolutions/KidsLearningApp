import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  alphabetData,
  animalData,
  animalSpeech,
  categoryEmojis,
  categoryLabels,
  countAloudSpeech,
  letterOrder,
  letterSpeech,
  numberData,
  numberSpeech,
  NUMBER_TOTAL,
  LETTER_TOTAL,
  ANIMAL_TOTAL,
  WORD_TOTAL,
  vocabularyData,
  type VocabularyCategory,
} from '@kids/learning-core';
import { useAppStore } from '../store/useAppStore';
import { useLearning } from '../hooks/useLearning';
import { BigButton, Body, Emoji, Hero, Screen, Title, letterWorld } from '../ui/components';
import { usePalette, worldColors } from '../ui/theme';

function Stage({ emoji, title, lines, onHear, onRepeat }: { emoji: string; title: string; lines: string[]; onHear: () => void; onRepeat: () => void }) {
  const palette = usePalette();
  return (
    <View style={[styles.stage, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
      <Emoji emoji={emoji} size={72} label={title} />
      <Title>{title}</Title>
      {lines.map((line) => <Body key={line}>{line}</Body>)}
      <View style={styles.row}>
        <BigButton label="Hear it" emoji="🔊" onPress={onHear} />
        <BigButton label="Again" emoji="🔁" world="green" onPress={onRepeat} />
      </View>
    </View>
  );
}

export function AlphabetScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const explored = useAppStore((state) => state.progress.lettersExplored);
  const addLetter = useAppStore((state) => state.addLetterExplored);
  const { say, chime } = useLearning();
  const letter = selected ? alphabetData[selected] : null;

  const choose = (value: string) => {
    setSelected(value);
    addLetter(value);
    chime();
    say(letterSpeech(value, alphabetData[value].word));
  };

  const step = (dir: -1 | 1) => {
    const index = selected ? letterOrder.indexOf(selected) : 0;
    choose(letterOrder[(index + dir + 26) % 26]);
  };

  return (
    <Screen>
      <Hero world="green" emoji="🔤" title="Alphabet World" subtitle={`${explored.length} of ${LETTER_TOTAL} letters explored`} />
      {letter && selected ? (
        <Stage
          emoji={letter.emoji}
          title={`${letter.uppercase} ${letter.lowercase}`}
          lines={[letter.description, `${letter.word} starts with "${letter.phonetic}"`]}
          onHear={() => say(letter.word)}
          onRepeat={() => say(letterSpeech(selected, letter.word))}
        />
      ) : <Body>Tap a letter to meet it.</Body>}
      <View style={styles.row}>
        <BigButton label="Back" world="slate" onPress={() => step(-1)} />
        <BigButton label="Next" world="green" onPress={() => step(1)} />
      </View>
      <View style={styles.grid}>
        {letterOrder.map((value, index) => {
          const colors = worldColors(letterWorld(index));
          const done = explored.includes(value);
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`Letter ${value}${done ? ', explored' : ''}`}
              onPress={() => choose(value)}
              style={[styles.tile, { backgroundColor: selected === value ? colors.main : colors.soft, borderColor: colors.dark }]}
            >
              <Text style={[styles.tileText, { color: selected === value ? colors.onMain : colors.ink }]}>{value}</Text>
              {done ? <Text style={styles.done}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Body>Uppercase and lowercase stay together, so a child can see both shapes.</Body>
    </Screen>
  );
}

export function NumbersScreen() {
  const [selected, setSelected] = useState<number | null>(null);
  const explored = useAppStore((state) => state.progress.numbersExplored);
  const addNumber = useAppStore((state) => state.addNumberExplored);
  const { say, chime } = useLearning();
  const item = selected !== null ? numberData[selected] : null;

  const choose = (value: number) => {
    setSelected(value);
    addNumber(value);
    chime();
    const data = numberData[value];
    say(numberSpeech(data.word, data.description));
  };

  return (
    <Screen>
      <Hero world="sun" emoji="🔢" title="Number World" subtitle={`${explored.length} of ${NUMBER_TOTAL} numbers explored`} />
      {item ? (
        <Stage
          emoji={item.emoji}
          title={`${item.value} · ${item.word}`}
          lines={[item.description, item.value === 0 ? 'Nothing to count yet.' : `${item.emoji.repeat(item.value)}`]}
          onHear={() => say(countAloudSpeech(item.value))}
          onRepeat={() => say(numberSpeech(item.word, item.description))}
        />
      ) : <Body>Tap a number and count the pictures.</Body>}
      <View style={styles.grid}>
        {numberData.map((number) => {
          const colors = worldColors(letterWorld(number.value + 5));
          const done = explored.includes(number.value);
          return (
            <Pressable
              key={number.value}
              accessibilityRole="button"
              accessibilityLabel={`Number ${number.value}${done ? ', explored' : ''}`}
              onPress={() => choose(number.value)}
              style={[styles.tile, { backgroundColor: selected === number.value ? colors.main : colors.soft, borderColor: colors.dark }]}
            >
              <Text style={[styles.tileText, { color: selected === number.value ? colors.onMain : colors.ink }]}>{number.value}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const habitats = ['Home', 'Farm', 'Savanna', 'Jungle', 'Pond', 'Sky', 'Forest', 'Antarctic'] as const;

export function AnimalsScreen() {
  const [selected, setSelected] = useState<number | null>(null);
  const discovered = useAppStore((state) => state.progress.animalsDiscovered);
  const addAnimal = useAppStore((state) => state.addAnimalDiscovered);
  const { say, chime } = useLearning();
  const palette = usePalette();
  const animal = selected !== null ? animalData[selected] : null;

  const choose = (index: number) => {
    const next = animalData[index];
    setSelected(index);
    addAnimal(next.name);
    chime();
    say(animalSpeech(next.name, next.description, next.sound));
  };

  return (
    <Screen>
      <Hero world="orange" emoji="🦁" title="Animal Kingdom" subtitle={`${discovered.length} of ${ANIMAL_TOTAL} animals discovered`} />
      {animal ? (
        <Stage
          emoji={animal.emoji}
          title={animal.name}
          lines={[animal.description, `Says “${animal.sound}”`, animal.funFact, `Lives in the ${animal.habitat}`]}
          onHear={() => say(`${animal.name} says ${animal.sound}!`)}
          onRepeat={() => say(animalSpeech(animal.name, animal.description, animal.sound))}
        />
      ) : <Body>Tap an animal to hear what it says.</Body>}
      <View style={styles.row}>
        <BigButton label="Back" world="slate" onPress={() => choose(((selected ?? 0) - 1 + animalData.length) % animalData.length)} />
        <BigButton label="Next" world="orange" onPress={() => choose(((selected ?? 0) + 1) % animalData.length)} />
      </View>
      {animalData.map((item, index) => {
        const done = discovered.includes(item.name);
        return (
          <Pressable
            key={item.name}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}${done ? ', discovered' : ''}. Says ${item.sound}`}
            onPress={() => choose(index)}
            style={[styles.wideTile, { backgroundColor: palette.surface, borderColor: selected === index ? '#EE5A30' : palette.outline }]}
          >
            <Emoji emoji={item.emoji} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.animalName, { color: palette.text }]}>{item.name}</Text>
              <Text style={{ color: palette.muted, fontFamily: 'Nunito_700Bold' }}>“{item.sound}”</Text>
            </View>
            {done ? <Text>✓</Text> : null}
          </Pressable>
        );
      })}
      <Body>Homes you can visit: {habitats.join(', ')}.</Body>
    </Screen>
  );
}

const categories = Object.keys(categoryLabels) as VocabularyCategory[];

export function WordsScreen() {
  const [category, setCategory] = useState<VocabularyCategory>('fruits');
  const [selected, setSelected] = useState<string | null>(null);
  const learned = useAppStore((state) => state.progress.wordsLearned);
  const addWord = useAppStore((state) => state.addWordLearned);
  const { say, chime } = useLearning();
  const palette = usePalette();
  const items = vocabularyData.filter((item) => item.category === category);
  const word = items.find((item) => item.word === selected) ?? null;

  const choose = (value: string, description: string) => {
    setSelected(value);
    addWord(value);
    chime();
    say(`${value}! ${description}`);
  };

  return (
    <Screen>
      <Hero world="pink" emoji="📚" title="My First Words" subtitle={`${learned.length} of ${WORD_TOTAL} words learned`} />
      <View style={styles.row}>
        {categories.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item }}
            accessibilityLabel={categoryLabels[item]}
            onPress={() => { setCategory(item); setSelected(null); }}
            style={[styles.chip, { backgroundColor: category === item ? '#E8448C' : palette.surface, borderColor: palette.outline }]}
          >
            <Text style={{ color: category === item ? '#FFFFFF' : palette.text, fontFamily: 'Nunito_800ExtraBold' }}>
              {categoryEmojis[item]} {categoryLabels[item]}
            </Text>
          </Pressable>
        ))}
      </View>
      {word ? (
        <Stage
          emoji={word.emoji}
          title={word.word}
          lines={[word.description, categoryLabels[word.category]]}
          onHear={() => say(word.word)}
          onRepeat={() => say(`${word.word}! ${word.description}`)}
        />
      ) : <Body>Choose a picture to learn the word.</Body>}
      <View style={styles.grid}>
        {items.map((item) => {
          const done = learned.includes(item.word);
          return (
            <Pressable
              key={`${item.category}-${item.word}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.word}${done ? ', learned' : ''}`}
              onPress={() => choose(item.word, item.description)}
              style={[styles.word, { backgroundColor: palette.surface, borderColor: selected === item.word ? '#E8448C' : palette.outline }]}
            >
              <Emoji emoji={item.emoji} size={40} />
              <Text style={[styles.animalName, { color: palette.text }]}>{item.word}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { borderWidth: 2, borderRadius: 24, padding: 16, gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: 64, height: 64, borderRadius: 16, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontFamily: 'Fredoka_700Bold', fontSize: 26 },
  done: { position: 'absolute', top: 2, right: 4, fontSize: 12 },
  wideTile: { minHeight: 72, borderRadius: 18, borderWidth: 2, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  animalName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18 },
  chip: { minHeight: 44, borderRadius: 16, borderWidth: 2, paddingHorizontal: 10, justifyContent: 'center' },
  word: { width: '47%', minHeight: 110, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 8 },
});
