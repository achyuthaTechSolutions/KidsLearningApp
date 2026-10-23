import { useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { EmojiEventsRounded } from '@mui/icons-material';
import Page from '../../../components/ui/Page';
import Illustration from '../../../components/ui/Illustration';
import { blocks } from '../../../theme/looks';
import { fonts } from '../../../theme/tokens';
import { blockSx } from '../../home/looks/lookStyles';
import { filterItems, topics, type HubItem, type Topic } from './hubData';

interface Props {
  items: HubItem[];
  badges: number;
  onOpen: (item: HubItem) => void;
}

const colours = [blocks.sky, blocks.butter, blocks.mint, blocks.peach, blocks.lilac];

/** Bright Blocks Games: big picture blocks with one word each, and picture filters. */
export default function BlocksGames({ items, badges, onOpen }: Props) {
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const shown = filterItems(items, topic);

  return (
    <Page maxWidth={860}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.4rem' } }}>Games</Typography>
        <Box role="img" aria-label={`${badges} badges earned`} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, border: `3px solid ${blocks.ink}`, borderRadius: '22px', bgcolor: blocks.yellow, px: 1.5, py: 0.5, fontFamily: fonts.display, fontWeight: 700, fontSize: '1.15rem' }}>
          <EmojiEventsRounded />{badges}
        </Box>
      </Box>

      <Box role="group" aria-label="Kind of game" sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 1, mb: 2.5 }}>
        {topics.map((item) => {
          const on = topic === item.id;
          return (
            <ButtonBase
              key={item.id}
              aria-pressed={on}
              aria-label={item.label}
              onClick={() => setTopic(item.id)}
              sx={{ height: 68, flexDirection: 'column', gap: 0.25, borderRadius: '20px', border: `3px solid ${blocks.ink}`, bgcolor: on ? blocks.ink : '#FFFFFF', color: on ? '#FFFFFF' : blocks.ink, fontFamily: fonts.display, fontWeight: 600, fontSize: '0.82rem' }}
            >
              <Illustration emoji={item.emoji} size="26px" />
              {item.label}
            </ButtonBase>
          );
        })}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.75 }}>
        {shown.map((item, index) => (
          <ButtonBase
            key={item.key}
            onClick={() => onOpen(item)}
            aria-label={`${item.title}. ${item.status}`}
            sx={{ ...blockSx(colours[index % colours.length], 4), borderRadius: '24px', height: 150, p: 1.5, position: 'relative', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', textAlign: 'left' }}
          >
            {!item.played && (
              <Box component="span" sx={{ position: 'absolute', top: 10, right: 10, bgcolor: blocks.ink, color: '#FFFFFF', fontWeight: 900, fontSize: '0.75rem', borderRadius: '10px', px: 1, py: 0.25 }}>NEW</Box>
            )}
            <Illustration emoji={item.emoji} size="58px" />
            <Box>
              <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: '1.3rem', lineHeight: 1 }}>{item.short}</Typography>
              {item.played && <Typography component="span" sx={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', mt: 0.5 }}>{item.status}</Typography>}
            </Box>
          </ButtonBase>
        ))}
      </Box>
    </Page>
  );
}
