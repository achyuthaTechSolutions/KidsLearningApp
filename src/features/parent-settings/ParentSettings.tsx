import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Box, Typography, Switch, Slider, Select, MenuItem,
  FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Divider, Alert, LinearProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  InsightsRounded, RecordVoiceOverRounded, PaletteRounded, LockRounded, PlayArrowRounded, RestartAltRounded, SportsEsportsRounded,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import { useWorld } from '../../components/ui/world';
import type { WorldKey } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import {
  getVoices, isChildVoiceName, isSpeechAvailable, RECOMMENDED_VOICE_LABEL, speak, VOICE_PREVIEW_TEXT,
} from '../../services/speech';
import { loadDailyChallenge } from '../../services/storage';
import { ANIMAL_TOTAL, LETTER_TOTAL, NUMBER_TOTAL, WORD_TOTAL, overallLearningProgress } from '../../services/progressStats';
import { normalizeDailyRecord } from '../daily-challenge/dailySelection';
import ParentGate from '../../components/parent/ParentGate.tsx';
import { pushOverlay } from '../../platform/overlays';
import Illustration from '../../components/ui/Illustration';
import { difficultyHints, difficultyOptions } from '../learning-games/difficulty';
import { LANGUAGES, languageInfo } from '../stories/engine/types';
import type { AppSettings, GameDifficulty } from '../../types';

// Story content is large, so its summary loads only when this page opens.
const StoryProgressSummary = lazy(() => import('../stories/StoryProgressSummary'));

function Section({ world, icon, title, children }: { world: WorldKey; icon: ReactNode; title: string; children: ReactNode }) {
  const w = useWorld(world);
  return (
    <Box
      component="section"
      aria-label={title}
      sx={{ mb: 3, p: { xs: 2.25, md: 3 }, borderRadius: '28px', bgcolor: 'background.paper', border: '2px solid', borderColor: 'divider' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box aria-hidden sx={{ width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: w.tint, color: w.text }}>
          {icon}
        </Box>
        <Typography variant="h4" component="h2">{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}

function SettingRow({ emoji, label, children }: { emoji: string; label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '2px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
      <Box aria-hidden sx={{ fontSize: '1.4rem', width: 32, textAlign: 'center' }}><Illustration emoji={emoji} /></Box>
      <Typography sx={{ flex: 1, fontWeight: 800 }}>{label}</Typography>
      {children}
    </Box>
  );
}

const areaWorlds: Record<string, WorldKey> = { Letters: 'green', Numbers: 'sun', Animals: 'orange', Words: 'pink' };

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
    <Page maxWidth={800}>
      <PageHero world="slate" title="Parent Settings" subtitle="Sound, speech, appearance, and progress on this device." emoji="⚙️" />

      {resetDone && <Alert severity="success" sx={{ mb: 2 }}>Progress has been reset on this device.</Alert>}

      <Section world="violet" icon={<InsightsRounded />} title="Learning summary">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {summary.explored} of {summary.total} explored ({summary.percent}%). Today’s challenge: {daily.completed ? 'finished' : `${daily.answered} of 5`}. Answer streak: {progress.currentStreak}. Achievements: {progress.achievementsEarned.length}.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3, rowGap: 1.5 }}>
          {areas.map((area) => (
            <AreaBar key={area.label} label={area.label} value={area.value} total={area.total} />
          ))}
        </Box>
        <Suspense fallback={null}><StoryProgressSummary /></Suspense>
      </Section>

      <Section world="blue" icon={<RecordVoiceOverRounded />} title="Speech & Audio">
        <SettingRow emoji="🗣️" label="Speech">
          <Switch
            checked={settings.speechEnabled}
            onChange={(e) => updateSettings({ speechEnabled: e.target.checked })}
            slotProps={{ input: { 'aria-label': 'Speech' } }}
          />
        </SettingRow>
        <SettingRow emoji="🔔" label="Sound effects">
          <Switch
            checked={settings.soundEnabled}
            onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
            slotProps={{ input: { 'aria-label': 'Sound effects' } }}
          />
        </SettingRow>
        <SettingRow emoji="🎵" label="Background music">
          <Switch
            checked={settings.backgroundMusic}
            onChange={(e) => updateSettings({ backgroundMusic: e.target.checked })}
            slotProps={{ input: { 'aria-label': 'Background music' } }}
          />
        </SettingRow>

        <Box sx={{ mt: 2, mb: 1, px: 1 }}>
          <Typography gutterBottom id="volume-label" sx={{ fontWeight: 800 }}>
            <Illustration emoji="🔊" sx={{ mr: 1 }} />Volume
          </Typography>
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

        <Box sx={{ mb: 2.5, px: 1 }}>
          <Typography gutterBottom id="speech-speed-label" sx={{ fontWeight: 800 }}>
            <Illustration emoji="🐢" sx={{ mr: 1 }} />Speech speed
          </Typography>
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
          <FormControl fullWidth sx={{ mb: 2 }}>
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
          <Alert severity="info" sx={{ mb: 2 }}>
            The saved voice is not on this device, so a soft on-device voice is used until you choose another.
          </Alert>
        )}

        <Button variant="outlined" startIcon={<PlayArrowRounded />} onClick={previewVoice} disabled={!settings.speechEnabled || !isSpeechAvailable()}>
          Preview voice
        </Button>

        {!isSpeechAvailable() && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Speech synthesis is not available on this device. Lessons still work without spoken words.
          </Alert>
        )}
      </Section>

      <Section world="teal" icon={<SportsEsportsRounded />} title="Games">
        <FormControl fullWidth sx={{ mb: 1 }}>
          <InputLabel id="game-level-label">Starting level for games</InputLabel>
          <Select
            labelId="game-level-label"
            value={settings.gameDifficulty}
            onChange={(e) => updateSettings({ gameDifficulty: e.target.value as GameDifficulty })}
            label="Starting level for games"
          >
            {difficultyOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          {difficultyHints[settings.gameDifficulty]} Each game opens at this level, and your child can still change it before playing.
        </Typography>
        <FormControl fullWidth sx={{ mt: 2.5, mb: 1 }}>
          <InputLabel id="story-language-label">Story Time language</InputLabel>
          <Select
            labelId="story-language-label"
            value={settings.storyLanguage}
            onChange={(e) => updateSettings({ storyLanguage: e.target.value as AppSettings['storyLanguage'] })}
            label="Story Time language"
          >
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang} value={lang}>{languageInfo[lang].label} ({languageInfo[lang].native})</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          Telugu and Hindi story text are draft translations that have not yet been reviewed by native speakers. Narration uses this device’s voice for the language when one is installed; otherwise the story shows the words.
        </Typography>
      </Section>

      <Section world="pink" icon={<PaletteRounded />} title="Appearance">
        <FormControl fullWidth sx={{ mb: 1.5 }}>
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

        <SettingRow emoji="🧘" label="Reduced motion">
          <Switch
            checked={settings.reducedMotion}
            onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
            slotProps={{ input: { 'aria-label': 'Reduced motion' } }}
          />
        </SettingRow>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Reduced motion stops floating, confetti, and other moving decorations.
        </Typography>
      </Section>

      <Section world="slate" icon={<LockRounded />} title="Data & progress">
        <Alert severity="info" sx={{ mb: 2 }}>
          Learning progress and these settings stay on this device. Nothing is sent to a server. Reset clears progress, finished game levels, story positions and story learning records, the answer streak, achievements, Dino Dash scores, today’s daily challenge, and any photos added to My Photo Puzzle. It does not change these sound and speech settings.
        </Alert>

        <Button component={RouterLink} to="/privacy" variant="text" sx={{ mb: 1 }}>
          Read the privacy page
        </Button>

        <Divider sx={{ my: 2, borderBottomWidth: 2 }} />

        <Button variant="outlined" color="error" startIcon={<RestartAltRounded />} onClick={() => setGateOpen(true)}>
          Reset all progress
        </Button>
      </Section>

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
            This erases explored letters, numbers, animals, words, game scores, Dino Dash scores, the answer streak, today’s daily challenge, and earned achievements on this device. Sound and speech settings stay as they are. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeReset}>Cancel</Button>
          <Button onClick={handleReset} color="error" variant="contained">Reset everything</Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}

function AreaBar({ label, value, total }: { label: string; value: number; total: number }) {
  const w = useWorld(areaWorlds[label] ?? 'violet');
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 900, color: w.text }}>{label}</Typography>
        <Typography variant="body2">{value} of {total}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={total === 0 ? 0 : (value / total) * 100}
        aria-label={`${label}, ${value} of ${total}`}
        sx={{ height: 12, bgcolor: alpha(w.main, 0.15), '& .MuiLinearProgress-bar': { bgcolor: w.main } }}
      />
    </Box>
  );
}
