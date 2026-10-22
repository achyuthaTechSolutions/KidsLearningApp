import { Box, ButtonBase } from '@mui/material';
import { CheckRounded } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import type { WorldKey } from '../../theme/tokens';
import { fonts, worlds } from '../../theme/tokens';
import { tactile, useWorld } from './world';

interface Props {
  world: WorldKey;
  selected: boolean;
  done: boolean;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
  /** Square tiles for letters and numbers; `wide` fills the grid cell. */
  shape?: 'square' | 'wide';
}

export default function LearnTile({ world, selected, done, ariaLabel, onClick, children, shape = 'square' }: Props) {
  const theme = useTheme();
  const w = useWorld(world);
  const square = shape === 'square';
  return (
    <ButtonBase
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={selected}
      sx={[
        tactile(theme, w, { state: selected ? 'selected' : done ? 'done' : 'idle', depth: 5, radius: square ? 18 : 24 }),
        {
          position: 'relative',
          width: square ? { xs: 54, sm: 62, md: 66 } : '100%',
          height: square ? { xs: 54, sm: 62, md: 66 } : '100%',
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: square ? { xs: '1.5rem', md: '1.8rem' } : undefined,
          flexDirection: 'column',
          ...(selected ? { transform: 'translateY(-3px) scale(1.06)', zIndex: 1 } : {}),
        },
      ]}
    >
      {children}
      {done && !selected && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -7,
            right: -7,
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: worlds.green.main,
            color: '#FFFFFF',
            display: 'grid',
            placeItems: 'center',
            border: `2px solid ${theme.palette.background.paper}`,
          }}
        >
          <CheckRounded sx={{ fontSize: 14 }} />
        </Box>
      )}
    </ButtonBase>
  );
}
