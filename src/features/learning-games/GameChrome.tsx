import { useEffect, type ReactNode } from 'react';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import { ArrowBackRounded, ReplayRounded, SportsEsportsRounded, StarRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Mascot from '../../components/ui/Mascot';
import StarRow from '../../components/ui/StarRow';
import Confetti from '../../components/ui/Confetti';
import Illustration from '../../components/ui/Illustration';
import { useWorld } from '../../components/ui/world';
import { worlds, type WorldKey } from '../../theme/tokens';

interface HeaderProps {
  title: string;
  emoji: string;
  world: WorldKey;
  backLabel: string;
  onBack: () => void;
  score?: number;
  scoreLabel?: string;
  progress?: { value: number; total: number; label: string };
  actions?: ReactNode;
}

/**
 * Starting a game or reaching the results changes the screen without changing the route,
 * so the layout's own scroll reset does not run. Without this, a phone would stay
 * scrolled down where the Start button was, with the game board out of view.
 */
function useScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
}

/** Back button, title, score chip, and progress bar shared by the Play games. */
export function GameHeader({ title, emoji, world, backLabel, onBack, score, scoreLabel, progress, actions }: HeaderProps) {
  useScrollToTop();
  const w = useWorld(world);
  const gold = useWorld('gold');
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: progress ? 1.5 : 0, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={onBack}>
          {backLabel}
        </Button>
        <Typography variant="h3" component="h1" sx={{ flex: 1, minWidth: 160, fontSize: { xs: '1.3rem', md: '1.6rem' }, color: w.text }}>
          <Illustration emoji={emoji} sx={{ mr: 1 }} />{title}
        </Typography>
        {actions}
        {score !== undefined && (
          <Box
            role="img"
            aria-label={scoreLabel ?? `Score ${score}`}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.75, py: 0.75, borderRadius: '999px', bgcolor: gold.tint, color: gold.text, fontWeight: 900, fontSize: '1.1rem', border: `2px solid ${gold.main}` }}
          >
            <StarRounded aria-hidden sx={{ color: worlds.gold.main }} />
            {score}
          </Box>
        )}
      </Box>
      {progress && (
        <>
          <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.75 }}>{progress.label}</Typography>
          <LinearProgress
            variant="determinate"
            value={progress.total > 0 ? (progress.value / progress.total) * 100 : 0}
            aria-label={progress.label}
            sx={{ '& .MuiLinearProgress-bar': { bgcolor: w.main } }}
          />
        </>
      )}
    </Box>
  );
}

interface ResultsProps {
  stars: number;
  total?: number;
  message: string;
  celebrate: number;
  onPlayAgain: () => void;
  onChooseGame: () => void;
}

/** The end-of-round card: Pip, a cheer, stars, and what to do next. */
export function GameResults({ stars, total = 3, message, celebrate, onPlayAgain, onChooseGame }: ResultsProps) {
  useScrollToTop();
  const gold = useWorld('gold');
  const ratio = stars / total;
  const title = ratio >= 1 ? 'Amazing!' : ratio >= 0.6 ? 'Great Job!' : 'Good Try!';
  return (
    <Page maxWidth={720}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          borderRadius: '40px',
          bgcolor: 'background.paper',
          border: `3px solid ${gold.main}`,
          boxShadow: `0 10px 0 ${gold.main}`,
          px: { xs: 2.5, md: 5 },
          py: { xs: 3.5, md: 5 },
          mt: { xs: 1, md: 3 },
        }}
      >
        <Box aria-hidden sx={{ position: 'absolute', left: '50%', top: -260, width: 620, height: 440, transform: 'translateX(-50%)', borderRadius: '50%', bgcolor: gold.tint }} />
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Mascot size={150} mood={ratio >= 0.6 ? 'cheer' : 'happy'} label="Pip the owl celebrating" />
        </Box>
        <Typography variant="h1" component="h1" sx={{ position: 'relative', fontSize: { xs: '2.2rem', md: '2.8rem' }, color: gold.text }}>
          {title}
        </Typography>
        <Typography variant="h3" component="p" sx={{ position: 'relative', mt: 1, mb: 2.5, fontSize: { xs: '1.3rem', md: '1.55rem' } }}>
          {message}
        </Typography>
        <StarRow earned={stars} total={total} size={52} label={`${stars} of ${total} stars`} />
        <Box sx={{ position: 'relative', mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<ReplayRounded />} onClick={onPlayAgain} sx={{ fontSize: '1.1rem', px: 3 }}>
            Play Again
          </Button>
          <Button variant="outlined" startIcon={<SportsEsportsRounded />} onClick={onChooseGame} sx={{ fontSize: '1.1rem', px: 3 }}>
            Choose Game
          </Button>
        </Box>
      </Box>
      <Confetti fire={celebrate} pieces={70} />
    </Page>
  );
}
