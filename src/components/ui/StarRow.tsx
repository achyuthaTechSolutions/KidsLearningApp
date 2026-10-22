import { Box } from '@mui/material';
import { StarRounded } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { worlds } from '../../theme/tokens';

interface Props {
  earned: number;
  total: number;
  size?: number;
  label?: string;
}

export default function StarRow({ earned, total, size = 44, label }: Props) {
  const theme = useTheme();
  const empty = theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.16) : alpha(worlds.gold.dark, 0.18);
  return (
    <Box
      role="img"
      aria-label={label ?? `${earned} of ${total} stars`}
      sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}
    >
      {Array.from({ length: total }, (_, index) => {
        const on = index < earned;
        return (
          <StarRounded
            key={index}
            aria-hidden
            sx={{
              fontSize: size,
              color: on ? worlds.gold.main : empty,
              filter: on ? `drop-shadow(0 3px 0 ${worlds.gold.dark})` : 'none',
              animation: on ? `kl-pop-in 520ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 140}ms both` : 'none',
            }}
          />
        );
      })}
    </Box>
  );
}
