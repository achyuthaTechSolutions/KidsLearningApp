import { useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { NavigateBefore, NavigateNext, ReplayRounded, RecordVoiceOverRounded } from '@mui/icons-material';
import { numberData } from '../../data/numbers';
import { NUMBER_TOTAL } from '../../services/progressStats';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech, speakNumber } from '../../services/speech';
import { playConfirmation } from '../../services/audio';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import LearnTile from '../../components/ui/LearnTile';
import DetailStage from '../../components/ui/DetailStage';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Mascot, { SpeechBubble } from '../../components/ui/Mascot';
import { useWorld } from '../../components/ui/world';
import { rainbow, type WorldKey } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';

const numberWorld = (value: number): WorldKey => rainbow[(value + 5) % rainbow.length];

export default function NumberWorld() {
  const [selected, setSelected] = useState<number | null>(null);
  const settings = useAppStore((s) => s.settings);
  const progress = useAppStore((s) => s.progress);
  const addNumberExplored = useAppStore((s) => s.addNumberExplored);
  const world = selected !== null ? numberWorld(selected) : 'sun';
  const w = useWorld(world);

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

  const countAloud = (value: number) => {
    if (!settings.speechEnabled) return;
    cancelSpeech();
    let countText = `Let's count! `;
    for (let i = 1; i <= value; i++) countText += `${i}. `;
    speak(countText, { rate: settings.speechRate });
  };

  const d = selected !== null ? numberData[selected] : null;

  return (
    <Page>
      <PageHero
        world="sun"
        title="Number World"
        subtitle="Tap a number and count the things together."
        emoji="🔢"
        progress={{ value: progress.numbersExplored.length, total: NUMBER_TOTAL, label: 'Numbers explored', ariaLabel: `${progress.numbersExplored.length} of ${NUMBER_TOTAL} numbers explored` }}
      />

      <Grid container spacing={{ xs: 3, md: 4 }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(54px, 1fr))', sm: 'repeat(auto-fill, minmax(62px, 1fr))', md: 'repeat(auto-fill, minmax(66px, 1fr))' },
              gap: { xs: 1.5, md: 2 },
              justifyItems: 'center',
              p: { xs: 1, md: 0 },
            }}
          >
            {numberData.map((n) => (
              <LearnTile
                key={n.value}
                world={numberWorld(n.value)}
                selected={selected === n.value}
                done={progress.numbersExplored.includes(n.value)}
                ariaLabel={`Number ${n.value}${progress.numbersExplored.includes(n.value) ? ', explored' : ''}`}
                onClick={() => handleSelect(n.value)}
              >
                {n.value}
              </LearnTile>
            ))}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
            {d ? (
              <DetailStage
                world={world}
                popKey={d.value}
                art={
                  <Box
                    sx={{
                      width: { xs: 120, md: 140 },
                      height: { xs: 120, md: 140 },
                      borderRadius: '36px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: w.main,
                      color: w.onMain,
                      boxShadow: `0 8px 0 ${w.dark}`,
                      fontFamily: 'Fredoka, Nunito, sans-serif',
                      fontWeight: 700,
                      fontSize: { xs: '4.4rem', md: '5.4rem' },
                      lineHeight: 1,
                      transform: 'rotate(-4deg)',
                      animation: 'kl-pop-in 480ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
                    }}
                    key={d.value}
                    aria-hidden
                  >
                    {d.value}
                  </Box>
                }
                heading={`${d.word}!`}
                controls={
                  <>
                    <Button startIcon={<NavigateBefore />} onClick={() => handleNav(-1)} variant="outlined" disabled={selected === 0} aria-label="Previous number">
                      Back
                    </Button>
                    <RoundIconButton
                      label="Repeat the number"
                      world={world}
                      onClick={() => {
                        if (settings.speechEnabled) { cancelSpeech(); speakNumber(d.value, d.word, d.description, settings.speechRate); }
                      }}
                    >
                      <ReplayRounded />
                    </RoundIconButton>
                    <RoundIconButton label="Count out loud" world={world} filled onClick={() => countAloud(d.value)}>
                      <RecordVoiceOverRounded />
                    </RoundIconButton>
                    <Button endIcon={<NavigateNext />} onClick={() => handleNav(1)} variant="contained" color="warning" disabled={selected === 20} aria-label="Next number">
                      Next
                    </Button>
                  </>
                }
              >
                <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>{d.description}</Typography>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: '24px',
                    border: `3px dashed ${alpha(w.main, 0.45)}`,
                    bgcolor: w.tint,
                    minHeight: 96,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800, color: w.text, mb: 1 }}>
                    Let&apos;s count {d.value} {d.objects}!
                  </Typography>
                  {d.value === 0 ? (
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: w.text }}>
                      <Illustration emoji="🫙" sx={{ mr: 1 }} />Nothing here!
                    </Typography>
                  ) : (
                    <Box key={d.value} role="img" aria-label={`${d.value} ${d.objects}`} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 0.5, md: 1 } }}>
                      {Array.from({ length: d.value }, (_, i) => (
                        <Box
                          key={i}
                          aria-hidden
                          sx={{
                            fontSize: { xs: '1.7rem', md: '2.1rem' },
                            lineHeight: 1.1,
                            animation: `kl-pop-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60}ms both`,
                          }}
                        >
                          <Illustration emoji={d.emoji} />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </DetailStage>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: { xs: 1, md: 4 }, px: 1 }}>
                <Mascot size={110} mood="think" />
                <SpeechBubble>Pick a number and we&apos;ll count together!</SpeechBubble>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Page>
  );
}
