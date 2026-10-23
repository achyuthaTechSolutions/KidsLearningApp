import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, ButtonBase, LinearProgress, Switch, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBackRounded, NavigateNext, PauseRounded, PlayArrowRounded, ReplayRounded, VolumeUpRounded,
} from '@mui/icons-material';
import Page from '../../../components/ui/Page';
import Illustration from '../../../components/ui/Illustration';
import Mascot from '../../../components/ui/Mascot';
import Confetti from '../../../components/ui/Confetti';
import PillPicker from '../../../components/ui/PillPicker';
import { tactile, useWorld } from '../../../components/ui/world';
import { useAppStore } from '../../../store/useAppStore';
import { loadStoryProgress, saveStoryProgress } from '../../../services/storage';
import { playSuccess } from '../../../services/audio';
import type { Attempt } from '../engine/activities';
import { currentScene, phaseOf, playerReducer, resumePlayback, startPlayback, storyFraction, type Playback, type PlayerAction } from '../engine/player';
import { recordActivity, savePlayback } from '../engine/progress';
import { AFTER_SPEECH_MS, STORY_MODES, autoStep, readingTimeMs, speechTimeoutMs, type StoryMode } from '../engine/pacing';
import { LANGUAGES, languageInfo, type Lang, type StoryManifest } from '../engine/types';
import { characters } from '../content/characters';
import { storyById } from '../content/library';
import { scriptFont, ui } from '../content/uiText';
import ActivityView from '../activities/ActivityView';
import { AutoFinishContext } from '../activities/autoFinish';
import { Stage } from './Stage';
import { useNarration } from './useNarration';
import { narrationId } from '../assets';

const languageOptions = LANGUAGES.map((lang) => ({ value: lang, label: languageInfo[lang].native }));

export default function StoryPlayerRoute() {
  const { storyId = '' } = useParams();
  const story = storyById(storyId);
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.settings.storyLanguage);
  if (!story) {
    return (
      <Page maxWidth={720}>
        <Alert severity="info" sx={{ mb: 2 }} lang={lang}>{ui(lang, 'storyMissing')}</Alert>
        <Button variant="contained" startIcon={<ArrowBackRounded />} onClick={() => navigate('/stories')}>{ui(lang, 'backToStories')}</Button>
      </Page>
    );
  }
  return <StoryPlayer key={story.id} story={story} />;
}

function StoryPlayer({ story }: { story: StoryManifest }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const violet = useWorld('violet');
  const gold = useWorld('gold');
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const lang = settings.storyLanguage;
  const { say, stop, voiceMissing, narrationOn } = useNarration(lang);

  const [playback, setPlayback] = useState<Playback>(() => {
    const saved = loadStoryProgress().stories[story.id]?.playback;
    return params.get('restart') ? startPlayback(story) : resumePlayback(story, saved);
  });
  const mode: StoryMode = settings.storyMode;
  // The story moves on by itself unless the child presses Pause.
  const [playing, setPlaying] = useState(true);
  const [celebrate, setCelebrate] = useState(0);
  const playbackRef = useRef(playback);
  const autoTimer = useRef<number | undefined>(undefined);
  const clearAuto = useCallback(() => {
    window.clearTimeout(autoTimer.current);
    autoTimer.current = undefined;
  }, []);
  useEffect(() => clearAuto, [clearAuto]);

  const scene = currentScene(story, playback);
  const phase = phaseOf(story, playback);
  const line = phase === 'line' ? scene.lines[playback.lineIndex] : scene.lines[scene.lines.length - 1];
  const lineAudio = line && narrationId(lang, `${story.id}/${scene.id}/${line.id}`, line.audio);

  const persist = useCallback((next: Playback) => {
    saveStoryProgress(savePlayback(loadStoryProgress(), next, lang, Date.now()));
  }, [lang]);

  const dispatch = useCallback((action: PlayerAction) => {
    const before = playbackRef.current;
    const next = playerReducer(story, before, action);
    if (next === before) return;
    playbackRef.current = next;
    setPlayback(next);
    persist(next);
    if (next.finished && !before.finished) {
      setCelebrate((count) => count + 1);
      if (settings.soundEnabled) playSuccess(settings.volume * 0.3);
    }
  }, [persist, settings.soundEnabled, settings.volume, story]);

  // Save once on open, so a resumed or restarted story is remembered straight away.
  useEffect(() => {
    persist(playbackRef.current);
  }, [persist]);

  /*
   * Narrate what is on screen and, unless paused, move on by itself:
   * a line turns after it has been read aloud, or after reading time when nothing
   * was heard (no voice for the language, or Voice off). Story mode also passes over
   * activities and takes the main choice; Puzzle mode waits there for the child.
   */
  const narrate = useEffectEvent(() => {
    clearAuto();
    const later = (action: PlayerAction, ms: number) => {
      const at = `${playbackRef.current.sceneId}:${playbackRef.current.lineIndex}:${phase}`;
      clearAuto();
      autoTimer.current = window.setTimeout(() => {
        const current = playbackRef.current;
        if (`${current.sceneId}:${current.lineIndex}:${phaseOf(story, current)}` === at) dispatch(action);
      }, ms);
    };
    const step = playing ? autoStep(story, playback, phase, mode) : { kind: 'paused' as const };
    if (phase === 'line' && line) {
      const text = line.text[lang];
      const started = Date.now();
      if (step.kind === 'wait-line') later({ type: 'next-line' }, speechTimeoutMs(text));
      say(text, (spoken) => {
        if (step.kind !== 'wait-line') return;
        const reading = readingTimeMs(text, settings.speechRate) - (Date.now() - started);
        later({ type: 'next-line' }, spoken ? AFTER_SPEECH_MS : Math.max(AFTER_SPEECH_MS, reading));
      }, lineAudio);
    } else if (phase === 'activity' && scene.activity) {
      if (step.kind === 'skip-activity') later({ type: 'skip-activity', activityId: step.activityId }, 400);
      else say(scene.activity.prompt[lang], undefined, narrationId(lang, `${story.id}/${scene.id}/${scene.activity.id}.prompt`));
    } else if (phase === 'choice') {
      if (step.kind === 'choose') later({ type: 'choose', choiceId: step.choiceId }, 400);
      else say(ui(lang, 'whatNext'), undefined, narrationId(lang, 'ui.whatNext'));
    } else if (phase === 'continue' && step.kind === 'continue') {
      later({ type: 'continue' }, 500);
    } else if (phase === 'end' && scene.moral) {
      say(`${ui(lang, 'moral')}: ${scene.moral[lang]}`, undefined, narrationId(lang, `${story.id}/${scene.id}.moral`));
    }
  });
  // Speak again only when the position, phase, language, mode, or play state changes.
  useEffect(() => {
    narrate();
  }, [playback.sceneId, playback.lineIndex, phase, lang, mode, playing]);

  const solve = (attempt: Attempt) => {
    if (!scene.activity) return;
    saveStoryProgress(recordActivity(loadStoryProgress(), playbackRef.current, scene.activity, attempt, Date.now()));
    dispatch({ type: 'solve', activityId: scene.activity.id });
  };

  const restart = () => {
    stop();
    const fresh = startPlayback(story);
    playbackRef.current = fresh;
    setPlayback(fresh);
    persist(fresh);
  };

  const speaker = line ? characters[line.speaker] : undefined;
  const fraction = storyFraction(story, playback);

  return (
    <Page maxWidth={1040}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => { stop(); navigate('/stories'); }} lang={lang}>
          {ui(lang, 'backToStories')}
        </Button>
        <Typography variant="h3" component="h1" lang={lang} sx={{ flex: 1, minWidth: 180, fontSize: { xs: '1.2rem', md: '1.5rem' }, color: violet.text, fontFamily: scriptFont }}>
          <Illustration emoji={story.emoji} sx={{ mr: 1 }} />{story.title[lang]}
        </Typography>
        <Button
          variant={playing ? 'outlined' : 'contained'}
          startIcon={playing ? <PauseRounded /> : <PlayArrowRounded />}
          onClick={() => {
            if (playing) {
              stop();
              clearAuto();
            }
            setPlaying(!playing);
          }}
          disabled={phase === 'end'}
          lang={lang}
        >
          {playing ? ui(lang, 'pause') : ui(lang, 'play')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
        <Box sx={{ '& > div': { mb: 0 } }}>
          <PillPicker value={lang} options={languageOptions} onChange={(value) => updateSettings({ storyLanguage: value as Lang })} world="violet" ariaLabel={ui(lang, 'language')} />
        </Box>
        <Box sx={{ '& > div': { mb: 0 } }} lang={lang}>
          <PillPicker
            value={mode}
            options={STORY_MODES.map((value) => ({ value, label: `${value === 'puzzle' ? '🧩' : '📖'} ${ui(lang, value === 'puzzle' ? 'modePuzzle' : 'modeStory')}` }))}
            onChange={(value) => updateSettings({ storyMode: value as StoryMode })}
            world="violet"
            ariaLabel={ui(lang, 'mode')}
          />
        </Box>
        <Tooltip title={ui(lang, 'narration')}>
          <Box component="label" sx={{ display: 'flex', alignItems: 'center', fontWeight: 800 }} lang={lang}>
            <Switch checked={settings.storyNarration} onChange={(event) => { if (!event.target.checked) stop(); updateSettings({ storyNarration: event.target.checked }); }} />
            {ui(lang, 'narration')}
          </Box>
        </Tooltip>
        <Box component="label" sx={{ display: 'flex', alignItems: 'center', fontWeight: 800 }} lang={lang}>
          <Switch checked={settings.storyCaptions} onChange={(event) => updateSettings({ storyCaptions: event.target.checked })} />
          {ui(lang, 'captions')}
        </Box>
      </Box>

      <LinearProgress variant="determinate" value={fraction * 100} aria-label={`${Math.round(fraction * 100)}%`} sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: gold.main } }} />

      <Typography lang={lang} data-testid="mode-help" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 700, color: 'text.secondary', mb: 1.5 }}>
        {ui(lang, mode === 'puzzle' ? 'modePuzzleHelp' : 'modeStoryHelp')}
      </Typography>

      <Stage
        backdrop={scene.backdrop}
        cast={scene.characters}
        props={scene.activity?.kind === 'pebble-pot' ? [] : scene.props}
        speaker={phase === 'line' ? line?.speaker : undefined}
        speakerExpression={phase === 'line' ? line?.expression : undefined}
        lang={lang}
        sceneKey={scene.id}
      />

      {phase === 'line' && line && speaker && (
        <Box
          sx={{ mt: 2, p: { xs: 2, md: 2.5 }, borderRadius: '24px', bgcolor: 'background.paper', border: `3px solid ${alpha(violet.main, 0.25)}`, display: 'flex', gap: 2, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
        >
          <Box aria-hidden sx={{ width: 56, height: 56, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: violet.tint, fontSize: '2rem' }}>
            <Illustration emoji={speaker.emoji} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography lang={lang} sx={{ fontWeight: 900, color: violet.text, fontFamily: scriptFont }}>{speaker.name[lang]}</Typography>
            {settings.storyCaptions ? (
              <Typography data-testid="caption" lang={lang} sx={{ fontSize: { xs: '1.2rem', md: '1.4rem' }, fontWeight: 700, lineHeight: 1.45, fontFamily: scriptFont }}>
                {line.text[lang]}
              </Typography>
            ) : (
              <Typography sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }} lang={lang}>{line.text[lang]}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button variant="outlined" onClick={() => say(line.text[lang], undefined, lineAudio)} aria-label={ui(lang, 'hearAgain')} disabled={!narrationOn} sx={{ minWidth: 52 }}>
              <VolumeUpRounded />
            </Button>
            <Button variant="contained" size="large" endIcon={<NavigateNext />} onClick={() => dispatch({ type: 'next-line' })} lang={lang} sx={{ fontSize: '1.15rem', px: 3 }}>
              {ui(lang, 'next')}
            </Button>
          </Box>
        </Box>
      )}

      {phase === 'activity' && scene.activity && (
        <Box sx={{ mt: 2, fontFamily: scriptFont }}>
          <AutoFinishContext.Provider value={playing && mode === 'puzzle'}>
            <ActivityView key={`${playback.runId}-${scene.activity.id}`} activity={scene.activity} lang={lang} say={say} onSolved={solve} />
          </AutoFinishContext.Provider>
        </Box>
      )}

      {phase === 'choice' && scene.choices && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h3" component="h2" lang={lang} sx={{ fontSize: '1.3rem', mb: 1.5, fontFamily: scriptFont }}>{ui(lang, 'whatNext')}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${scene.choices.length}, 1fr)` }, gap: 1.5 }}>
            {scene.choices.map((choice) => (
              <ButtonBase
                key={choice.id}
                onClick={() => dispatch({ type: 'choose', choiceId: choice.id })}
                sx={[tactile(theme, violet, { depth: 6, radius: 22 }), { p: 2, gap: 1.5, justifyContent: 'flex-start', textAlign: 'left' }]}
              >
                {choice.emoji && <Illustration emoji={choice.emoji} size="44px" />}
                <Typography lang={lang} sx={{ fontWeight: 800, fontSize: '1.15rem', fontFamily: scriptFont }}>{choice.text[lang]}</Typography>
              </ButtonBase>
            ))}
          </Box>
        </Box>
      )}

      {phase === 'continue' && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<ReplayRounded />} onClick={() => dispatch({ type: 'replay-scene' })} lang={lang}>{ui(lang, 'replayScene')}</Button>
          <Button variant="contained" size="large" endIcon={<NavigateNext />} onClick={() => dispatch({ type: 'continue' })} lang={lang} sx={{ fontSize: '1.2rem', px: 4 }}>
            {ui(lang, 'next')}
          </Button>
        </Box>
      )}

      {voiceMissing && narrationOn && (
        <Alert severity="info" sx={{ mt: 2 }} lang={lang}>
          {ui(lang, 'noVoice')}
          <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.9em' }}>{ui(lang, 'noVoiceHelp')}</Box>
        </Alert>
      )}

      {phase === 'end' && (
        <Box sx={{ mt: 2, p: { xs: 2.5, md: 4 }, borderRadius: '32px', textAlign: 'center', bgcolor: 'background.paper', border: `3px solid ${gold.main}`, boxShadow: `0 8px 0 ${gold.main}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}><Mascot size={110} mood="cheer" /></Box>
          <Typography variant="h2" component="h2" lang={lang} sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, color: gold.text, fontFamily: scriptFont }}>{ui(lang, 'theEnd')}</Typography>
          {scene.moral && (
            <Box sx={{ mt: 2, mx: 'auto', maxWidth: 560, p: 2, borderRadius: '20px', bgcolor: gold.tint }}>
              <Typography lang={lang} sx={{ fontWeight: 900, color: gold.text, fontFamily: scriptFont }}>{ui(lang, 'moral')}</Typography>
              <Typography lang={lang} data-testid="moral" sx={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: scriptFont }}>{scene.moral[lang]}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
            <Button variant="contained" startIcon={<ReplayRounded />} onClick={restart} lang={lang}>{ui(lang, 'playAgain')}</Button>
            <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate('/stories')} lang={lang}>{ui(lang, 'backToStories')}</Button>
          </Box>
          <Confetti fire={celebrate} pieces={70} />
        </Box>
      )}
    </Page>
  );
}
