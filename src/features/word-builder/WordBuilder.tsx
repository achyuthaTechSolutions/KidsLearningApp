import { useEffect, useState } from 'react';
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
import { WORDS_PER_ROUND, isNextLetter, pickSpellWords, scrambleTiles, spellOut, type LetterTile, type SpellWord } from './words';

interface Round {
  words: SpellWord[];
  index: number;
  tiles: LetterTile[];
  used: number[];
  mistakes: number;
  wordMistakes: number;
  perfectWords: number;
  done: boolean;
}

function newRound(): Round {
  const words = pickSpellWords();
  return { words, index: 0, tiles: scrambleTiles(words[0].word), used: [], mistakes: 0, wordMistakes: 0, perfectWords: 0, done: false };
}

/** One star per word spelled without a wrong tap, scaled to three. */
function spellStars(perfectWords: number): number {
  if (perfectWords >= WORDS_PER_ROUND - 1) return 3;
  if (perfectWords >= 2) return 2;
  return 1;
}

export default function WordBuilder() {
  const theme = useTheme();
  const navigate = useNavigate();
  const pink = useWorld('pink');
  const green = useWorld('green');
  const { say, sound } = useGameFeedback();
  const incrementGamesCompleted = useAppStore((s) => s.incrementGamesCompleted);
  const addLetterExplored = useAppStore((s) => s.addLetterExplored);
  const addWordLearned = useAppStore((s) => s.addWordLearned);

  const [round, setRound] = useState<Round>(() => newRound());
  const [hints, setHints] = useState(true);
  const [shaking, setShaking] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [celebrate, setCelebrate] = useState(0);

  const current = round.words[round.index];
  const word = current.word.toUpperCase();
  const placed = round.used.length;
  const solved = placed === word.length;

  const introduce = (next: SpellWord) => say(`Let's spell ${next.word}!`);

  const [firstWord] = useState(() => round.words[0].word);
  useEffect(() => {
    say(`Let's spell ${firstWord}!`);
  }, [say, firstWord]);

  const restart = () => {
    const next = newRound();
    setRound(next);
    setFinished(false);
    introduce(next.words[0]);
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
    say(spellOut(current.word));
    setRound({ ...round, used, perfectWords: round.perfectWords + (round.wordMistakes === 0 ? 1 : 0) });
  };

  const next = () => {
    if (round.index + 1 >= round.words.length) {
      incrementGamesCompleted();
      setFinished(true);
      setCelebrate((count) => count + 1);
      say(`You spelled ${WORDS_PER_ROUND} words! Super speller!`);
      return;
    }
    const index = round.index + 1;
    setRound({ ...round, index, tiles: scrambleTiles(round.words[index].word), used: [], wordMistakes: 0 });
    introduce(round.words[index]);
  };

  if (finished) {
    return (
      <GameResults
        stars={spellStars(round.perfectWords)}
        message={`You spelled ${WORDS_PER_ROUND} words!`}
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
        progress={{ value: round.index + (solved ? 1 : 0), total: WORDS_PER_ROUND, label: `Word ${round.index + 1} of ${WORDS_PER_ROUND}` }}
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
              {round.index + 1 >= round.words.length ? 'See Results' : 'Next Word'}
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
      <Confetti fire={celebrate} />
    </Page>
  );
}
