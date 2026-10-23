import { useRef, useState } from 'react';
import { playConfirmation, playError } from '../../../services/audio';
import { useAppStore } from '../../../store/useAppStore';
import { askHint, freshAttempt, recordTry, showDemo, type Attempt } from '../engine/activities';
import type { Activity, Lang } from '../engine/types';
import { ui } from '../content/uiText';

export interface ActivityProps<A extends Activity> {
  activity: A;
  lang: Lang;
  say: (text: string) => void;
  onSolved: (attempt: Attempt) => void;
}

/**
 * Shared attempt handling for every activity: hint after one miss, "Show me" after two,
 * and a single completion even if the child taps again.
 */
export function useAttempt(activity: Activity, lang: Lang, say: (text: string) => void, onSolved: (attempt: Attempt) => void) {
  const [attempt, setAttemptState] = useState<Attempt>(freshAttempt);
  const attemptRef = useRef<Attempt>(freshAttempt);
  const [feedback, setFeedback] = useState<'none' | 'wrong' | 'right'>('none');
  const sent = useRef(false);
  const soundOn = useAppStore((s) => s.settings.soundEnabled && s.settings.volume > 0);
  const volume = useAppStore((s) => s.settings.volume);

  const setAttempt = (next: Attempt) => {
    attemptRef.current = next;
    setAttemptState(next);
  };

  const submit = (correct: boolean, wrongNote?: string) => {
    const current = attemptRef.current;
    if (current.solved) return;
    setAttempt(recordTry(current, correct));
    if (correct) {
      setFeedback('right');
      if (soundOn) playConfirmation(volume * 0.25);
      say(`${ui(lang, 'correct')} ${activity.explanation[lang]}`);
    } else {
      setFeedback('wrong');
      if (soundOn) playError(volume * 0.2);
      say(`${wrongNote ? `${wrongNote} ` : ''}${ui(lang, 'tryAgain')} ${activity.hint[lang]}`);
    }
  };

  const hint = () => {
    setAttempt(askHint(attemptRef.current));
    say(activity.hint[lang]);
  };

  const demo = () => {
    setAttempt(showDemo(attemptRef.current));
    say(activity.explanation[lang]);
  };

  const finish = () => {
    if (sent.current || !attemptRef.current.solved) return;
    sent.current = true;
    onSolved(attemptRef.current);
  };

  return { attempt, feedback, submit, hint, demo, finish };
}

