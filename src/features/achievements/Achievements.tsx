import { Box, Typography, Grid, Card, CardContent, LinearProgress, Chip } from '@mui/material';
import { achievementsList } from '../../data/achievements';
import { useAppStore } from '../../store/useAppStore';
import { ANIMAL_TOTAL, LETTER_TOTAL, NUMBER_TOTAL, WORD_TOTAL } from '../../services/progressStats';

export default function Achievements() {
  const progress = useAppStore((s) => s.progress);
  const earned = progress.achievementsEarned;
  const earnedCount = earned.length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          🏆 My Achievements
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {earnedCount} of {achievementsList.length} achievements earned!
        </Typography>
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 1 }}>
          <LinearProgress variant="determinate" value={(earnedCount / achievementsList.length) * 100}
            sx={{ height: 10, borderRadius: 5, '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: '#FDCB6E' } }} />
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Letters Explored', value: `${progress.lettersExplored.length}/${LETTER_TOTAL}`, emoji: '🔤' },
          { label: 'Numbers Explored', value: `${progress.numbersExplored.length}/${NUMBER_TOTAL}`, emoji: '🔢' },
          { label: 'Animals Discovered', value: `${progress.animalsDiscovered.length}/${ANIMAL_TOTAL}`, emoji: '🐾' },
          { label: 'Words Learned', value: `${progress.wordsLearned.length}/${WORD_TOTAL}`, emoji: '📖' },
          { label: 'Answer Streak', value: progress.currentStreak, emoji: '💯' },
          { label: 'Games Completed', value: progress.gamesCompleted, emoji: '🎮' },
          { label: 'Music Activities', value: progress.musicActivities, emoji: '🎵' },
        ].map((stat) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>{stat.emoji}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Achievement Badges */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
        Badges
      </Typography>
      <Grid container spacing={2}>
        {achievementsList.map((achievement) => {
          const isEarned = earned.includes(achievement.id);
          return (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={achievement.id}>
              <Card sx={{
                opacity: isEarned ? 1 : 0.5,
                border: isEarned ? '2px solid' : '1px solid',
                borderColor: isEarned ? '#FDCB6E' : 'divider',
                bgcolor: isEarned ? '#FDCB6E11' : 'background.paper',
                transition: 'all 0.3s',
              }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 0.5, filter: isEarned ? 'none' : 'grayscale(1)' }}>
                    {achievement.emoji}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{achievement.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{achievement.description}</Typography>
                  {isEarned && <Chip label="Earned!" size="small" sx={{ mt: 1, bgcolor: '#FDCB6E', color: '#333', fontWeight: 700 }} />}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
