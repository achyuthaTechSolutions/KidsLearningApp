import { Box, Button } from '@mui/material';
import { FlagRounded } from '@mui/icons-material';
import { useWorld } from '../../components/ui/world';
import type { WorldKey } from '../../theme/tokens';

/** The current endless level, and a Finish button: the game never ends by itself. */
export default function EndlessControls({ level, world, onFinish }: { level: number; world: WorldKey; onFinish: () => void }) {
  const w = useWorld(world);
  return (
    <>
      <Box data-testid="game-level" sx={{ px: 1.75, py: 0.75, borderRadius: '999px', bgcolor: w.tint, color: w.text, fontWeight: 900, fontSize: '1.1rem', border: `2px solid ${w.main}` }}>
        Level {level}
      </Box>
      <Button variant="outlined" startIcon={<FlagRounded />} onClick={onFinish}>Finish</Button>
    </>
  );
}
