import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, FormControlLabel, Switch, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { NavigateNext, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import IllustrationBubble from '../../components/ui/IllustrationBubble';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Confetti from '../../components/ui/Confetti';
import { resolveWorld, tactile, useWorld } from '../../components/ui/world';
import { fonts, rainbow } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playError, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { useEndlessLevel } from '../learning-games/useEndlessLevel';
import LevelUpBanner from '../learning-games/LevelUpBanner';
import EndlessControls from '../learning-games/EndlessControls';
import { decoysFor, isNextLetter, pickWord, scrambleTiles, spellOut, type LetterTile, type SpellWord } from './words';

/** An endless game: words keep coming until the child taps Finish. */
interface Round {
  word: SpellWord;
  tiles: LetterTile[];
  used: number[];
  mistakes: number;
  wordMistakes: number;
  spelled: number;
  perfectWords: number;
  recent: string[];
}

function wordFor(level: number, recent: string[]) {
  const word = pickWord(level, recent);
  return { word, tiles: scrambleTiles(word.word, Math.random, decoysFor(level)) };
}

function newRound(level: number): Round {
  const first = wordFor(level, []);
  return { ...first, used: [], mistakes: 0, wordMistakes: 0, spelled: 0, perfectWords: 0, recent: [first.word.word] };
}

/** Stars when the child stops: words spelled with no wrong tap, out of all words spelled. */
function spellStars(round: Round): number {
  if (round.spelled === 0) return 1;
  const ratio = round.perfectWords / round.spelled;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export default function WordBuilder() {
  const theme = useTheme();
  const navigate = useNavigate();
  const pink = useWorld('pink');
  const green = useWorld('green');
  const { say, sound, settings } = useGameFeedback();
  const endless = useEndlessLevel('spell', settings.gameDifficulty);
  const incrementGamesCompleted = useAppStore((s) => s.incrementGamesCompleted);
  const addLetterExplored = useAppStore((s) => s.addLetterExplored);
  const addWordLearned = useAppStore((s) => s.addWordLearned);

  const [round, setRound] = useState<Round>(() => newRound(endless.planned));
  const [hints, setHints] = useState(true);
  const [shaking, setShaking] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [celebrate, setCelebrate] = useState(0);

  const current = round.word;
  const word = current.word.toUpperCase();
  const placed = round.used.length;
  const solved = placed === word.length;

  const introduce = (next: SpellWord) => say(`Let's spell ${next.word}!`);

  const [firstWord] = useState(() => round.word.word);
  // Start once when the screen opens. `begin` changes as the level moves, so guard it.
  const { begin } = endless;
  const begun = useRef(false);
  useEffect(() => {
    if (begun.current) return;
    begun.current = true;
    begin();
    say(`Let's spell ${firstWord}!`);
  }, [say, firstWord, begin]);

  const restart = () => {
    const next = newRound(endless.begin());
    setRound(next);
    setFinished(false);
    introduce(next.word);
  };

  const tap = (tile: LetterTile) => {
    if (solved || round.used.includes(tile.id)) return;
    if (!isNextLetter(word, placed, tile.letter)) {
      setShaking(tile.id);
      window.setTimeout(() => setShaking(null), 450);
      sound((v) => playError(v * 0.25));
      say(`That is ${tile.letter}. Find ${word[placed]}.`);
      setRound((r) => ({ ...r, mistakes: r.mistakes + 1, wordMistakes: r.wordMistakes + 1 }));
      return;
    }

    addLetterExplored(tile.letter);
    const used = [...round.used, tile.id];
    if (used.length < word.length) {
      sound((v) => playConfirmation(v * 0.15));
      say(tile.letter);
      setRound({ ...round, used });
      return;
    }

    addWordLearned(current.word);
    sound((v) => playSuccess(v * 0.3));
    setCelebrate((count) => count + 1);
    const after = endless.record(round.wordMistakes === 0);
    say(`${spellOut(current.word)}${after.change === 'up' ? ` Level up! Level ${after.level}!` : ''}`);
    setRound({ ...round, used, spelled: round.spelled + 1, perfectWords: round.perfectWords + (round.wordMistakes === 0 ? 1 : 0) });
  };

  const next = () => {
    const upcoming = wordFor(endless.level, round.recent);
    setRound({ ...round, ...upcoming, used: [], wordMistakes: 0, recent: [...round.recent, upcoming.word.word].slice(-10) });
    introduce(upcoming.word);
  };

  /** The game never ends by itself: the child stops when they like. */
  const finish = () => {
    if (round.spelled > 0) incrementGamesCompleted();
    setFinished(true);
    setCelebrate((count) => count + 1);
    say(round.spelled > 0 ? `You spelled ${round.spelled} words and reached level ${endless.level}! Super speller!` : 'See you next time!');
  };

  if (finished) {
    return (
      <GameResults
        stars={spellStars(round)}
        message={`You spelled ${round.spelled} ${round.spelled === 1 ? 'word' : 'words'} and reached Level ${endless.level}!`}
        celebrate={celebrate}
        onPlayAgain={restart}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  return (
    <Page maxWidth={820}>
      <GameHeader
        title="Word Builder"
        emoji="🧩"
        world="pink"
        backLabel="Back to Games"
        onBack={() => navigate('/games')}
        score={round.spelled}
        scoreLabel={`${round.spelled} words spelled`}
        actions={<EndlessControls level={endless.level} world="pink" onFinish={finish} />}
      />

      <Box
        key={current.word}
        sx={{
          textAlign: 'center',
          borderRadius: { xs: '28px', md: '36px' },
          bgcolor: 'background.paper',
          border: `3px solid ${pink.tint}`,
          boxShadow: `0 8px 0 ${pink.tint}`,
          p: { xs: 2, md: 4 },
          animation: 'kl-rise-in 320ms ease-out both',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <IllustrationBubble emoji={current.emoji} world="pink" size="md" popKey={current.word} />
          <RoundIconButton label="Hear the word" world="pink" size={52} onClick={() => say(current.word)}>
            <VolumeUpRounded />
          </RoundIconButton>
        </Box>

        <Box role="list" aria-label={`Spelling ${placed} of ${word.length} letters`} sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.75, md: 1.25 }, mb: 3, flexWrap: 'wrap' }}>
          {word.split('').map((letter, index) => {
            const filled = index < placed;
            return (
              <Box
                key={index}
                role="listitem"
                aria-label={filled ? letter : hints ? `Empty, needs ${letter}` : 'Empty'}
                sx={{
                  width: { xs: 54, md: 72 },
                  height: { xs: 64, md: 84 },
                  borderRadius: '18px',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: { xs: '2.2rem', md: '3rem' },
                  border: filled ? `3px solid ${solved ? green.main : pink.main}` : `3px dashed ${alpha(pink.main, 0.5)}`,
                  bgcolor: filled ? (solved ? green.tint : pink.tint) : 'transparent',
                  color: filled ? (solved ? green.text : pink.text) : alpha(theme.palette.text.primary, 0.18),
                  animation: filled ? 'kl-pop-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
                }}
              >
                {filled || hints ? letter : ''}
              </Box>
            );
          })}
        </Box>

        {!solved ? (
          <>
            <Typography variant="body1" sx={{ fontWeight: 800, mb: 1.5 }}>
              Tap the letters in order
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, md: 1.5 }, flexWrap: 'wrap' }}>
              {round.tiles.map((tile, index) => {
                const used = round.used.includes(tile.id);
                const w = resolveWorld(rainbow[index % rainbow.length], theme.palette.mode);
                return (
                  <ButtonBase
                    key={tile.id}
                    aria-label={`Letter ${tile.letter}`}
                    disabled={used}
                    onClick={() => tap(tile)}
                    sx={[
                      tactile(theme, w, { state: 'selected', depth: 6, radius: 20 }),
                      {
                        width: { xs: 64, md: 80 },
                        height: { xs: 64, md: 80 },
                        fontFamily: fonts.display,
                        fontWeight: 700,
                        fontSize: { xs: '2.2rem', md: '2.8rem' },
                        visibility: used ? 'hidden' : 'visible',
                        animation: shaking === tile.id ? 'kl-shake 420ms ease-in-out' : `kl-rise-in 320ms ease-out ${index * 60}ms both`,
                      },
                    ]}
                  >
                    {tile.letter}
                  </ButtonBase>
                );
              })}
            </Box>
          </>
        ) : (
          <Box aria-live="polite" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h3" component="p" sx={{ color: green.text, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              You spelled {current.word}!
            </Typography>
            <Button variant="contained" color="success" endIcon={<NavigateNext />} onClick={next} sx={{ fontSize: '1.1rem', px: 3 }}>
              Next Word
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <FormControlLabel
          control={<Switch checked={hints} onChange={(event) => setHints(event.target.checked)} color="secondary" />}
          label="Show letter hints"
        />
      </Box>
      <LevelUpBanner change={endless.lastChange} world="pink" />
      <Confetti fire={celebrate} />
    </Page>
  );
}
