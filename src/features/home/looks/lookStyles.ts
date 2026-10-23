import { blocks } from '../../../theme/looks';

/** The thick ink outline and hard shadow every Bright Blocks surface shares. */
export const blockSx = (bg: string, depth = 5) => ({
  bgcolor: bg,
  color: blocks.ink,
  border: `3px solid ${blocks.ink}`,
  borderRadius: '26px',
  boxShadow: `${depth}px ${depth}px 0 ${blocks.ink}`,
  transition: 'transform 90ms, box-shadow 90ms',
  '&:active': { transform: `translate(${depth - 1}px, ${depth - 1}px)`, boxShadow: `1px 1px 0 ${blocks.ink}` },
  '&:focus-visible': { outline: `4px solid ${blocks.blue}`, outlineOffset: 3 },
});

export type IslandId = 'stories' | 'letters' | 'numbers' | 'games';

export interface Island {
  id: IslandId;
  name: string;
  emoji: string;
  path: string;
  /** Centre of the island on the map, in % of its width and height. */
  x: number;
  y: number;
}

/** The four islands, joined by the dotted path in the order a trip visits them. */
export const islands: Island[] = [
  { id: 'stories', name: 'Story Cove', emoji: '📖', path: '/stories', x: 26, y: 20 },
  { id: 'letters', name: 'Letter Hill', emoji: '🔤', path: '/alphabet', x: 77, y: 37 },
  { id: 'numbers', name: 'Number Bay', emoji: '🔢', path: '/numbers', x: 28, y: 68 },
  { id: 'games', name: 'Game Island', emoji: '🎮', path: '/games', x: 74, y: 86 },
];

/** Where Avi stands: the island of the last thing the child did. */
export function islandFor(lastActivity: string | null): IslandId {
  if (lastActivity === 'numbers') return 'numbers';
  if (lastActivity === 'games' || lastActivity === 'music') return 'games';
  if (lastActivity === 'keyboard' || lastActivity === 'vocabulary' || lastActivity === 'animals') return 'letters';
  return 'stories';
}

