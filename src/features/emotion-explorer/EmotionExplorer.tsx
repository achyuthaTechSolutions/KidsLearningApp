import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, ButtonBase, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NavigateNext, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Illustration from '../../components/ui/Illustration';
import IllustrationBubble from '../../components/ui/IllustrationBubble';
import Mascot from '../../components/ui/Mascot';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Confetti from '../../components/ui/Confetti';
import { resolveWorld, tactile, useWorld } from '../../components/ui/world';
import { fonts } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import type { GameDifficulty } from '../learning-games/difficulty';
import {
  SUPPORT_TIP, buildEmotionRound, emotions, feedbackFor, judgeEmotion, needsSupportTip,
  type Emotion, type EmotionQuestion,
} from './scenarios';

const optionWorlds = ['blue', 'pink', 'violet', 'teal'] as const;

function promptFor(question: EmotionQuestion): string {
  const { scenario } = question;
  if (scenario.kind === 'face') return 'How does this face feel?';
  return `${scenario.story} How might ${scenario.name} feel?`;
}

export default function EmotionExplorer() {
  const theme = useTheme();
  const navigate = useNavigate();
  const pink = useWorld('pink');
  const green = useWorld('green');
  const sun = useWorld('sun');
  const { say, sound, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [round, setRound] = useState<EmotionQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Emotion | null>(null);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);

  const question = round[index];

  const ask = (next: EmotionQuestion) => {
    setPicked(null);
    setStatus(promptFor(next));
    say(promptFor(next));
  };

  const start = () => {
    const next = buildEmotionRound(difficulty);
    setRound(next);
    setIndex(0);
    setPhase('play');
    ask(next[0]);
  };

  const choose = (emotion: Emotion) => {
    if (!question || picked) return;
    setPicked(emotion);
    const verdict = judgeEmotion(question.scenario, emotion);
    if (verdict !== 'not-quite') {
      setCelebrate((count) => count + 1);
      sound((v) => playConfirmation(v * 0.25));
    }
    const text = feedbackFor(question.scenario, emotion);
    setStatus(text);
    say(needsSupportTip(question.scenario, emotion) ? `${text} ${SUPPORT_TIP}` : text);
  };

  const goNext = () => {
    if (index + 1 >= round.length) {
      completeGameRound('emotions', difficulty);
      setPhase('done');
      sound((v) => playSuccess(v * 0.3));
      say('Thank you for thinking about feelings with me!');
      return;
    }
    setIndex(index + 1);
    ask(round[index + 1]);
  };

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Emotion Explorer"
        subtitle="Look, listen, and think: how might our friends feel?"
        emoji="😊"
        world="pink"
        steps={[
          { emoji: '👀', text: 'Look at the face or hear the little story.' },
          { emoji: '💭', text: 'Pick how the friend might feel.' },
          { emoji: '💬', text: 'Talk about it! Different friends can feel different things.' },
        ]}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onStart={start}
        onHear={() => say('Look at the face, or listen to the little story. Then pick how the friend might feel. There are lots of ways to feel, and all feelings are okay.')}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
          For grown-ups: this is a talking game about feelings, not a test. Champion level has open questions with no single right answer. Nothing your child picks is saved, apart from finishing a round.
        </Typography>
      </GameIntro>
    );
  }

  if (phase === 'done') {
    return (
      <GameResults stars={3} message="You explored lots of feelings!" celebrate={celebrate} onPlayAgain={start} onChooseGame={() => navigate('/games')} />
    );
  }

  if (!question) return null;
  const { scenario } = question;
  const verdict = picked ? judgeEmotion(scenario, picked) : null;

  return (
    <Page maxWidth={860}>
      <GameHeader
        title="Emotion Explorer"
        emoji="😊"
        world="pink"
        backLabel="Back"
        onBack={() => setPhase('intro')}
        progress={{ value: index + (picked ? 1 : 0), total: round.length, label: `Feeling ${index + 1} of ${round.length}` }}
      />

      <Box sx={{ textAlign: 'center', p: { xs: 2, md: 3 }, mb: 3, borderRadius: '32px', bgcolor: pink.tint }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <IllustrationBubble emoji={scenario.character} world="pink" size="lg" popKey={scenario.id} />
        </Box>
        {scenario.kind !== 'face' && (
          <Typography sx={{ fontSize: { xs: '1.2rem', md: '1.35rem' }, fontWeight: 800, mb: 1 }}>{scenario.story}</Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '1.35rem', md: '1.7rem' }, color: pink.text }}>
            {scenario.kind === 'face' ? 'How does this face feel?' : `How might ${scenario.name} feel?`}
          </Typography>
          <RoundIconButton label="Hear it again" world="pink" size={48} onClick={() => say(promptFor(question))}>
            <VolumeUpRounded />
          </RoundIconButton>
        </Box>
      </Box>

      <Box role="group" aria-label="Feelings" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${question.choices.length}, 1fr)` }, gap: 2 }}>
        {question.choices.map((emotion, i) => {
          const info = emotions[emotion];
          const chosen = picked === emotion;
          const fits = picked && verdict !== 'discuss' && scenario.accepted.includes(emotion);
          const w = resolveWorld(chosen || fits ? (verdict === 'not-quite' && chosen ? 'sun' : 'green') : optionWorlds[i % optionWorlds.length], theme.palette.mode);
          return (
            <ButtonBase
              key={emotion}
              aria-label={`${info.label}${chosen ? ', your answer' : ''}${fits ? ', fits' : ''}`}
              disabled={Boolean(picked)}
              onClick={() => choose(emotion)}
              sx={[
                tactile(theme, w, { state: chosen || fits ? 'done' : 'idle', depth: 6, radius: 24 }),
                { flexDirection: 'column', gap: 1, py: 2, minHeight: 130, opacity: picked && !chosen && !fits ? 0.55 : 1 },
              ]}
            >
              <Illustration emoji={info.emoji} size="56px" />
              <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.2rem', color: w.text }}>{info.label}</Typography>
            </ButtonBase>
          );
        })}
      </Box>

      {picked && (
        <Box sx={{ mt: 3, p: { xs: 2, md: 2.5 }, borderRadius: '24px', bgcolor: verdict === 'not-quite' ? sun.tint : green.tint, animation: 'kl-rise-in 300ms ease-out both' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Mascot size={64} mood={verdict === 'not-quite' ? 'think' : 'cheer'} float={false} />
            <Typography variant="h4" component="p" sx={{ flex: 1, minWidth: 220, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              {feedbackFor(scenario, picked)}
            </Typography>
            <Button variant="contained" color="success" endIcon={<NavigateNext />} onClick={goNext} sx={{ fontSize: '1.1rem', px: 3 }}>
              {index + 1 >= round.length ? 'Finish' : 'Next'}
            </Button>
          </Box>
          {needsSupportTip(scenario, picked) && (
            <Alert severity="info" icon={<Illustration emoji="🤗" />} sx={{ mt: 2 }}>{SUPPORT_TIP}</Alert>
          )}
        </Box>
      )}
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
