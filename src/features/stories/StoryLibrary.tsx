import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Grid, LinearProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircleRounded, CloudDoneRounded, MenuBookRounded, PlayArrowRounded, ReplayRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import { useWorld } from '../../components/ui/world';
import { useAppStore } from '../../store/useAppStore';
import { loadStoryProgress } from '../../services/storage';
import { storyFraction } from './engine/player';
import { canResume, isCompleted } from './engine/progress';
import { LANGUAGES, languageInfo, type Lang, type StoryManifest } from './engine/types';
import { publishedStories, storiesForAge, type AgeFilter } from './content/library';
import { objectiveLabels, scriptFont, ui } from './content/uiText';
import { Backdrop } from './player/Stage';

export default function StoryLibrary() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.settings.storyLanguage);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [age, setAge] = useState<AgeFilter>('all');
  const [progress] = useState(loadStoryProgress);
  const stories = publishedStories();
  const shown = storiesForAge(stories, age);

  const resumable = stories
    .filter((story) => canResume(progress, story))
    .sort((a, b) => (progress.stories[b.id]?.updatedAt ?? 0) - (progress.stories[a.id]?.updatedAt ?? 0))[0];

  const ageOptions = [
    { value: 'all' as const, label: ui(lang, 'allAges') },
    { value: '3-5' as const, label: ui(lang, 'ages', { n: '3–5' }) },
    { value: '5-7' as const, label: ui(lang, 'ages', { n: '5–7' }) },
    { value: '7-9' as const, label: ui(lang, 'ages', { n: '7–9' }) },
  ];

  return (
    <Page maxWidth={1120}>
      <PageHero world="orange" title={ui(lang, 'storyTime')} subtitle={ui(lang, 'storyTimeSubtitle')} emoji="📖" />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <PillPicker value={lang} options={LANGUAGES.map((value) => ({ value, label: languageInfo[value].native }))} onChange={(value) => updateSettings({ storyLanguage: value as Lang })} world="violet" ariaLabel={ui(lang, 'language')} />
        <PillPicker value={age} options={ageOptions} onChange={setAge} world="violet" ariaLabel={ui(lang, 'age')} />
      </Box>

      {resumable && (
        <ContinueCard story={resumable} lang={lang} fraction={storyFraction(resumable, progress.stories[resumable.id]!.playback!)} onOpen={() => navigate(`/stories/${resumable.id}`)} />
      )}

      {shown.length === 0 ? (
        <Typography lang={lang} sx={{ textAlign: 'center', fontWeight: 800, py: 6 }}>{ui(lang, 'noStories')}</Typography>
      ) : (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {shown.map((story, index) => (
            <Grid key={story.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <StoryCard
                story={story}
                lang={lang}
                delay={index * 60}
                started={canResume(progress, story)}
                finished={isCompleted(progress, story.id)}
                onOpen={(restart) => navigate(`/stories/${story.id}${restart ? '?restart=1' : ''}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Page>
  );
}

function ContinueCard({ story, lang, fraction, onOpen }: { story: StoryManifest; lang: Lang; fraction: number; onOpen: () => void }) {
  const violet = useWorld('violet');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 3, borderRadius: '24px', bgcolor: violet.tint, flexWrap: 'wrap' }}>
      <Illustration emoji={story.emoji} size="56px" />
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography lang={lang} sx={{ fontWeight: 900, color: violet.text }}>{ui(lang, 'continueStory')}</Typography>
        <Typography lang={lang} sx={{ fontWeight: 800, fontSize: '1.15rem', fontFamily: scriptFont }}>{story.title[lang]}</Typography>
        <LinearProgress variant="determinate" value={fraction * 100} aria-hidden sx={{ mt: 1, maxWidth: 320 }} />
      </Box>
      <Button variant="contained" size="large" startIcon={<PlayArrowRounded />} onClick={onOpen} lang={lang}>{ui(lang, 'continue')}</Button>
    </Box>
  );
}

interface CardProps {
  story: StoryManifest;
  lang: Lang;
  delay: number;
  started: boolean;
  finished: boolean;
  onOpen: (restart: boolean) => void;
}

function StoryCard({ story, lang, delay, started, finished, onOpen }: CardProps) {
  const orange = useWorld('orange');
  const green = useWorld('green');
  return (
    <Box
      component="article"
      aria-labelledby={`story-${story.id}`}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '28px', overflow: 'hidden', bgcolor: 'background.paper',
        border: `3px solid ${alpha(orange.main, 0.35)}`, boxShadow: `0 6px 0 ${alpha(orange.main, 0.35)}`,
        animation: `kl-rise-in 420ms ease-out ${delay}ms both`,
      }}
    >
      <Box sx={{ position: 'relative', height: 132 }}>
        <Box sx={{ position: 'absolute', inset: 0 }}><Backdrop id={story.backdrop} /></Box>
        <Box aria-hidden sx={{ position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', fontSize: '4rem', lineHeight: 1 }}>
          <Illustration emoji={story.emoji} />
        </Box>
        {finished && (
          <Chip icon={<CheckCircleRounded />} label={ui(lang, 'finished')} lang={lang} sx={{ position: 'absolute', top: 10, right: 10, bgcolor: green.main, color: '#FFFFFF', fontWeight: 900, '& .MuiChip-icon': { color: '#FFFFFF' } }} />
        )}
      </Box>
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography id={`story-${story.id}`} variant="h4" component="h2" lang={lang} sx={{ fontSize: '1.25rem', color: orange.text, fontFamily: scriptFont }}>{story.title[lang]}</Typography>
        <Typography lang={lang} sx={{ color: 'text.secondary', fontFamily: scriptFont }}>{story.summary[lang]}</Typography>
        <Typography variant="body2" lang={lang} sx={{ fontWeight: 800 }}>
          {ui(lang, 'minutes', { n: story.minutes })} · {ui(lang, 'ages', { n: `${story.ageRange[0]}–${story.ageRange[1]}` })}
        </Typography>
        <Box>
          <Typography variant="caption" lang={lang} sx={{ fontWeight: 900 }}>{ui(lang, 'youWillLearn')}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {story.objectives.slice(0, 5).map((objective) => (
              <Chip key={objective} size="small" label={objectiveLabels[objective][lang]} lang={lang} />
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <CloudDoneRounded fontSize="small" aria-hidden />
          <Typography variant="caption" lang={lang} sx={{ fontWeight: 800 }}>{ui(lang, 'worksOffline')} · {LANGUAGES.map((code) => languageInfo[code].native).join(' · ')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 1, flexWrap: 'wrap' }}>
          {started ? (
            <>
              <Button variant="contained" startIcon={<PlayArrowRounded />} onClick={() => onOpen(false)} lang={lang} aria-label={`${ui(lang, 'continue')}: ${story.title[lang]}`}>{ui(lang, 'continue')}</Button>
              <Button variant="text" startIcon={<ReplayRounded />} onClick={() => onOpen(true)} lang={lang}>{ui(lang, 'startOver')}</Button>
            </>
          ) : (
            <Button variant="contained" startIcon={finished ? <ReplayRounded /> : <MenuBookRounded />} onClick={() => onOpen(finished)} lang={lang} aria-label={`${finished ? ui(lang, 'playAgain') : ui(lang, 'start')}: ${story.title[lang]}`}>
              {finished ? ui(lang, 'playAgain') : ui(lang, 'start')}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
