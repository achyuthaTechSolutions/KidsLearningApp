import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, ButtonBase, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import ActivityCard from '../../components/ui/ActivityCard';
import PillPicker from '../../components/ui/PillPicker';
import Illustration from '../../components/ui/Illustration';
import Confetti from '../../components/ui/Confetti';
import { tactile, useWorld } from '../../components/ui/world';
import { fonts, type WorldKey } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { playConfirmation, playNote, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import { createDeck, isPair, memoryStars, pairsForLevel, type MemoryCard, type MemoryLevel, type MemoryTheme } from './deck';

type Status = 'menu' | 'playing' | 'done';

const themes: { theme: MemoryTheme; title: string; subtitle: string; emoji: string; world: WorldKey }[] = [
  { theme: 'animals', title: 'Animal Pairs', subtitle: 'Find two of each animal!', emoji: '🐾', world: 'orange' },
  { theme: 'fruits', title: 'Fruit and Veg Pairs', subtitle: 'Match the yummy food!', emoji: '🍓', world: 'pink' },
  { theme: 'vehicles', title: 'Vehicle Pairs', subtitle: 'Beep beep! Match the rides!', emoji: '🚗', world: 'blue' },
];

const levels: { value: MemoryLevel; label: string }[] = [
  { value: 'easy', label: `Easy · ${pairsForLevel.easy * 2} cards` },
  { value: 'medium', label: `Medium · ${pairsForLevel.medium * 2} cards` },
  { value: 'hard', label: `Hard · ${pairsForLevel.hard * 2} cards` },
];

const FLIP_BACK_MS = 1000;

export default function MemoryMatch() {
  const theme = useTheme();
  const navigate = useNavigate();
  const violet = useWorld('violet');
  const green = useWorld('green');
  const { say, sound } = useGameFeedback();
  const incrementGamesCompleted = useAppStore((s) => s.incrementGamesCompleted);
  const addAnimalDiscovered = useAppStore((s) => s.addAnimalDiscovered);
  const addWordLearned = useAppStore((s) => s.addWordLearned);

  const [status, setStatus] = useState<Status>('menu');
  const [deckTheme, setDeckTheme] = useState<MemoryTheme>('animals');
  const [level, setLevel] = useState<MemoryLevel>('easy');
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [turns, setTurns] = useState(0);
  const [celebrate, setCelebrate] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const flipBack = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flipBack.current), []);

  const pairs = pairsForLevel[level];

  const start = (nextTheme: MemoryTheme) => {
    window.clearTimeout(flipBack.current);
    setDeckTheme(nextTheme);
    setDeck(createDeck(nextTheme, level));
    setOpen([]);
    setMatched([]);
    setTurns(0);
    setStatus('playing');
    say('Find the matching pairs!');
  };

  const flip = (card: MemoryCard) => {
    if (open.length >= 2 || open.includes(card.id) || matched.includes(card.name)) return;
    sound((v) => playNote(open.length === 0 ? 587 : 698, 0.1, v * 0.2, 'triangle'));
    say(card.name);
    if (open.length === 0) {
      setOpen([card.id]);
      return;
    }

    const first = deck.find((item) => item.id === open[0]);
    setOpen([open[0], card.id]);
    setTurns((count) => count + 1);
    if (first && isPair(first, card)) {
      const nextMatched = [...matched, card.name];
      setMatched(nextMatched);
      setOpen([]);
      if (deckTheme === 'animals') addAnimalDiscovered(card.name);
      else addWordLearned(card.name);
      setAnnouncement(`Match! Two ${card.name} cards.`);
      if (nextMatched.length === pairs) {
        incrementGamesCompleted();
        setCelebrate((count) => count + 1);
        sound((v) => playSuccess(v * 0.3));
        window.setTimeout(() => {
          setStatus('done');
          say('You found all the pairs! Well done!');
        }, 700);
      } else {
        sound((v) => playConfirmation(v * 0.25));
        window.setTimeout(() => say(`Match! ${card.name}!`), 600);
      }
      return;
    }

    setAnnouncement(`${first?.name ?? 'That'} and ${card.name} do not match.`);
    flipBack.current = window.setTimeout(() => setOpen([]), FLIP_BACK_MS);
  };

  if (status === 'menu') {
    return (
      <Page>
        <PageHero world="violet" title="Memory Match" subtitle="Turn over two cards. Can you find the pairs?" emoji="🃏" />
        <Box sx={{ mb: 3 }}>
          <PillPicker value={level} options={levels} onChange={setLevel} world="violet" ariaLabel="How many cards" />
        </Box>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {themes.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.theme}>
              <ActivityCard world={item.world} emoji={item.emoji} title={item.title} subtitle={item.subtitle} delay={index * 60} onClick={() => start(item.theme)} />
            </Grid>
          ))}
        </Grid>
      </Page>
    );
  }

  if (status === 'done') {
    return (
      <GameResults
        stars={memoryStars(turns, pairs)}
        message={`You found ${pairs} pairs in ${turns} turns!`}
        celebrate={celebrate}
        onPlayAgain={() => start(deckTheme)}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  const columns = deck.length <= 6 ? 3 : 4;

  return (
    <Page maxWidth={760}>
      <GameHeader
        title="Memory Match"
        emoji="🃏"
        world="violet"
        backLabel="Back"
        onBack={() => setStatus('menu')}
        score={matched.length}
        scoreLabel={`${matched.length} pairs found`}
        progress={{ value: matched.length, total: pairs, label: `${matched.length} of ${pairs} pairs · ${turns} ${turns === 1 ? 'turn' : 'turns'}` }}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: { xs: 1.25, sm: 2 } }}>
        {deck.map((card, index) => {
          const isMatched = matched.includes(card.name);
          const faceUp = isMatched || open.includes(card.id);
          const w = isMatched ? green : violet;
          return (
            <ButtonBase
              key={card.id}
              onClick={() => flip(card)}
              aria-label={faceUp ? `Card ${index + 1}, ${card.name}${isMatched ? ', matched' : ''}` : `Card ${index + 1}, face down`}
              aria-disabled={faceUp}
              sx={[
                tactile(theme, w, { state: faceUp ? 'done' : 'selected', depth: 6, radius: 22 }),
                {
                  aspectRatio: '3 / 4',
                  flexDirection: 'column',
                  gap: 0.5,
                  animation: `kl-rise-in 320ms ease-out ${index * 40}ms both`,
                },
              ]}
            >
              <Box
                aria-hidden
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  gap: 0.5,
                  animation: faceUp ? 'kl-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
                }}
              >
                {faceUp ? (
                  <>
                    <Illustration emoji={card.emoji} size="clamp(44px, 12vw, 76px)" />
                    <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.15rem' }, color: w.text, overflowWrap: 'anywhere' }}>
                      {card.name}
                    </Typography>
                  </>
                ) : (
                  <Box
                    sx={{
                      width: 'clamp(48px, 13vw, 80px)',
                      height: 'clamp(48px, 13vw, 80px)',
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha('#FFFFFF', 0.2),
                      border: `3px dashed ${alpha('#FFFFFF', 0.55)}`,
                      fontFamily: fonts.display,
                      fontWeight: 700,
                      fontSize: 'clamp(1.8rem, 6vw, 2.6rem)',
                      color: violet.onMain,
                    }}
                  >
                    ?
                  </Box>
                )}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>

      <Box aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {announcement}
      </Box>
      <Confetti fire={celebrate} />
    </Page>
  );
}
