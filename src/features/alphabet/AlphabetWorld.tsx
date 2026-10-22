import { useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { VolumeUpRounded, NavigateBefore, NavigateNext, ReplayRounded } from '@mui/icons-material';
import { alphabetData, letterOrder } from '../../data/alphabet';
import { LETTER_TOTAL } from '../../services/progressStats';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech, speakLetter } from '../../services/speech';
import { playConfirmation } from '../../services/audio';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import LearnTile from '../../components/ui/LearnTile';
import DetailStage from '../../components/ui/DetailStage';
import IllustrationBubble from '../../components/ui/IllustrationBubble';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Mascot, { SpeechBubble } from '../../components/ui/Mascot';
import { useWorld } from '../../components/ui/world';
import { rainbow, type WorldKey } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';

const letterWorld = (letter: string): WorldKey => rainbow[letterOrder.indexOf(letter) % rainbow.length];

export default function AlphabetWorld() {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const settings = useAppStore((s) => s.settings);
  const progress = useAppStore((s) => s.progress);
  const addLetterExplored = useAppStore((s) => s.addLetterExplored);
  const green = useWorld('green');

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
  const world = selectedLetter ? letterWorld(selectedLetter) : 'green';

  return (
    <Page>
      <PageHero
        world="green"
        title="Alphabet World"
        subtitle="Tap a letter to meet it and hear its sound."
        emoji="🔤"
        progress={{ value: explored.length, total: LETTER_TOTAL, label: 'Letters explored', ariaLabel: `${explored.length} of ${LETTER_TOTAL} letters explored` }}
      />

      <Grid container spacing={{ xs: 3, md: 4 }}>
        <Grid size={{ xs: 12, md: 7 }} sx={{ order: { xs: 2, md: 1 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(54px, 1fr))', sm: 'repeat(auto-fill, minmax(62px, 1fr))', md: 'repeat(auto-fill, minmax(66px, 1fr))' },
              gap: { xs: 1.5, md: 2 },
              justifyItems: 'center',
              p: { xs: 1, md: 0 },
            }}
          >
            {letterOrder.map((letter) => (
              <LearnTile
                key={letter}
                world={letterWorld(letter)}
                selected={selectedLetter === letter}
                done={explored.includes(letter)}
                ariaLabel={`Letter ${letter}${explored.includes(letter) ? ', explored' : ''}`}
                onClick={() => handleSelect(letter)}
              >
                {letter}
              </LearnTile>
            ))}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }} sx={{ order: { xs: 1, md: 2 } }}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
            {d && selectedLetter ? (
              <DetailStage
                world={world}
                popKey={selectedLetter}
                art={<IllustrationBubble emoji={d.emoji} world={world} size="lg" popKey={selectedLetter} label={d.word} />}
                title={`${d.uppercase} ${d.lowercase}`}
                heading={d.description}
                controls={
                  <>
                    <Button startIcon={<NavigateBefore />} onClick={() => handleNav(-1)} variant="outlined" aria-label="Previous letter">
                      Back
                    </Button>
                    <RoundIconButton label="Repeat the letter" world={world} onClick={handleRepeat}>
                      <ReplayRounded />
                    </RoundIconButton>
                    <RoundIconButton
                      label="Hear the word"
                      world={world}
                      filled
                      onClick={() => { if (settings.speechEnabled) speak(d.word, { rate: settings.speechRate }); }}
                    >
                      <VolumeUpRounded />
                    </RoundIconButton>
                    <Button endIcon={<NavigateNext />} onClick={() => handleNav(1)} variant="contained" color="success" aria-label="Next letter">
                      Next
                    </Button>
                  </>
                }
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 1.5,
                    px: 2,
                    py: 0.75,
                    borderRadius: '999px',
                    bgcolor: green.tint,
                    color: green.text,
                    fontWeight: 800,
                  }}
                >
                  <Illustration emoji="🗣️" size="1.3em" /> Sounds like “{d.phonetic}”
                </Box>
              </DetailStage>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: { xs: 1, md: 4 }, px: 1 }}>
                <Mascot size={110} mood="think" />
                <SpeechBubble>Pick any letter. I&apos;ll tell you a word that starts with it!</SpeechBubble>
              </Box>
            )}
            {d && (
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
                Letter {letterOrder.indexOf(selectedLetter ?? 'A') + 1} of {LETTER_TOTAL}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Page>
  );
}
