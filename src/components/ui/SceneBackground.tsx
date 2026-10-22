import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { worlds } from '../../theme/tokens';

const blobs = [
  { color: worlds.violet.main, size: 520, top: '-12%', left: '-8%', delay: '0s' },
  { color: worlds.pink.main, size: 420, top: '8%', left: '70%', delay: '-6s' },
  { color: worlds.sun.main, size: 460, top: '62%', left: '-6%', delay: '-12s' },
  { color: worlds.blue.main, size: 400, top: '70%', left: '72%', delay: '-3s' },
];

const doodles = [
  { kind: 'star', top: '18%', left: '88%', size: 22, color: worlds.gold.main },
  { kind: 'circle', top: '42%', left: '3%', size: 16, color: worlds.green.main },
  { kind: 'star', top: '86%', left: '46%', size: 18, color: worlds.pink.main },
  { kind: 'circle', top: '30%', left: '52%', size: 12, color: worlds.blue.main },
  { kind: 'squiggle', top: '64%', left: '92%', size: 40, color: worlds.violet.main },
];

function Doodle({ kind, size, color }: { kind: string; size: number; color: string }) {
  if (kind === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill={color} />
      </svg>
    );
  }
  if (kind === 'squiggle') {
    return (
      <svg width={size} height={size / 2} viewBox="0 0 40 20">
        <path d="M2 10 q6 -8 12 0 t12 0 t12 0" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7" fill="none" stroke={color} strokeWidth="3.5" />
    </svg>
  );
}

/** Soft, slow-moving color blobs and doodles behind every screen. */
export default function SceneBackground() {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  return (
    <Box aria-hidden sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {blobs.map((blob) => (
        <Box
          key={blob.color}
          sx={{
            position: 'absolute',
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(blob.color, dark ? 0.16 : 0.13)} 0%, transparent 68%)`,
            animation: `kl-drift 26s ease-in-out ${blob.delay} infinite`,
          }}
        />
      ))}
      {doodles.map((d) => (
        <Box
          key={`${d.top}-${d.left}`}
          sx={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            opacity: dark ? 0.35 : 0.45,
            lineHeight: 0,
            display: { xs: 'none', md: 'block' },
            animation: 'kl-drift 18s ease-in-out infinite',
          }}
        >
          <Doodle kind={d.kind} size={d.size} color={d.color} />
        </Box>
      ))}
    </Box>
  );
}
