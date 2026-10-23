import { useState } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Illustration from '../../../components/ui/Illustration';
import { useWorld } from '../../../components/ui/world';
import { fonts } from '../../../theme/tokens';
import { arithmeticAnswer, isCorrectOption, patternAnswer, patternShown } from '../engine/activities';
import type { ArithmeticActivity, CountActivity, PatternActivity, QuestionActivity } from '../engine/types';
import { ui } from '../content/uiText';
import { ActivityFrame } from './ActivityFrame';
import { useAttempt, type ActivityProps } from './useAttempt';
import OptionButton from './OptionButton';

function useChoice() {
  const [tried, setTried] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const miss = (id: string) => {
    setTried((items) => [...items, id]);
    setShake(id);
    window.setTimeout(() => setShake(null), 450);
  };
  return { tried, shake, miss };
}

function Pictures({ emoji, count, label }: { emoji: string; count: number; label: string }) {
  const tint = useWorld('teal');
  return (
    <Box role="img" aria-label={label} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, p: 2, mb: 2, borderRadius: '20px', bgcolor: tint.tint }}>
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} aria-hidden sx={{ fontSize: { xs: '2.2rem', md: '2.6rem' }, lineHeight: 1, animation: `kl-pop-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 80}ms both` }}>
          <Illustration emoji={emoji} />
        </Box>
      ))}
    </Box>
  );
}

export function QuestionView({ activity, lang, say, onSolved }: ActivityProps<QuestionActivity>) {
  const state = useAttempt(activity, lang, say, onSolved);
  const { tried, shake, miss } = useChoice();
  const done = state.attempt.solved;
  return (
    <ActivityFrame activity={activity} lang={lang} attempt={state.attempt} feedback={state.feedback} onHear={() => say(activity.prompt[lang])} onHint={state.hint} onDemo={state.demo} onFinish={state.finish} done={done}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(3, activity.options.length)}, 1fr)` }, gap: 1.5 }}>
        {activity.options.map((option, index) => {
          const right = isCorrectOption(activity, option.id);
          return (
            <OptionButton
              key={option.id}
              index={index}
              label={option.text[lang]}
              lang={lang}
              tried={tried.includes(option.id)}
              revealed={right && (done || state.attempt.demoShown)}
              disabled={done}
              shake={shake === option.id}
              onClick={() => {
                if (!right) miss(option.id);
                state.submit(right, option.text[lang]);
              }}
            >
              {option.emoji && <Illustration emoji={option.emoji} size="44px" />}
            </OptionButton>
          );
        })}
      </Box>
    </ActivityFrame>
  );
}

function NumberChoices({ choices, answer, onPick, done, demo, lang }: { choices: (number | string)[]; answer: number | string; onPick: (value: number | string) => void; done: boolean; demo: boolean; lang: string }) {
  const { tried, shake, miss } = useChoice();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${choices.length}, 1fr)`, gap: 1.5, maxWidth: 520, mx: 'auto' }}>
      {choices.map((choice, index) => {
        const id = String(choice);
        const right = choice === answer;
        const isEmoji = typeof choice === 'string';
        return (
          <OptionButton
            key={id}
            index={index}
            label={isEmoji ? '' : id}
            lang={lang}
            big
            tried={tried.includes(id)}
            revealed={right && (done || demo)}
            disabled={done}
            shake={shake === id}
            onClick={() => {
              if (!right) miss(id);
              onPick(choice);
            }}
          >
            {isEmoji && <Illustration emoji={choice} size="56px" />}
          </OptionButton>
        );
      })}
    </Box>
  );
}

export function CountView({ activity, lang, say, onSolved }: ActivityProps<CountActivity>) {
  const state = useAttempt(activity, lang, say, onSolved);
  return (
    <ActivityFrame activity={activity} lang={lang} attempt={state.attempt} feedback={state.feedback} onHear={() => say(activity.prompt[lang])} onHint={state.hint} onDemo={state.demo} onFinish={state.finish} done={state.attempt.solved}>
      <Pictures emoji={activity.emoji} count={activity.count} label={`${activity.count}`} />
      <NumberChoices choices={activity.choices} answer={activity.count} lang={lang} done={state.attempt.solved} demo={state.attempt.demoShown} onPick={(value) => state.submit(value === activity.count)} />
    </ActivityFrame>
  );
}

export function ArithmeticView({ activity, lang, say, onSolved }: ActivityProps<ArithmeticActivity>) {
  const state = useAttempt(activity, lang, say, onSolved);
  const answer = arithmeticAnswer(activity);
  const tint = useWorld('teal');
  const done = state.attempt.solved;
  return (
    <ActivityFrame activity={activity} lang={lang} attempt={state.attempt} feedback={state.feedback} onHear={() => say(activity.prompt[lang])} onHint={state.hint} onDemo={state.demo} onFinish={state.finish} done={done}>
      <Box
        role="img"
        aria-label={`${activity.a} ${activity.op === 'add' ? '+' : '−'} ${activity.b}`}
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 1, p: 2, mb: 2, borderRadius: '20px', bgcolor: tint.tint, fontSize: { xs: '2rem', md: '2.4rem' } }}
      >
        {Array.from({ length: activity.a }, (_, i) => {
          const takenAway = activity.op === 'subtract' && i >= activity.a - activity.b;
          return (
            <Box key={`a${i}`} aria-hidden sx={{ lineHeight: 1, opacity: takenAway && (done || state.attempt.demoShown) ? 0.25 : 1, position: 'relative' }}>
              <Illustration emoji={activity.emoji} />
              {takenAway && <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '0.8em', color: '#C0392B', fontWeight: 900 }}>✕</Box>}
            </Box>
          );
        })}
        {activity.op === 'add' && (
          <>
            <Box aria-hidden sx={{ fontFamily: fonts.display, fontWeight: 700, mx: 1 }}>+</Box>
            {Array.from({ length: activity.b }, (_, i) => (
              <Box key={`b${i}`} aria-hidden sx={{ lineHeight: 1 }}><Illustration emoji={activity.emoji} /></Box>
            ))}
          </>
        )}
        <Box aria-hidden sx={{ fontFamily: fonts.display, fontWeight: 700, mx: 1, width: '100%', textAlign: 'center', fontSize: '1.6rem' }}>
          {activity.a} {activity.op === 'add' ? '+' : '−'} {activity.b} = {done || state.attempt.demoShown ? answer : '?'}
        </Box>
      </Box>
      <NumberChoices choices={activity.choices} answer={answer} lang={lang} done={done} demo={state.attempt.demoShown} onPick={(value) => state.submit(value === answer)} />
    </ActivityFrame>
  );
}

export function PatternView({ activity, lang, say, onSolved }: ActivityProps<PatternActivity>) {
  const state = useAttempt(activity, lang, say, onSolved);
  const answer = patternAnswer(activity);
  const tint = useWorld('violet');
  const done = state.attempt.solved;
  return (
    <ActivityFrame activity={activity} lang={lang} attempt={state.attempt} feedback={state.feedback} onHear={() => say(activity.prompt[lang])} onHint={state.hint} onDemo={state.demo} onFinish={state.finish} done={done}>
      <Box role="img" aria-label={ui(lang, 'patternGap')} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 1, p: 2, mb: 2, borderRadius: '20px', bgcolor: tint.tint }}>
        {patternShown(activity).map((emoji, i) => (
          <Box key={i} aria-hidden sx={{ fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1 }}><Illustration emoji={emoji} /></Box>
        ))}
        <Box aria-hidden sx={{ width: 56, height: 56, borderRadius: '14px', border: `3px dashed ${alpha(tint.main, 0.6)}`, display: 'grid', placeItems: 'center', fontSize: '2rem', bgcolor: 'background.paper' }}>
          {done ? <Illustration emoji={answer} /> : '?'}
        </Box>
      </Box>
      <NumberChoices choices={activity.choices} answer={answer} lang={lang} done={done} demo={state.attempt.demoShown} onPick={(value) => state.submit(value === answer)} />
    </ActivityFrame>
  );
}
