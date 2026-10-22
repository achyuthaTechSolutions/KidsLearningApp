import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { illustrationFor } from '../../data/illustrations';

interface Props {
  emoji: string;
  /** When set, the picture is announced with this name. Otherwise it is decorative. */
  label?: string;
  /** Defaults to 1em so the picture matches the surrounding font size. */
  size?: string | number;
  sx?: SxProps<Theme>;
}

/** Shows the bundled Fluent illustration for an emoji, or the emoji itself if none is bundled. */
export default function Illustration({ emoji, label, size = '1em', sx }: Props) {
  const src = illustrationFor(emoji);
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  if (!src) {
    return (
      <Box component="span" {...a11y} sx={[{ display: 'inline-block', lineHeight: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}>
        {emoji}
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      decoding="async"
      sx={[
        { width: size, height: size, display: 'inline-block', verticalAlign: '-0.14em', objectFit: 'contain', userSelect: 'none', flexShrink: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
