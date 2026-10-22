import { Box } from '@mui/material';

/** Announces game feedback to screen readers without showing it twice on screen. */
export default function ScreenReaderStatus({ message }: { message: string }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
    >
      {message}
    </Box>
  );
}
