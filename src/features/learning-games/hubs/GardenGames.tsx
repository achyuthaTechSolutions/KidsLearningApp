import { useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { PlayArrowRounded } from '@mui/icons-material';
import Page from '../../../components/ui/Page';
import Mascot from '../../../components/ui/Mascot';
import Illustration from '../../../components/ui/Illustration';
import { garden } from '../../../theme/looks';
import { fonts } from '../../../theme/tokens';
import { aviPick, filterItems, topics, type HubItem, type Topic } from './hubData';

interface Props {
  items: HubItem[];
  onOpen: (item: HubItem) => void;
}

/** Storybook Garden Games: Avi's pick for today, then every game as a small picture tile. */
export default function GardenGames({ items, onOpen }: Props) {
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const shown = filterItems(items, topic);
  const pick = aviPick(items);

  return (
    <Page maxWidth={860}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, fontWeight: 800, color: garden.indigo }}>Let’s play</Typography>
          <Typography sx={{ fontWeight: 700, color: garden.muted }}>Avi picked one for you below</Typography>
        </Box>
        <Mascot size={64} mood="think" float={false} />
      </Box>

      <Box role="group" aria-label="Filter games" sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 0.5, mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, scrollbarWidth: 'none' }}>
        {topics.map((item) => {
          const on = topic === item.id;
          return (
            <ButtonBase
              key={item.id}
              aria-pressed={on}
              onClick={() => setTopic(item.id)}
              sx={{ flexShrink: 0, minHeight: 44, px: 2, borderRadius: '22px', fontWeight: 800, fontSize: '0.92rem', bgcolor: on ? garden.indigo : '#FFFFFF', color: on ? garden.cream : garden.indigo, border: `2px solid ${on ? garden.indigo : garden.border}` }}
            >
              {item.label}
            </ButtonBase>
          );
        })}
      </Box>

      {topic === 'all' && (
        <ButtonBase
          onClick={() => onOpen(pick)}
          aria-label={`Avi's pick for today: ${pick.title}`}
          sx={{ width: '100%', mb: 2, p: 2, gap: 1.75, borderRadius: '26px', bgcolor: garden.leafDark, color: garden.cream, justifyContent: 'flex-start', textAlign: 'left', '&:focus-visible': { outline: `3px solid ${garden.indigo}`, outlineOffset: 2 } }}
        >
          <Illustration emoji={pick.emoji} size="56px" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="span" sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#FFFFFF' }}>Avi’s pick for today</Typography>
            <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.1 }}>{pick.title}</Typography>
            <Typography component="span" sx={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: garden.leafSoft }}>{pick.description}</Typography>
          </Box>
          <Box aria-hidden sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: garden.cream, color: garden.leafDark, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <PlayArrowRounded sx={{ fontSize: 30 }} />
          </Box>
        </ButtonBase>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.25 }}>
        {shown.map((item) => (
          <ButtonBase
            key={item.key}
            onClick={() => onOpen(item)}
            aria-label={`${item.title}. ${item.status}`}
            sx={{ flexDirection: 'column', gap: 0.75, p: 1.25, minHeight: 124, borderRadius: '22px', bgcolor: '#FFFFFF', border: `2px solid ${garden.border}`, color: garden.indigo, textAlign: 'center', '&:hover': { borderColor: garden.marigold }, '&:focus-visible': { outline: `3px solid ${garden.indigo}`, outlineOffset: 2 } }}
          >
            <Illustration emoji={item.emoji} size="44px" />
            <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.15 }}>{item.title}</Typography>
            <Typography
              component="span"
              sx={item.played
                ? { fontSize: '0.75rem', fontWeight: 800, color: garden.leafDark }
                : { fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', bgcolor: garden.terracotta, borderRadius: '8px', px: 0.75 }}
            >
              {item.status}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Page>
  );
}
