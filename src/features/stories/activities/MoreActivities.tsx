import { useMemo, useState } from 'react';
import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowBackRounded, ArrowForwardRounded, CheckRounded, RestartAltRounded } from '@mui/icons-material';
import Illustration from '../../../components/ui/Illustration';
import { resolveWorld, tactile, useWorld } from '../../../components/ui/world';
import { fonts, rainbow } from '../../../theme/tokens';
import {
  addToBar, differenceChoices, equalGroupsTotal, graphAnswer, graphBuilt, isNextEvent, moveOnLine, numberLineTarget,
} from '../engine/activities';
import type { BarGraphActivity, EqualGroupsActivity, NumberLineActivity, SequenceActivity } from '../engine/types';
import { ui } from '../content/uiText';
import { shuffle } from '../../learning-games/random';
import { ActivityFrame } from './ActivityFrame';
import { useAttempt, type ActivityProps } from './useAttempt';
import OptionButton from './OptionButton';

/** The child moves a marker along the line, then says "this is the spot". */
export function NumberLineView({ activity, lang, say, onSolved }: ActivityProps<NumberLineActivity>) {
  const theme = useTheme();
  const blue = useWorld('blue');
  const state = useAttempt(activity, lang, say, onSolved);
  const [position, setPosition] = useState(activity.start);
  const target = numberLineTarget(activity);
  const done = state.attempt.solved;
  const span = activity.max - activity.min;
  const pct = (value: number) => ((value - activity.min) / span) * 100;
  return (
    <ActivityFrame activity={activity} lang={lang} attempt={state.attempt} feedback={state.feedback} onHear={() => say(activity.prompt[lang])} onHint={state.hint} onDemo={state.demo} onFinish={state.finish} done={done}>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 7, pb: 4 }}>
        <Box
          role="slider"
          tabIndex={0}
          aria-label="Number line"
          aria-valuemin={activity.min}
          aria-valuemax={activity.max}
          aria-valuenow={position}
          onKeyDown={(event) => {
            if (done) return;
            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); setPosition((p) => moveOnLine(activity, p, 1)); }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); setPosition((p) => moveOnLine(activity, p, -1)); }
          }}
          sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: blue.main, '&:focus-visible': { outline: `3px solid ${theme.palette.text.primary}`, outlineOffset: 8 } }}
        >
          {Array.from({ length: span + 1 }, (_, i) => {
            const value = activity.min + i;
            const isTarget = (done || state.attempt.demoShown) && value === target;
            return (
              <Box key={value} sx={{ position: 'absolute', left: `${pct(value)}%`, top: -8, transform: 'translateX(-50%)', textAlign: 'center' }}>
                <Box sx={{ width: 4, height: 24, mx: 'auto', bgcolor: isTarget ? '#0F9D68' : blue.dark, borderRadius: 2 }} />
                <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '0.8rem', sm: '1rem' }, color: isTarget ? '#0A6E49' : 'text.primary' }}>{value}</Typography>
              </Box>
            );
          })}
          <Box aria-hidden sx={{ position: 'absolute', left: `${pct(position)}%`, bottom: 14, transform: 'translateX(-50%)', fontSize: { xs: '2.2rem', md: '2.8rem' }, lineHeight: 1, transition: 'left 300ms ease-out' }}>
            <Illustration emoji={activity.emoji} />
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Button variant="outlined" size="large" startIcon={<ArrowBackRounded />} disabled={done || position <= activity.min} onClick={() => setPosition((p) => moveOnLine(activity, p, -1))}>{ui(lang, 'moveBack')}</Button>
        <Button variant="outlined" size="large" endIcon={<ArrowForwardRounded />} disabled={done || position >= activity.max} onClick={() => setPosition((p) => moveOnLine(activity, p, 1))}>{ui(lang, 'moveForward')}</Button>
        <Button variant="contained" size="large" startIcon={<CheckRounded />} disabled={done} onClick={() => state.submit(position === target)}>{ui(lang, 'checkAnswer')}</Button>
      </Box>
    </ActivityFrame>
  );
}

/** Fill each group, then say how many there are in all. */
export function EqualGroupsView({ activity, lang, say, onSolved }: ActivityProps<EqualGroupsActivity>) {
  const theme = useTheme();
  const state = useAttempt(activity, lang, say, onSolved);
  const [filled, setFilled] = useState<number[]>(() => Array.from({ length: activity.groups }, () => 0));
  const [tried, setTried] = useState<number[]>([]);
  const total = equalGroupsTotal(activity);
  const allFull = filled.every((count) => count === activity.perGroup);
  const done = state.attempt.solved;
  return (
    <ActivityFrame
      activity={activity}
      lang={lang}
      prompt={allFull ? activity.totalPrompt[lang] : activity.prompt[lang]}
      attempt={state.attempt}
      feedback={state.feedback}
      onHear={() => say(allFull ? activity.totalPrompt[lang] : activity.prompt[lang])}
      onHint={state.hint}
      onDemo={state.demo}
      onFinish={state.finish}
      done={done}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${Math.min(4, activity.groups)}, 1fr)` }, gap: 1.5, mb: 2 }}>
        {filled.map((count, i) => {
          const w = resolveWorld(rainbow[i % rainbow.length], theme.palette.mode);
          const full = count === activity.perGroup;
          return (
            <ButtonBase
              key={i}
              disabled={full}
              onClick={() => setFilled((items) => items.map((value, j) => (j === i ? Math.min(activity.perGroup, value + 1) : value)))}
              aria-label={`${ui(lang, 'addOne', { a: String(i + 1) })}: ${count} / ${activity.perGroup}`}
              sx={[tactile(theme, w, { state: full ? 'done' : 'idle', depth: 5, radius: 22 }), { minHeight: 120, p: 1.5, flexDirection: 'column', gap: 0.5 }]}
            >
              <Box aria-hidden sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, fontSize: '1.8rem', minHeight: 40 }}>
                {Array.from({ length: count }, (_, k) => <Box key={k} sx={{ lineHeight: 1, animation: 'kl-pop-in 260ms both' }}><Illustration emoji={activity.emoji} /></Box>)}
              </Box>
              <Typography sx={{ fontWeight: 900, color: w.text }} lang={lang}>{full ? ui(lang, 'groupFull') : `${count} / ${activity.perGroup}`}</Typography>
            </ButtonBase>
          );
        })}
      </Box>
      {allFull && (
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${activity.choices.length}, 1fr)`, gap: 1.5, maxWidth: 520, mx: 'auto' }}>
          {activity.choices.map((value, index) => (
            <OptionButton
              key={value}
              index={index}
              label={String(value)}
              lang={lang}
              big
              tried={tried.includes(value)}
              revealed={value === total && (done || state.attempt.demoShown)}
              disabled={done}
              onClick={() => {
                if (value !== total) setTried((items) => [...items, value]);
                state.submit(value === total);
              }}
            />
          ))}
        </Box>
      )}
    </ActivityFrame>
  );
}

/** Tap the events in the order they happened in the story. */
export function SequenceView({ activity, lang, say, onSolved }: ActivityProps<SequenceActivity>) {
  const theme = useTheme();
  const green = useWorld('green');
  const state = useAttempt(activity, lang, say, onSolved);
  const shuffled = useMemo(() => {
    const mixed = shuffle(activity.events, Math.random);
    return mixed.every((event, i) => event.id === activity.events[i].id) ? [...mixed.slice(1), mixed[0]] : mixed;
  }, [activity]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const done = state.attempt.solved;
  const pick = (id: string) => {
    if (done || placed.includes(id)) return;
    if (!isNextEvent(activity, placed, id)) {
      setShake(id);
      window.setTimeout(() => setShake(null), 450);
      state.submit(false);
      return;
    }
    const next = [...placed, id];
    setPlaced(next);
    if (next.length === activity.events.length) state.submit(true);
  };
  const nextHint = activity.events[placed.length]?.id;
  return (
    <ActivityFrame activity={activity} lang={lang} attempt={state.attempt} feedback={state.feedback} onHear={() => say(`${activity.prompt[lang]} ${ui(lang, 'tapInOrder')}`)} onHint={state.hint} onDemo={state.demo} onFinish={state.finish} done={done}>
      <Typography lang={lang} sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>{ui(lang, 'tapInOrder')}</Typography>
      <Box component="ol" aria-label="Story order" sx={{ listStyle: 'none', p: 0, m: 0, mb: 2, display: 'grid', gap: 1 }}>
        {activity.events.map((event, i) => {
          const isPlaced = placed.includes(event.id);
          return (
            <Box component="li" key={event.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: '14px', border: `2px dashed ${alpha(green.main, isPlaced ? 0 : 0.4)}`, bgcolor: isPlaced ? green.tint : 'transparent', minHeight: 52 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: green.main, color: '#FFFFFF', fontWeight: 900, flexShrink: 0 }}>{i + 1}</Box>
              {isPlaced && <><Illustration emoji={event.emoji} size="32px" /><Typography lang={lang} sx={{ fontWeight: 800 }}>{event.text[lang]}</Typography></>}
            </Box>
          );
        })}
      </Box>
      <Box role="group" aria-label="Events to place" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
        {shuffled.filter((event) => !placed.includes(event.id)).map((event, index) => {
          const w = resolveWorld(rainbow[index % rainbow.length], theme.palette.mode);
          const highlight = state.attempt.demoShown && event.id === nextHint;
          return (
            <ButtonBase
              key={event.id}
              onClick={() => pick(event.id)}
              aria-label={event.text[lang]}
              sx={[tactile(theme, w, { depth: 5, radius: 18 }), { justifyContent: 'flex-start', gap: 1.5, p: 1.5, textAlign: 'left', animation: shake === event.id ? 'kl-shake 420ms ease-in-out' : 'none', outline: highlight ? `4px solid ${green.main}` : 'none' }]}
            >
              <Illustration emoji={event.emoji} size="40px" />
              <Typography lang={lang} sx={{ fontWeight: 800, color: w.text }}>{event.text[lang]}</Typography>
            </ButtonBase>
          );
        })}
      </Box>
      {placed.length > 0 && !done && (
        <Box sx={{ mt: 1.5, textAlign: 'right' }}>
          <Button size="small" startIcon={<RestartAltRounded />} onClick={() => setPlaced([])}>{ui(lang, 'startOver')}</Button>
        </Box>
      )}
    </ActivityFrame>
  );
}

const PLOT_HEIGHT = 200;

/**
 * Build a bar graph from the story's counts, then answer questions about it.
 * Bars can only grow to the real count, so the finished graph always matches the data.
 */
export function BarGraphView({ activity, lang, say, onSolved }: ActivityProps<BarGraphActivity>) {
  const theme = useTheme();
  const state = useAttempt(activity, lang, say, onSolved);
  const [built, setBuilt] = useState<Record<string, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [tried, setTried] = useState<string[]>([]);
  const ready = graphBuilt(activity, built);
  const question = activity.questions[questionIndex];
  const done = state.attempt.solved;
  const top = Math.max(...activity.categories.map((category) => category.value));
  const answer = question ? graphAnswer(activity, question) : '';

  const answerQuestion = (value: string) => {
    const right = value === answer;
    if (!right) {
      setTried((items) => [...items, value]);
      state.submit(false);
      return;
    }
    if (questionIndex + 1 < activity.questions.length) {
      setQuestionIndex(questionIndex + 1);
      setTried([]);
      say(`${ui(lang, 'correct')} ${activity.questions[questionIndex + 1].prompt[lang]}`);
      return;
    }
    state.submit(true);
  };

  const summary = activity.categories.map((category) => `${category.label[lang]}: ${built[category.id] ?? 0}`).join(', ');
  const prompt = !ready ? `${activity.prompt[lang]} ${ui(lang, 'buildGraph')}` : question ? question.prompt[lang] : activity.prompt[lang];

  return (
    <ActivityFrame activity={activity} lang={lang} prompt={prompt} attempt={state.attempt} feedback={state.feedback} onHear={() => say(prompt)} onHint={state.hint} onDemo={state.demo} onFinish={state.finish} done={done}>
      {/* Bars share one plot area and one scale, so their heights always compare fairly. */}
      <Box role="figure" aria-label={`Bar graph. ${summary}`} sx={{ mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `28px repeat(${activity.categories.length}, 1fr)`, columnGap: { xs: 0.75, sm: 1.5 } }}>
          <Box aria-hidden sx={{ position: 'relative', height: PLOT_HEIGHT }}>
            {Array.from({ length: top + 1 }, (_, i) => (
              <Typography key={i} variant="caption" sx={{ position: 'absolute', right: 4, bottom: `${(i / top) * 100}%`, transform: 'translateY(50%)', lineHeight: 1, fontWeight: 800 }}>{i}</Typography>
            ))}
          </Box>
          {activity.categories.map((category, i) => {
            const w = resolveWorld(rainbow[i % rainbow.length], theme.palette.mode);
            const value = built[category.id] ?? 0;
            return (
              <Box key={category.id} sx={{ position: 'relative', height: PLOT_HEIGHT, borderBottom: `3px solid ${theme.palette.text.primary}`, backgroundImage: `repeating-linear-gradient(to top, ${alpha(theme.palette.text.primary, 0.08)} 0 1px, transparent 1px ${100 / top}%)` }}>
                <Box
                  aria-hidden
                  sx={{ position: 'absolute', bottom: 0, left: '15%', width: '70%', height: `${(value / top) * 100}%`, bgcolor: w.main, borderRadius: '10px 10px 0 0', transition: 'height 350ms ease-out', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', color: w.onMain, fontWeight: 900, pt: value ? 0.5 : 0 }}
                >
                  {value > 0 ? value : ''}
                </Box>
              </Box>
            );
          })}
          <Box />
          {activity.categories.map((category, i) => {
            const w = resolveWorld(rainbow[i % rainbow.length], theme.palette.mode);
            const value = built[category.id] ?? 0;
            const full = value === category.value;
            return (
              <Box key={category.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                <ButtonBase
                  onClick={() => setBuilt(addToBar(activity, built, category.id))}
                  disabled={full || ready}
                  aria-label={`${ui(lang, 'addOne', { a: category.label[lang] })}. ${value} / ${category.value}`}
                  sx={[tactile(theme, w, { state: full ? 'done' : 'selected', depth: 4, radius: 14 }), { width: '100%', minHeight: 48, flexDirection: 'column', py: 0.5, '&.Mui-disabled': { color: w.text } }]}
                >
                  <Illustration emoji={category.emoji} size="26px" />
                  <Typography lang={lang} sx={{ fontSize: { xs: '0.72rem', sm: '0.85rem' }, fontWeight: 800, lineHeight: 1.1 }}>{category.label[lang]}</Typography>
                </ButtonBase>
                {!ready && (
                  <Box aria-hidden sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.9rem' }}>
                    {Array.from({ length: category.value }, (_, k) => <Box key={k} sx={{ opacity: k < value ? 0.25 : 1 }}><Illustration emoji={activity.itemEmoji} /></Box>)}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {ready && question && !done && (
        <>
          <Typography lang={lang} sx={{ fontWeight: 800, mb: 1, color: 'text.secondary' }}>{ui(lang, 'graphReady')}</Typography>
          {question.kind === 'difference' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, maxWidth: 480, mx: 'auto' }}>
              {differenceChoices(Number(answer)).map((value, index) => (
                <OptionButton key={value} index={index} label={String(value)} lang={lang} big tried={tried.includes(String(value))} revealed={state.attempt.demoShown && String(value) === answer} onClick={() => answerQuestion(String(value))} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${activity.categories.length}, 1fr)`, gap: 1.5 }}>
              {activity.categories.map((category, index) => (
                <OptionButton key={category.id} index={index} label={category.label[lang]} lang={lang} tried={tried.includes(category.id)} revealed={state.attempt.demoShown && category.id === answer} onClick={() => answerQuestion(category.id)}>
                  <Illustration emoji={category.emoji} size="36px" />
                </OptionButton>
              ))}
            </Box>
          )}
        </>
      )}
    </ActivityFrame>
  );
}
