import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, ToggleButtonGroup, ToggleButton, Slider, IconButton, Card, CardContent } from '@mui/material';
import { VolumeUp, VolumeOff, PlayArrow, Stop } from '@mui/icons-material';
import { pianoNotes, xylophoneNotes, drumSounds, builtInMelodies } from '../../data/instruments';
import { playNote, playXylophone, playDrum, playGuitar, playFlute } from '../../services/audio';
import { speak } from '../../services/speech';
import { useAppStore } from '../../store/useAppStore';

type Instrument = 'piano' | 'xylophone' | 'drums' | 'guitar' | 'flute';

const xylophoneColors = ['#E17055', '#FDCB6E', '#00B894', '#74B9FF', '#6C5CE7', '#FF7675', '#A29BFE', '#55EFC4'];

const pianoFrequencies: Record<string, number> = {};
pianoNotes.forEach((n) => { pianoFrequencies[n.note] = n.frequency; });

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

export default function MusicStudio() {
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [playingMelody, setPlayingMelody] = useState(false);
  const melodyTimeout = useRef<ReturnType<typeof setTimeout>[]>([]);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const playInstrument = useCallback((key: string) => {
    setActiveKeys((prev) => new Set(prev).add(key));
    setTimeout(() => setActiveKeys((prev) => { const next = new Set(prev); next.delete(key); return next; }), 200);

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
  }, [instrument]);

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

  const handlePlayMelody = (melodyIndex: number) => {
    if (playingMelody) {
      melodyTimeout.current.forEach(clearTimeout);
      melodyTimeout.current = [];
      setPlayingMelody(false);
      return;
    }
    setPlayingMelody(true);
    const melody = builtInMelodies[melodyIndex];

    if (settings.speechEnabled) {
      speak(`Playing ${melody.name}!`, { rate: settings.speechRate });
    }

    const noteMap: Record<string, number> = {};
    pianoNotes.forEach((n) => { noteMap[n.note] = n.frequency; });

    let time = 0;
    melody.notes.forEach(({ note, duration }) => {
      const t = setTimeout(() => {
        const current = useAppStore.getState().settings;
        if (!current.soundEnabled || current.volume <= 0) return;
        const freq = noteMap[note];
        if (freq) playNote(freq, duration * 0.9, current.volume);
      }, time * 1000);
      melodyTimeout.current.push(t);
      time += duration;
    });

    const endT = setTimeout(() => setPlayingMelody(false), time * 1000);
    melodyTimeout.current.push(endT);
  };

  useEffect(() => {
    return () => melodyTimeout.current.forEach(clearTimeout);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          🎵 Music Studio
        </Typography>
        <Typography variant="body1" color="text.secondary">Click the keys or use your keyboard to play!</Typography>
      </Box>

      {/* Instrument Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <ToggleButtonGroup value={instrument} exclusive onChange={(_, v) => v && setInstrument(v)} size="small" sx={{ flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
          <ToggleButton value="piano" sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>🎹 Piano</ToggleButton>
          <ToggleButton value="xylophone" sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>🎵 Xylophone</ToggleButton>
          <ToggleButton value="drums" sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>🥁 Drums</ToggleButton>
          <ToggleButton value="guitar" sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>🎸 Guitar</ToggleButton>
          <ToggleButton value="flute" sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>🪈 Flute</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Volume Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1, px: 2 }}>
        <IconButton
          aria-label={settings.soundEnabled ? 'Turn sound off' : 'Turn sound on'}
          onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        >
          {settings.soundEnabled ? <VolumeUp /> : <VolumeOff />}
        </IconButton>
        <Slider
          aria-label="Volume"
          value={settings.volume}
          onChange={(_, value) => updateSettings({ volume: value as number })}
          min={0}
          max={1}
          step={0.05}
          sx={{ width: { xs: 140, sm: 180 } }}
        />
      </Box>
      {!settings.soundEnabled && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          Sound is off. Turn it on to hear the instruments.
        </Typography>
      )}

      {/* Piano */}
      {instrument === 'piano' && (
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexWrap: 'wrap', justifyContent: 'center', gap: 1, mb: 3, px: 1 }}>
          {pianoNotes.map((note) => (
            <Button
              key={`compact-${note.note}`}
              aria-label={keyName(note.label, note.key)}
              onClick={() => playInstrument(note.key)}
              sx={{
                minWidth: 72,
                minHeight: note.isBlack ? 64 : 84,
                bgcolor: note.isBlack
                  ? (activeKeys.has(note.key) ? '#6C5CE7' : '#333')
                  : (activeKeys.has(note.key) ? 'primary.light' : 'white'),
                color: note.isBlack ? 'white' : 'text.primary',
                border: note.isBlack ? 'none' : '1px solid #ccc',
                borderRadius: 2,
                fontWeight: 700,
              }}
            >
              {note.label}
            </Button>
          ))}
        </Box>
      )}
      {instrument === 'piano' && (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', position: 'relative', mb: 3, overflowX: 'auto', pb: 2, px: 1 }}>
          <Box sx={{ display: 'flex', position: 'relative' }}>
            {pianoNotes.filter((n) => !n.isBlack).map((note) => (
              <Button
                key={note.note}
                aria-label={keyName(note.label, note.key)}
                onClick={() => playInstrument(note.key)}
                sx={{
                  width: { xs: 40, md: 56 }, height: { xs: 120, md: 160 },
                  bgcolor: activeKeys.has(note.key) ? 'primary.light' : 'white',
                  color: 'text.primary', border: '1px solid #ccc', borderRadius: '0 0 8px 8px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pb: 1,
                  fontSize: '0.75rem', fontWeight: 600, mx: '1px',
                  transition: 'background-color 0.1s',
                  '&:hover': { bgcolor: '#f0f0ff' },
                }}
              >
                <span>{note.label}</span>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>{note.key}</Typography>
              </Button>
            ))}
            {pianoNotes.filter((n) => n.isBlack).map((note) => {
              const whiteIdx = pianoNotes.filter((n2) => !n2.isBlack).findIndex((_, idx, arr) => {
                const nextWhite = arr[idx + 1];
                return nextWhite && pianoNotes.indexOf(note) < pianoNotes.indexOf(nextWhite) && pianoNotes.indexOf(note) > pianoNotes.indexOf(arr[idx]);
              });
              const baseWidth = 56;
              const offset = (whiteIdx + 1) * (baseWidth + 2) - baseWidth * 0.3;
              return (
                <Button
                  key={note.note}
                  aria-label={keyName(note.label, note.key)}
                  onClick={() => playInstrument(note.key)}
                  sx={{
                    position: 'absolute', top: 0,
                    left: offset,
                    display: 'flex',
                    width: 36, height: 100,
                    bgcolor: activeKeys.has(note.key) ? '#6C5CE7' : '#333',
                    color: 'white', borderRadius: '0 0 6px 6px',
                    fontSize: '0.65rem', fontWeight: 600, zIndex: 2,
                    flexDirection: 'column', justifyContent: 'flex-end', pb: 1,
                    '&:hover': { bgcolor: '#555' },
                  }}
                >
                  <span>{note.label}</span>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>{note.key}</Typography>
                </Button>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Xylophone */}
      {instrument === 'xylophone' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.5, md: 1 }, mb: 3, flexWrap: 'wrap' }}>
          {xylophoneNotes.map((note, i) => (
            <Button
              key={note.note}
              aria-label={keyName(note.label, note.key)}
              onClick={() => playInstrument(note.key)}
              sx={{
                width: { xs: 44, md: 56 }, height: { xs: 100 + i * 8, md: 120 + i * 10 }, minWidth: 44,
                bgcolor: activeKeys.has(note.key) ? `${xylophoneColors[i]}cc` : xylophoneColors[i],
                color: 'white', borderRadius: 3, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem',
                boxShadow: activeKeys.has(note.key) ? `0 4px 15px ${xylophoneColors[i]}80` : 'none',
                transform: activeKeys.has(note.key) ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.1s',
              }}
            >
              {note.label}
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem' }}>{note.key}</Typography>
            </Button>
          ))}
        </Box>
      )}

      {/* Drums */}
      {instrument === 'drums' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {drumSounds.map((drum) => (
            <Button
              key={drum.type}
              aria-label={keyName(drum.name, drum.key)}
              onClick={() => playInstrument(drum.key)}
              variant="contained"
              sx={{
                width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 },
                borderRadius: '50%', bgcolor: activeKeys.has(drum.key) ? 'secondary.main' : 'primary.main',
                fontSize: '0.8rem', fontWeight: 700,
                transform: activeKeys.has(drum.key) ? 'scale(0.9)' : 'scale(1)',
                transition: 'all 0.1s',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {drum.name}
              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.6rem' }}>{drum.key}</Typography>
            </Button>
          ))}
        </Box>
      )}

      {/* Guitar */}
      {instrument === 'guitar' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
          {guitarNotes.map((note) => (
            <Button
              key={note.note}
              aria-label={keyName(note.label, note.key)}
              onClick={() => playInstrument(note.key)}
              sx={{
                width: '80%', maxWidth: 400, minHeight: 44,
                bgcolor: activeKeys.has(note.key) ? 'primary.light' : 'background.paper',
                border: '2px solid', borderColor: activeKeys.has(note.key) ? 'primary.main' : '#8B7355',
                borderRadius: 1, fontWeight: 600,
                transition: 'all 0.1s',
              }}
            >
              {note.label} ({note.key})
            </Button>
          ))}
        </Box>
      )}

      {/* Flute */}
      {instrument === 'flute' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.5, md: 1 }, mb: 3, flexWrap: 'wrap' }}>
          {fluteNotes.map((note) => (
            <Button
              key={note.note}
              aria-label={keyName(note.label, note.key)}
              onClick={() => playInstrument(note.key)}
              sx={{
                width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, minWidth: 48,
                borderRadius: '50%',
                bgcolor: activeKeys.has(note.key) ? 'secondary.main' : '#DFE6E9',
                color: activeKeys.has(note.key) ? 'white' : 'text.primary',
                fontWeight: 700, fontSize: '0.85rem',
                transition: 'all 0.1s',
              }}
            >
              {note.label}
              <br />
              <span style={{ fontSize: '0.55rem' }}>{note.key}</span>
            </Button>
          ))}
        </Box>
      )}

      {/* Built-in Melodies */}
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
            🎶 Play a Melody
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {builtInMelodies.map((melody, i) => (
              <Button
                key={melody.name}
                onClick={() => handlePlayMelody(i)}
                variant="outlined"
                startIcon={playingMelody ? <Stop /> : <PlayArrow />}
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, justifyContent: 'flex-start' }}
              >
                {melody.name}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Keyboard hints */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {instrument === 'piano' && 'Keys: A S D F G H J K L (white) | W E T Y U O (black)'}
          {instrument === 'xylophone' && 'Keys: 1 2 3 4 5 6 7 8'}
          {instrument === 'drums' && 'Keys: Z X C V B N'}
          {instrument === 'guitar' && 'Keys: Q W E R T Y'}
          {instrument === 'flute' && 'Keys: 1 2 3 4 5 6 7 8'}
        </Typography>
      </Box>
    </Box>
  );
}
