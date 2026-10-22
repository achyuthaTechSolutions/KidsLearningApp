import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';
import type { WorldKey } from '../../theme/tokens';
import { useWorld } from './world';

interface Props {
  world: WorldKey;
  art: ReactNode;
  /** Large heading, for example "A a" or "5". */
  title?: string;
  heading: string;
  /** Replays the entrance animation when it changes. */
  popKey?: string | number;
  children?: ReactNode;
  controls?: ReactNode;
}

/** Flashcard layout shared by letters, numbers, and animals. */
export default function DetailStage({ world, art, title, heading, popKey, children, controls }: Props) {
  const w = useWorld(world);
  const bigTextColor = world === 'sun' || world === 'gold' ? w.text : w.main;
  return (
    <Box
      role="region"
      aria-label={heading}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: '28px', md: '36px' },
        bgcolor: 'background.paper',
        border: `3px solid ${alpha(w.main, 0.4)}`,
        boxShadow: `0 8px 0 ${alpha(w.main, 0.4)}`,
        p: { xs: 2.5, md: 3.5 },
        textAlign: 'center',
      }}
    >
      <Box aria-hidden sx={{ position: 'absolute', left: '50%', top: -210, width: 460, height: 360, transform: 'translateX(-50%)', borderRadius: '50%', bgcolor: w.tint }} />
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 1.5 }}>{art}</Box>
      <Box key={popKey} sx={{ position: 'relative', animation: 'kl-rise-in 320ms ease-out both' }}>
        {title && (
          <Typography
            component="p"
            variant="h1"
            sx={{ fontSize: { xs: '3.4rem', md: '4.4rem' }, lineHeight: 1, color: bigTextColor, textShadow: `0 4px 0 ${alpha(w.main, 0.18)}` }}
          >
            {title}
          </Typography>
        )}
        <Typography variant="h3" component="h2" sx={{ mt: title ? 1 : 0, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>
          {heading}
        </Typography>
        {children}
      </Box>
      {controls && (
        <Box sx={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 1.5, mt: 2.5 }}>
          {controls}
        </Box>
      )}
    </Box>
  );
}
