import { useState, type ReactNode } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { VolumeUpRounded, ReplayRounded, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { animalData } from '../../data/animals';
import { ANIMAL_TOTAL } from '../../services/progressStats';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech, speakAnimal } from '../../services/speech';
import { playConfirmation } from '../../services/audio';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import LearnTile from '../../components/ui/LearnTile';
import DetailStage from '../../components/ui/DetailStage';
import IllustrationBubble from '../../components/ui/IllustrationBubble';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Mascot, { SpeechBubble } from '../../components/ui/Mascot';
import { useWorld } from '../../components/ui/world';
import { fonts, type WorldKey } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';

const habitatWorld: Record<string, WorldKey> = {
  Home: 'pink',
  Farm: 'sun',
  Savanna: 'orange',
  Jungle: 'green',
  Pond: 'blue',
  Sky: 'blue',
  Forest: 'green',
  Antarctic: 'teal',
};

const worldFor = (habitat: string): WorldKey => habitatWorld[habitat] ?? 'orange';

function Pill({ world, children }: { world: WorldKey; children: ReactNode }) {
  const w = useWorld(world);
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.75, py: 0.75, borderRadius: '999px', bgcolor: w.tint, color: w.text, fontWeight: 800 }}>
      {children}
    </Box>
  );
}

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
  const world = animal ? worldFor(animal.habitat) : 'orange';

  return (
    <Page>
      <PageHero
        world="orange"
        title="Animal Kingdom"
        subtitle="Meet the animals and hear what they say."
        emoji="🦁"
        progress={{ value: progress.animalsDiscovered.length, total: ANIMAL_TOTAL, label: 'Animals discovered', ariaLabel: `${progress.animalsDiscovered.length} of ${ANIMAL_TOTAL} animals discovered` }}
      />

      <Grid container spacing={{ xs: 3, md: 4 }}>
        <Grid size={{ xs: 12, md: 7 }} sx={{ order: { xs: 2, md: 1 } }}>
          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            {animalData.map((a, i) => {
              const discovered = progress.animalsDiscovered.includes(a.name);
              return (
                <Grid size={{ xs: 6, sm: 4 }} key={a.name}>
                  <LearnTile
                    shape="wide"
                    world={worldFor(a.habitat)}
                    selected={selected === i}
                    done={discovered}
                    ariaLabel={`${a.name}${discovered ? ', discovered' : ''}`}
                    onClick={() => handleSelect(i)}
                  >
                    <Box sx={{ py: 1.75, px: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                      <Box aria-hidden sx={{ fontSize: { xs: '2.6rem', md: '3rem' }, lineHeight: 1.1, filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.15))' }}><Illustration emoji={a.emoji} /></Box>
                      <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: '1.15rem', color: 'inherit' }}>{a.name}</Typography>
                      <Typography component="span" sx={{ fontSize: '0.82rem', fontWeight: 800, opacity: 0.85, color: 'inherit' }}>“{a.sound}”</Typography>
                    </Box>
                  </LearnTile>
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }} sx={{ order: { xs: 1, md: 2 } }}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
            {animal ? (
              <DetailStage
                world={world}
                popKey={animal.name}
                art={<IllustrationBubble emoji={animal.emoji} world={world} size="lg" popKey={animal.name} label={animal.name} />}
                heading={animal.name}
                controls={
                  <>
                    <Button startIcon={<NavigateBefore />} onClick={() => handleNav(-1)} variant="outlined" aria-label="Previous animal">Back</Button>
                    <RoundIconButton
                      label="Repeat the animal"
                      world={world}
                      onClick={() => {
                        if (settings.speechEnabled) { cancelSpeech(); speakAnimal(animal.name, animal.description, animal.sound, settings.speechRate); }
                      }}
                    >
                      <ReplayRounded />
                    </RoundIconButton>
                    <RoundIconButton
                      label="Hear the animal sound"
                      world={world}
                      filled
                      onClick={() => { if (settings.speechEnabled) speak(`The ${animal.name} says ${animal.sound}!`, { rate: settings.speechRate }); }}
                    >
                      <VolumeUpRounded />
                    </RoundIconButton>
                    <Button endIcon={<NavigateNext />} onClick={() => handleNav(1)} variant="contained" color="error" aria-label="Next animal">Next</Button>
                  </>
                }
              >
                <Typography variant="body1" sx={{ mt: 0.75 }}>{animal.description}</Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mt: 1.5 }}>
                  <Pill world={world}><Illustration emoji="🔊" size="1.25em" /> Says “{animal.sound}”</Pill>
                  <Pill world="slate"><Illustration emoji="🏡" size="1.25em" /> Lives: {animal.habitat}</Pill>
                </Box>
                <Box sx={{ mt: 2, p: 2, borderRadius: '22px', bgcolor: 'action.hover', textAlign: 'left', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box aria-hidden sx={{ fontSize: '1.6rem', lineHeight: 1 }}><Illustration emoji="💡" /></Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>Fun fact</Typography>
                    <Typography variant="body1">{animal.funFact}</Typography>
                  </Box>
                </Box>
              </DetailStage>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: { xs: 1, md: 4 }, px: 1 }}>
                <Mascot size={110} mood="think" />
                <SpeechBubble>Tap an animal. Can you guess what it says?</SpeechBubble>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Page>
  );
}
