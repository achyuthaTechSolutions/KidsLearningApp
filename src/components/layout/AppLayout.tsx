import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  Typography,
  AppBar,
  Toolbar,
} from '@mui/material';
import { startNativeApp } from '../../platform/androidApp';
import {
  Home as HomeIcon,
  Keyboard as KeyboardIcon,
  AbcOutlined as AlphabetIcon,
  Numbers as NumbersIcon,
  Pets as AnimalsIcon,
  MenuBook as WordsIcon,
  MusicNote as MusicIcon,
  SportsEsports as GamesIcon,
  EmojiEvents as AchievementsIcon,
  Star as DailyIcon,
  Settings as SettingsIcon,
  Policy as PrivacyIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

const navItems = [
  { path: '/', label: 'Home', icon: <HomeIcon /> },
  { path: '/daily', label: 'Daily Challenge', icon: <DailyIcon /> },
  { path: '/keyboard', label: 'Keyboard Explorer', icon: <KeyboardIcon /> },
  { path: '/alphabet', label: 'Alphabet World', icon: <AlphabetIcon /> },
  { path: '/numbers', label: 'Number World', icon: <NumbersIcon /> },
  { path: '/animals', label: 'Animal Kingdom', icon: <AnimalsIcon /> },
  { path: '/words', label: 'My First Words', icon: <WordsIcon /> },
  { path: '/music', label: 'Music Studio', icon: <MusicIcon /> },
  { path: '/games', label: 'Learning Games', icon: <GamesIcon /> },
  { path: '/achievements', label: 'My Achievements', icon: <AchievementsIcon /> },
  { path: '/settings', label: 'Parent Settings', icon: <SettingsIcon /> },
  { path: '/privacy', label: 'Privacy', icon: <PrivacyIcon /> },
];

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.1rem' }}>
            Kids Learning
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={() => setCollapsed(!collapsed)} size="small" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}>
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>
      <List sx={{ flex: 1, px: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNav(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'flex-start',
                bgcolor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isActive ? 'primary.dark' : 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 40,
                  color: isActive ? 'primary.contrastText' : 'primary.main',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' } } }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  const currentWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            pt: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{ color: 'text.primary' }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', ml: 1 }}>
              Kids Learning
            </Typography>
          </Toolbar>
        </AppBar>
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
            '& .MuiDrawer-paper': {
              width: currentWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
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
          flexGrow: 1,
          minWidth: 0,
          maxWidth: '100%',
          minHeight: '100vh',
          overflow: 'auto',
          pt: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : 0,
          pb: 'env(safe-area-inset-bottom, 0px)',
          pl: 'env(safe-area-inset-left, 0px)',
          pr: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
