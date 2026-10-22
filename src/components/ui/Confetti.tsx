import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@mui/material';
import { worlds } from '../../theme/tokens';

const palette = [worlds.violet.main, worlds.pink.main, worlds.sun.main, worlds.green.main, worlds.blue.main, worlds.orange.main];

interface Bit {
  id: number;
  left: number;
  dx: number;
  dy: number;
  rot: number;
  delay: number;
  duration: number;
  size: number;
  round: boolean;
  color: string;
}

function scatter(count: number): Bit[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 20 + Math.random() * 60,
    dx: (Math.random() - 0.5) * 520,
    dy: 260 + Math.random() * 420,
    rot: (Math.random() - 0.5) * 1080,
    delay: Math.random() * 0.18,
    duration: 1.1 + Math.random() * 0.6,
    size: 7 + Math.random() * 7,
    round: Math.random() > 0.6,
    color: palette[i % palette.length],
  }));
}

interface Props {
  /** Increase this number to fire a new burst. Zero never fires. */
  fire: number;
  pieces?: number;
}

/**
 * A short, quiet burst of paper confetti. It is hidden when reduced motion is on
 * and removes itself after the animation so nothing keeps running in the background.
 */
export default function Confetti({ fire, pieces = 46 }: Props) {
  const [finishedBurst, setFinishedBurst] = useState(0);
  const bits = useMemo(() => (fire > 0 ? scatter(pieces) : []), [fire, pieces]);

  useEffect(() => {
    if (fire <= 0) return undefined;
    const timer = window.setTimeout(() => setFinishedBurst(fire), 1900);
    return () => window.clearTimeout(timer);
  }, [fire]);

  if (fire <= 0 || finishedBurst === fire || typeof document === 'undefined') return null;

  return createPortal(
    <Box
      aria-hidden
      className="kl-motion-only"
      sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1600, overflow: 'hidden' }}
    >
      {bits.map((bit) => (
        <Box
          key={`${fire}-${bit.id}`}
          style={{
            left: `${bit.left}%`,
            width: bit.size,
            height: bit.round ? bit.size : bit.size * 0.45,
            background: bit.color,
            borderRadius: bit.round ? '50%' : 2,
            animationDelay: `${bit.delay}s`,
            animationDuration: `${bit.duration}s`,
            ['--kl-dx' as string]: `${bit.dx}px`,
            ['--kl-dy' as string]: `${bit.dy}px`,
            ['--kl-rot' as string]: `${bit.rot}deg`,
          }}
          sx={{ position: 'absolute', top: '28%', animationName: 'kl-confetti', animationTimingFunction: 'cubic-bezier(0.2, 0.6, 0.4, 1)', animationFillMode: 'both' }}
        />
      ))}
    </Box>,
    document.body,
  );
}
