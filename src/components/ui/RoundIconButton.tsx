import { IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import type { WorldKey } from '../../theme/tokens';
import { tactile, useWorld } from './world';

interface Props {
  label: string;
  world?: WorldKey;
  filled?: boolean;
  disabled?: boolean;
  size?: number;
  onClick: () => void;
  children: ReactNode;
}

export default function RoundIconButton({ label, world = 'violet', filled = false, disabled, size = 56, onClick, children }: Props) {
  const theme = useTheme();
  const w = useWorld(world);
  return (
    <Tooltip title={label} arrow>
      <span>
        <IconButton
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          sx={[
            tactile(theme, w, { state: filled ? 'selected' : 'idle', depth: 4, radius: size }),
            {
              width: size,
              height: size,
              color: filled ? w.onMain : w.text,
              '& svg': { fontSize: size * 0.48 },
              '&.Mui-disabled': { opacity: 0.45, color: w.text },
            },
          ]}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}
