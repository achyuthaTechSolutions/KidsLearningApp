import { Box, ButtonBase, IconButton, Typography } from '@mui/material';
import { PlayArrowRounded, StarRounded, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../../components/ui/Page';
import Mascot from '../../../components/ui/Mascot';
import Illustration from '../../../components/ui/Illustration';
import { blocks } from '../../../theme/looks';
import { fonts } from '../../../theme/tokens';
import { useHomeData, useStoryPick } from '../useHomeData';
import { blockSx } from './lookStyles';

function BigBlock({ emoji, word, bg, onClick, height = 160 }: { emoji: string; word: string; bg: string; onClick: () => void; height?: number }) {
  return (
    <ButtonBase onClick={onClick} aria-label={word} sx={{ ...blockSx(bg), height, p: 1.75, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Illustration emoji={emoji} size={height >= 140 ? '64px' : '44px'} />
      <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: height >= 140 ? '1.65rem' : '1.2rem', lineHeight: 1 }}>{word}</Typography>
    </ButtonBase>
  );
}

/** Bright Blocks Home: four huge one-word blocks a child can find by colour and picture alone. */
export default function BlocksHome() {
  const { daily, dailyText, dailyTotal, say, go } = useHomeData();
  const story = useStoryPick();
  const hello = "Hi, I'm Avi! Tap a big block to play.";

  return (
    <Page maxWidth={760}>
      <Box sx={{ ...blockSx(blocks.blue), borderRadius: '28px', color: '#FFFFFF', p: 2, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, '&:active': undefined }}>
        <Mascot size={88} wave label="Avi waving hello" />
        <Box sx={{ flex: 1 }}>
          <Typography component="h1" sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.1rem' }, lineHeight: 1 }}>Hi, I’m Avi!</Typography>
          <Typography sx={{ fontWeight: 800, mt: 0.5 }}>Tap a big block to play.</Typography>
        </Box>
        <IconButton onClick={() => say(hello)} aria-label="Hear Avi" sx={{ width: 56, height: 56, bgcolor: '#FFFFFF', color: blocks.ink, border: `3px solid ${blocks.ink}`, '&:hover': { bgcolor: blocks.butter } }}>
          <VolumeUpRounded />
        </IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1.75, mb: 2.5 }}>
        <BigBlock emoji="📖" word="Stories" bg={blocks.coral} onClick={() => go('/stories', 'Stories')} />
        <BigBlock emoji="🔤" word="Letters" bg={blocks.green} onClick={() => go('/alphabet', 'Letters')} />
        <BigBlock emoji="🔢" word="Numbers" bg={blocks.yellow} onClick={() => go('/numbers', 'Numbers')} />
        <BigBlock emoji="🎮" word="Games" bg={blocks.purple} onClick={() => go('/games', 'Games')} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75, mb: 2.5 }}>
        <ButtonBase
          onClick={() => go(story ? `/stories/${story.id}` : '/stories', story?.title)}
          aria-label={story ? `${story.started ? 'Keep going' : 'New story'}: ${story.title}` : 'Story Time'}
          sx={{ ...blockSx('#FFFFFF'), borderRadius: '24px', p: 1.5, gap: 1.5, justifyContent: 'flex-start', textAlign: 'left' }}
        >
          <Illustration emoji={story?.emoji ?? '📖'} size="56px" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="span" sx={{ display: 'block', fontWeight: 900, fontSize: '0.8rem', color: blocks.blue, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{story?.started ? 'Keep going' : 'New story'}</Typography>
            <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 600, fontSize: '1.15rem', lineHeight: 1.1 }}>{story?.title ?? 'Story Time'}</Typography>
            <Box role="progressbar" aria-label="Story progress" aria-valuenow={Math.round((story?.progress ?? 0) * 100)} aria-valuemin={0} aria-valuemax={100} sx={{ mt: 0.75, height: 12, borderRadius: 6, border: `2px solid ${blocks.ink}`, bgcolor: blocks.paper, overflow: 'hidden' }}>
              <Box sx={{ width: `${(story?.progress ?? 0) * 100}%`, height: '100%', bgcolor: blocks.blue }} />
            </Box>
          </Box>
          <Box aria-hidden sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: blocks.ink, color: '#FFFFFF', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <PlayArrowRounded sx={{ fontSize: 30 }} />
          </Box>
        </ButtonBase>

        <ButtonBase
          onClick={() => go('/daily', 'Daily questions')}
          aria-label={`Today's ${dailyTotal} questions. ${dailyText}`}
          sx={{ ...blockSx(blocks.butter), borderRadius: '24px', p: 1.5, gap: 1.5, justifyContent: 'flex-start', textAlign: 'left' }}
        >
          <Illustration emoji="🌟" size="56px" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.1 }}>Today</Typography>
            <Box aria-hidden sx={{ display: 'flex', gap: 0.25, mt: 0.5 }}>
              {Array.from({ length: dailyTotal }, (_, i) => (
                <StarRounded key={i} sx={{ fontSize: 30, color: i < daily.answered ? blocks.ink : '#FFFFFF', stroke: blocks.ink, strokeWidth: 1.5 }} />
              ))}
            </Box>
          </Box>
        </ButtonBase>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(6, minmax(0, 1fr))' }, gap: 1.5 }}>
        <BigBlock height={112} emoji="🦁" word="Animals" bg={blocks.peach} onClick={() => go('/animals', 'Animals')} />
        <BigBlock height={112} emoji="📚" word="Words" bg={blocks.mint} onClick={() => go('/words', 'Words')} />
        <BigBlock height={112} emoji="🎹" word="Music" bg={blocks.sky} onClick={() => go('/music', 'Music')} />
        <BigBlock height={112} emoji="⌨️" word="Keys" bg={blocks.lilac} onClick={() => go('/keyboard', 'Keyboard')} />
        <BigBlock height={112} emoji="🦖" word="Dino" bg={blocks.butter} onClick={() => go('/dino', 'Dino Dash')} />
        <BigBlock height={112} emoji="🏆" word="Badges" bg={blocks.yellow} onClick={() => go('/achievements', 'Badges')} />
      </Box>
    </Page>
  );
}
