import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { WorldKey } from '../../theme/tokens';
import { useWorld } from './world';
import Illustration from './Illustration';

export interface PillOption<T extends string> {
  value: T;
  label: string;
  emoji?: string;
}

interface Props<T extends string> {
  value: T;
  options: PillOption<T>[];
  onChange: (value: T) => void;
  world: WorldKey;
  ariaLabel: string;
  /** Scroll sideways on small screens instead of wrapping. */
  scroll?: boolean;
}

export default function PillPicker<T extends string>({ value, options, onChange, world, ariaLabel, scroll = false }: Props<T>) {
  const w = useWorld(world);
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: scroll ? { xs: 'flex-start', md: 'center' } : 'center',
        overflowX: scroll ? 'auto' : 'visible',
        mx: scroll ? { xs: -2, sm: 0 } : 0,
        px: scroll ? { xs: 2, sm: 0 } : 0,
        pt: 0.5,
        pb: 1.5,
        mb: { xs: 2, md: 3 },
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <ToggleButtonGroup
        value={value}
        exclusive
        aria-label={ariaLabel}
        onChange={(_, next: T | null) => {
          if (next) onChange(next);
        }}
        sx={{
          flexWrap: scroll ? 'nowrap' : 'wrap',
          justifyContent: 'center',
          '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover': {
            bgcolor: w.main,
            color: w.onMain,
            borderColor: `${w.main} !important`,
            boxShadow: `0 3px 0 ${w.dark}`,
          },
        }}
      >
        {options.map((option) => (
          <ToggleButton key={option.value} value={option.value} sx={{ whiteSpace: 'nowrap', gap: 0.75 }}>
            {option.emoji && <Illustration emoji={option.emoji} size="1.35em" />}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
