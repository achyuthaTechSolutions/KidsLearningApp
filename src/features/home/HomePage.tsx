import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { PlayArrowRounded, StarRounded } from '@mui/icons-material';
import { useAppStore } from '../../store/useAppStore';
import { speak } from '../../services/speech';
import { loadDailyChallenge } from '../../services/storage';
import { achievementsList } from '../../data/achievements';
import { DAILY_QUESTION_COUNT, normalizeDailyRecord } from '../daily-challenge/dailySelection';
import { ANIMAL_TOTAL, LETTER_TOTAL, NUMBER_TOTAL, WORD_TOTAL, overallLearningProgress } from '../../services/progressStats';
import { activityPaths, sectionFor } from '../../app/sections';
import Page from '../../components/ui/Page';
import Mascot, { SpeechBubble } from '../../components/ui/Mascot';
import ActivityCard from '../../components/ui/ActivityCard';
import { gradient, resolveWorld, tactile, useWorld } from '../../components/ui/world';
import { fonts, worlds, type WorldKey } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';
import { useLook } from '../../theme/useLook';
import GardenHome from './looks/GardenHome';
import BlocksHome from './looks/BlocksHome';
import MapHome from './looks/MapHome';

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const floaters = [
  { text: '3', world: 'sun' as WorldKey, top: '62%', left: '2%', delay: '1.2s' },
  { text: '♪', world: 'blue' as WorldKey, top: '8%', left: '30%', delay: '2s' },
];

function StatTile({ world, emoji, label, value, total }: { world: WorldKey; emoji: string; label: string; value: number; total: number }) {
  const w = useWorld(world);
  return (
    <Box
      sx={{
        flex: { xs: '0 0 auto', md: 1 },
        minWidth: { xs: 132, md: 0 },
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.75,
        py: 1.25,
        borderRadius: '22px',
        bgcolor: w.tint,
        border: `2px solid ${alpha(w.main, 0.3)}`,
      }}
    >
      <Box aria-hidden sx={{ fontSize: '1.8rem', lineHeight: 1 }}><Illustration emoji={emoji} /></Box>
      <Box>
        <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.1, color: w.text }}>
          {value}
          <Box component="span" sx={{ fontSize: '0.85rem', opacity: 0.75 }}>/{total}</Box>
        </Typography>
        <Typography component="span" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: w.text }}>{label}</Typography>
      </Box>
    </Box>
  );
}

/** Home for the parent's chosen look. */
export default function HomePage() {
  const look = useLook();
  if (look.id === 'garden') return <GardenHome />;
  if (look.id === 'blocks') return <BlocksHome />;
  if (look.id === 'map') return <MapHome />;
  return <ClassicHome />;
}

function ClassicHome() {
  const navigate = useNavigate();
  const theme = useTheme();
  const progress = useAppStore((s) => s.progress);
  const settings = useAppStore((s) => s.settings);

  const summary = overallLearningProgress(progress);
  const totalStars = progress.achievementsEarned.length;
  const daily = normalizeDailyRecord(loadDailyChallenge());
  const continuePath = (progress.lastActivity && activityPaths[progress.lastActivity]) || '/keyboard';
  const continueSection = sectionFor(continuePath);
  const violet = resolveWorld('violet', theme.palette.mode);
  const red = useWorld('red');
  const sun = useWorld('sun');
  const gold = useWorld('gold');

  const go = (path: string, spoken: string) => {
    navigate(path);
    if (settings.speechEnabled) speak(spoken, { rate: settings.speechRate });
  };

  const dailyText = daily.completed
    ? `All done today! You earned ${daily.stars} ${daily.stars === 1 ? 'star' : 'stars'}.`
    : daily.answered > 0
      ? `${daily.answered} of ${DAILY_QUESTION_COUNT} done. Keep going!`
      : 'Five fresh questions are waiting for you.';

  const cards: { path: string; title: string; subtitle: string; progress?: { value: number; total: number } }[] = [
    { path: '/stories', title: 'Story Time', subtitle: 'Animal stories with maths and morals' },
    { path: '/keyboard', title: 'Explore the keyboard', subtitle: 'Tap a key, see a picture' },
    { path: '/alphabet', title: "Let's learn ABC", subtitle: 'All 26 letters', progress: { value: summary.letters, total: LETTER_TOTAL } },
    { path: '/numbers', title: 'Count the stars', subtitle: 'Numbers 0 to 20', progress: { value: summary.numbers, total: NUMBER_TOTAL } },
    { path: '/animals', title: 'Meet the animals', subtitle: 'Who says moo?', progress: { value: summary.animals, total: ANIMAL_TOTAL } },
    { path: '/words', title: 'My first words', subtitle: 'Fruits, cars, colours', progress: { value: summary.words, total: WORD_TOTAL } },
    { path: '/music', title: 'Make some music', subtitle: 'Piano, drums, and more' },
    { path: '/dino', title: 'Dino Dash', subtitle: 'Run, jump, and catch letters' },
    { path: '/balloons', title: 'Balloon Pop', subtitle: 'Pop letters, numbers, and colours' },
    { path: '/games', title: 'Play a game', subtitle: 'Match, spell, guess, and count' },
    { path: '/achievements', title: 'My badges', subtitle: `${totalStars} of ${achievementsList.length} earned` },
  ];

  return (
    <Page maxWidth={1200}>
      <Box
        component="section"
        aria-labelledby="home-title"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '30px', md: '40px' },
          background: gradient(violet, 140),
          color: '#FFFFFF',
          px: { xs: 2.5, md: 5 },
          pt: { xs: 3, md: 4 },
          pb: { xs: 3, md: 4 },
          mb: 3,
          boxShadow: `0 8px 0 ${alpha(worlds.violet.dark, 0.6)}, 0 24px 50px ${alpha(worlds.violet.dark, 0.28)}`,
        }}
      >
        <Box aria-hidden sx={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', right: -120, top: -170, bgcolor: alpha('#FFFFFF', 0.1) }} />
        <Box aria-hidden sx={{ position: 'absolute', width: 520, height: 180, borderRadius: '50%', left: -120, bottom: -120, bgcolor: alpha('#FFFFFF', 0.12) }} />
        {floaters.map((f) => {
          const fw = worlds[f.world];
          return (
            <Box
              key={f.text}
              aria-hidden
              className="kl-motion-only"
              sx={{
                position: 'absolute',
                top: f.top,
                left: f.left,
                width: 44,
                height: 44,
                borderRadius: '14px',
                display: { xs: 'none', md: 'grid' },
                placeItems: 'center',
                bgcolor: fw.main,
                color: fw.onMain,
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: '1.4rem',
                boxShadow: `0 4px 0 ${fw.dark}`,
                transform: 'rotate(-8deg)',
                animation: `kl-float 5s ease-in-out ${f.delay} infinite`,
              }}
            >
              {f.text}
            </Box>
          );
        })}

        <Box sx={{ position: 'relative', display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { xs: 'stretch', lg: 'center' }, gap: { xs: 2, md: 3, lg: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 1.5, md: 2.5 }, flex: 1, minWidth: 0 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Mascot size={150} wave label="Avi waving hello" />
            </Box>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Mascot size={92} wave label="Avi waving hello" />
            </Box>
            <Box sx={{ flex: 1, minWidth: { xs: 0, sm: 220 }, maxWidth: 460, color: 'text.primary', mb: { xs: 1, md: 3 } }}>
              <SpeechBubble>
                {greeting()}! I&apos;m Avi. What shall we learn today?
              </SpeechBubble>
            </Box>
          </Box>

          <Box sx={{ flex: { lg: '0 0 360px' }, display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: { md: 520, lg: 'none' } }}>
            <Typography id="home-title" variant="h1" sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' }, color: 'inherit', textShadow: `0 2px 0 ${alpha(worlds.violet.dark, 0.5)}` }}>
              Ready to explore?
            </Typography>
            <Typography sx={{ fontWeight: 700, opacity: 0.95 }}>
              {summary.explored} of {summary.total} things discovered so far.
            </Typography>
            <ButtonBase
              onClick={() => go(continuePath, `Let's keep going in ${continueSection.label}`)}
              aria-label={`Continue learning in ${continueSection.label}`}
              sx={{
                mt: 0.5,
                justifyContent: 'flex-start',
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderRadius: '24px',
                bgcolor: '#FFFFFF',
                color: worlds.violet.dark,
                boxShadow: `0 6px 0 ${alpha('#000000', 0.18)}`,
                transition: 'transform 90ms, box-shadow 90ms',
                '&:hover': { transform: 'translateY(-2px)' },
                '&:active': { transform: 'translateY(5px)', boxShadow: `0 1px 0 ${alpha('#000000', 0.18)}` },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: '16px', display: 'grid', placeItems: 'center', bgcolor: worlds.green.main, color: '#FFFFFF', boxShadow: `0 3px 0 ${worlds.green.dark}`, flexShrink: 0 }}>
                <PlayArrowRounded sx={{ fontSize: 32 }} />
              </Box>
              <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.15 }}>
                  Continue learning
                </Typography>
                <Typography component="span" sx={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: 'text.secondary' }}>
                  <Illustration emoji={continueSection.emoji} /> {continueSection.label}
                </Typography>
              </Box>
            </ButtonBase>
          </Box>
        </Box>
      </Box>

      <Box
        role="list"
        aria-label="Your progress"
        sx={{ display: 'flex', gap: 1.5, mb: 3, overflowX: 'auto', mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
      >
        <Box role="listitem" sx={{ display: 'contents' }}><StatTile world="green" emoji="🔤" label="Letters" value={summary.letters} total={LETTER_TOTAL} /></Box>
        <Box role="listitem" sx={{ display: 'contents' }}><StatTile world="sun" emoji="🔢" label="Numbers" value={summary.numbers} total={NUMBER_TOTAL} /></Box>
        <Box role="listitem" sx={{ display: 'contents' }}><StatTile world="orange" emoji="🐾" label="Animals" value={summary.animals} total={ANIMAL_TOTAL} /></Box>
        <Box role="listitem" sx={{ display: 'contents' }}><StatTile world="pink" emoji="📖" label="Words" value={summary.words} total={WORD_TOTAL} /></Box>
        <Box role="listitem" sx={{ display: 'contents' }}><StatTile world="gold" emoji="🏆" label="Badges" value={totalStars} total={achievementsList.length} /></Box>
      </Box>

      <ButtonBase
        onClick={() => go('/daily', 'Daily Learning Challenge')}
        aria-label={`Daily Learning Challenge. ${dailyText}`}
        sx={[
          tactile(theme, red, { state: 'selected', depth: 7, radius: 32 }),
          {
            width: '100%',
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(120deg, ${red.main} 0%, ${worlds.orange.main} 55%, ${sun.main} 130%)`,
            justifyContent: 'flex-start',
            textAlign: 'left',
            gap: { xs: 2, md: 3 },
            px: { xs: 2.5, md: 4 },
            py: { xs: 2.5, md: 3 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
          },
        ]}
      >
        <Box
          aria-hidden
          className="kl-motion-only"
          sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', background: `linear-gradient(90deg, transparent, ${alpha('#FFFFFF', 0.22)}, transparent)`, animation: 'kl-shine 4.5s ease-in-out infinite' }}
        />
        <Box aria-hidden sx={{ width: { xs: 64, md: 84 }, height: { xs: 64, md: 84 }, borderRadius: '24px', display: 'grid', placeItems: 'center', bgcolor: alpha('#FFFFFF', 0.22), fontSize: { xs: '2.4rem', md: '3rem' }, flexShrink: 0, animation: 'kl-wiggle 3s ease-in-out infinite' }}>
          <Illustration emoji="🌟" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '1.35rem', md: '1.6rem' }, lineHeight: 1.15 }}>
            Daily Learning Challenge
          </Typography>
          <Typography component="span" sx={{ display: 'block', fontWeight: 800, mt: 0.5 }}>{dailyText}</Typography>
        </Box>
        <Box aria-hidden sx={{ display: 'flex', gap: 0.25, bgcolor: alpha('#000000', 0.14), borderRadius: '999px', px: 1.25, py: 0.75 }}>
          {Array.from({ length: DAILY_QUESTION_COUNT }, (_, i) => (
            <StarRounded key={i} sx={{ fontSize: 30, color: i < daily.stars ? worlds.gold.light : alpha('#FFFFFF', 0.35) }} />
          ))}
        </Box>
      </ButtonBase>

      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2, gap: 2 }}>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>Let&apos;s explore</Typography>
        <Button variant="text" onClick={() => navigate('/achievements')} sx={{ color: gold.text }}>
          {totalStars} {totalStars === 1 ? 'badge' : 'badges'} earned
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {cards.map((card, index) => {
          const section = sectionFor(card.path);
          return (
            <Grid key={card.path} size={{ xs: 12, sm: 6, md: 4 }}>
              <ActivityCard
                world={section.world}
                emoji={section.emoji}
                title={card.title}
                subtitle={card.subtitle}
                progress={card.progress}
                delay={index * 50}
                onClick={() => go(card.path, card.title)}
              />
            </Grid>
          );
        })}
      </Grid>
    </Page>
  );
}
