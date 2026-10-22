import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { WorldKey } from '../../theme/tokens';
import { useWorld } from './world';
import Illustration from './Illustration';

const sizes = { sm: 64, md: 96, lg: 148, xl: 200 } as const;

interface Props {
  emoji: string;
  world: WorldKey;
  size?: keyof typeof sizes;
  float?: boolean;
  /** Change this to replay the pop animation, for example the selected letter. */
  popKey?: string | number;
  label?: string;
}

/** Presents an emoji as a consistent, illustrated object on a soft colored disc. */
export default function IllustrationBubble({ emoji, world, size = 'lg', float = true, popKey, label }: Props) {
  const w = useWorld(world);
  const px = sizes[size];
  return (
    <Box
      sx={{
        position: 'relative',
        width: px,
        height: px,
        flexShrink: 0,
        animation: float ? 'kl-float 5s ease-in-out infinite' : 'none',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle at 32% 28%, ${alpha('#FFFFFF', 0.9)} 0%, ${w.tint} 46%, ${alpha(w.main, 0.28)} 100%)`,
          boxShadow: `inset 0 -${Math.round(px / 18)}px 0 ${alpha(w.main, 0.18)}, 0 ${Math.round(px / 14)}px ${Math.round(px / 5)}px ${alpha(w.dark, 0.18)}`,
          border: `3px solid ${alpha('#FFFFFF', 0.7)}`,
        }}
      />
      <Box
        key={popKey}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: px * 0.56,
          lineHeight: 1,
          filter: `drop-shadow(0 ${Math.max(2, Math.round(px / 32))}px ${Math.max(2, Math.round(px / 24))}px ${alpha('#000000', 0.18)})`,
          animation: 'kl-pop-in 480ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
          userSelect: 'none',
        }}
      >
        <Illustration emoji={emoji} />
      </Box>
    </Box>
  );
}
