import { useState } from 'react';
import { Box, ButtonBase, IconButton, Typography } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import Page from '../../../components/ui/Page';
import Illustration from '../../../components/ui/Illustration';
import { map } from '../../../theme/looks';
import { fonts } from '../../../theme/tokens';
import { filterItems, type HubItem, type Topic } from './hubData';

interface Props {
  items: HubItem[];
  onOpen: (item: HubItem) => void;
  onBack: () => void;
}

const parts: { id: Topic | 'all'; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'letters', label: 'Letter Hill' },
  { id: 'numbers', label: 'Number Bay' },
  { id: 'think', label: 'Puzzle Peak' },
  { id: 'explore', label: 'Explorer Reef' },
];

const ROW = 116;
/** Stops zigzag down the island: left, right, left… */
const xOf = (index: number) => (index % 2 === 0 ? 22 : 78);

/** Adventure Map Games: every game is a stop on a trail. Done, next stop, or not tried yet. */
export default function MapGames({ items, onOpen, onBack }: Props) {
  const [part, setPart] = useState<Topic | 'all'>('all');
  const shown = filterItems(items, part);
  const next = shown.findIndex((item) => !item.played);
  const points = shown.map((_, index) => `${xOf(index)},${index * ROW + ROW / 2}`).join(' ');

  return (
    <Page maxWidth={720}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
        <IconButton onClick={onBack} aria-label="Back to the map" sx={{ bgcolor: map.cream, color: map.deep, '&:hover': { bgcolor: '#FFFFFF' } }}>
          <ArrowBackRounded />
        </IconButton>
        <Typography variant="h1" sx={{ flex: 1, fontSize: { xs: '1.8rem', md: '2.2rem' }, fontWeight: 800, color: map.deep }}>Game Island</Typography>
      </Box>

      <Box role="group" aria-label="Part of the island" sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 0.5, mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, scrollbarWidth: 'none' }}>
        {parts.map((item) => {
          const on = part === item.id;
          return (
            <ButtonBase
              key={item.id}
              aria-pressed={on}
              onClick={() => setPart(item.id)}
              sx={{ flexShrink: 0, minHeight: 44, px: 1.75, borderRadius: '22px', border: `3px solid ${map.deep}`, bgcolor: on ? map.deep : map.cream, color: on ? map.cream : map.deep, fontWeight: 600, fontSize: '0.9rem' }}
            >
              {item.label}
            </ButtonBase>
          );
        })}
      </Box>

      <Box component="ol" aria-label="Game trail" sx={{ position: 'relative', listStyle: 'none', m: 0, p: 0, height: shown.length * ROW, borderRadius: '28px', bgcolor: map.sand }}>
        <Box component="svg" aria-hidden viewBox={`0 0 100 ${shown.length * ROW}`} preserveAspectRatio="none" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <polyline points={points} fill="none" stroke={map.deep} strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </Box>
        {shown.map((item, index) => {
          const isNext = index === next;
          const left = index % 2 === 0;
          const size = isNext ? 92 : 72;
          const state = item.played ? `Done · ${item.status}` : isNext ? 'Next stop' : 'Not tried yet';
          return (
            <Box component="li" key={item.key} sx={{ position: 'absolute', left: 0, right: 0, top: index * ROW, height: ROW }}>
              <ButtonBase
                onClick={() => onOpen(item)}
                aria-label={`${item.title}. ${state}`}
                sx={{ position: 'absolute', inset: 0, borderRadius: '24px', '&:focus-visible': { outline: `4px solid ${map.orange}`, outlineOffset: -4 } }}
              >
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    left: `${xOf(index)}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: item.played ? map.green : isNext ? map.orange : map.cream,
                    border: `${isNext ? 5 : 4}px ${item.played || isNext ? 'solid' : 'dashed'} ${map.deep}`,
                    boxShadow: isNext ? `0 0 0 7px ${map.cream}` : 'none',
                  }}
                >
                  <Illustration emoji={item.emoji} size={isNext ? '52px' : '40px'} />
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    ...(left ? { left: `calc(${xOf(index)}% + ${size / 2 + 10}px)`, right: 12, textAlign: 'left' } : { right: `calc(${100 - xOf(index)}% + ${size / 2 + 10}px)`, left: 12, textAlign: 'right' }),
                  }}
                >
                  <Box sx={{ display: 'inline-block', bgcolor: map.cream, border: isNext ? `3px solid ${map.deep}` : 'none', borderRadius: '14px', px: 1.25, py: 0.75, color: map.deep }}>
                    {isNext && <Typography component="span" sx={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: map.rust }}>NEXT STOP</Typography>}
                    <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 800, fontSize: isNext ? '1.15rem' : '1rem', lineHeight: 1.1 }}>{item.title}</Typography>
                    {!isNext && <Typography component="span" sx={{ display: 'block', fontSize: '0.78rem' }}>{item.played ? `Done · ${item.status}` : 'Not tried yet'}</Typography>}
                  </Box>
                </Box>
              </ButtonBase>
            </Box>
          );
        })}
      </Box>
    </Page>
  );
}
