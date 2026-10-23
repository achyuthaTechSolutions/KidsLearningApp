import type { ReactNode } from 'react';
import { ButtonBase, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckRounded } from '@mui/icons-material';
import { resolveWorld, tactile } from '../../../components/ui/world';
import { fonts, type WorldKey } from '../../../theme/tokens';

const optionWorlds: WorldKey[] = ['blue', 'pink', 'violet', 'teal'];

interface Props {
  index: number;
  label: string;
  lang: string;
  onClick: () => void;
  /** Already tried and not right: greyed out, never hidden. */
  tried?: boolean;
  /** The right answer, shown after success or "Show me". */
  revealed?: boolean;
  disabled?: boolean;
  shake?: boolean;
  big?: boolean;
  children?: ReactNode;
}

/** A large answer button. Right answers get a check mark as well as colour. */
export default function OptionButton({ index, label, lang, onClick, tried, revealed, disabled, shake, big, children }: Props) {
  const theme = useTheme();
  const w = resolveWorld(revealed ? 'green' : optionWorlds[index % optionWorlds.length], theme.palette.mode);
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled || tried}
      aria-label={`${label}${revealed ? ', correct' : tried ? ', not this one' : ''}`}
      sx={[
        tactile(theme, w, { state: revealed ? 'done' : 'idle', depth: 6, radius: 22 }),
        {
          minHeight: big ? 110 : 72,
          px: 2,
          py: 1.5,
          gap: 1,
          flexDirection: 'column',
          opacity: tried ? 0.45 : 1,
          outline: revealed ? `4px solid ${w.main}` : 'none',
          animation: shake ? 'kl-shake 420ms ease-in-out' : 'none',
        },
      ]}
    >
      {children}
      <Typography component="span" lang={lang} sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: big ? '1.8rem' : '1.1rem', color: w.text, textDecoration: tried ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {revealed && <CheckRounded aria-hidden />}
        {label}
      </Typography>
    </ButtonBase>
  );
}
