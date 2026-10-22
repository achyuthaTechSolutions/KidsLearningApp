import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  maxWidth?: number;
}

export default function Page({ children, maxWidth = 1120 }: Props) {
  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 2, md: 3 },
        pb: { xs: 4, md: 6 },
        maxWidth,
        mx: 'auto',
        animation: 'kl-rise-in 380ms cubic-bezier(0.4, 0, 0.2, 1) both',
      }}
    >
      {children}
    </Box>
  );
}
