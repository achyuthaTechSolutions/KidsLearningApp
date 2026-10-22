import { useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Illustration from '../../../components/ui/Illustration';
import { tactile, useWorld } from '../../../components/ui/world';
import { playNote } from '../../../services/audio';
import { useAppStore } from '../../../store/useAppStore';
import { canDrink, pebblesNeeded, predictionAnswer, waterLevel } from '../engine/activities';
import type { PebblePotActivity } from '../engine/types';
import { ui } from '../content/uiText';
import { ActivityFrame } from './ActivityFrame';
import { useAttempt, type ActivityProps } from './useAttempt';
import OptionButton from './OptionButton';

const POT_TOP = 40;
const POT_BOTTOM = 230;

/** Water height in the pot drawing for a level from 0 to maxLevel. */
function levelY(level: number, max: number): number {
  return POT_BOTTOM - ((POT_BOTTOM - POT_TOP) * level) / max;
}

/**
 * Kalu's pot. The child drops pebbles; the water rises one marked step per pebble.
 * After `predictAfter` pebbles the child predicts how many more are needed.
 * The drawing only shows `waterLevel()`; it never decides anything itself.
 */
export default function PebblePot({ activity, lang, say, onSolved }: ActivityProps<PebblePotActivity>) {
  const theme = useTheme();
  const blue = useWorld('blue');
  const [pebbles, setPebbles] = useState(0);
  const [predicted, setPredicted] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const state = useAttempt(activity, lang, say, onSolved);
  const soundOn = useAppStore((s) => s.settings.soundEnabled && s.settings.volume > 0);
  const volume = useAppStore((s) => s.settings.volume);

  const level = waterLevel(activity, pebbles);
  const drinking = canDrink(activity, pebbles);
  const asking = pebbles >= activity.predictAfter && !predicted;
  const answer = predictionAnswer(activity);
  const choices = [...new Set([Math.max(1, answer - 1), answer, answer + 1])];
  const done = predicted && drinking;
  const pile = Math.max(0, pebblesNeeded(activity) + 1 - pebbles);

  const drop = () => {
    if (asking || drinking) return;
    const next = pebbles + 1;
    setPebbles(next);
    if (soundOn) playNote(320 + next * 40, 0.12, volume * 0.25, 'triangle');
    if (next === activity.predictAfter) say(activity.predictPrompt[lang]);
    else if (canDrink(activity, next)) say(ui(lang, 'canDrinkNow'));
  };

  const predict = (value: number) => {
    const right = value === answer;
    if (!right) setTried((items) => [...items, value]);
    state.submit(right);
    if (right) setPredicted(true);
  };

  const max = activity.maxLevel;
  const waterTop = levelY(level, max);
  const drinkY = levelY(activity.drinkLevel, max);

  return (
    <ActivityFrame
      activity={activity}
      lang={lang}
      prompt={asking ? activity.predictPrompt[lang] : drinking ? ui(lang, 'canDrinkNow') : activity.prompt[lang]}
      attempt={state.attempt}
      feedback={state.feedback}
      onHear={() => say(asking ? activity.predictPrompt[lang] : activity.prompt[lang])}
      onHint={state.hint}
      onDemo={state.demo}
      onFinish={state.finish}
      done={done && state.attempt.solved}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.1fr 1fr' }, gap: 2, alignItems: 'center' }}>
        <Box sx={{ position: 'relative', maxWidth: 300, mx: 'auto', width: '100%' }}>
          <svg
            viewBox="0 0 220 260"
            width="100%"
            role="img"
            aria-label={`${ui(lang, 'pebblesIn', { n: pebbles })}. ${drinking ? ui(lang, 'canDrinkNow') : ''}`}
          >
            <defs>
              <clipPath id="pot-inside">
                <path d="M62 40 Q40 60 40 120 Q34 200 70 232 L150 232 Q186 200 180 120 Q180 60 158 40 Z" />
              </clipPath>
            </defs>
            <path d="M58 30 Q30 60 32 120 Q26 210 66 240 L154 240 Q194 210 188 120 Q190 60 162 30 Z" fill="#B5652F" />
            <g clipPath="url(#pot-inside)">
              <rect x="0" y="0" width="220" height="260" fill="#6E3A1C" />
              <rect
                x="0"
                y={waterTop}
                width="220"
                height={260 - waterTop}
                fill={blue.main}
                opacity="0.85"
                style={{ transition: 'y 600ms ease-out, height 600ms ease-out' }}
              />
              {Array.from({ length: pebbles }, (_, i) => (
                <ellipse key={i} cx={78 + (i % 4) * 22} cy={222 - Math.floor(i / 4) * 16} rx="12" ry="9" fill="#9C9284" stroke="#6F675C" strokeWidth="2" style={{ animation: 'kl-pop-in 300ms both' }} />
              ))}
            </g>
            {Array.from({ length: max + 1 }, (_, step) => (
              <line key={step} x1="192" x2="204" y1={levelY(step, max)} y2={levelY(step, max)} stroke={theme.palette.text.secondary} strokeWidth="2" />
            ))}
            <line x1="38" x2="206" y1={drinkY} y2={drinkY} stroke="#C0392B" strokeWidth="3" strokeDasharray="7 6" />
            <rect x="44" y="18" width="132" height="18" rx="9" fill="#C97A3F" />
          </svg>
          <Box aria-hidden sx={{ position: 'absolute', top: drinking ? '2%' : '-6%', left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(40px, 10vw, 64px)', transition: 'top 500ms', animation: drinking ? 'kl-hop 0.9s ease-in-out infinite' : 'none' }}>
            <Illustration emoji="🐦‍⬛" />
          </Box>
          <Typography variant="caption" sx={{ position: 'absolute', right: 0, top: `${(drinkY / 260) * 100 - 9}%`, fontWeight: 900, color: '#C0392B', bgcolor: alpha('#FFFFFF', 0.85), px: 0.5, borderRadius: 1 }} lang={lang}>
            {ui(lang, 'drinkLine')}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', mb: 1 }} lang={lang}>{ui(lang, 'pebblesIn', { n: pebbles })}</Typography>
          {asking ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${choices.length}, 1fr)`, gap: 1.5 }}>
              {choices.map((value, index) => (
                <OptionButton
                  key={value}
                  index={index}
                  label={String(value)}
                  lang={lang}
                  big
                  tried={tried.includes(value)}
                  revealed={value === answer && state.attempt.demoShown}
                  onClick={() => predict(value)}
                />
              ))}
            </Box>
          ) : (
            <Box role="group" aria-label={ui(lang, 'dropPebble')} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
              {Array.from({ length: pile }, (_, i) => (
                <ButtonBase
                  key={i}
                  aria-label={`${ui(lang, 'dropPebble')} (${pile})`}
                  disabled={drinking}
                  onClick={drop}
                  sx={[tactile(theme, blue, { depth: 5, radius: 20 }), { width: 72, height: 72, fontSize: '2.4rem', '&.Mui-disabled': { opacity: 0.4 } }]}
                >
                  <Illustration emoji="🪨" />
                </ButtonBase>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </ActivityFrame>
  );
}
