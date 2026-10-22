import { useState } from 'react';
import { Box, Typography, Grid, Card, CardActionArea, Chip, ToggleButtonGroup, ToggleButton, IconButton } from '@mui/material';
import { VolumeUp } from '@mui/icons-material';
import { vocabularyData, categoryLabels, categoryEmojis } from '../../data/vocabulary';
import { WORD_TOTAL } from '../../services/progressStats';
import type { VocabularyCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech } from '../../services/speech';
import { playConfirmation } from '../../services/audio';

const categories = Object.keys(categoryLabels) as VocabularyCategory[];

export default function MyFirstWords() {
  const [category, setCategory] = useState<VocabularyCategory>('fruits');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const settings = useAppStore((s) => s.settings);
  const addWordLearned = useAppStore((s) => s.addWordLearned);
  const progress = useAppStore((s) => s.progress);

  const filtered = vocabularyData.filter((v) => v.category === category);

  const handleSelect = (word: string) => {
    setSelectedWord(word);
    const item = vocabularyData.find((v) => v.word === word);
    if (item) {
      addWordLearned(word);
      if (settings.soundEnabled) playConfirmation(settings.volume * 0.3);
      if (settings.speechEnabled) {
        cancelSpeech();
        speak(`${item.word}! ${item.description}`, { rate: settings.speechRate });
      }
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          📖 My First Words
        </Typography>
        <Typography variant="body1" color="text.secondary">Learn new words in different categories!</Typography>
        <Typography variant="caption" color="text.secondary">{progress.wordsLearned.length}/{WORD_TOTAL} words learned</Typography>
      </Box>

      {/* Category Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, overflowX: 'auto', pb: 1 }}>
        <ToggleButtonGroup value={category} exclusive onChange={(_, v) => v && setCategory(v)} size="small">
          {categories.map((cat) => (
            <ToggleButton key={cat} value={cat} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, px: 2 }}>
              {categoryEmojis[cat]} {categoryLabels[cat]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Word Cards */}
      <Grid container spacing={2}>
        {filtered.map((item) => {
          const isSelected = selectedWord === item.word;
          const isLearned = progress.wordsLearned.includes(item.word);
          return (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.word}>
              <Card sx={{
                border: isSelected ? '3px solid' : '1px solid',
                borderColor: isSelected ? 'secondary.main' : 'divider',
                bgcolor: isSelected ? 'secondary.main' : 'background.paper',
                color: isSelected ? 'white' : 'text.primary',
                transition: 'all 0.2s',
              }}>
                <CardActionArea onClick={() => handleSelect(item.word)} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 0.5 }}>{item.emoji}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.word}</Typography>
                  {isSelected && (
                    <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>{item.description}</Typography>
                  )}
                  {isLearned && !isSelected && (
                    <Chip label="Learned" size="small" color="success" sx={{ mt: 0.5, fontSize: '0.65rem' }} />
                  )}
                </CardActionArea>
                {isSelected && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
                    <IconButton aria-label="Hear this word" onClick={() => {
                      if (settings.speechEnabled) { cancelSpeech(); speak(`${item.word}! ${item.description}`, { rate: settings.speechRate }); }
                    }} sx={{ color: isSelected ? 'white' : 'primary.main' }}>
                      <VolumeUp />
                    </IconButton>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
