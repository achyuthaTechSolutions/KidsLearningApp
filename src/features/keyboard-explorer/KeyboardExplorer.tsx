import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, ToggleButtonGroup, ToggleButton, IconButton, Chip } from '@mui/material';
import { VolumeUp, VolumeOff, Replay, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { alphabetData, letterOrder } from '../../data/alphabet';
import { numberData } from '../../data/numbers';
import { specialKeyData, punctuationData } from '../../data/specialKeys';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech } from '../../services/speech';
import { playConfirmation } from '../../services/audio';
import OnScreenKeyboard from './OnScreenKeyboard';

type Mode = 'free' | 'letters' | 'numbers' | 'guess' | 'find';

interface DisplayContent {
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
}

const numberKeyMap: Record<string, number> = {};
for (let i = 0; i <= 9; i++) numberKeyMap[String(i)] = i;

export default function KeyboardExplorer() {
  const [mode, setMode] = useState<Mode>('free');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [content, setContent] = useState<DisplayContent | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [guessTarget, setGuessTarget] = useState<string | null>(null);
  const [guessResult, setGuessResult] = useState<'correct' | 'wrong' | null>(null);
  const [findTarget, setFindTarget] = useState<string | null>(null);

  const settings = useAppStore((s) => s.settings);
  const addLetterExplored = useAppStore((s) => s.addLetterExplored);
  const addNumberExplored = useAppStore((s) => s.addNumberExplored);
  const lastKeyTime = useRef(0);

  const getContentForKey = useCallback((key: string): DisplayContent | null => {
    const upper = key.toUpperCase();
    if (alphabetData[upper]) {
      const d = alphabetData[upper];
      return { title: `${d.uppercase} ${d.lowercase}`, subtitle: d.description, emoji: d.emoji, description: `${d.word} starts with the sound "${d.phonetic}"` };
    }
    if (key in numberKeyMap) {
      const n = numberData[numberKeyMap[key]];
      if (n) return { title: n.word, subtitle: n.description, emoji: n.emoji, description: `The number ${n.value}` };
    }
    if (specialKeyData[key]) {
      const s = specialKeyData[key];
      return { title: s.name, subtitle: s.description, emoji: s.emoji, description: '' };
    }
    if (punctuationData[key]) {
      const p = punctuationData[key];
      return { title: p.name, subtitle: p.description, emoji: p.emoji, description: '' };
    }
    return { title: `Key: ${key}`, subtitle: 'This is a key on your keyboard!', emoji: '⌨️', description: '' };
  }, []);

  const handleKeyAction = useCallback((key: string) => {
    const now = Date.now();
    if (now - lastKeyTime.current < 200) return;
    lastKeyTime.current = now;

    const displayKey = key === ' ' ? 'Space' : key;
    setActiveKey(displayKey);

    const c = getContentForKey(key);
    setContent(c);

    if (settings.soundEnabled) playConfirmation(settings.volume * 0.3);

    if (settings.speechEnabled && c) {
      cancelSpeech();
      const upper = key.toUpperCase();
      if (alphabetData[upper]) {
        speak(`Letter ${upper}. ${upper} is for ${alphabetData[upper].word}. ${alphabetData[upper].word} starts with the sound ${upper}.`, { rate: settings.speechRate });
      } else if (key in numberKeyMap) {
        const n = numberData[numberKeyMap[key]];
        if (n) speak(`${n.word}! ${n.description}`, { rate: settings.speechRate });
      } else if (c) {
        speak(`${c.title}. ${c.subtitle}`, { rate: settings.speechRate });
      }
    }

    const upper = key.toUpperCase();
    if (alphabetData[upper]) addLetterExplored(upper);
    if (key in numberKeyMap) addNumberExplored(numberKeyMap[key]);

    if (mode === 'guess' && guessTarget) {
      if (key.toUpperCase() === guessTarget) {
        setGuessResult('correct');
        if (settings.speechEnabled) setTimeout(() => speak('Correct! Well done!', { rate: settings.speechRate }), 800);
        setTimeout(() => { setGuessResult(null); newGuessTarget(); }, 2000);
      } else {
        setGuessResult('wrong');
        if (settings.speechEnabled) setTimeout(() => speak('Try again!', { rate: settings.speechRate }), 500);
        setTimeout(() => setGuessResult(null), 1500);
      }
    }

    if (mode === 'find' && findTarget) {
      if (displayKey.toUpperCase() === findTarget.toUpperCase() || key.toUpperCase() === findTarget.toUpperCase()) {
        setGuessResult('correct');
        if (settings.speechEnabled) setTimeout(() => speak('You found it! Great job!', { rate: settings.speechRate }), 800);
        setTimeout(() => { setGuessResult(null); newFindTarget(); }, 2000);
      }
    }
  }, [settings, getContentForKey, addLetterExplored, addNumberExplored, mode, guessTarget, findTarget]);

  const newGuessTarget = () => {
    const letter = letterOrder[Math.floor(Math.random() * letterOrder.length)];
    setGuessTarget(letter);
    setGuessResult(null);
    setTimeout(() => {
      const d = alphabetData[letter];
      if (d) speak(`Can you press the letter ${letter}? ${letter} is for ${d.word}!`, { rate: 0.85 });
    }, 300);
  };

  const newFindTarget = () => {
    const keys = [...letterOrder, '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Space', 'Enter'];
    const key = keys[Math.floor(Math.random() * keys.length)];
    setFindTarget(key);
    setGuessResult(null);
    setTimeout(() => speak(`Find the ${key} key on the keyboard!`, { rate: 0.85 }), 300);
  };

  useEffect(() => {
    if (mode === 'guess') newGuessTarget();
    if (mode === 'find') newFindTarget();
  }, [mode]);

  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return el.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      e.preventDefault();
      setPressedKeys((prev) => new Set(prev).add(e.key));
      handleKeyAction(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.key);
        return next;
      });
    };

    const handleBlur = () => setPressedKeys(new Set());

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      cancelSpeech();
    };
  }, [handleKeyAction]);

  const handlePracticeNav = (dir: -1 | 1) => {
    const items = mode === 'letters' ? letterOrder : ['0','1','2','3','4','5','6','7','8','9'];
    const newIndex = (practiceIndex + dir + items.length) % items.length;
    setPracticeIndex(newIndex);
    handleKeyAction(items[newIndex]);
  };

  const handleRepeat = () => {
    if (content && settings.speechEnabled) {
      speak(`${content.title}. ${content.subtitle}`, { rate: settings.speechRate });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          ⌨️ Keyboard Explorer
        </Typography>
        <Typography variant="body1" color="text.secondary">Tap a key below to learn. A keyboard works too.</Typography>
      </Box>

      {/* Mode Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%', '& .MuiToggleButton-root': { minHeight: 48 } }}
        >
          <ToggleButton value="free" sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none' }}>Free Explore</ToggleButton>
          <ToggleButton value="letters" sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none' }}>Letter Practice</ToggleButton>
          <ToggleButton value="numbers" sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none' }}>Number Practice</ToggleButton>
          <ToggleButton value="guess" sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none' }}>Guess the Letter</ToggleButton>
          <ToggleButton value="find" sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none' }}>Find the Key</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Display Area */}
      <Box sx={{
        textAlign: 'center', p: { xs: 3, md: 4 }, mb: 3,
        bgcolor: 'background.paper', borderRadius: 4,
        boxShadow: '0 4px 20px rgba(108,92,231,0.08)',
        minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: guessResult === 'correct' ? '3px solid #00B894' : guessResult === 'wrong' ? '3px solid #E17055' : '3px solid transparent',
        transition: 'border-color 0.3s ease',
      }}>
        {mode === 'guess' && guessTarget && !content && (
          <>
            <Typography sx={{ fontSize: '3rem', mb: 1 }}>🤔</Typography>
            <Typography variant="h3">Can you press the letter {guessTarget}?</Typography>
            <Typography variant="body1" color="text.secondary">{alphabetData[guessTarget]?.description}</Typography>
          </>
        )}
        {mode === 'find' && findTarget && !content && (
          <>
            <Typography sx={{ fontSize: '3rem', mb: 1 }}>🔍</Typography>
            <Typography variant="h3">Find the {findTarget} key!</Typography>
            <Typography variant="body1" color="text.secondary">Tap it on the keyboard below</Typography>
          </>
        )}
        {content ? (
          <>
            <Typography sx={{ fontSize: { xs: '4rem', md: '5rem' }, lineHeight: 1, mb: 1 }}>{content.emoji}</Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, color: 'primary.main', mb: 0.5 }}>
              {content.title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>{content.subtitle}</Typography>
            {content.description && (
              <Typography variant="body1" color="text.secondary">{content.description}</Typography>
            )}
            {guessResult === 'correct' && <Chip label="Correct!" color="success" sx={{ mt: 1, fontWeight: 700 }} />}
            {guessResult === 'wrong' && <Chip label="Try again!" color="error" sx={{ mt: 1, fontWeight: 700 }} />}
          </>
        ) : !['guess', 'find'].includes(mode) ? (
          <>
            <Typography sx={{ fontSize: '3rem', mb: 1 }}>👆</Typography>
            <Typography variant="h4" color="text.secondary">Press a key to start exploring!</Typography>
          </>
        ) : null}
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
        {(mode === 'letters' || mode === 'numbers') && (
          <>
            <Button startIcon={<NavigateBefore />} onClick={() => handlePracticeNav(-1)} variant="outlined" sx={{ borderRadius: 3 }}>
              Previous
            </Button>
            <Button endIcon={<NavigateNext />} onClick={() => handlePracticeNav(1)} variant="outlined" sx={{ borderRadius: 3 }}>
              Next
            </Button>
          </>
        )}
        <IconButton onClick={handleRepeat} color="primary" aria-label="Repeat speech" sx={{ bgcolor: 'action.hover' }}>
          <Replay />
        </IconButton>
        <IconButton
          onClick={() => useAppStore.getState().updateSettings({ speechEnabled: !settings.speechEnabled })}
          color={settings.speechEnabled ? 'primary' : 'default'}
          aria-label={settings.speechEnabled ? 'Turn speech off' : 'Turn speech on'}
          sx={{ bgcolor: 'action.hover' }}
        >
          {settings.speechEnabled ? <VolumeUp /> : <VolumeOff />}
        </IconButton>
      </Box>

      {/* On-screen keyboard */}
      <OnScreenKeyboard
        pressedKeys={pressedKeys}
        activeKey={activeKey}
        onKeyClick={(key) => handleKeyAction(key)}
        highlightKey={mode === 'find' ? findTarget : null}
      />
    </Box>
  );
}
