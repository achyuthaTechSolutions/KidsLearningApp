import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, LinearProgress, Chip } from '@mui/material';
import {
  Keyboard as KeyboardIcon,
  AbcOutlined as AlphabetIcon,
  Numbers as NumbersIcon,
  Pets as AnimalsIcon,
  MusicNote as MusicIcon,
  SportsEsports as GamesIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useAppStore } from '../../store/useAppStore';
import { speak } from '../../services/speech';
import { loadDailyChallenge } from '../../services/storage';
import { achievementsList } from '../../data/achievements';
import { normalizeDailyRecord } from '../daily-challenge/dailySelection';
import { ANIMAL_TOTAL, LETTER_TOTAL, NUMBER_TOTAL, WORD_TOTAL, overallLearningProgress } from '../../services/progressStats';

const activities = [
  { path: '/keyboard', title: "Let's Explore the Keyboard!", subtitle: 'Tap a key to learn', emoji: '⌨️', color: '#6C5CE7', icon: <KeyboardIcon sx={{ fontSize: 40 }} /> },
  { path: '/alphabet', title: "Let's Learn ABC!", subtitle: 'Discover all 26 letters', emoji: '🔤', color: '#00B894', icon: <AlphabetIcon sx={{ fontSize: 40 }} /> },
  { path: '/numbers', title: 'Count the Stars!', subtitle: 'Learn numbers 0 to 20', emoji: '🔢', color: '#FDCB6E', icon: <NumbersIcon sx={{ fontSize: 40 }} /> },
  { path: '/animals', title: 'Meet the Animals!', subtitle: 'Discover amazing creatures', emoji: '🦁', color: '#E17055', icon: <AnimalsIcon sx={{ fontSize: 40 }} /> },
  { path: '/music', title: 'Make Some Music!', subtitle: 'Play piano, drums & more', emoji: '🎵', color: '#74B9FF', icon: <MusicIcon sx={{ fontSize: 40 }} /> },
  { path: '/games', title: 'Play a Guessing Game!', subtitle: 'Test what you know', emoji: '🎮', color: '#A29BFE', icon: <GamesIcon sx={{ fontSize: 40 }} /> },
];

export default function HomePage() {
  const navigate = useNavigate();
  const progress = useAppStore((s) => s.progress);
  const settings = useAppStore((s) => s.settings);

  const summary = overallLearningProgress(progress);
  const totalStars = progress.achievementsEarned.length;
  const daily = normalizeDailyRecord(loadDailyChallenge());

  const handleCardClick = (path: string, title: string) => {
    navigate(path);
    if (settings.speechEnabled) {
      speak(title, { rate: settings.speechRate });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Welcome Section */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography sx={{ fontSize: { xs: '3rem', md: '4rem' }, lineHeight: 1 }}>🎓</Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, color: 'primary.main', mb: 1 }}>
          Welcome to Kids Learning!
        </Typography>
        <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          What would you like to learn today?
        </Typography>
      </Box>

      {/* Progress Summary */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
        <Chip icon={<span>🔤</span>} label={`${summary.letters}/${LETTER_TOTAL} Letters`} variant="outlined" sx={{ fontWeight: 600, fontSize: '0.9rem', py: 2.5 }} />
        <Chip icon={<span>🔢</span>} label={`${summary.numbers}/${NUMBER_TOTAL} Numbers`} variant="outlined" sx={{ fontWeight: 600, fontSize: '0.9rem', py: 2.5 }} />
        <Chip icon={<span>🐾</span>} label={`${summary.animals}/${ANIMAL_TOTAL} Animals`} variant="outlined" sx={{ fontWeight: 600, fontSize: '0.9rem', py: 2.5 }} />
        <Chip icon={<span>📖</span>} label={`${summary.words}/${WORD_TOTAL} Words`} variant="outlined" sx={{ fontWeight: 600, fontSize: '0.9rem', py: 2.5 }} />
        <Chip icon={<TrophyIcon sx={{ color: '#FDCB6E' }} />} label={`${totalStars}/${achievementsList.length} Stars`} variant="outlined" sx={{ fontWeight: 600, fontSize: '0.9rem', py: 2.5 }} />
      </Box>

      {/* Overall Progress */}
      <Box sx={{ mb: 4, maxWidth: 560, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Letters, numbers, animals, and words</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{summary.explored}/{summary.total}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={summary.percent}
          aria-label={`Learning progress, ${summary.explored} of ${summary.total} letters, numbers, animals, and words`}
          sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5 } }}
        />
        <Typography variant="caption" color="text.secondary">{summary.percent}% of the learning content explored</Typography>
      </Box>

      {/* Activity Cards */}
      <Grid container spacing={3}>
        {activities.map((activity) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={activity.path}>
            <Card
              sx={{
                height: '100%',
                borderTop: `4px solid ${activity.color}`,
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 12px 30px ${activity.color}30` },
              }}
            >
              <CardActionArea onClick={() => handleCardClick(activity.path, activity.title)} aria-label={activity.title} sx={{ height: '100%', minHeight: 48 }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography sx={{ fontSize: '3rem', mb: 1 }}>{activity.emoji}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: activity.color, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    {activity.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activity.subtitle}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Daily Challenge */}
      <Card sx={{ mt: 4, background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)', color: 'white' }}>
        <CardActionArea onClick={() => handleCardClick('/daily', 'Daily Learning Challenge')} aria-label="Daily Learning Challenge">
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🌟</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Daily Learning Challenge
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {daily.completed
                ? `Finished today with ${daily.stars} ${daily.stars === 1 ? 'star' : 'stars'}`
                : daily.answered > 0
                  ? `${daily.answered} of 5 done, ${daily.stars} ${daily.stars === 1 ? 'star' : 'stars'} so far`
                  : 'Five questions picked for today'}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );
}
