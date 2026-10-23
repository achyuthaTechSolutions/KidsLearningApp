import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, ButtonBase, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { HearingRounded, NavigateNext } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import Mascot from '../../components/ui/Mascot';
import Confetti from '../../components/ui/Confetti';
import { resolveWorld, tactile, useWorld } from '../../components/ui/world';
import { fonts } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { isAudioAvailable, playConfirmation, playSuccess } from '../../services/audio';
import { cancelSpeech, isSpeechAvailable } from '../../services/speech';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import type { GameDifficulty } from '../learning-games/difficulty';
import { SAFARI_ROUNDS, createPhrasePlayer, createSafariQuestion, type SafariCategory, type SafariQuestion, type SafariSound } from './sounds';

const categoryOptions = [
  { value: 'instruments' as const, label: 'Music Studio sounds', emoji: '🥁' },
  { value: 'animals' as const, label: 'Animal sounds, said by Pip', emoji: '🐄' },
];
const optionWorlds = ['blue', 'pink', 'violet', 'teal'] as const;

export default function SoundSafari() {
  const theme = useTheme();
  const navigate = useNavigate();
  const sun = useWorld('sun');
  const green = useWorld('green');
  const orange = useWorld('orange');
  const { say, settings } = useGameFeedback();
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const player = useMemo(() => createPhrasePlayer(), []);
  useEffect(() => () => player.stop(), [player]);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [category, setCategory] = useState<SafariCategory>('instruments');
  const [question, setQuestion] = useState<SafariQuestion | null>(null);
  const [number, setNumber] = useState(1);
  const [tried, setTried] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);

  const soundReady = isAudioAvailable() && settings.soundEnabled && settings.volume > 0;
  const speechReady = isSpeechAvailable() && settings.speechEnabled && settings.volume > 0;
  const blocked = category === 'instruments'
    ? (!soundReady ? 'Music Studio sounds need sound effects. Turn on sound and volume in Parent Settings.' : '')
    : (!speechReady ? 'Pip needs speech to make animal sounds. Turn on speech and volume in Parent Settings.' : '');

  const playSound = (sound: SafariSound) => {
    setPlaying(true);
    if (sound.source.kind === 'spoken') {
      say(sound.source.text, () => setPlaying(false));
      window.setTimeout(() => setPlaying(false), 3500);
      return;
    }
    cancelSpeech();
    const ok = player.play(sound.source.instrument, settings.volume, () => setPlaying(false));
    if (!ok) {
      setPlaying(false);
      setStatus('The sound could not play on this device.');
    }
  };

  const ask = (next: SafariQuestion) => {
    setQuestion(next);
    setTried([]);
    setSolved(false);
    const prompt = next.sound.category === 'animals' ? 'Listen to Pip. Which animal says this?' : 'Listen. What makes this sound?';
    setStatus(prompt);
    setPlaying(true);
    say(prompt, () => playSound(next.sound));
  };

  const start = () => {
    if (blocked) return;
    setNumber(1);
    setFirstTry(0);
    setPhase('play');
    ask(createSafariQuestion(category, difficulty));
  };

  const choose = (choice: SafariSound) => {
    if (!question || solved || tried.includes(choice.id)) return;
    player.stop();
    if (choice.id !== question.sound.id) {
      setTried((items) => [...items, choice.id]);
      const message = `That is the ${choice.name.toLowerCase()}. Listen again and try another picture!`;
      setStatus(message);
      say(message);
      return;
    }
    setSolved(true);
    if (tried.length === 0) setFirstTry((count) => count + 1);
    setCelebrate((count) => count + 1);
    if (settings.soundEnabled) playConfirmation(settings.volume * 0.25);
    const message = `Yes! ${question.sound.explanation}`;
    setStatus(message);
    say(message);
  };

  const goNext = () => {
    if (!question) return;
    if (number >= SAFARI_ROUNDS) {
      completeGameRound('sound-safari', `${category}-${difficulty}`);
      setPhase('done');
      setCelebrate((count) => count + 1);
      if (settings.soundEnabled) playSuccess(settings.volume * 0.3);
      say('What great listening!');
      return;
    }
    setNumber(number + 1);
    ask(createSafariQuestion(category, difficulty, Math.random, question.sound.id));
  };

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Sound Safari"
        subtitle="Listen closely. What makes that sound?"
        emoji="🎧"
        world="sun"
        steps={[
          { emoji: '👂', text: 'Listen to the sound.' },
          { emoji: '🔁', text: 'Tap "Hear it again" as many times as you like.' },
          { emoji: '👆', text: 'Tap the picture that makes that sound.' },
        ]}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onStart={start}
        startDisabled={Boolean(blocked)}
        onHear={() => say('Listen to the sound, then tap the picture that makes it. You can hear it again as many times as you like.')}
      >
        <PillPicker value={category} options={categoryOptions} onChange={setCategory} world="sun" ariaLabel="Sound type" />
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto' }}>
          {category === 'instruments'
            ? 'These are the same instrument sounds you play in Music Studio. They are made by the app, not recorded.'
            : 'There are no animal recordings in the app. Pip pretends to be each animal using the speaking voice.'}
        </Typography>
        {blocked && <Alert severity="info" sx={{ mt: 2 }}>{blocked}</Alert>}
      </GameIntro>
    );
  }

  if (phase === 'done') {
    return (
      <GameResults
        stars={firstTry >= SAFARI_ROUNDS - 1 ? 3 : firstTry >= SAFARI_ROUNDS / 2 ? 2 : 1}
        message={`You found ${SAFARI_ROUNDS} sounds! ${firstTry} on the first try.`}
        celebrate={celebrate}
        onPlayAgain={start}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  if (!question) return null;
  const isAnimal = question.sound.category === 'animals';

  return (
    <Page maxWidth={860}>
      <GameHeader
        title="Sound Safari"
        emoji="🎧"
        world="sun"
        backLabel="Back"
        onBack={() => { player.stop(); cancelSpeech(); setPhase('intro'); }}
        score={firstTry}
        scoreLabel={`${firstTry} found on the first try`}
        progress={{ value: number - (solved ? 0 : 1), total: SAFARI_ROUNDS, label: `Sound ${number} of ${SAFARI_ROUNDS}` }}
      />

      <Box sx={{ textAlign: 'center', p: { xs: 2, md: 3 }, borderRadius: '32px', bgcolor: sun.tint, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          {isAnimal ? <Mascot size={96} mood="happy" float={false} label="Pip, pretending to be an animal" /> : <Illustration emoji="🎧" size="88px" />}
        </Box>
        <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '1.35rem', md: '1.7rem' }, mb: 1.5 }}>
          {isAnimal ? 'Which animal is Pip pretending to be?' : 'What makes this sound?'}
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<HearingRounded />}
          onClick={() => playSound(question.sound)}
          sx={{ fontSize: '1.2rem', px: 4, bgcolor: sun.main, color: sun.onMain, '&:hover': { bgcolor: sun.dark } }}
          aria-describedby="safari-playing"
        >
          Hear it again
        </Button>
        <Typography id="safari-playing" variant="body2" sx={{ mt: 1, fontWeight: 800, minHeight: 20 }}>
          {playing ? 'Playing…' : ''}
        </Typography>
      </Box>

      <Box role="group" aria-label="Picture choices" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${Math.min(4, question.choices.length)}, 1fr)` }, gap: 2 }}>
        {question.choices.map((choice, index) => {
          const isAnswer = solved && choice.id === question.sound.id;
          const wasTried = tried.includes(choice.id);
          const w = resolveWorld(isAnswer ? 'green' : optionWorlds[index % optionWorlds.length], theme.palette.mode);
          return (
            <ButtonBase
              key={choice.id}
              aria-label={`${choice.name}${isAnswer ? ', correct' : wasTried ? ', not this one' : ''}`}
              disabled={solved || wasTried}
              onClick={() => choose(choice)}
              sx={[
                tactile(theme, w, { state: isAnswer ? 'done' : 'idle', depth: 6, radius: 24 }),
                { flexDirection: 'column', gap: 1, py: 2.5, minHeight: 150, opacity: wasTried ? 0.4 : 1 },
              ]}
            >
              <Illustration emoji={choice.emoji} size="72px" />
              <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.2rem', color: w.text, textDecoration: wasTried ? 'line-through' : 'none' }}>
                {choice.name}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      {(solved || tried.length > 0) && (
        <Box sx={{ mt: 3, p: 2, borderRadius: '24px', bgcolor: solved ? green.tint : orange.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="p" sx={{ color: solved ? green.text : orange.text, textAlign: 'center' }}>
            {solved ? question.sound.explanation : 'Good listening! Try another picture.'}
          </Typography>
          {solved && (
            <Button variant="contained" color="success" endIcon={<NavigateNext />} onClick={goNext} sx={{ fontSize: '1.1rem', px: 3 }}>
              {number >= SAFARI_ROUNDS ? 'See Results' : 'Next Sound'}
            </Button>
          )}
        </Box>
      )}
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
