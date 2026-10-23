import { Box, ButtonBase, Typography } from '@mui/material';
import { CheckCircleRounded } from '@mui/icons-material';
import { AviFor } from '../../components/ui/Mascot';
import { lookOrder, looks } from '../../theme/looks';
import type { AppLook } from '../../types';

/** A look's colours, as small swatches on its card. */
const swatches: Record<AppLook, string[]> = {
  classic: ['#6C4EF5', '#0F9D68', '#FFB21E', '#E8448C'],
  garden: ['#2A2550', '#3F8F5B', '#F2A93B', '#FFF8EC'],
  blocks: ['#2F5BEA', '#FF6B4A', '#22C47E', '#FFC93C'],
  map: ['#0D4250', '#BFE7EC', '#F5DFA8', '#F27B35'],
};

interface Props {
  value: AppLook;
  onChange: (look: AppLook) => void;
}

/** Lets a grown-up try each look in the real app. Progress is never affected. */
export default function LookPicker({ value, onChange }: Props) {
  return (
    <Box role="radiogroup" aria-label="Look" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
      {lookOrder.map((id) => {
        const spec = looks[id];
        const on = id === value;
        return (
          <ButtonBase
            key={id}
            role="radio"
            aria-checked={on}
            aria-label={`${spec.name}. ${spec.description}`}
            onClick={() => onChange(id)}
            sx={{
              position: 'relative',
              flexDirection: 'column',
              alignItems: 'stretch',
              textAlign: 'left',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '3px solid',
              borderColor: on ? 'primary.main' : 'divider',
              bgcolor: 'background.paper',
              '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            <Box sx={{ bgcolor: spec.background, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <AviFor look={id} size={56} float={false} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                {swatches[id].map((colour) => (
                  <Box key={colour} sx={{ width: 16, height: 16, borderRadius: id === 'blocks' ? '5px' : '50%', bgcolor: colour, border: `2px solid ${spec.ink}` }} />
                ))}
              </Box>
            </Box>
            <Box sx={{ p: 1.25 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', lineHeight: 1.2, color: 'text.primary' }}>{spec.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.3, mt: 0.25 }}>{spec.description}</Typography>
            </Box>
            {on && <CheckCircleRounded aria-hidden sx={{ position: 'absolute', top: 6, right: 6, color: 'primary.main', bgcolor: '#FFFFFF', borderRadius: '50%' }} />}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
