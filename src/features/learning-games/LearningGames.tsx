import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid } from '@mui/material';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import ActivityCard from '../../components/ui/ActivityCard';
import type { QuizGameType } from './questions';
import QuizRound from './QuizRound';
import { gameCatalog, gameCategories } from './catalog';
import { useAppStore } from '../../store/useAppStore';
import { useLook } from '../../theme/useLook';
import { hubItems, type HubItem, type QuizCard } from './hubs/hubData';
import GardenGames from './hubs/GardenGames';
import BlocksGames from './hubs/BlocksGames';
import MapGames from './hubs/MapGames';

const gameList: QuizCard[] = [
  { type: 'find-letter', title: 'Find the Letter', description: 'Identify the letter by its sound!', emoji: '🔤', world: 'green' },
  { type: 'guess-animal', title: 'Guess the Animal', description: 'Which animal makes this sound?', emoji: '🐾', world: 'orange' },
  { type: 'count', title: 'Count the Objects', description: 'How many objects do you see?', emoji: '🔢', world: 'sun' },
  { type: 'match', title: 'Match the Word', description: 'Find the word that starts with this letter!', emoji: '🎯', world: 'pink' },
  { type: 'listen', title: 'Listen and Choose', description: 'Listen to the word and find it!', emoji: '👂', world: 'blue' },
  { type: 'odd-one-out', title: 'Odd One Out', description: 'Which picture does not belong?', emoji: '🔍', world: 'violet' },
  { type: 'pattern', title: 'What Comes Next?', description: 'Finish the picture pattern!', emoji: '🧠', world: 'red' },
];



export default function LearningGames() {
  const [gameType, setGameType] = useState<QuizGameType | 'select'>('select');
  const navigate = useNavigate();
  const look = useLook();
  const progress = useAppStore((s) => s.progress);
  const activeGame = gameList.find((game) => game.type === gameType);

  if (gameType === 'select' && look.id !== 'classic') {
    const items = hubItems(progress, gameList);
    const open = (item: HubItem) => (item.quiz ? setGameType(item.quiz) : item.path && navigate(item.path));
    if (look.id === 'garden') return <GardenGames items={items} onOpen={open} />;
    if (look.id === 'blocks') return <BlocksGames items={items} badges={progress.achievementsEarned.length} onOpen={open} />;
    return <MapGames items={items} onOpen={open} onBack={() => navigate('/')} />;
  }

  if (gameType === 'select') {
    return (
      <Page>
        <PageHero world="teal" title="Learning Games" subtitle="Trace, build, listen, solve, and explore. Pick a game!" emoji="🎮" />
        {gameCategories.map((category) => {
          const games = gameCatalog.filter((game) => game.category === category.id);
          if (games.length === 0) return null;
          return (
            <Box component="section" aria-labelledby={`games-${category.id}`} key={category.id} sx={{ mb: 4 }}>
              <Typography id={`games-${category.id}`} variant="h2" sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' }, mb: 2 }}>{category.title}</Typography>
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {games.map((game, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={game.id}>
                    <ActivityCard world={game.world} emoji={game.emoji} title={game.title} subtitle={game.description} delay={index * 50} onClick={() => navigate(game.path)} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
        <Typography variant="h2" sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' }, mb: 2 }}>Quiz games · the levels never end</Typography>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {gameList.map((game, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={game.type}>
              <ActivityCard
                world={game.world}
                emoji={game.emoji}
                title={game.title}
                subtitle={game.description}
                delay={index * 60}
                onClick={() => setGameType(game.type)}
              />
            </Grid>
          ))}
        </Grid>
      </Page>
    );
  }

  return (
    <QuizRound
      key={gameType}
      type={gameType}
      title={activeGame?.title ?? ''}
      emoji={activeGame?.emoji ?? '🎮'}
      world={activeGame?.world ?? 'teal'}
      onExit={() => setGameType('select')}
    />
  );
}
