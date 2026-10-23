import { Box, ButtonBase, Typography } from '@mui/material';
import { EmojiEventsRounded, PlayArrowRounded } from '@mui/icons-material';
import Page from '../../../components/ui/Page';
import Mascot from '../../../components/ui/Mascot';
import Illustration from '../../../components/ui/Illustration';
import { map } from '../../../theme/looks';
import { fonts } from '../../../theme/tokens';
import { useHomeData } from '../useHomeData';
import { islandFor, islands } from './lookStyles';

const places = [
  { name: 'Animal Jungle', emoji: '🦁', path: '/animals' },
  { name: 'Word Woods', emoji: '📚', path: '/words' },
  { name: 'Music Reef', emoji: '🎹', path: '/music' },
  { name: 'Keyboard Cave', emoji: '⌨️', path: '/keyboard' },
  { name: 'Dino Valley', emoji: '🦖', path: '/dino' },
  { name: 'Badge Tower', emoji: '🏆', path: '/achievements' },
];

/** Keeps a label centred on its island without spilling off a narrow phone. */
const clampLeft = (x: number) => `clamp(72px, ${x}%, calc(100% - 72px))`;

/** Adventure Map Home: islands on the sea, Avi where the child is, and today's trip. */
export default function MapHome() {
  const { progress, daily, badges, go } = useHomeData();
  const here = islands.find((island) => island.id === islandFor(progress.lastActivity)) ?? islands[0];
  const next = islands[(islands.indexOf(here) + 1) % islands.length];
  const trip = daily.completed
    ? { text: `Next stop: ${next.name}`, stops: 1, path: next.path, spoken: next.name }
    : { text: `Today’s questions, then ${next.name}`, stops: 2, path: '/daily', spoken: 'Today’s questions' };

  return (
    <Page maxWidth={760}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography component="h1" sx={{ fontFamily: fonts.display, fontWeight: 800, fontSize: { xs: '1.6rem', md: '2rem' }, color: map.deep }}>Avi’s map</Typography>
        <ButtonBase onClick={() => go('/achievements', 'Badges')} aria-label={`${badges} badges`} sx={{ bgcolor: map.cream, borderRadius: '22px', px: 1.75, py: 1, gap: 1, color: map.deep, fontFamily: fonts.display, fontSize: '1.1rem' }}>
          <EmojiEventsRounded sx={{ color: map.gold }} />{badges} badges
        </ButtonBase>
      </Box>

      <Box sx={{ position: 'relative', width: '100%', maxWidth: 560, mx: 'auto', aspectRatio: '390 / 540' }}>
        <Box component="svg" viewBox="0 100 390 540" aria-hidden sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M0 120 q40 -10 80 0 t80 0 t80 0 t80 0 t80 0" stroke={map.wave} strokeWidth="3" fill="none" />
          <path d="M0 420 q40 -10 80 0 t80 0 t80 0 t80 0 t80 0" stroke={map.wave} strokeWidth="3" fill="none" />
          <path d="M30 210 C10 160 120 130 170 170 C220 210 150 270 90 262 C40 256 46 240 30 210 Z" fill={map.sand} />
          <path d="M232 300 C220 250 350 240 368 296 C382 344 300 372 262 352 C238 340 236 322 232 300 Z" fill={map.sand} />
          <path d="M40 470 C30 420 150 400 180 450 C204 494 120 536 80 520 C50 508 46 494 40 470 Z" fill={map.sand} />
          <path d="M220 560 C214 510 352 500 360 560 C366 610 280 630 246 612 C226 600 224 582 220 560 Z" fill={map.sand} />
          <path d="M110 220 C180 250 230 270 290 300 M290 310 C230 380 170 420 120 470 M120 480 C170 520 230 550 280 570" stroke={map.deep} strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" fill="none" />
          <path d="M60 220 l10 -28 l10 28 z" fill={map.green} />
          <path d="M78 226 l8 -22 l8 22 z" fill={map.greenDark} />
          <path d="M300 330 l0 -30 l22 10 l-22 10" fill={map.orange} stroke={map.deep} strokeWidth="2" />
          <circle cx="96" cy="482" r="12" fill={map.green} />
          <circle cx="114" cy="476" r="9" fill={map.greenDark} />
          <rect x="280" y="560" width="30" height="20" rx="4" fill={map.orange} stroke={map.deep} strokeWidth="2" />
        </Box>

        <Box sx={{ position: 'absolute', left: clampLeft(here.x), top: `${here.y - 14}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
          <Mascot size={72} wave label={`Avi the little elephant, at ${here.name}`} />
        </Box>

        {islands.map((island) => (
          <ButtonBase
            key={island.id}
            onClick={() => go(island.path, island.name)}
            aria-label={island.name}
            sx={{
              position: 'absolute',
              left: clampLeft(island.x),
              top: `${island.y}%`,
              transform: 'translate(-50%, -50%)',
              bgcolor: map.cream,
              border: `3px solid ${map.deep}`,
              borderRadius: '20px',
              px: 1.25,
              py: 0.75,
              gap: 0.75,
              whiteSpace: 'nowrap',
              color: map.deep,
              '&:active': { transform: 'translate(-50%, -50%) scale(0.96)' },
              '&:focus-visible': { outline: `4px solid ${map.orange}`, outlineOffset: 2 },
            }}
          >
            <Illustration emoji={island.emoji} size="26px" />
            <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 800, fontSize: { xs: '1rem', sm: '1.15rem' } }}>{island.name}</Typography>
          </ButtonBase>
        ))}
      </Box>

      <ButtonBase
        onClick={() => go(trip.path, trip.spoken)}
        aria-label={`Today's trip with Avi. ${trip.text}`}
        sx={{ width: '100%', mt: 2, mb: 2.5, bgcolor: map.cream, border: `3px solid ${map.deep}`, borderRadius: '26px', p: 1.75, gap: 1.5, justifyContent: 'flex-start', textAlign: 'left', color: map.deep, '&:focus-visible': { outline: `4px solid ${map.orange}`, outlineOffset: 2 } }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.1 }}>Today’s trip with Avi</Typography>
          <Typography component="span" sx={{ display: 'block', fontSize: '0.9rem', mt: 0.25 }}>{trip.text} · {trip.stops} {trip.stops === 1 ? 'stop' : 'stops'}</Typography>
        </Box>
        <Box aria-hidden sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: map.orange, border: `3px solid ${map.deep}`, color: map.deep, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <PlayArrowRounded sx={{ fontSize: 32 }} />
        </Box>
      </ButtonBase>

      <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 1.25, color: map.deep }}>More places to explore</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25 }}>
        {places.map((place) => (
          <ButtonBase
            key={place.path}
            onClick={() => go(place.path, place.name)}
            aria-label={place.name}
            sx={{ bgcolor: map.cream, border: `3px solid ${map.deep}`, borderRadius: '18px', px: 1.25, py: 1, gap: 1, justifyContent: 'flex-start', color: map.deep, minHeight: 56, '&:focus-visible': { outline: `4px solid ${map.orange}`, outlineOffset: 2 } }}
          >
            <Illustration emoji={place.emoji} size="30px" />
            <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 800, fontSize: '1rem', lineHeight: 1.1, textAlign: 'left' }}>{place.name}</Typography>
          </ButtonBase>
        ))}
      </Box>
    </Page>
  );
}
