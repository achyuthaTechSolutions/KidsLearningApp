import type { ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { LightbulbRounded, NavigateNext, VolumeUpRounded, VisibilityRounded } from '@mui/icons-material';
import Mascot from '../../../components/ui/Mascot';
import { useWorld } from '../../../components/ui/world';
import { canShowDemo, type Attempt } from '../engine/activities';
import type { Activity, Lang } from '../engine/types';
import { ui } from '../content/uiText';

interface FrameProps {
  activity: Activity;
  lang: Lang;
  /** The question being asked now. Defaults to the activity's prompt. */
  prompt?: string;
  attempt: Attempt;
  feedback: 'none' | 'wrong' | 'right';
  onHear: () => void;
  onHint: () => void;
  onDemo: () => void;
  onFinish: () => void;
  /** Show the Next button: true once the whole activity is done. */
  done: boolean;
  children: ReactNode;
}

export function ActivityFrame({ activity, lang, prompt, attempt, feedback, onHear, onHint, onDemo, onFinish, done, children }: FrameProps) {
  const green = useWorld('green');
  const sun = useWorld('sun');
  const violet = useWorld('violet');
  const showHint = attempt.hintShown && !done;
  const showExplanation = attempt.demoShown || done;
  return (
    <Box component="section" data-testid="activity" lang={lang} aria-label={ui(lang, 'activity')} sx={{ p: { xs: 2, md: 3 }, borderRadius: '28px', bgcolor: 'background.paper', border: `3px solid ${violet.tint}` }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
        <Typography variant="h3" component="h2" lang={lang} sx={{ flex: 1, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.35 }}>
          {prompt ?? activity.prompt[lang]}
        </Typography>
        <Button variant="outlined" onClick={onHear} aria-label={ui(lang, 'hearAgain')} sx={{ minWidth: 48, px: 1.5 }}>
          <VolumeUpRounded />
        </Button>
      </Box>

      {children}

      <Box aria-live="polite" sx={{ mt: 2 }}>
        {feedback === 'wrong' && !done && (
          <Typography lang={lang} sx={{ fontWeight: 900, color: sun.text, mb: 1 }}>{ui(lang, 'tryAgain')}</Typography>
        )}
        {showHint && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.5, borderRadius: '16px', bgcolor: sun.tint, mb: 1 }}>
            <LightbulbRounded sx={{ color: sun.main }} aria-hidden />
            <Typography lang={lang} sx={{ fontWeight: 800 }}>{activity.hint[lang]}</Typography>
          </Box>
        )}
        {showExplanation && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1.5, borderRadius: '16px', bgcolor: green.tint, flexWrap: 'wrap' }}>
            <Mascot size={52} mood={done ? 'cheer' : 'think'} float={false} />
            <Typography lang={lang} sx={{ fontWeight: 800, flex: 1, minWidth: 180 }}>
              {done && <Box component="span" sx={{ color: green.text, mr: 0.5 }}>{ui(lang, 'correct')}</Box>}
              {activity.explanation[lang]}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', mt: 2 }}>
        {!done && !attempt.hintShown && (
          <Button variant="text" startIcon={<LightbulbRounded />} onClick={onHint}>{ui(lang, 'hint')}</Button>
        )}
        {!done && canShowDemo(attempt) && !attempt.demoShown && (
          <Button variant="outlined" startIcon={<VisibilityRounded />} onClick={onDemo}>{ui(lang, 'showMe')}</Button>
        )}
        {done && (
          <Button variant="contained" color="success" size="large" endIcon={<NavigateNext />} onClick={onFinish} sx={{ fontSize: '1.1rem', px: 3 }}>
            {ui(lang, 'next')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
