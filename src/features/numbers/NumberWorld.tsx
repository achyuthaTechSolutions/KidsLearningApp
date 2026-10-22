import { useState } from 'react';
import { Box, Typography, Grid, Button, IconButton, Card, CardContent, LinearProgress } from '@mui/material';
import { NavigateBefore, NavigateNext, Replay, VolumeUp } from '@mui/icons-material';
import { numberData } from '../../data/numbers';
import { NUMBER_TOTAL } from '../../services/progressStats';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech, speakNumber } from '../../services/speech';
import { playConfirmation } from '../../services/audio';

const numberColors = [
  '#636E72','#E17055','#00B894','#6C5CE7','#FDCB6E','#74B9FF',
  '#FF7675','#A29BFE','#55EFC4','#FAB1A0','#81ECEC',
  '#DFE6E9','#FFEAA7','#FD79A8','#00CEC9','#E84393',
  '#0984E3','#F39C12','#6AB04C','#EB4D4B','#7ED6DF',
];

export default function NumberWorld() {
  const [selected, setSelected] = useState<number | null>(null);
  const settings = useAppStore((s) => s.settings);
  const progress = useAppStore((s) => s.progress);
  const addNumberExplored = useAppStore((s) => s.addNumberExplored);

  const handleSelect = (num: number) => {
    setSelected(num);
    addNumberExplored(num);
    if (settings.soundEnabled) playConfirmation(settings.volume * 0.3);
    if (settings.speechEnabled) {
      cancelSpeech();
      const d = numberData[num];
      speakNumber(num, d.word, d.description, settings.speechRate);
    }
  };

  const handleNav = (dir: -1 | 1) => {
    const current = selected ?? 0;
    const next = Math.max(0, Math.min(20, current + dir));
    handleSelect(next);
  };

  const d = selected !== null ? numberData[selected] : null;

  const renderCountingObjects = (num: number, emoji: string) => {
    if (num === 0) return <Typography sx={{ fontSize: '2rem', color: 'text.secondary' }}>Nothing here!</Typography>;
    const items = [];
    for (let i = 0; i < num; i++) {
      items.push(
        <Box key={i} sx={{
          display: 'inline-block', fontSize: { xs: '1.5rem', md: '2rem' }, m: 0.3,
          animation: `popIn 0.3s ease ${i * 0.05}s both`,
          '@keyframes popIn': { '0%': { transform: 'scale(0)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        }}>
          {emoji}
        </Box>
      );
    }
    return <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>{items}</Box>;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          🔢 Number World
        </Typography>
        <Typography variant="body1" color="text.secondary">Learn to count from 0 to 20!</Typography>
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 1 }}>
          <LinearProgress variant="determinate" value={(progress.numbersExplored.length / NUMBER_TOTAL) * 100}
            sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'secondary.main' } }} />
          <Typography variant="caption" color="text.secondary">{progress.numbersExplored.length}/{NUMBER_TOTAL} numbers explored</Typography>
        </Box>
      </Box>

      {/* Number Grid */}
      <Grid container spacing={1} sx={{ mb: 3, justifyContent: 'center' }}>
        {numberData.map((n) => {
          const isExplored = progress.numbersExplored.includes(n.value);
          const isSelected = selected === n.value;
          const color = numberColors[n.value];
          return (
            <Grid key={n.value}>
              <Button
                onClick={() => handleSelect(n.value)}
                variant={isSelected ? 'contained' : 'outlined'}
                sx={{
                  width: { xs: 48, md: 60 }, height: { xs: 48, md: 60 },
                  fontSize: { xs: '1.2rem', md: '1.5rem' }, fontWeight: 800, borderRadius: 3,
                  bgcolor: isSelected ? color : isExplored ? `${color}22` : 'background.paper',
                  color: isSelected ? 'white' : color, borderColor: color,
                  '&:hover': { bgcolor: isSelected ? color : `${color}33` },
                }}
              >
                {n.value}
              </Button>
            </Grid>
          );
        })}
      </Grid>

      {/* Number Detail */}
      {d && (
        <Card sx={{ maxWidth: 600, mx: 'auto', borderTop: `4px solid ${numberColors[d.value]}` }}>
          <CardContent sx={{ textAlign: 'center', p: { xs: 3, md: 4 } }}>
            <Typography variant="h1" sx={{ fontSize: { xs: '4rem', md: '6rem' }, color: numberColors[d.value], lineHeight: 1, mb: 1 }}>
              {d.value}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>{d.word}</Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>{d.description}</Typography>

            {/* Counting display */}
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 3, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Let's count {d.value} {d.objects}!
              </Typography>
              {renderCountingObjects(d.value, d.emoji)}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button startIcon={<NavigateBefore />} onClick={() => handleNav(-1)} variant="outlined" disabled={selected === 0} sx={{ borderRadius: 3 }}>Prev</Button>
              <IconButton aria-label="Repeat the number" onClick={() => {
                if (settings.speechEnabled) { cancelSpeech(); speakNumber(d.value, d.word, d.description, settings.speechRate); }
              }} color="primary" sx={{ bgcolor: 'action.hover' }}>
                <Replay />
              </IconButton>
              <IconButton aria-label="Count out loud" onClick={() => {
                if (settings.speechEnabled) {
                  cancelSpeech();
                  let countText = `Let's count! `;
                  for (let i = 1; i <= d.value; i++) countText += `${i}. `;
                  speak(countText, { rate: settings.speechRate });
                }
              }} color="secondary" sx={{ bgcolor: 'action.hover' }}>
                <VolumeUp />
              </IconButton>
              <Button endIcon={<NavigateNext />} onClick={() => handleNav(1)} variant="outlined" disabled={selected === 20} sx={{ borderRadius: 3 }}>Next</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {!d && (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🔢</Typography>
          <Typography variant="h4" color="text.secondary">Select a number to start counting!</Typography>
        </Box>
      )}
    </Box>
  );
}
