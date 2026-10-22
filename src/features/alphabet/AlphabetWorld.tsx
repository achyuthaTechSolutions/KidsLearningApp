import { useState } from 'react';
import { Box, Typography, Grid, Button, IconButton, Card, CardContent, LinearProgress, Chip } from '@mui/material';
import { VolumeUp, NavigateBefore, NavigateNext, Replay } from '@mui/icons-material';
import { alphabetData, letterOrder } from '../../data/alphabet';
import { LETTER_TOTAL } from '../../services/progressStats';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech, speakLetter } from '../../services/speech';
import { playConfirmation } from '../../services/audio';

const letterColors = [
  '#E17055','#00B894','#6C5CE7','#FDCB6E','#74B9FF',
  '#FF7675','#A29BFE','#55EFC4','#FAB1A0','#81ECEC',
  '#DFE6E9','#FFEAA7','#FD79A8','#636E72','#00CEC9',
  '#E84393','#0984E3','#F39C12','#6AB04C','#EB4D4B',
  '#7ED6DF','#E056FD','#F9CA24','#30336B','#22A6B3','#BE2EDD',
];

export default function AlphabetWorld() {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const settings = useAppStore((s) => s.settings);
  const progress = useAppStore((s) => s.progress);
  const addLetterExplored = useAppStore((s) => s.addLetterExplored);

  const explored = progress.lettersExplored;

  const handleSelect = (letter: string) => {
    setSelectedLetter(letter);
    addLetterExplored(letter);
    if (settings.soundEnabled) playConfirmation(settings.volume * 0.3);
    if (settings.speechEnabled) {
      cancelSpeech();
      const d = alphabetData[letter];
      speakLetter(letter, d.word, settings.speechRate);
    }
  };

  const handleNav = (dir: -1 | 1) => {
    const idx = selectedLetter ? letterOrder.indexOf(selectedLetter) : -1;
    const next = (idx + dir + 26) % 26;
    handleSelect(letterOrder[next]);
  };

  const handleRepeat = () => {
    if (selectedLetter && settings.speechEnabled) {
      const d = alphabetData[selectedLetter];
      speakLetter(selectedLetter, d.word, settings.speechRate);
    }
  };

  const d = selectedLetter ? alphabetData[selectedLetter] : null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          🔤 Alphabet World
        </Typography>
        <Typography variant="body1" color="text.secondary">Click a letter to learn about it!</Typography>
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 1 }}>
          <LinearProgress variant="determinate" value={(explored.length / LETTER_TOTAL) * 100}
            sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4 } }} />
          <Typography variant="caption" color="text.secondary">{explored.length}/{LETTER_TOTAL} letters explored</Typography>
        </Box>
      </Box>

      {/* Letter Grid */}
      <Grid container spacing={1} sx={{ mb: 3, justifyContent: 'center' }}>
        {letterOrder.map((letter, i) => {
          const isExplored = explored.includes(letter);
          const isSelected = selectedLetter === letter;
          return (
            <Grid key={letter}>
              <Button
                onClick={() => handleSelect(letter)}
                variant={isSelected ? 'contained' : 'outlined'}
                sx={{
                  width: { xs: 44, sm: 52, md: 60 },
                  height: { xs: 44, sm: 52, md: 60 },
                  fontSize: { xs: '1.1rem', md: '1.4rem' },
                  fontWeight: 800,
                  borderRadius: 3,
                  bgcolor: isSelected ? letterColors[i] : isExplored ? `${letterColors[i]}22` : 'background.paper',
                  color: isSelected ? 'white' : letterColors[i],
                  borderColor: letterColors[i],
                  '&:hover': { bgcolor: isSelected ? letterColors[i] : `${letterColors[i]}33` },
                  position: 'relative',
                }}
              >
                {letter}
                {isExplored && !isSelected && (
                  <Box sx={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', bgcolor: '#00B894' }} />
                )}
              </Button>
            </Grid>
          );
        })}
      </Grid>

      {/* Letter Detail */}
      {d && (
        <Card sx={{ maxWidth: 600, mx: 'auto', borderTop: `4px solid ${letterColors[letterOrder.indexOf(selectedLetter!)]}` }}>
          <CardContent sx={{ textAlign: 'center', p: { xs: 3, md: 4 } }}>
            <Typography sx={{ fontSize: { xs: '4rem', md: '6rem' }, lineHeight: 1, mb: 1 }}>{d.emoji}</Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '4rem' }, color: letterColors[letterOrder.indexOf(selectedLetter!)], mb: 0 }}>
              {d.uppercase} {d.lowercase}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>{d.description}</Typography>
            <Chip label={`Phonetic: "${d.phonetic}"`} variant="outlined" sx={{ mb: 2, fontWeight: 600 }} />

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
              <Button startIcon={<NavigateBefore />} onClick={() => handleNav(-1)} variant="outlined" sx={{ borderRadius: 3 }}>Previous</Button>
              <IconButton aria-label="Repeat the letter" onClick={handleRepeat} color="primary" sx={{ bgcolor: 'action.hover' }}>
                <Replay />
              </IconButton>
              <IconButton aria-label="Hear the word" onClick={() => { if (settings.speechEnabled) speak(d.word, { rate: settings.speechRate }); }} color="secondary" sx={{ bgcolor: 'action.hover' }}>
                <VolumeUp />
              </IconButton>
              <Button endIcon={<NavigateNext />} onClick={() => handleNav(1)} variant="outlined" sx={{ borderRadius: 3 }}>Next</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {!d && (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>👆</Typography>
          <Typography variant="h4" color="text.secondary">Select a letter to begin!</Typography>
        </Box>
      )}
    </Box>
  );
}
