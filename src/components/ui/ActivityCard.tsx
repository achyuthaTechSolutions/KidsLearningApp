import { Box, ButtonBase, LinearProgress, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { WorldKey } from '../../theme/tokens';
import { gradient, tactile, useWorld } from './world';
import Illustration from './Illustration';

interface Props {
  world: WorldKey;
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  progress?: { value: number; total: number };
  delay?: number;
}

export default function ActivityCard({ world, emoji, title, subtitle, onClick, progress, delay = 0 }: Props) {
  const theme = useTheme();
  const w = useWorld(world);
  const percent = progress && progress.total > 0 ? Math.round((progress.value / progress.total) * 100) : 0;

  return (
    <ButtonBase
      onClick={onClick}
      aria-label={progress ? `${title}. ${progress.value} of ${progress.total} explored` : title}
      sx={[
        tactile(theme, w, { depth: 6, radius: 28 }),
        {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          textAlign: 'left',
          overflow: 'hidden',
          animation: `kl-rise-in 420ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms both`,
          '@media (hover: hover)': {
            '&:hover': { transform: 'translateY(-4px)', borderColor: w.main, boxShadow: `0 6px 0 ${w.main}` },
            '&:hover .kl-card-art': { transform: 'scale(1.08) rotate(-4deg)' },
          },
        },
      ]}
    >
      <Box
        sx={{
          position: 'relative',
          height: { xs: 104, md: 120 },
          background: gradient(w, 150),
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Box aria-hidden sx={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', right: -40, top: -60, bgcolor: alpha('#FFFFFF', 0.14) }} />
        <Box aria-hidden sx={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', left: -30, bottom: -50, bgcolor: alpha('#FFFFFF', 0.12) }} />
        <Box
          aria-hidden
          className="kl-card-art"
          sx={{
            width: { xs: 76, md: 86 },
            height: { xs: 76, md: 86 },
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha('#FFFFFF', 0.25),
            border: `3px solid ${alpha('#FFFFFF', 0.5)}`,
            fontSize: { xs: '2.6rem', md: '3rem' },
            lineHeight: 1,
            filter: `drop-shadow(0 4px 6px ${alpha('#000000', 0.18)})`,
            transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <Illustration emoji={emoji} />
        </Box>
      </Box>
      <Box sx={{ p: { xs: 2, md: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="h4" component="span" sx={{ color: w.text, fontSize: { xs: '1.2rem', md: '1.3rem' } }}>
          {title}
        </Typography>
        <Typography variant="body2" component="span" sx={{ color: 'text.secondary' }}>
          {subtitle}
        </Typography>
        {progress && (
          <Box sx={{ mt: 'auto', pt: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <LinearProgress
              variant="determinate"
              value={percent}
              aria-hidden
              sx={{ flex: 1, height: 10, bgcolor: w.tint, '& .MuiLinearProgress-bar': { bgcolor: w.main } }}
            />
            <Typography variant="caption" component="span" sx={{ color: w.text, minWidth: 44, textAlign: 'right' }}>
              {progress.value}/{progress.total}
            </Typography>
          </Box>
        )}
      </Box>
    </ButtonBase>
  );
}
