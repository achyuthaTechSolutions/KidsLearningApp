import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { AutoStoriesRounded, EmojiEventsRounded, HomeRounded, LockRounded, MapRounded, MenuRounded, SportsEsportsRounded } from '@mui/icons-material';
import type { AppLook } from '../../types';
import { blocks, garden, lookBarHeight, map } from '../../theme/looks';
import { fonts } from '../../theme/tokens';

interface Item {
  path: string;
  label: string;
  Icon: SvgIconComponent;
}

const items: Record<Exclude<AppLook, 'classic'>, Item[]> = {
  garden: [
    { path: '/', label: 'Home', Icon: HomeRounded },
    { path: '/stories', label: 'Stories', Icon: AutoStoriesRounded },
    { path: '/games', label: 'Play', Icon: SportsEsportsRounded },
    { path: '/achievements', label: 'Stars', Icon: EmojiEventsRounded },
  ],
  blocks: [
    { path: '/', label: 'Home', Icon: HomeRounded },
    { path: '/stories', label: 'Stories', Icon: AutoStoriesRounded },
    { path: '/games', label: 'Games', Icon: SportsEsportsRounded },
  ],
  map: [
    { path: '/', label: 'Map', Icon: MapRounded },
    { path: '/stories', label: 'Stories', Icon: AutoStoriesRounded },
    { path: '/games', label: 'Games', Icon: SportsEsportsRounded },
    { path: '/achievements', label: 'Badges', Icon: EmojiEventsRounded },
  ],
};


const HOLD_MS = 1000;

/**
 * Bright Blocks keeps grown-ups' settings behind a lock: press and hold to open it,
 * so a tap by a small child does nothing but show a hint. A keyboard opens it at once.
 */
function GrownUpsLock({ onOpen }: { onOpen: () => void }) {
  const timer = useRef<number | undefined>(undefined);
  const [hint, setHint] = useState(false);
  const [holding, setHolding] = useState(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!hint) return undefined;
    const id = window.setTimeout(() => setHint(false), 2200);
    return () => window.clearTimeout(id);
  }, [hint]);

  const cancel = () => {
    window.clearTimeout(timer.current);
    setHolding(false);
  };

  return (
    <Box sx={{ position: 'relative', justifySelf: 'center' }}>
      {hint && (
        <Box role="status" sx={{ position: 'absolute', bottom: 66, right: -8, whiteSpace: 'nowrap', bgcolor: '#FFFFFF', color: blocks.ink, border: `3px solid ${blocks.ink}`, borderRadius: '16px', px: 1.5, py: 0.75, fontWeight: 800, fontSize: '0.85rem' }}>
          Grown-ups: press and hold
        </Box>
      )}
      <ButtonBase
        aria-label="Grown-ups (press and hold to open)"
        onPointerDown={() => {
          setHolding(true);
          timer.current = window.setTimeout(() => {
            setHolding(false);
            onOpen();
          }, HOLD_MS);
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          // A keyboard press has no pointer: open straight away. A short tap shows the hint.
          if (event.detail === 0) onOpen();
          else if (!holding) setHint(true);
        }}
        sx={{ width: 64, height: 56, borderRadius: '28px', color: '#FFFFFF', position: 'relative', overflow: 'hidden' }}
      >
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, bgcolor: blocks.yellow, opacity: 0.35, transformOrigin: 'left', transform: holding ? 'scaleX(1)' : 'scaleX(0)', transition: holding ? `transform ${HOLD_MS}ms linear` : 'none' }} />
        <LockRounded sx={{ fontSize: 28, position: 'relative' }} />
      </ButtonBase>
    </Box>
  );
}

interface BarColours {
  text: string;
  activeText: string;
  activeIcon: string;
  pill: string;
}

function BarButton({ label, spoken, active, colours, onClick, children }: { label: string; spoken?: string; active: boolean; colours: BarColours; onClick: () => void; children: ReactNode }) {
  return (
    <ButtonBase onClick={onClick} aria-label={spoken ?? label} aria-current={active ? 'page' : undefined} sx={{ flexDirection: 'column', gap: 0.25, minHeight: 60, borderRadius: '18px' }}>
      <Box sx={{ width: 56, height: 32, borderRadius: '16px', display: 'grid', placeItems: 'center', bgcolor: active ? colours.pill : 'transparent', color: active ? colours.activeIcon : colours.text }}>
        {children}
      </Box>
      <Typography component="span" sx={{ fontFamily: fonts.body, fontWeight: 800, fontSize: '0.78rem', color: active ? colours.activeText : colours.text }}>{label}</Typography>
    </ButtonBase>
  );
}

interface Props {
  look: Exclude<AppLook, 'classic'>;
  currentPath: string;
  onNav: (path: string) => void;
  onMore: () => void;
}

/** The phone's bottom menu in the Storybook Garden, Bright Blocks, and Adventure Map looks. */
export default function LookBottomBar({ look, currentPath, onNav, onMore }: Props) {
  const list = items[look];

  if (look === 'blocks') {
    return (
      <Box component="nav" aria-label="Quick links" sx={{ position: 'fixed', left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', zIndex: 1100 }}>
        <Box sx={{ height: 72, borderRadius: '36px', bgcolor: blocks.ink, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', alignItems: 'center', px: 0.75 }}>
          {list.map(({ path, label, Icon }) => {
            const active = currentPath === path;
            return (
              <ButtonBase key={path} onClick={() => onNav(path)} aria-label={label} aria-current={active ? 'page' : undefined} sx={{ justifySelf: 'center', width: 64, height: 56, borderRadius: '28px', bgcolor: active ? blocks.yellow : 'transparent', color: active ? blocks.ink : '#FFFFFF' }}>
                <Icon sx={{ fontSize: 30 }} />
              </ButtonBase>
            );
          })}
          <ButtonBase onClick={onMore} aria-label="More places" sx={{ justifySelf: 'center', width: 64, height: 56, borderRadius: '28px', color: '#FFFFFF' }}>
            <MenuRounded sx={{ fontSize: 30 }} />
          </ButtonBase>
          <GrownUpsLock onOpen={() => onNav('/settings')} />
        </Box>
      </Box>
    );
  }

  const isMap = look === 'map';
  const colours = isMap
    ? { bar: map.deep, text: map.mist, activeText: map.cream, activeIcon: map.gold, pill: 'transparent', border: 'none' }
    : { bar: '#FFFFFF', text: garden.muted, activeText: garden.indigo, activeIcon: garden.indigo, pill: garden.sand, border: `2px solid #EFE4CE` };

  return (
    <Box
      component="nav"
      aria-label="Quick links"
      sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1100, pb: 'env(safe-area-inset-bottom, 0px)', bgcolor: colours.bar, borderTop: colours.border, borderRadius: isMap ? '28px 28px 0 0' : 0 }}
    >
      <Box sx={{ height: lookBarHeight[look], display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', alignItems: 'center', px: 0.5 }}>
        {list.map(({ path, label, Icon }) => (
          <BarButton key={path} label={label} active={currentPath === path} colours={colours} onClick={() => onNav(path)}>
            <Icon sx={{ fontSize: 24 }} />
          </BarButton>
        ))}
        <BarButton label="More" spoken="More places" active={false} colours={colours} onClick={onMore}>
          <MenuRounded sx={{ fontSize: 24 }} />
        </BarButton>
      </Box>
    </Box>
  );
}
