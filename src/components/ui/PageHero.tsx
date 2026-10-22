import { Box, LinearProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';
import type { WorldKey } from '../../theme/tokens';
import { gradient, useWorld } from './world';
import Illustration from './Illustration';

interface Props {
  world: WorldKey;
  title: string;
  subtitle?: string;
  emoji?: string;
  /** Replaces the emoji illustration, for example with the mascot. */
  art?: ReactNode;
  progress?: { value: number; total: number; label: string; ariaLabel?: string };
  children?: ReactNode;
}

const sparkles = [
  { top: '14%', left: '46%', size: 14, delay: '0s' },
  { top: '70%', left: '58%', size: 10, delay: '0.8s' },
  { top: '24%', left: '8%', size: 9, delay: '1.6s' },
  { top: '78%', left: '30%', size: 12, delay: '2.2s' },
];

function Sparkle({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill={color} />
    </svg>
  );
}

export default function PageHero({ world, title, subtitle, emoji, art, progress, children }: Props) {
  const w = useWorld(world);
  const percent = progress && progress.total > 0 ? Math.round((progress.value / progress.total) * 100) : 0;

  return (
    <Box
      component="header"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: '28px', md: '36px' },
        background: gradient(w),
        color: w.onMain,
        px: { xs: 2.5, sm: 3.5, md: 5 },
        py: { xs: 2.5, md: 3.5 },
        mb: { xs: 2.5, md: 3.5 },
        boxShadow: `0 8px 0 ${alpha(w.dark, 0.55)}, 0 18px 40px ${alpha(w.dark, 0.25)}`,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 2, md: 4 },
      }}
    >
      <Box aria-hidden sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', right: -60, top: -110, bgcolor: alpha('#FFFFFF', 0.12) }} />
      <Box aria-hidden sx={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', left: '38%', bottom: -110, bgcolor: alpha('#FFFFFF', 0.1) }} />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${alpha('#FFFFFF', 0.16)} 1.5px, transparent 1.6px)`,
          backgroundSize: '22px 22px',
          maskImage: 'linear-gradient(90deg, transparent 0%, black 70%)',
        }}
      />
      {sparkles.map((s) => (
        <Box
          key={`${s.top}-${s.left}`}
          aria-hidden
          className="kl-motion-only"
          sx={{ position: 'absolute', top: s.top, left: s.left, lineHeight: 0, animation: `kl-twinkle 3.2s ease-in-out ${s.delay} infinite` }}
        >
          <Sparkle size={s.size} color={alpha('#FFFFFF', 0.85)} />
        </Box>
      ))}

      <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{ fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.7rem' }, color: 'inherit', textShadow: `0 2px 0 ${alpha(w.dark, 0.35)}` }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ mt: 0.5, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 700, opacity: 0.95, color: 'inherit' }}>
            {subtitle}
          </Typography>
        )}
        {progress && (
          <Box sx={{ mt: 2, maxWidth: 420 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'inherit' }}>{progress.label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'inherit' }}>{progress.value}/{progress.total}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percent}
              aria-label={progress.ariaLabel ?? `${progress.label}, ${progress.value} of ${progress.total}`}
              sx={{
                height: 14,
                bgcolor: alpha(w.onMain === '#FFFFFF' ? '#FFFFFF' : w.onMain, 0.22),
                '& .MuiLinearProgress-bar': {
                  bgcolor: w.onMain === '#FFFFFF' ? '#FFFFFF' : w.onMain,
                  boxShadow: `inset 0 -3px 0 ${alpha('#000000', 0.12)}`,
                },
              }}
            />
          </Box>
        )}
        {children}
      </Box>

      {(art || emoji) && (
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {art ?? (
            <Box
              aria-hidden
              sx={{
                width: { xs: 76, sm: 104, md: 128 },
                height: { xs: 76, sm: 104, md: 128 },
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha('#FFFFFF', 0.22),
                border: `3px solid ${alpha('#FFFFFF', 0.45)}`,
                fontSize: { xs: '2.6rem', sm: '3.4rem', md: '4.2rem' },
                lineHeight: 1,
                animation: 'kl-float 4.5s ease-in-out infinite',
                filter: `drop-shadow(0 6px 10px ${alpha('#000000', 0.18)})`,
              }}
            >
              {emoji && <Illustration emoji={emoji} />}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
