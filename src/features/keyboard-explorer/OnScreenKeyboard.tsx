import { Box, Button } from '@mui/material';

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

export default function OnScreenKeyboard({ pressedKeys, activeKey, onKeyClick, highlightKey }: Props) {
  const isPressed = (key: string) => {
    if (pressedKeys.has(key)) return true;
    if (pressedKeys.has(key.toLowerCase())) return true;
    return false;
  };

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
    if (key === 'Tab') return 'Tab';
    if (key === 'CapsLock') return 'Caps';
    if (key === 'Enter') return '↵';
    if (key === 'Shift') return '⇧';
    if (key === 'Space') return 'Space';
    return key;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', pb: 1 }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center', minWidth: 'max-content', mx: 'auto' }}>
      {rows.map((row, ri) => (
        <Box key={ri} sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {row.map((key) => {
            const w = wideKeys[key] || 1;
            const pressed = isPressed(key);
            const active = isActive(key);
            const highlighted = isHighlighted(key);
            return (
              <Button
                key={key}
                aria-label={accessibleName(key)}
                onClick={() => handleClick(key)}
                variant={active ? 'contained' : 'outlined'}
                sx={{
                  minWidth: { xs: w * 28, sm: w * 36, md: w * 48 },
                  height: { xs: 32, sm: 40, md: 48 },
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.9rem' },
                  fontWeight: 700,
                  borderRadius: 2,
                  p: 0.5,
                  textTransform: 'none',
                  bgcolor: active ? 'primary.main' : pressed ? 'primary.light' : highlighted ? 'warning.light' : 'background.paper',
                  color: active ? 'white' : 'text.primary',
                  border: highlighted ? '2px solid' : '1px solid',
                  borderColor: highlighted ? 'warning.main' : active ? 'primary.main' : 'divider',
                  boxShadow: active ? '0 4px 12px rgba(108,92,231,0.3)' : pressed ? '0 2px 8px rgba(108,92,231,0.2)' : 'none',
                  transform: pressed ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  animation: highlighted ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%,100%': { boxShadow: '0 0 0 0 rgba(253,203,110,0.4)' },
                    '50%': { boxShadow: '0 0 0 8px rgba(253,203,110,0)' },
                  },
                }}
              >
                {getLabel(key)}
              </Button>
            );
          })}
        </Box>
      ))}
      {/* Arrow keys */}
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
        {['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'].map((key) => {
          const labels: Record<string, string> = { ArrowLeft: '←', ArrowDown: '↓', ArrowUp: '↑', ArrowRight: '→' };
          const active = isActive(key);
          return (
            <Button
              key={key}
              aria-label={accessibleName(key)}
              onClick={() => handleClick(key)}
              variant={active ? 'contained' : 'outlined'}
              sx={{
                minWidth: { xs: 32, md: 48 }, height: { xs: 32, md: 48 },
                fontSize: '1.2rem', borderRadius: 2,
                bgcolor: active ? 'primary.main' : 'background.paper',
              }}
            >
              {labels[key]}
            </Button>
          );
        })}
      </Box>
    </Box>
    </Box>
  );
}
