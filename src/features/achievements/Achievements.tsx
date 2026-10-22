import { Box, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { LockRounded } from '@mui/icons-material';
import { achievementsList } from '../../data/achievements';
import { useAppStore } from '../../store/useAppStore';
import { ANIMAL_TOTAL, LETTER_TOTAL, NUMBER_TOTAL, WORD_TOTAL } from '../../services/progressStats';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import Mascot from '../../components/ui/Mascot';
import { outlineColor, useWorld } from '../../components/ui/world';
import { fonts, worlds, type WorldKey } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';

function Stat({ world, emoji, label, value }: { world: WorldKey; emoji: string; label: string; value: string | number }) {
  const w = useWorld(world);
  return (
    <Box sx={{ height: '100%', p: 2, borderRadius: '24px', bgcolor: w.tint, border: `2px solid ${alpha(w.main, 0.3)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box aria-hidden sx={{ width: 52, height: 52, borderRadius: '16px', display: 'grid', placeItems: 'center', bgcolor: 'background.paper', fontSize: '1.8rem', flexShrink: 0 }}><Illustration emoji={emoji} /></Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="p" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.1, color: w.text }}>{value}</Typography>
        <Typography component="p" variant="body2" sx={{ fontWeight: 800, color: w.text }}>{label}</Typography>
      </Box>
    </Box>
  );
}

function Medal({ emoji, earned }: { emoji: string; earned: boolean }) {
  const theme = useTheme();
  const muted = outlineColor(theme);
  return (
    <Box aria-hidden sx={{ position: 'relative', width: 104, height: 120, mx: 'auto' }}>
      <Box sx={{ position: 'absolute', left: 30, top: 70, width: 18, height: 44, bgcolor: earned ? worlds.red.main : muted, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)', transform: 'rotate(14deg)' }} />
      <Box sx={{ position: 'absolute', right: 30, top: 70, width: 18, height: 44, bgcolor: earned ? worlds.blue.main : muted, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)', transform: 'rotate(-14deg)' }} />
      <Box
        sx={{
          position: 'absolute',
          left: 8,
          top: 0,
          width: 88,
          height: 88,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: '2.6rem',
          background: earned
            ? `radial-gradient(circle at 35% 30%, ${worlds.gold.light} 0%, ${worlds.gold.main} 55%, ${worlds.gold.dark} 100%)`
            : theme.palette.action.hover,
          border: earned ? `5px solid ${worlds.gold.light}` : `3px dashed ${muted}`,
          boxShadow: earned ? `0 5px 0 ${worlds.gold.dark}` : 'none',
          filter: earned ? 'none' : 'grayscale(1)',
          opacity: earned ? 1 : 0.6,
          animation: earned ? 'kl-float 5s ease-in-out infinite' : 'none',
        }}
      >
        <Illustration emoji={emoji} />
        {!earned && (
          <Box sx={{ position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'background.paper', border: `2px solid ${muted}` }}>
            <LockRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function Achievements() {
  const progress = useAppStore((s) => s.progress);
  const earned = progress.achievementsEarned;
  const earnedCount = earned.length;
  const gold = useWorld('gold');

  const sorted = [...achievementsList].sort((a, b) => Number(earned.includes(b.id)) - Number(earned.includes(a.id)));

  return (
    <Page>
      <PageHero
        world="gold"
        title="My Achievements"
        subtitle={earnedCount === 0 ? 'Explore and play to earn your first badge!' : `You have earned ${earnedCount} ${earnedCount === 1 ? 'badge' : 'badges'}. Keep going!`}
        art={<Mascot size={120} mood={earnedCount > 0 ? 'cheer' : 'happy'} />}
        progress={{ value: earnedCount, total: achievementsList.length, label: 'Badges earned', ariaLabel: `${earnedCount} of ${achievementsList.length} achievements earned` }}
      />

      <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 4 }}>
        {[
          { world: 'green' as WorldKey, emoji: '🔤', label: 'Letters explored', value: `${progress.lettersExplored.length}/${LETTER_TOTAL}` },
          { world: 'sun' as WorldKey, emoji: '🔢', label: 'Numbers explored', value: `${progress.numbersExplored.length}/${NUMBER_TOTAL}` },
          { world: 'orange' as WorldKey, emoji: '🐾', label: 'Animals discovered', value: `${progress.animalsDiscovered.length}/${ANIMAL_TOTAL}` },
          { world: 'pink' as WorldKey, emoji: '📖', label: 'Words learned', value: `${progress.wordsLearned.length}/${WORD_TOTAL}` },
          { world: 'red' as WorldKey, emoji: '🔥', label: 'Answer streak', value: progress.currentStreak },
          { world: 'teal' as WorldKey, emoji: '🎮', label: 'Games completed', value: progress.gamesCompleted },
          { world: 'blue' as WorldKey, emoji: '🎵', label: 'Music played', value: progress.musicActivities },
          { world: 'violet' as WorldKey, emoji: '✅', label: 'Correct answers', value: progress.correctAnswers },
        ].map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <Stat {...stat} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' }, mb: 2 }}>Badges</Typography>
      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {sorted.map((achievement, index) => {
          const isEarned = earned.includes(achievement.id);
          return (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={achievement.id}>
              <Box
                aria-label={`${achievement.title}. ${achievement.description} ${isEarned ? 'Earned.' : 'Not earned yet.'}`}
                role="img"
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 2,
                  pt: 2.5,
                  borderRadius: '28px',
                  bgcolor: isEarned ? gold.tint : 'background.paper',
                  border: '2px solid',
                  borderColor: isEarned ? alpha(worlds.gold.main, 0.6) : 'divider',
                  boxShadow: isEarned ? `0 5px 0 ${alpha(worlds.gold.main, 0.6)}` : 'none',
                  animation: `kl-rise-in 320ms ease-out ${index * 40}ms both`,
                }}
              >
                <Medal emoji={achievement.emoji} earned={isEarned} />
                <Typography variant="h5" component="p" sx={{ mt: 1, color: isEarned ? gold.text : 'text.primary' }}>{achievement.title}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>{achievement.description}</Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Page>
  );
}
