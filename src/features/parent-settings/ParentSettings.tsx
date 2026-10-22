import { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Switch, Slider, Select, MenuItem,
  FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Divider, Alert, LinearProgress,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
  getVoices, isChildVoiceName, isSpeechAvailable, RECOMMENDED_VOICE_LABEL, speak, VOICE_PREVIEW_TEXT,
} from '../../services/speech';
import { loadDailyChallenge } from '../../services/storage';
import { ANIMAL_TOTAL, LETTER_TOTAL, NUMBER_TOTAL, WORD_TOTAL, overallLearningProgress } from '../../services/progressStats';
import { normalizeDailyRecord } from '../daily-challenge/dailySelection';
import ParentGate from '../../components/parent/ParentGate.tsx';
import { pushOverlay } from '../../platform/overlays';

function voiceMenuLabel(voice: SpeechSynthesisVoice): string {
  const place = voice.localService ? 'on this device' : 'needs a network';
  if (isChildVoiceName(voice.name)) return `${voice.name} (${place}, youthful)`;
  return `${voice.name} (${place})`;
}

export default function ParentSettings() {
  const settings = useAppStore((s) => s.settings);
  const progress = useAppStore((s) => s.progress);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAllProgress = useAppStore((s) => s.resetAllProgress);
  const [gateOpen, setGateOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [resetDone, setResetDone] = useState(false);
  const summary = overallLearningProgress(progress);
  const daily = normalizeDailyRecord(loadDailyChallenge());
  const savedVoiceMissing = Boolean(settings.selectedVoice && !voices.some((voice) => voice.name === settings.selectedVoice));
  const areas = [
    { label: 'Letters', value: summary.letters, total: LETTER_TOTAL },
    { label: 'Numbers', value: summary.numbers, total: NUMBER_TOTAL },
    { label: 'Animals', value: summary.animals, total: ANIMAL_TOTAL },
    { label: 'Words', value: summary.words, total: WORD_TOTAL },
  ];

  useEffect(() => {
    const loadVoiceList = () => setVoices(getVoices());
    loadVoiceList();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoiceList);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoiceList);
    }
    return undefined;
  }, []);

  const closeGate = useCallback(() => setGateOpen(false), []);
  const closeReset = useCallback(() => setShowReset(false), []);

  useEffect(() => {
    if (!showReset) return undefined;
    return pushOverlay(closeReset);
  }, [showReset, closeReset]);

  const handleReset = () => {
    resetAllProgress();
    setShowReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  const previewVoice = () => {
    if (!settings.speechEnabled) return;
    speak(VOICE_PREVIEW_TEXT, {
      rate: settings.speechRate,
      voice: settings.selectedVoice || undefined,
      volume: settings.volume,
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Parent Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">Configure the learning experience</Typography>
      </Box>

      {resetDone && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>Progress has been reset on this device.</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1 }}>Learning summary</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {summary.explored} of {summary.total} explored ({summary.percent}%). Today’s challenge: {daily.completed ? 'finished' : `${daily.answered} of 5`}. Answer streak: {progress.currentStreak}. Achievements: {progress.achievementsEarned.length}.
          </Typography>
          {areas.map((area) => (
            <Box key={area.label} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{area.label}</Typography>
                <Typography variant="body2">{area.value} of {area.total}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={area.total === 0 ? 0 : (area.value / area.total) * 100}
                aria-label={`${area.label}, ${area.value} of ${area.total}`}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>Speech & Audio</Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
            <Typography>Speech</Typography>
            <Switch
              checked={settings.speechEnabled}
              onChange={(e) => updateSettings({ speechEnabled: e.target.checked })}
              slotProps={{ input: { 'aria-label': 'Speech' } }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
            <Typography>Sound effects</Typography>
            <Switch
              checked={settings.soundEnabled}
              onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              slotProps={{ input: { 'aria-label': 'Sound effects' } }}
            />
          </Box>

          <Box sx={{ mb: 2, px: 1 }}>
            <Typography gutterBottom id="volume-label">Volume</Typography>
            <Slider
              aria-labelledby="volume-label"
              value={settings.volume}
              onChange={(_, v) => updateSettings({ volume: v as number })}
              min={0}
              max={1}
              step={0.05}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
            />
          </Box>

          <Box sx={{ mb: 2, px: 1 }}>
            <Typography gutterBottom id="speech-speed-label">Speech speed</Typography>
            <Slider
              aria-labelledby="speech-speed-label"
              value={settings.speechRate}
              onChange={(_, v) => updateSettings({ speechRate: v as number })}
              min={0.5}
              max={1.5}
              step={0.1}
              valueLabelDisplay="auto"
              marks={[{ value: 0.5, label: 'Slow' }, { value: 1, label: 'Normal' }, { value: 1.5, label: 'Fast' }]}
            />
          </Box>

          {isSpeechAvailable() && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="voice-label">Voice</InputLabel>
              <Select
                labelId="voice-label"
                value={settings.selectedVoice || ''}
                onChange={(e) => updateSettings({ selectedVoice: e.target.value || null })}
                label="Voice"
              >
                <MenuItem value="">{RECOMMENDED_VOICE_LABEL}</MenuItem>
                {settings.selectedVoice && savedVoiceMissing && (
                  <MenuItem value={settings.selectedVoice}>{settings.selectedVoice} (not on this device)</MenuItem>
                )}
                {voices.map((voice) => (
                  <MenuItem key={voice.name} value={voice.name}>{voiceMenuLabel(voice)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The recommended choice uses the softest clear English voice installed on this device. A voice is marked youthful only when the device describes it that way. Voices that need a network are not used unless a parent selects one.
          </Typography>

          {savedVoiceMissing && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              The saved voice is not on this device, so a soft on-device voice is used until you choose another.
            </Alert>
          )}

          <Button variant="outlined" onClick={previewVoice} disabled={!settings.speechEnabled || !isSpeechAvailable()} sx={{ minHeight: 48 }}>
            Preview voice
          </Button>

          {!isSpeechAvailable() && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              Speech synthesis is not available on this device. Lessons still work without spoken words.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>Appearance</Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="theme-label">Theme</InputLabel>
            <Select
              labelId="theme-label"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
              label="Theme"
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography>Reduced motion</Typography>
            <Switch
              checked={settings.reducedMotion}
              onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
              slotProps={{ input: { 'aria-label': 'Reduced motion' } }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>Data & progress</Typography>

          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Learning progress and these settings stay on this device. Nothing is sent to a server. Reset clears progress, the answer streak, achievements, and today’s daily challenge. It does not change these sound and speech settings.
          </Alert>

          <Button component={RouterLink} to="/privacy" variant="text" sx={{ mb: 1, minHeight: 48 }}>
            Read the privacy page
          </Button>

          <Divider sx={{ my: 2 }} />

          <Button variant="outlined" color="error" onClick={() => setGateOpen(true)} sx={{ borderRadius: 3, minHeight: 48 }}>
            Reset all progress
          </Button>
        </CardContent>
      </Card>

      <ParentGate
        open={gateOpen}
        title="Parent check"
        description="Answer this question before erasing learning progress on this device."
        onClose={closeGate}
        onGranted={() => {
          setGateOpen(false);
          setShowReset(true);
        }}
      />

      <Dialog open={showReset} onClose={closeReset} aria-labelledby="reset-progress-title">
        <DialogTitle id="reset-progress-title">Reset learning progress?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This erases explored letters, numbers, animals, words, game scores, the answer streak, today’s daily challenge, and earned achievements on this device. Sound and speech settings stay as they are. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReset}>Cancel</Button>
          <Button onClick={handleReset} color="error" variant="contained">Reset everything</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
