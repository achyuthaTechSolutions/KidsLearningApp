import type { ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBackRounded, PlayArrowRounded, VolumeUpRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import { useWorld } from '../../components/ui/world';
import type { WorldKey } from '../../theme/tokens';
import { difficultyHints, difficultyOptions, type GameDifficulty } from './difficulty';
import { fonts } from '../../theme/tokens';

interface Props {
  title: string;
  subtitle: string;
  emoji: string;
  world: WorldKey;
  /** Short, picture-led steps. The first one is also spoken. */
  steps: { emoji: string; text: string }[];
  difficulty?: GameDifficulty;
  onDifficulty?: (value: GameDifficulty) => void;
  onStart: () => void;
  onHear: () => void;
  startLabel?: string;
  startDisabled?: boolean;
  /** Extra choices, such as a mode or theme picker. */
  children?: ReactNode;
  /** Endless games: the level play will start at. It then rises and falls by itself. */
  endlessLevel?: number;
}

/** The "how to play" screen every new Play game opens with. */
export default function GameIntro({
  title, subtitle, emoji, world, steps, difficulty, onDifficulty, onStart, onHear, startLabel = "Let's play!", startDisabled, children, endlessLevel,
}: Props) {
  const navigate = useNavigate();
  const w = useWorld(world);
  return (
    <Page maxWidth={900}>
      <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate('/games')} sx={{ mb: 2 }}>
        All Games
      </Button>
      <PageHero world={world} title={title} subtitle={subtitle} emoji={emoji} />
      <Box component="section" aria-label="How to play" sx={{ p: { xs: 2, md: 3 }, borderRadius: '28px', bgcolor: 'background.paper', border: `3px solid ${w.tint}`, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '1.3rem', md: '1.5rem' }, color: w.text }}>How to play</Typography>
          <Button variant="outlined" startIcon={<VolumeUpRounded />} onClick={onHear}>Hear instructions</Button>
        </Box>
        <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.25 }}>
          {steps.map((step, index) => (
            <Box component="li" key={step.text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box aria-hidden sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: '16px', display: 'grid', placeItems: 'center', bgcolor: w.tint, fontSize: '1.7rem' }}>
                <Illustration emoji={step.emoji} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                <Box component="span" sx={{ color: w.text, mr: 0.75 }}>{index + 1}.</Box>{step.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {difficulty && onDifficulty && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" component="h2" sx={{ mb: 1.25, fontSize: '1.15rem' }}>{endlessLevel ? 'Start from' : 'Level'}</Typography>
          <PillPicker value={difficulty} options={difficultyOptions} onChange={onDifficulty} world={world} ariaLabel="Game level" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{difficultyHints[difficulty]}</Typography>
        </Box>
      )}

      {endlessLevel !== undefined && (
        <Box data-testid="endless-level" sx={{ mb: 2, mx: 'auto', maxWidth: 520, p: 1.5, borderRadius: '20px', bgcolor: w.tint, textAlign: 'center' }}>
          <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.5rem', color: w.text }}>Level {endlessLevel}</Typography>
          <Typography sx={{ fontWeight: 700 }}>The levels never end. Get 3 right in a row to go up a level!</Typography>
        </Box>
      )}

      {children}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowRounded />}
          onClick={onStart}
          disabled={startDisabled}
          sx={{ fontSize: '1.3rem', px: 5, py: 1.5, bgcolor: w.main, color: w.onMain, '&:hover': { bgcolor: w.dark } }}
        >
          {startLabel}
        </Button>
      </Box>
    </Page>
  );
}
