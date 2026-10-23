import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  ButtonBase,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MenuRounded, ChevronLeftRounded, CloseRounded } from '@mui/icons-material';
import { startNativeApp } from '../../platform/androidApp';
import { useBackgroundMusic } from '../../app/useBackgroundMusic';
import { sections, sectionFor, type Section, type SectionGroup } from '../../app/sections';
import Mascot from '../ui/Mascot';
import SceneBackground from '../ui/SceneBackground';
import { useWorld } from '../ui/world';
import { colors, fonts } from '../../theme/tokens';
import { useLook } from '../../theme/useLook';
import { lookBarHeight } from '../../theme/looks';
import LookBottomBar from './LookBottomBar';

const DRAWER_WIDTH = 284;
const DRAWER_COLLAPSED = 96;
const BOTTOM_BAR = 74;

const groups: { id: SectionGroup; label: string }[] = [
  { id: 'home', label: '' },
  { id: 'learn', label: 'Learn' },
  { id: 'play', label: 'Play' },
  { id: 'grownups', label: 'Grown-ups' },
];

const bottomPaths = ['/', '/daily', '/games', '/achievements'];

function NavItem({ section, active, collapsed, onClick }: { section: Section; active: boolean; collapsed: boolean; onClick: () => void }) {
  const w = useWorld(section.world);
  const { Icon } = section;
  return (
    <ButtonBase
      onClick={onClick}
      aria-label={section.label}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? section.label : undefined}
      sx={{
        width: '100%',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 1.5,
        px: collapsed ? 0 : 1,
        py: 0.75,
        mb: 0.5,
        minHeight: 56,
        borderRadius: '18px',
        border: '2px solid',
        borderColor: active ? w.main : 'transparent',
        bgcolor: active ? w.tint : 'transparent',
        transition: 'background-color 160ms, border-color 160ms, transform 120ms',
        '&:hover': { bgcolor: active ? w.tint : 'action.hover' },
        '&:active': { transform: 'scale(0.98)' },
        '&:hover .kl-nav-icon': { transform: 'rotate(-8deg) scale(1.06)' },
      }}
    >
      <Box
        className="kl-nav-icon"
        sx={{
          width: 40,
          height: 40,
          borderRadius: '14px',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          bgcolor: active ? w.main : w.tint,
          color: active ? w.onMain : w.text,
          boxShadow: active ? `0 3px 0 ${w.dark}` : 'none',
          transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 160ms',
        }}
      >
        <Icon sx={{ fontSize: 24 }} />
      </Box>
      {!collapsed && (
        <Typography
          component="span"
          sx={{ fontFamily: fonts.display, fontWeight: active ? 600 : 500, fontSize: '1.02rem', color: active ? w.text : 'text.primary', whiteSpace: 'nowrap' }}
        >
          {section.label}
        </Typography>
      )}
    </ButtonBase>
  );
}

function BottomItem({ section, active, onClick }: { section: Section; active: boolean; onClick: () => void }) {
  const w = useWorld(section.world);
  const { Icon } = section;
  return (
    <ButtonBase
      onClick={onClick}
      aria-label={section.label}
      aria-current={active ? 'page' : undefined}
      sx={{ flex: 1, flexDirection: 'column', gap: 0.25, minHeight: 60, borderRadius: '18px' }}
    >
      <Box
        sx={{
          width: 56,
          height: 32,
          borderRadius: '16px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: active ? w.main : 'transparent',
          color: active ? w.onMain : 'text.secondary',
          boxShadow: active ? `0 3px 0 ${w.dark}` : 'none',
          transition: 'background-color 200ms, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: active ? 'translateY(-2px)' : 'none',
        }}
      >
        <Icon sx={{ fontSize: 24 }} />
      </Box>
      <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: '0.76rem', color: active ? w.text : 'text.secondary' }}>
        {section.shortLabel}
      </Typography>
    </ButtonBase>
  );
}

export default function AppLayout() {
  useBackgroundMusic();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dark = theme.palette.mode === 'dark';
  const outline = dark ? colors.darkOutline : theme.palette.divider;
  const current = sectionFor(location.pathname);
  const look = useLook();
  const bottomBar = look.id === 'classic' ? BOTTOM_BAR : lookBarHeight[look.id];

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  useEffect(() => {
    let stop = () => {};
    let cancelled = false;
    void startNativeApp(() => {
      if (location.pathname !== '/') {
        navigate(-1);
        return true;
      }
      return false;
    }).then((cleanup) => {
      if (cancelled) cleanup();
      else stop = cleanup;
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const showCollapsed = collapsed && !isMobile;

  const drawerContent = (
    <Box component="nav" aria-label="Main" sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: showCollapsed ? 'center' : 'space-between', gap: 1 }}>
        {!showCollapsed && (
          <ButtonBase onClick={() => handleNav('/')} aria-label="Kids Learning home" sx={{ gap: 1.25, borderRadius: '16px', p: 0.5, justifyContent: 'flex-start' }}>
            <Mascot size={46} float={false} />
            <Box sx={{ textAlign: 'left' }}>
              <Typography component="span" sx={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.05, color: 'primary.main' }}>
                Kids Learning
              </Typography>
              <Typography component="span" sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'text.secondary' }}>
                & Discovery
              </Typography>
            </Box>
          </ButtonBase>
        )}
        {isMobile ? (
          <IconButton onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <CloseRounded />
          </IconButton>
        ) : (
          <IconButton onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}>
            {collapsed ? <MenuRounded /> : <ChevronLeftRounded />}
          </IconButton>
        )}
      </Box>
      <Box sx={{ flex: 1, px: 1.5, pb: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {groups.map((group) => (
          <Box key={group.id} sx={{ mt: group.label ? 1.5 : 0.5 }}>
            {group.label && !showCollapsed && (
              <Typography sx={{ px: 1.5, mb: 0.75, fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' }}>
                {group.label}
              </Typography>
            )}
            {group.label && showCollapsed && <Box sx={{ mx: 2, mb: 1, borderTop: `2px solid ${outline}` }} />}
            {sections
              .filter((section) => section.group === group.id)
              .map((section) => (
                <NavItem
                  key={section.path}
                  section={section}
                  active={current.path === section.path}
                  collapsed={showCollapsed}
                  onClick={() => handleNav(section.path)}
                />
              ))}
          </Box>
        ))}
      </Box>
    </Box>
  );

  const currentWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      {look.id === 'classic' && <SceneBackground />}

      {isMobile && (
        <Box
          component="header"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            pt: 'env(safe-area-inset-top, 0px)',
            bgcolor: alpha(theme.palette.background.paper, 0.86),
            backdropFilter: 'blur(14px)',
            borderBottom: `2px solid ${outline}`,
          }}
        >
          <Box sx={{ height: 60, display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
            <IconButton onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{ color: 'text.primary' }}>
              <MenuRounded />
            </IconButton>
            <Mascot size={34} float={false} />
            <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.15rem', color: 'primary.main', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {current.path === '/' ? 'Kids Learning' : current.label}
            </Typography>
          </Box>
        </Box>
      )}

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRadius: '0 28px 28px 0',
              pt: 'env(safe-area-inset-top, 0px)',
              pb: 'env(safe-area-inset-bottom, 0px)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: currentWidth,
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
            '& .MuiDrawer-paper': {
              width: currentWidth,
              boxSizing: 'border-box',
              borderRight: `2px solid ${outline}`,
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          minWidth: 0,
          maxWidth: '100%',
          minHeight: '100dvh',
          overflow: 'auto',
          pt: isMobile ? 'calc(62px + env(safe-area-inset-top, 0px))' : 0,
          pb: isMobile ? `calc(${bottomBar + 8}px + env(safe-area-inset-bottom, 0px))` : 'env(safe-area-inset-bottom, 0px)',
          pl: 'env(safe-area-inset-left, 0px)',
          pr: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <Outlet />
      </Box>

      {isMobile && look.id !== 'classic' && (
        <LookBottomBar look={look.id} currentPath={current.path} onNav={handleNav} onMore={() => setMobileOpen(true)} />
      )}

      {isMobile && look.id === 'classic' && (
        <Box
          component="nav"
          aria-label="Quick links"
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar,
            pb: 'env(safe-area-inset-bottom, 0px)',
            bgcolor: alpha(theme.palette.background.paper, 0.92),
            backdropFilter: 'blur(14px)',
            borderTop: `2px solid ${outline}`,
          }}
        >
          <Box sx={{ height: BOTTOM_BAR, display: 'flex', alignItems: 'center', px: 0.5 }}>
            {bottomPaths.map((path) => (
              <BottomItem key={path} section={sectionFor(path)} active={current.path === path} onClick={() => handleNav(path)} />
            ))}
            <ButtonBase
              onClick={() => setMobileOpen(true)}
              aria-label="More places"
              sx={{ flex: 1, flexDirection: 'column', gap: 0.25, minHeight: 60, borderRadius: '18px' }}
            >
              <Box sx={{ width: 56, height: 32, borderRadius: '16px', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                <MenuRounded sx={{ fontSize: 24 }} />
              </Box>
              <Typography component="span" sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: '0.76rem', color: 'text.secondary' }}>
                More
              </Typography>
            </ButtonBase>
          </Box>
        </Box>
      )}
    </Box>
  );
}
