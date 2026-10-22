import { Box, ButtonBase } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { outlineColor, useWorld } from '../../components/ui/world';
import { fonts, worlds } from '../../theme/tokens';

const rows = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],
  ['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],
  ['CapsLock','A','S','D','F','G','H','J','K','L',';',"'",'Enter'],
  ['Shift','Z','X','C','V','B','N','M',',','.','/'],
  ['Space'],
];

const wideKeys: Record<string, number> = {
  Backspace: 2, Tab: 1.5, '\\': 1.5, CapsLock: 1.8, Enter: 2.2, Shift: 2.5, Space: 8,
};

interface Props {
  pressedKeys: Set<string>;
  activeKey: string | null;
  onKeyClick: (key: string) => void;
  highlightKey?: string | null;
}

const arrowLabels: Record<string, string> = { ArrowLeft: '←', ArrowDown: '↓', ArrowUp: '↑', ArrowRight: '→' };

export default function OnScreenKeyboard({ pressedKeys, activeKey, onKeyClick, highlightKey }: Props) {
  const theme = useTheme();
  const violet = useWorld('violet');
  const sun = useWorld('sun');
  const slate = useWorld('slate');
  const outline = outlineColor(theme);
  const dark = theme.palette.mode === 'dark';

  const isPressed = (key: string) => pressedKeys.has(key) || pressedKeys.has(key.toLowerCase());

  const isActive = (key: string) => {
    if (!activeKey) return false;
    return activeKey.toUpperCase() === key.toUpperCase() || activeKey === key;
  };

  const isHighlighted = (key: string) => {
    if (!highlightKey) return false;
    return highlightKey.toUpperCase() === key.toUpperCase();
  };

  const handleClick = (key: string) => {
    const sendKey = key === 'Space' ? ' ' : key.length === 1 ? key.toLowerCase() : key;
    onKeyClick(sendKey);
  };

  const accessibleName = (key: string) => {
    const names: Record<string, string> = {
      Backspace: 'Backspace',
      Tab: 'Tab',
      CapsLock: 'Caps Lock',
      Enter: 'Enter',
      Shift: 'Shift',
      Space: 'Space',
      ArrowLeft: 'Left arrow',
      ArrowDown: 'Down arrow',
      ArrowUp: 'Up arrow',
      ArrowRight: 'Right arrow',
    };
    return names[key] ?? `${key} key`;
  };

  const getLabel = (key: string) => {
    if (key === 'Backspace') return '⌫';
    if (key === 'CapsLock') return 'Caps';
    if (key === 'Enter') return '↵ Enter';
    if (key === 'Shift') return '⇧ Shift';
    if (key in arrowLabels) return arrowLabels[key];
    return key;
  };

  const inkFor = (key: string) => {
    if (/^[A-Z]$/.test(key)) return violet.text;
    if (/^[0-9]$/.test(key)) return sun.text;
    return slate.text;
  };

  const renderKey = (key: string, width: number) => {
    const pressed = isPressed(key);
    const active = isActive(key);
    const highlighted = isHighlighted(key);
    const capColor = active ? violet.main : highlighted ? (dark ? alpha(worlds.gold.main, 0.25) : worlds.gold.soft) : 'background.paper';
    const lipColor = active ? violet.dark : highlighted ? worlds.gold.main : outline;
    const down = pressed || active;
    return (
      <ButtonBase
        key={key}
        aria-label={accessibleName(key)}
        onClick={() => handleClick(key)}
        sx={{
          minWidth: { xs: width * 30, sm: width * 38, md: width * 50 },
          height: { xs: 38, sm: 44, md: 52 },
          px: 0.5,
          borderRadius: { xs: '10px', md: '14px' },
          border: `2px solid ${active ? violet.main : highlighted ? worlds.gold.main : outline}`,
          bgcolor: capColor,
          color: active ? violet.onMain : inkFor(key),
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: { xs: key.length > 1 ? '0.7rem' : '0.95rem', sm: key.length > 1 ? '0.8rem' : '1.1rem', md: key.length > 1 ? '0.9rem' : '1.3rem' },
          boxShadow: down ? `0 1px 0 ${lipColor}` : `0 4px 0 ${lipColor}`,
          transform: down ? 'translateY(3px)' : 'none',
          transition: 'transform 80ms, box-shadow 80ms, background-color 140ms',
          animation: highlighted ? 'kl-ring 1.4s ease-out infinite' : 'none',
          '&:hover': { borderColor: violet.main },
          '&:active': { transform: 'translateY(3px)', boxShadow: `0 1px 0 ${lipColor}` },
        }}
      >
        {getLabel(key)}
      </ButtonBase>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: { xs: '24px', md: '32px' },
        bgcolor: dark ? alpha('#FFFFFF', 0.04) : alpha(worlds.violet.main, 0.07),
        border: `2px solid ${alpha(worlds.violet.main, dark ? 0.25 : 0.15)}`,
        p: { xs: 1.25, sm: 2, md: 2.5 },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, md: 1 }, alignItems: 'center', minWidth: 'max-content', mx: 'auto', pb: 0.5 }}>
        {rows.map((row, ri) => (
          <Box key={ri} sx={{ display: 'flex', gap: { xs: 0.5, md: 0.75 }, justifyContent: 'center' }}>
            {row.map((key) => renderKey(key, wideKeys[key] || 1))}
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 0.75 }, mt: 0.5 }}>
          {['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'].map((key) => renderKey(key, 1))}
        </Box>
      </Box>
    </Box>
  );
}
