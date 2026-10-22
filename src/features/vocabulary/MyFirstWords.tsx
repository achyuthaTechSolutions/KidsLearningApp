import { useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { VolumeUpRounded } from '@mui/icons-material';
import { vocabularyData, categoryLabels, categoryEmojis } from '../../data/vocabulary';
import { WORD_TOTAL } from '../../services/progressStats';
import type { VocabularyCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech } from '../../services/speech';
import { playConfirmation } from '../../services/audio';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import PillPicker from '../../components/ui/PillPicker';
import LearnTile from '../../components/ui/LearnTile';
import DetailStage from '../../components/ui/DetailStage';
import IllustrationBubble from '../../components/ui/IllustrationBubble';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Mascot, { SpeechBubble } from '../../components/ui/Mascot';
import { fonts, type WorldKey } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';

const categories = Object.keys(categoryLabels) as VocabularyCategory[];

const categoryWorld: Record<VocabularyCategory, WorldKey> = {
  fruits: 'red',
  vegetables: 'green',
  food: 'orange',
  vehicles: 'blue',
  colors: 'violet',
  shapes: 'teal',
  body: 'pink',
  household: 'sun',
  nature: 'green',
};

export default function MyFirstWords() {
  const [category, setCategory] = useState<VocabularyCategory>('fruits');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const settings = useAppStore((s) => s.settings);
  const addWordLearned = useAppStore((s) => s.addWordLearned);
  const progress = useAppStore((s) => s.progress);

  const filtered = vocabularyData.filter((v) => v.category === category);
  const selected = vocabularyData.find((v) => v.word === selectedWord && v.category === category)
    ?? vocabularyData.find((v) => v.word === selectedWord)
    ?? null;

  const sayWord = (word: string, description: string) => {
    if (!settings.speechEnabled) return;
    cancelSpeech();
    speak(`${word}! ${description}`, { rate: settings.speechRate });
  };

  const handleSelect = (word: string) => {
    setSelectedWord(word);
    const item = vocabularyData.find((v) => v.word === word);
    if (item) {
      addWordLearned(word);
      if (settings.soundEnabled) playConfirmation(settings.volume * 0.3);
      sayWord(item.word, item.description);
    }
  };

  const selectedWorld = selected ? categoryWorld[selected.category] : 'pink';

  return (
    <Page>
      <PageHero
        world="pink"
        title="My First Words"
        subtitle="Pick a group, then tap a picture to hear its name."
        emoji="📚"
        progress={{ value: progress.wordsLearned.length, total: WORD_TOTAL, label: 'Words learned', ariaLabel: `${progress.wordsLearned.length} of ${WORD_TOTAL} words learned` }}
      />

      <PillPicker<VocabularyCategory>
        world={categoryWorld[category]}
        ariaLabel="Word group"
        value={category}
        onChange={setCategory}
        scroll
        options={categories.map((cat) => ({ value: cat, label: categoryLabels[cat], emoji: categoryEmojis[cat] }))}
      />

      <Grid container spacing={{ xs: 3, md: 4 }}>
        <Grid size={{ xs: 12, md: 7 }} sx={{ order: { xs: 2, md: 1 } }}>
          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            {filtered.map((item, index) => {
              const learned = progress.wordsLearned.includes(item.word);
              return (
                <Grid size={{ xs: 6, sm: 4 }} key={`${item.category}-${item.word}`} sx={{ animation: `kl-rise-in 320ms ease-out ${index * 40}ms both` }}>
                  <LearnTile
                    shape="wide"
                    world={categoryWorld[item.category]}
                    selected={selectedWord === item.word}
                    done={learned}
                    ariaLabel={`${item.word}${learned ? ', learned' : ''}`}
                    onClick={() => handleSelect(item.word)}
                  >
                    <Box sx={{ py: 2, px: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <Box aria-hidden sx={{ fontSize: { xs: '2.6rem', md: '3rem' }, lineHeight: 1.1, filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.15))' }}><Illustration emoji={item.emoji} /></Box>
                      <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: '1.15rem', color: 'inherit', textAlign: 'center' }}>{item.word}</Typography>
                    </Box>
                  </LearnTile>
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }} sx={{ order: { xs: 1, md: 2 } }}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
            {selected ? (
              <DetailStage
                world={selectedWorld}
                popKey={selected.word}
                art={<IllustrationBubble emoji={selected.emoji} world={selectedWorld} size="lg" popKey={selected.word} label={selected.word} />}
                heading={selected.word}
                controls={
                  <RoundIconButton label="Hear this word" world={selectedWorld} filled size={64} onClick={() => sayWord(selected.word, selected.description)}>
                    <VolumeUpRounded />
                  </RoundIconButton>
                }
              >
                <Typography variant="body1" sx={{ mt: 0.75 }}>{selected.description}</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  <Illustration emoji={categoryEmojis[selected.category]} sx={{ mr: 0.75 }} />{categoryLabels[selected.category]}
                </Typography>
              </DetailStage>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: { xs: 1, md: 4 }, px: 1 }}>
                <Mascot size={110} mood="think" />
                <SpeechBubble>Tap a picture and I&apos;ll say the word!</SpeechBubble>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Page>
  );
}
