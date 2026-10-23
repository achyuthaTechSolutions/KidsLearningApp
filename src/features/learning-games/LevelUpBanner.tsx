import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUpRounded } from '@mui/icons-material';
import { useWorld } from '../../components/ui/world';
import { fonts, type WorldKey } from '../../theme/tokens';

/** "Level up!" for a moment after the level rises. A drop is shown calmly as the new level. */
export default function LevelUpBanner({ change, world }: { change: { change: 'up' | 'down'; level: number; at: number } | null; world: WorldKey }) {
  const w = useWorld(world);
  // Shown from the moment the level rises until the timer hides that same change.
  const [hiddenAt, setHiddenAt] = useState<number | null>(null);
  useEffect(() => {
    if (!change || change.change !== 'up') return undefined;
    const timer = window.setTimeout(() => setHiddenAt(change.at), 2600);
    return () => window.clearTimeout(timer);
  }, [change]);
  if (!change || change.change !== 'up' || hiddenAt === change.at) return null;
  return (
    <Box
      role="status"
      data-testid="level-up"
      sx={{
        position: 'fixed', top: { xs: 76, md: 24 }, left: '50%', transform: 'translateX(-50%)', zIndex: 1400,
        display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 1.25, borderRadius: '999px',
        bgcolor: w.main, color: w.onMain, boxShadow: `0 6px 0 ${w.dark}`, animation: 'kl-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      <TrendingUpRounded aria-hidden />
      <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '1.3rem', md: '1.6rem' } }}>Level up! Level {change.level}</Typography>
    </Box>
  );
}
