import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Box, ButtonBase, Slider, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { VolumeUpRounded, VolumeOffRounded, PlayArrowRounded, StopRounded } from '@mui/icons-material';
import { pianoNotes, xylophoneNotes, drumSounds, builtInMelodies } from '../../data/instruments';
import { playNote, playXylophone, playDrum, playGuitar, playFlute } from '../../services/audio';
import { speak } from '../../services/speech';
import { useAppStore } from '../../store/useAppStore';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import LearnTile from '../../components/ui/LearnTile';
import RoundIconButton from '../../components/ui/RoundIconButton';
import { outlineColor, tactile, useWorld } from '../../components/ui/world';
import { fonts, worlds } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';

type Instrument = 'piano' | 'xylophone' | 'drums' | 'guitar' | 'flute';

const instruments: { value: Instrument; label: string; emoji: string; keys: string }[] = [
  { value: 'piano', label: 'Piano', emoji: '🎹', keys: 'A S D F G H J K L for white keys, W E T Y U O for black keys' },
  { value: 'xylophone', label: 'Xylophone', emoji: '🪇', keys: '1 to 8' },
  { value: 'drums', label: 'Drums', emoji: '🥁', keys: 'Z X C V B N' },
  { value: 'guitar', label: 'Guitar', emoji: '🎸', keys: 'Q W E R T Y' },
  { value: 'flute', label: 'Flute', emoji: '🪈', keys: '1 to 8' },
];

/** One color per note name, the way many classroom bells and charts teach it. */
const noteColors: Record<string, string> = {
  C: worlds.red.main,
  D: worlds.orange.main,
  E: worlds.sun.main,
  F: worlds.green.main,
  G: worlds.blue.main,
  A: worlds.violet.main,
  B: worlds.pink.main,
};

const xylophoneColors = [worlds.red.main, worlds.orange.main, worlds.sun.main, worlds.green.main, worlds.blue.main, worlds.violet.main, worlds.pink.main, worlds.red.main];

const drumLooks: Record<string, { color: string; emoji: string }> = {
  kick: { color: worlds.violet.main, emoji: '🥁' },
  snare: { color: worlds.orange.main, emoji: '🪘' },
  hihat: { color: worlds.sun.main, emoji: '✨' },
  tom: { color: worlds.green.main, emoji: '🔵' },
  crash: { color: worlds.blue.main, emoji: '💥' },
  clap: { color: worlds.pink.main, emoji: '👏' },
};

const melodyEmoji: Record<string, string> = {
  'Twinkle Twinkle Little Star': '⭐',
  'Mary Had a Little Lamb': '🐑',
  'Happy Birthday': '🎂',
};

const guitarNotes = [
  { note: 'E3', frequency: 164.81, key: 'q', label: 'E' },
  { note: 'A3', frequency: 220.00, key: 'w', label: 'A' },
  { note: 'D4', frequency: 293.66, key: 'e', label: 'D' },
  { note: 'G4', frequency: 392.00, key: 'r', label: 'G' },
  { note: 'B4', frequency: 493.88, key: 't', label: 'B' },
  { note: 'E5', frequency: 659.25, key: 'y', label: 'E' },
];

const fluteNotes = [
  { note: 'C5', frequency: 523.25, key: '1', label: 'Do' },
  { note: 'D5', frequency: 587.33, key: '2', label: 'Re' },
  { note: 'E5', frequency: 659.25, key: '3', label: 'Mi' },
  { note: 'F5', frequency: 698.46, key: '4', label: 'Fa' },
  { note: 'G5', frequency: 783.99, key: '5', label: 'Sol' },
  { note: 'A5', frequency: 880.00, key: '6', label: 'La' },
  { note: 'B5', frequency: 987.77, key: '7', label: 'Ti' },
  { note: 'C6', frequency: 1046.50, key: '8', label: 'Do' },
];

function keyName(label: string, key: string) {
  return `Play ${label}, keyboard ${key.toUpperCase()}`;
}

function KeyHint({ k, light = false }: { k: string; light?: boolean }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: 'inline-block',
        minWidth: 20,
        px: 0.5,
        borderRadius: '6px',
        fontSize: '0.68rem',
        fontWeight: 900,
        lineHeight: '18px',
        textAlign: 'center',
        textTransform: 'uppercase',
        bgcolor: light ? alpha('#FFFFFF', 0.25) : alpha('#000000', 0.08),
        color: light ? '#FFFFFF' : 'text.secondary',
      }}
    >
      {k}
    </Box>
  );
}

export default function MusicStudio() {
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [playingMelody, setPlayingMelody] = useState<number | null>(null);
  const melodyTimeout = useRef<ReturnType<typeof setTimeout>[]>([]);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const theme = useTheme();
  const blue = useWorld('blue');
  const small = useMediaQuery(theme.breakpoints.down('sm'));
  const medium = useMediaQuery(theme.breakpoints.down('md'));

  const flash = useCallback((key: string) => {
    setActiveKeys((prev) => new Set(prev).add(key));
    setTimeout(() => setActiveKeys((prev) => { const next = new Set(prev); next.delete(key); return next; }), 200);
  }, []);

  const playInstrument = useCallback((key: string) => {
    flash(key);

    const current = useAppStore.getState();
    if (!current.settings.soundEnabled || current.settings.volume <= 0) return;
    current.incrementMusicActivities();
    const volume = current.settings.volume;

    if (instrument === 'piano') {
      const note = pianoNotes.find((n) => n.key === key);
      if (note) playNote(note.frequency, 0.5, volume);
    } else if (instrument === 'xylophone') {
      const note = xylophoneNotes.find((n) => n.key === key);
      if (note) playXylophone(note.frequency, volume);
    } else if (instrument === 'drums') {
      const drum = drumSounds.find((d) => d.key === key);
      if (drum) playDrum(drum.type, volume);
    } else if (instrument === 'guitar') {
      const note = guitarNotes.find((n) => n.key === key);
      if (note) playGuitar(note.frequency, volume);
    } else if (instrument === 'flute') {
      const note = fluteNotes.find((n) => n.key === key);
      if (note) playFlute(note.frequency, volume);
    }
  }, [instrument, flash]);

  useEffect(() => {
    const getKeys = () => {
      if (instrument === 'piano') return pianoNotes.map((n) => n.key);
      if (instrument === 'xylophone') return xylophoneNotes.map((n) => n.key);
      if (instrument === 'drums') return drumSounds.map((d) => d.key);
      if (instrument === 'guitar') return guitarNotes.map((n) => n.key);
      if (instrument === 'flute') return fluteNotes.map((n) => n.key);
      return [];
    };
    const validKeys = getKeys();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.repeat) return;
      if (validKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        playInstrument(e.key.toLowerCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [instrument, playInstrument]);

  const stopMelody = () => {
    melodyTimeout.current.forEach(clearTimeout);
    melodyTimeout.current = [];
    setPlayingMelody(null);
  };

  const handlePlayMelody = (melodyIndex: number) => {
    if (playingMelody !== null) {
      stopMelody();
      return;
    }
    setPlayingMelody(melodyIndex);
    const melody = builtInMelodies[melodyIndex];

    if (settings.speechEnabled) {
      speak(`Playing ${melody.name}!`, { rate: settings.speechRate });
    }

    const noteMap: Record<string, { frequency: number; key: string }> = {};
    pianoNotes.forEach((n) => { noteMap[n.note] = { frequency: n.frequency, key: n.key }; });

    let time = 0;
    melody.notes.forEach(({ note, duration }) => {
      const t = setTimeout(() => {
        const target = noteMap[note];
        if (target) flash(target.key);
        const current = useAppStore.getState().settings;
        if (!current.soundEnabled || current.volume <= 0) return;
        if (target) playNote(target.frequency, duration * 0.9, current.volume);
      }, time * 1000);
      melodyTimeout.current.push(t);
      time += duration;
    });

    const endT = setTimeout(() => setPlayingMelody(null), time * 1000);
    melodyTimeout.current.push(endT);
  };

  useEffect(() => {
    return () => melodyTimeout.current.forEach(clearTimeout);
  }, []);

  const active = (key: string) => activeKeys.has(key);
  const current = instruments.find((i) => i.value === instrument) ?? instruments[0];

  const whiteW = small ? 36 : medium ? 52 : 62;
  const gap = small ? 3 : 4;
  const whites = pianoNotes.filter((n) => !n.isBlack);

  const piano = (
    <Box sx={{ overflowX: 'auto', display: 'flex', justifyContent: { xs: 'flex-start', sm: 'center' }, pb: 1 }}>
      <Box sx={{ bgcolor: '#2B2D42', borderRadius: '24px', p: { xs: 1, sm: 1.5 }, pt: { xs: 2, sm: 2.5 }, boxShadow: '0 8px 0 #1B1C2C', mx: 'auto' }}>
        <Box sx={{ position: 'relative', display: 'flex', gap: `${gap}px` }}>
          {whites.map((note) => {
            const on = active(note.key);
            const dot = noteColors[note.label];
            return (
              <ButtonBase
                key={note.note}
                aria-label={keyName(note.label, note.key)}
                onClick={() => playInstrument(note.key)}
                sx={{
                  width: whiteW,
                  height: small ? 150 : 200,
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  gap: 0.75,
                  pb: 1.25,
                  borderRadius: '0 0 14px 14px',
                  background: on ? `linear-gradient(180deg, #FFFFFF 0%, ${alpha(dot, 0.35)} 100%)` : 'linear-gradient(180deg, #FFFFFF 0%, #F1EFFA 100%)',
                  boxShadow: on ? 'inset 0 -2px 0 #D6D0F0' : 'inset 0 -8px 0 #D6D0F0',
                  transform: on ? 'translateY(3px)' : 'none',
                  transition: 'transform 70ms, box-shadow 70ms, background 120ms',
                  '&:active': { transform: 'translateY(3px)', boxShadow: 'inset 0 -2px 0 #D6D0F0' },
                }}
              >
                <Box aria-hidden sx={{ width: small ? 16 : 22, height: small ? 16 : 22, borderRadius: '50%', bgcolor: dot, boxShadow: `0 2px 0 ${alpha('#000000', 0.2)}` }} />
                <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: small ? '0.85rem' : '1rem', color: '#2B2D42' }}>{note.label}</Typography>
                {!small && <KeyHint k={note.key} />}
              </ButtonBase>
            );
          })}
          {pianoNotes.map((note, index) => {
            if (!note.isBlack) return null;
            const whitesBefore = pianoNotes.slice(0, index).filter((n) => !n.isBlack).length;
            const blackW = Math.round(whiteW * 0.62);
            const left = whitesBefore * (whiteW + gap) - gap / 2 - blackW / 2;
            const on = active(note.key);
            return (
              <ButtonBase
                key={note.note}
                aria-label={keyName(note.label, note.key)}
                onClick={() => playInstrument(note.key)}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left,
                  zIndex: 2,
                  width: blackW,
                  height: small ? 92 : 124,
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  gap: 0.5,
                  pb: 1,
                  borderRadius: '0 0 10px 10px',
                  background: on ? `linear-gradient(180deg, #3A3D5C 0%, ${worlds.violet.main} 100%)` : 'linear-gradient(180deg, #3A3D5C 0%, #15142B 100%)',
                  boxShadow: on ? 'inset 0 -2px 0 #000' : `inset 0 -6px 0 #000, 0 3px 6px ${alpha('#000', 0.4)}`,
                  color: '#FFFFFF',
                  transform: on ? 'translateY(2px)' : 'none',
                  transition: 'transform 70ms, background 120ms',
                }}
              >
                {!small && (
                  <>
                    <Typography component="span" sx={{ fontSize: '0.68rem', fontWeight: 900, color: 'inherit' }}>{note.label}</Typography>
                    <KeyHint k={note.key} light />
                  </>
                )}
              </ButtonBase>
            );
          })}
        </Box>
      </Box>
    </Box>
  );

  const xylophone = (
    <Box sx={{ position: 'relative', maxWidth: 720, mx: 'auto', py: 2 }}>
      <Box aria-hidden sx={{ position: 'absolute', left: 8, right: 8, top: '30%', height: 14, borderRadius: 8, bgcolor: '#B57A45', boxShadow: '0 4px 0 #8A5A30' }} />
      <Box aria-hidden sx={{ position: 'absolute', left: 8, right: 8, top: '68%', height: 14, borderRadius: 8, bgcolor: '#B57A45', boxShadow: '0 4px 0 #8A5A30' }} />
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.75, sm: 1.25 } }}>
        {xylophoneNotes.map((note, i) => {
          const on = active(note.key);
          const color = xylophoneColors[i];
          return (
            <ButtonBase
              key={note.note}
              aria-label={keyName(note.label, note.key)}
              onClick={() => playInstrument(note.key)}
              sx={{
                width: { xs: 36, sm: 56, md: 64 },
                height: { xs: 190 - i * 12, sm: 230 - i * 14 },
                flexDirection: 'column',
                justifyContent: 'space-between',
                py: 1.5,
                borderRadius: '16px',
                bgcolor: color,
                color: '#FFFFFF',
                boxShadow: on ? `0 1px 0 ${alpha('#000', 0.3)}, 0 0 0 4px ${alpha(color, 0.35)}` : `0 6px 0 ${alpha('#000', 0.25)}`,
                transform: on ? 'translateY(4px) scale(0.98)' : 'none',
                filter: on ? 'brightness(1.12)' : 'none',
                transition: 'transform 70ms, box-shadow 70ms, filter 120ms',
              }}
            >
              <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: alpha('#FFFFFF', 0.7) }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '0.8rem', sm: '1rem' }, color: 'inherit', textShadow: `0 1px 0 ${alpha('#000', 0.25)}` }}>{note.label}</Typography>
                <KeyHint k={note.key} light />
              </Box>
              <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: alpha('#FFFFFF', 0.7) }} />
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );

  const drums = (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: { xs: 2, md: 2.5 }, maxWidth: 820, mx: 'auto', justifyItems: 'center' }}>
      {drumSounds.map((drum) => {
        const look = drumLooks[drum.type];
        const on = active(drum.key);
        return (
          <ButtonBase
            key={drum.type}
            aria-label={keyName(drum.name, drum.key)}
            onClick={() => playInstrument(drum.key)}
            sx={{
              width: { xs: 96, md: 112 },
              height: { xs: 96, md: 112 },
              borderRadius: '50%',
              flexDirection: 'column',
              gap: 0.25,
              color: '#FFFFFF',
              background: `radial-gradient(circle at 50% 42%, ${alpha('#FFFFFF', 0.95)} 0%, #F4F2FF 46%, ${look.color} 48%, ${look.color} 100%)`,
              border: `6px solid ${alpha('#000000', 0.12)}`,
              boxShadow: on ? `0 2px 0 ${alpha('#000', 0.3)}` : `0 8px 0 ${alpha('#000', 0.25)}`,
              transform: on ? 'translateY(5px) scale(0.94)' : 'none',
              transition: 'transform 70ms, box-shadow 70ms',
            }}
          >
            <Box aria-hidden sx={{ fontSize: '1.6rem', lineHeight: 1 }}><Illustration emoji={look.emoji} /></Box>
            <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '0.9rem', color: '#2B2D42' }}>{drum.name}</Typography>
            <KeyHint k={drum.key} />
          </ButtonBase>
        );
      })}
    </Box>
  );

  const guitar = (
    <Box sx={{ position: 'relative', maxWidth: 760, mx: 'auto', borderRadius: '40px', overflow: 'hidden', bgcolor: '#C9874B', boxShadow: '0 8px 0 #93592A', py: 2.5, px: { xs: 1.5, sm: 3 } }}>
      <Box aria-hidden sx={{ position: 'absolute', right: { xs: -70, sm: 40 }, top: '50%', transform: 'translateY(-50%)', width: 150, height: 150, borderRadius: '50%', bgcolor: '#3B2414', border: '10px solid #E6B37A' }} />
      <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {guitarNotes.map((note, i) => {
          const on = active(note.key);
          return (
            <ButtonBase
              key={note.note}
              aria-label={keyName(note.label, note.key)}
              onClick={() => playInstrument(note.key)}
              sx={{ width: '100%', minHeight: 48, justifyContent: 'flex-start', gap: 1.5, borderRadius: '14px', px: 1, '&:hover': { bgcolor: alpha('#FFFFFF', 0.12) } }}
            >
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#FFF3E0', color: '#6B3D18', fontFamily: fonts.display, fontWeight: 700, flexShrink: 0, boxShadow: '0 3px 0 #93592A' }}>
                {note.label}
              </Box>
              <Box
                aria-hidden
                sx={{
                  flex: 1,
                  height: 6 - i * 0.7,
                  minHeight: 2,
                  borderRadius: 4,
                  background: on ? '#FFFFFF' : 'linear-gradient(180deg, #F7E7C6 0%, #B89A62 100%)',
                  boxShadow: on ? `0 0 12px ${alpha('#FFFFFF', 0.9)}` : `0 2px 0 ${alpha('#000', 0.25)}`,
                  animation: on ? 'kl-shake 200ms linear' : 'none',
                }}
              />
              <KeyHint k={note.key} light />
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );

  const flute = (
    <Box sx={{ overflowX: 'auto', pb: 1 }}>
      <Box sx={{ minWidth: 560, maxWidth: 860, mx: 'auto', position: 'relative', borderRadius: '999px', background: 'linear-gradient(180deg, #F4F6FB 0%, #C9D1E3 55%, #A9B4CC 100%)', boxShadow: '0 8px 0 #8592AE', px: 4, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box aria-hidden sx={{ width: 26, height: 16, borderRadius: '50%', bgcolor: '#5B6B85', mr: 1 }} />
        {fluteNotes.map((note) => {
          const on = active(note.key);
          return (
            <ButtonBase
              key={note.note}
              aria-label={keyName(note.label, note.key)}
              onClick={() => playInstrument(note.key)}
              sx={{ flexDirection: 'column', gap: 0.5, borderRadius: '16px', p: 0.5 }}
            >
              <Box
                sx={{
                  width: { xs: 40, md: 48 },
                  height: { xs: 40, md: 48 },
                  borderRadius: '50%',
                  bgcolor: on ? blue.main : '#2B2D42',
                  border: '5px solid #E6EAF3',
                  boxShadow: on ? `0 0 0 6px ${alpha(blue.main, 0.35)}` : 'inset 0 4px 6px rgba(0,0,0,0.5)',
                  transition: 'background-color 100ms, box-shadow 100ms',
                }}
              />
              <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '0.9rem', color: '#2B2D42' }}>{note.label}</Typography>
              <KeyHint k={note.key} />
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );

  const stages: Record<Instrument, ReactNode> = { piano, xylophone, drums, guitar, flute };

  return (
    <Page>
      <PageHero world="blue" title="Music Studio" subtitle="Tap the instrument or use your keyboard to play." emoji="🎹" />

      <Box
        role="group"
        aria-label="Instrument"
        sx={{ display: 'flex', gap: { xs: 1.25, md: 2 }, overflowX: 'auto', mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, pt: 1, pb: 2, mb: 1, justifyContent: { md: 'center' }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
      >
        {instruments.map((item) => (
          <Box key={item.value} sx={{ flex: '0 0 auto', width: { xs: 96, md: 120 } }}>
            <LearnTile
              shape="wide"
              world="blue"
              selected={instrument === item.value}
              done={false}
              ariaLabel={item.label}
              onClick={() => setInstrument(item.value)}
            >
              <Box sx={{ py: 1.25, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box aria-hidden sx={{ fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1.15 }}><Illustration emoji={item.emoji} /></Box>
                <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 600, color: 'inherit' }}>{item.label}</Typography>
              </Box>
            </LearnTile>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          borderRadius: { xs: '28px', md: '36px' },
          bgcolor: blue.tint,
          border: `2px solid ${alpha(blue.main, 0.25)}`,
          p: { xs: 2, md: 3.5 },
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <Typography variant="h3" component="h2" sx={{ color: blue.text, fontSize: { xs: '1.35rem', md: '1.6rem' } }}>
            <Illustration emoji={current.emoji} sx={{ mr: 1 }} />{current.label}
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 0.75, pr: 2.5, py: 0.5, borderRadius: '999px', bgcolor: 'background.paper', border: `2px solid ${outlineColor(theme)}`, boxShadow: `0 3px 0 ${outlineColor(theme)}` }}
          >
            <RoundIconButton
              label={settings.soundEnabled ? 'Turn sound off' : 'Turn sound on'}
              world="blue"
              filled={settings.soundEnabled}
              size={44}
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            >
              {settings.soundEnabled ? <VolumeUpRounded /> : <VolumeOffRounded />}
            </RoundIconButton>
            <Slider
              aria-label="Volume"
              value={settings.volume}
              onChange={(_, value) => updateSettings({ volume: value as number })}
              min={0}
              max={1}
              step={0.05}
              sx={{ width: { xs: 110, sm: 160 }, color: blue.main }}
            />
          </Box>
        </Box>

        {!settings.soundEnabled && (
          <Typography variant="body2" sx={{ textAlign: 'center', mb: 2, color: blue.text }}>
            Sound is off. Turn it on to hear the instruments.
          </Typography>
        )}

        <Box key={instrument} sx={{ animation: 'kl-rise-in 320ms ease-out both' }}>
          {stages[instrument]}
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2.5, color: 'text.secondary' }}>
          <Illustration emoji="⌨️" sx={{ mr: 0.75 }} />Keyboard: {current.keys}
        </Typography>
      </Box>

      {instrument === 'piano' && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mb: 3 }} aria-label="Note colours">
          {Object.entries(noteColors).map(([name, color]) => (
            <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: '999px', bgcolor: 'background.paper', border: `2px solid ${outlineColor(theme)}` }}>
              <Box aria-hidden sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color }} />
              <Typography component="span" sx={{ fontWeight: 900 }}>{name}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Typography variant="h2" sx={{ fontSize: { xs: '1.45rem', md: '1.8rem' }, mb: 2 }}>Play a melody</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {builtInMelodies.map((melody, i) => {
          const playing = playingMelody === i;
          return (
            <ButtonBase
              key={melody.name}
              onClick={() => handlePlayMelody(i)}
              aria-label={playingMelody !== null ? `Stop ${builtInMelodies[playingMelody].name}` : `Play ${melody.name}`}
              sx={[
                tactile(theme, blue, { state: playing ? 'selected' : 'idle', depth: 5, radius: 24 }),
                { justifyContent: 'flex-start', gap: 1.5, p: 1.5, textAlign: 'left' },
              ]}
            >
              <Box aria-hidden sx={{ width: 56, height: 56, borderRadius: '18px', display: 'grid', placeItems: 'center', bgcolor: playing ? alpha('#FFFFFF', 0.2) : blue.tint, fontSize: '1.9rem', flexShrink: 0, animation: playing ? 'kl-wiggle 0.8s ease-in-out infinite' : 'none' }}>
                <Illustration emoji={melodyEmoji[melody.name] ?? '🎵'} />
              </Box>
              <Typography component="span" sx={{ flex: 1, fontFamily: fonts.display, fontWeight: 600, fontSize: '1.08rem', color: 'inherit' }}>
                {melody.name}
              </Typography>
              <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: playing ? '#FFFFFF' : blue.main, color: playing ? blue.main : '#FFFFFF', flexShrink: 0 }}>
                {playing ? <StopRounded /> : <PlayArrowRounded />}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Page>
  );
}
