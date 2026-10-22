import { Box, Typography } from '@mui/material';
import Mascot from '../../components/ui/Mascot';

/** Shown for a moment while a game's code loads, so the screen is never blank. */
export default function GameLoading() {
  return (
    <Box role="status" sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center', alignContent: 'center', gap: 1.5 }}>
      <Mascot size={110} mood="think" />
      <Typography sx={{ fontWeight: 800, fontSize: '1.2rem' }}>Getting the game ready…</Typography>
    </Box>
  );
}
