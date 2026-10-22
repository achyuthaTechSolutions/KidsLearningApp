import { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Button, IconButton, Chip } from '@mui/material';
import { VolumeUp, Replay, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { animalData } from '../../data/animals';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech, speakAnimal } from '../../services/speech';
import { playConfirmation } from '../../services/audio';

export default function AnimalKingdom() {
  const [selected, setSelected] = useState<number | null>(null);
  const settings = useAppStore((s) => s.settings);
  const addAnimalDiscovered = useAppStore((s) => s.addAnimalDiscovered);
  const progress = useAppStore((s) => s.progress);

  const handleSelect = (idx: number) => {
    setSelected(idx);
    const animal = animalData[idx];
    addAnimalDiscovered(animal.name);
    if (settings.soundEnabled) playConfirmation(settings.volume * 0.3);
    if (settings.speechEnabled) {
      cancelSpeech();
      speakAnimal(animal.name, animal.description, animal.sound, settings.speechRate);
    }
  };

  const handleNav = (dir: -1 | 1) => {
    const current = selected ?? 0;
    const next = (current + dir + animalData.length) % animalData.length;
    handleSelect(next);
  };

  const animal = selected !== null ? animalData[selected] : null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          🐾 Animal Kingdom
        </Typography>
        <Typography variant="body1" color="text.secondary">Discover amazing animals and hear their sounds!</Typography>
        <Typography variant="caption" color="text.secondary">{progress.animalsDiscovered.length}/{animalData.length} animals discovered</Typography>
      </Box>

      {/* Animal Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {animalData.map((a, i) => {
          const discovered = progress.animalsDiscovered.includes(a.name);
          const isSelected = selected === i;
          return (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={a.name}>
              <Card sx={{
                border: isSelected ? '3px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'primary.main' : 'background.paper',
                color: isSelected ? 'white' : 'text.primary',
                transition: 'all 0.2s',
              }}>
                <CardActionArea onClick={() => handleSelect(i)} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '3rem', mb: 0.5 }}>{a.emoji}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{a.name}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>{a.sound}</Typography>
                  {discovered && !isSelected && (
                    <Chip label="Discovered" size="small" color="success" sx={{ mt: 0.5, fontSize: '0.65rem' }} />
                  )}
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Animal Detail */}
      {animal && (
        <Card sx={{ maxWidth: 600, mx: 'auto', borderTop: '4px solid', borderColor: 'primary.main' }}>
          <CardContent sx={{ textAlign: 'center', p: { xs: 3, md: 4 } }}>
            <Typography sx={{ fontSize: { xs: '4rem', md: '6rem' }, lineHeight: 1, mb: 1 }}>{animal.emoji}</Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5, fontSize: { xs: '2rem', md: '2.5rem' } }}>
              {animal.name}
            </Typography>
            <Typography variant="h5" sx={{ mb: 1 }}>{animal.description}</Typography>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`Sound: "${animal.sound}"`} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
              <Chip label={`Habitat: ${animal.habitat}`} color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
            </Box>

            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 3, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Fun Fact</Typography>
              <Typography variant="body1">{animal.funFact}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button startIcon={<NavigateBefore />} onClick={() => handleNav(-1)} variant="outlined" sx={{ borderRadius: 3 }}>Prev</Button>
              <IconButton aria-label="Repeat the animal" onClick={() => {
                if (settings.speechEnabled) { cancelSpeech(); speakAnimal(animal.name, animal.description, animal.sound, settings.speechRate); }
              }} color="primary" sx={{ bgcolor: 'action.hover' }}>
                <Replay />
              </IconButton>
              <IconButton aria-label="Hear the animal sound" onClick={() => {
                if (settings.speechEnabled) speak(`The ${animal.name} says ${animal.sound}!`, { rate: settings.speechRate });
              }} color="secondary" sx={{ bgcolor: 'action.hover' }}>
                <VolumeUp />
              </IconButton>
              <Button endIcon={<NavigateNext />} onClick={() => handleNav(1)} variant="outlined" sx={{ borderRadius: 3 }}>Next</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {!animal && (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🦁</Typography>
          <Typography variant="h4" color="text.secondary">Click an animal to learn about it!</Typography>
        </Box>
      )}
    </Box>
  );
}
