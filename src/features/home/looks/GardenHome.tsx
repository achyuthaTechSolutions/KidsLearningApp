import { Box, ButtonBase, IconButton, Typography } from '@mui/material';
import { PlayArrowRounded, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../../components/ui/Page';
import Mascot from '../../../components/ui/Mascot';
import Illustration from '../../../components/ui/Illustration';
import { garden } from '../../../theme/looks';
import { fonts } from '../../../theme/tokens';
import { ANIMAL_TOTAL, LETTER_TOTAL, NUMBER_TOTAL, WORD_TOTAL } from '../../../services/progressStats';
import { greeting, useHomeData, useStoryPick } from '../useHomeData';

const tileSx = {
  bgcolor: '#FFFFFF',
  border: `2px solid ${garden.border}`,
  borderRadius: '24px',
  color: garden.indigo,
  transition: 'transform 120ms, border-color 160ms',
  '&:hover': { borderColor: garden.marigold },
  '&:active': { transform: 'scale(0.97)' },
  '&:focus-visible': { outline: `3px solid ${garden.indigo}`, outlineOffset: 2 },
} as const;

function Tile({ emoji, title, note, onClick, small }: { emoji: string; title: string; note: string; onClick: () => void; small?: boolean }) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-label={`${title}. ${note}`}
      sx={{ ...tileSx, p: small ? 1.25 : 1.75, minHeight: small ? 96 : 120, flexDirection: 'column', alignItems: small ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 0.75, textAlign: small ? 'center' : 'left' }}
    >
      <Illustration emoji={emoji} size={small ? '36px' : '48px'} />
      <Box>
        <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: small ? '1rem' : '1.3rem', lineHeight: 1.05 }}>{title}</Typography>
        <Typography component="span" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: garden.muted, mt: 0.25 }}>{note}</Typography>
      </Box>
    </ButtonBase>
  );
}

/** Storybook Garden Home: Avi says hello, one story to carry on with, and four big picture tiles. */
export default function GardenHome() {
  const { summary, daily, dailyText, dailyTotal, badges, badgeTotal, gameTotal, say, go } = useHomeData();
  const story = useStoryPick();
  const hello = `${greeting()}! I'm Avi. Shall we read a story?`;

  return (
    <Page maxWidth={760}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mb: 2 }}>
        <Mascot size={96} wave label="Avi waving hello" />
        <Box sx={{ flex: 1, mb: 3.5, bgcolor: '#FFFFFF', border: `2px solid ${garden.border}`, borderRadius: '22px 22px 22px 6px', px: 1.75, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Typography component="h1" sx={{ flex: 1, fontWeight: 800, fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.3, color: garden.indigo }}>{hello}</Typography>
          <IconButton onClick={() => say(hello)} aria-label="Hear Avi" sx={{ bgcolor: garden.indigo, color: '#FFFFFF', '&:hover': { bgcolor: '#1A1638' } }}>
            <VolumeUpRounded />
          </IconButton>
        </Box>
      </Box>

      <ButtonBase
        onClick={() => go(story ? `/stories/${story.id}` : '/stories', story?.title)}
        aria-label={story ? `${story.started ? 'Keep reading' : 'Start a story'}: ${story.title}` : 'Story Time'}
        sx={{ width: '100%', display: 'block', textAlign: 'left', borderRadius: '28px', overflow: 'hidden', bgcolor: garden.indigo, color: garden.cream, mb: 2.25, '&:active': { transform: 'scale(0.99)' }, '&:focus-visible': { outline: `3px solid ${garden.marigold}`, outlineOffset: 3 } }}
      >
        <Box aria-hidden sx={{ height: { xs: 120, md: 150 }, bgcolor: garden.banner, position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
          <Box sx={{ position: 'absolute', width: 52, height: 52, borderRadius: '50%', bgcolor: '#FBE3A4', top: 16, right: 36 }} />
          <Box sx={{ position: 'absolute', left: -40, right: -40, bottom: -50, height: 90, borderRadius: '50%', bgcolor: garden.leaf, opacity: 0.85 }} />
          <Box sx={{ position: 'relative' }}><Illustration emoji={story?.emoji ?? '📖'} size="84px" /></Box>
        </Box>
        <Box sx={{ px: 2.25, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="span" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: garden.banner }}>
              {story?.started ? 'Keep reading' : 'Story Time'}
            </Typography>
            <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.15 }}>
              {story?.title ?? 'Animal stories with maths'}
            </Typography>
            {story?.started && (
              <Box role="progressbar" aria-label="Story progress" aria-valuenow={Math.round(story.progress * 100)} aria-valuemin={0} aria-valuemax={100} sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: garden.indigoSoft }}>
                <Box sx={{ width: `${Math.max(6, story.progress * 100)}%`, height: 8, borderRadius: 4, bgcolor: garden.marigold }} />
              </Box>
            )}
          </Box>
          <Box aria-hidden sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: garden.marigold, color: garden.indigo, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <PlayArrowRounded sx={{ fontSize: 36 }} />
          </Box>
        </Box>
      </ButtonBase>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5, mb: 2 }}>
        <Tile emoji="📖" title="Stories" note="Read and solve" onClick={() => go('/stories', 'Story Time')} />
        <Tile emoji="🔤" title="Letters" note={`${summary.letters} of ${LETTER_TOTAL}`} onClick={() => go('/alphabet', 'Letters')} />
        <Tile emoji="🔢" title="Numbers" note={`${summary.numbers} of ${NUMBER_TOTAL}`} onClick={() => go('/numbers', 'Numbers')} />
        <Tile emoji="🎮" title="Games" note={`${gameTotal} games`} onClick={() => go('/games', 'Games')} />
      </Box>

      <ButtonBase
        onClick={() => go('/daily', 'Daily questions')}
        aria-label={`Today's ${dailyTotal} questions. ${dailyText}`}
        sx={{ width: '100%', justifyContent: 'flex-start', gap: 1.5, px: 2, py: 1.5, mb: 3, borderRadius: '20px', bgcolor: garden.honey, color: garden.indigo, textAlign: 'left', '&:focus-visible': { outline: `3px solid ${garden.indigo}`, outlineOffset: 2 } }}
      >
        <Illustration emoji="🌟" size="34px" />
        <Box sx={{ flex: 1 }}>
          <Typography component="span" sx={{ display: 'block', fontWeight: 800, fontSize: '0.98rem' }}>Today’s {dailyTotal} questions</Typography>
          <Typography component="span" sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: garden.honeyText }}>{dailyText}</Typography>
        </Box>
        <Box aria-hidden sx={{ display: 'flex', gap: 0.5 }}>
          {Array.from({ length: dailyTotal }, (_, i) => (
            <Box key={i} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: i < daily.answered ? garden.terracotta : garden.dot }} />
          ))}
        </Box>
      </ButtonBase>

      <Typography variant="h2" sx={{ fontSize: '1.3rem', mb: 1.25, color: garden.indigo }}>More in the garden</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(6, minmax(0, 1fr))' }, gap: 1.25 }}>
        <Tile small emoji="🦁" title="Animals" note={`${summary.animals} of ${ANIMAL_TOTAL}`} onClick={() => go('/animals', 'Animals')} />
        <Tile small emoji="📚" title="Words" note={`${summary.words} of ${WORD_TOTAL}`} onClick={() => go('/words', 'Words')} />
        <Tile small emoji="⌨️" title="Keys" note="Tap a key" onClick={() => go('/keyboard', 'Keyboard')} />
        <Tile small emoji="🎹" title="Music" note="Play along" onClick={() => go('/music', 'Music')} />
        <Tile small emoji="🦖" title="Dino" note="Run and jump" onClick={() => go('/dino', 'Dino Dash')} />
        <Tile small emoji="🏆" title="Badges" note={`${badges} of ${badgeTotal}`} onClick={() => go('/achievements', 'Badges')} />
      </Box>
    </Page>
  );
}
