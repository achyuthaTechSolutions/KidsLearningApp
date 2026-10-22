import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { VolumeUpRounded, VolumeOffRounded, ReplayRounded, NavigateBefore, NavigateNext } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import PillPicker from '../../components/ui/PillPicker';
import IllustrationBubble from '../../components/ui/IllustrationBubble';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Confetti from '../../components/ui/Confetti';
import Mascot from '../../components/ui/Mascot';
import { useWorld } from '../../components/ui/world';
import { rainbow, worlds, type WorldKey } from '../../theme/tokens';
import { alphabetData, letterOrder } from '../../data/alphabet';
import { numberData } from '../../data/numbers';
import { specialKeyData, punctuationData } from '../../data/specialKeys';
import { useAppStore } from '../../store/useAppStore';
import { speak, cancelSpeech } from '../../services/speech';
import { playConfirmation } from '../../services/audio';
import OnScreenKeyboard from './OnScreenKeyboard';
import Illustration from '../../components/ui/Illustration';

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
  const [celebrate, setCelebrate] = useState(0);

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
        setCelebrate((count) => count + 1);
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
        setCelebrate((count) => count + 1);
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

  const stageWorld: WorldKey = (() => {
    if (!activeKey) return 'violet';
    const index = activeKey.length === 1 ? letterOrder.indexOf(activeKey.toUpperCase()) : -1;
    if (index >= 0) return rainbow[index % rainbow.length];
    if (/^[0-9]$/.test(activeKey)) return 'sun';
    return 'slate';
  })();
  const stage = useWorld(stageWorld);
  const green = useWorld('green');
  const orange = useWorld('orange');
  const titleColor = stageWorld === 'sun' || stageWorld === 'gold' ? stage.text : stage.main;
  const frame = guessResult === 'correct' ? green.main : guessResult === 'wrong' ? orange.main : alpha(stage.main, 0.35);
  const challenge = mode === 'guess' && guessTarget
    ? { emoji: '🤔', text: `Can you press the letter ${guessTarget}?`, hint: alphabetData[guessTarget]?.description }
    : mode === 'find' && findTarget
      ? { emoji: '🔍', text: `Find the ${findTarget} key!`, hint: 'Look for the glowing key below.' }
      : null;

  return (
    <Page>
      <PageHero world="violet" title="Keyboard Explorer" subtitle="Tap a key below to learn. A real keyboard works too." emoji="⌨️" />

      <PillPicker<Mode>
        world="violet"
        ariaLabel="Keyboard learning mode"
        value={mode}
        onChange={setMode}
        scroll
        options={[
          { value: 'free', label: 'Free Explore', emoji: '🌈' },
          { value: 'letters', label: 'Letter Practice', emoji: '🔤' },
          { value: 'numbers', label: 'Number Practice', emoji: '🔢' },
          { value: 'guess', label: 'Guess the Letter', emoji: '🤔' },
          { value: 'find', label: 'Find the Key', emoji: '🔍' },
        ]}
      />

      {challenge && (
        <Box
          key={challenge.text}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            px: 2,
            py: 1.5,
            borderRadius: '22px',
            bgcolor: worlds.gold.soft,
            color: worlds.gold.ink,
            border: `2px solid ${worlds.gold.main}`,
            boxShadow: `0 4px 0 ${worlds.gold.main}`,
            animation: 'kl-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
        >
          <Box aria-hidden sx={{ fontSize: '2rem', lineHeight: 1 }}><Illustration emoji={challenge.emoji} /></Box>
          <Box>
            <Typography variant="h4" component="p" sx={{ color: 'inherit' }}>{challenge.text}</Typography>
            {challenge.hint && <Typography variant="body2" sx={{ color: 'inherit' }}>{challenge.hint}</Typography>}
          </Box>
        </Box>
      )}

      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '28px', md: '36px' },
          bgcolor: 'background.paper',
          border: `3px solid ${frame}`,
          boxShadow: `0 8px 0 ${frame}`,
          p: { xs: 2.5, md: 4 },
          mb: 3.5,
          minHeight: { md: 260 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          gap: { xs: 2, md: 4 },
          transition: 'border-color 200ms, box-shadow 200ms',
          animation: guessResult === 'wrong' ? 'kl-shake 420ms ease-in-out' : 'none',
        }}
      >
        <Box aria-hidden sx={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', left: -90, top: -90, bgcolor: stage.tint }} />
        <Box sx={{ position: 'relative' }}>
          {content ? (
            <IllustrationBubble emoji={content.emoji} world={stageWorld} size="lg" popKey={activeKey ?? undefined} />
          ) : (
            <Mascot size={130} mood={challenge ? 'think' : 'happy'} wave={!challenge} />
          )}
        </Box>

        <Box sx={{ position: 'relative', flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
          {content ? (
            <Box key={activeKey ?? 'none'} sx={{ animation: 'kl-rise-in 320ms ease-out both' }}>
              <Typography
                variant="h1"
                component="p"
                sx={{ fontSize: { xs: content.title.length > 6 ? '2.2rem' : '3.4rem', md: content.title.length > 6 ? '3rem' : '4.6rem' }, lineHeight: 1, color: titleColor, textShadow: `0 4px 0 ${alpha(stage.main, 0.18)}`, overflowWrap: 'anywhere' }}
              >
                {content.title}
              </Typography>
              <Typography variant="h3" component="p" sx={{ mt: 1, fontSize: { xs: '1.35rem', md: '1.7rem' } }}>{content.subtitle}</Typography>
              {content.description && (
                <Typography variant="body1" sx={{ mt: 0.5, color: 'text.secondary' }}>{content.description}</Typography>
              )}
              {guessResult && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    mt: 1.5,
                    px: 2,
                    py: 0.75,
                    borderRadius: '999px',
                    fontWeight: 900,
                    bgcolor: guessResult === 'correct' ? green.main : orange.tint,
                    color: guessResult === 'correct' ? green.onMain : orange.text,
                    animation: 'kl-pop-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
                  }}
                >
                  {guessResult === 'correct' ? <>Correct! <Illustration emoji="🎉" sx={{ ml: 0.5 }} /></> : 'Good try! Have another go.'}
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="h3" component="p" sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, color: 'text.secondary' }}>
              {challenge ? 'Your turn! Press the key.' : 'Press any key to start exploring!'}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1.5, mt: 2.5 }}>
            {(mode === 'letters' || mode === 'numbers') && (
              <>
                <Button startIcon={<NavigateBefore />} onClick={() => handlePracticeNav(-1)} variant="outlined">
                  Previous
                </Button>
                <Button endIcon={<NavigateNext />} onClick={() => handlePracticeNav(1)} variant="contained">
                  Next
                </Button>
              </>
            )}
            <RoundIconButton label="Repeat speech" world={stageWorld} onClick={handleRepeat} disabled={!content}>
              <ReplayRounded />
            </RoundIconButton>
            <RoundIconButton
              label={settings.speechEnabled ? 'Turn speech off' : 'Turn speech on'}
              world="violet"
              filled={settings.speechEnabled}
              onClick={() => useAppStore.getState().updateSettings({ speechEnabled: !settings.speechEnabled })}
            >
              {settings.speechEnabled ? <VolumeUpRounded /> : <VolumeOffRounded />}
            </RoundIconButton>
          </Box>
        </Box>
      </Box>

      <OnScreenKeyboard
        pressedKeys={pressedKeys}
        activeKey={activeKey}
        onKeyClick={(key) => handleKeyAction(key)}
        highlightKey={mode === 'find' ? findTarget : null}
      />
      <Confetti fire={celebrate} />
    </Page>
  );
}
