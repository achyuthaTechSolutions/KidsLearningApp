export type Decor = 'clouds' | 'stars' | 'snow' | 'bubbles' | 'leaves' | 'embers';

export interface DinoTheme {
  name: string;
  emoji: string;
  night: boolean;
  decor: Decor;
  skyTop: string;
  skyBottom: string;
  sun: string;
  farHills: string;
  nearHills: string;
  ground: string;
  groundEdge: string;
  groundDots: string;
  cactus: string;
  cactusDark: string;
  rock: string;
  bird: string;
  birdWing: string;
  cloud: string;
}

type ColorKey = Exclude<keyof DinoTheme, 'name' | 'emoji' | 'night' | 'decor'>;

const baseThemes: DinoTheme[] = [
  { name: 'Sunny Meadow', emoji: '🌻', night: false, decor: 'clouds', skyTop: '#7FD4FF', skyBottom: '#D9F4FF', sun: '#FFD93B', farHills: '#9BE38B', nearHills: '#5CC96B', ground: '#8BD45A', groundEdge: '#4FA83C', groundDots: '#6FBF45', cactus: '#22A35A', cactusDark: '#157A42', rock: '#9AA4B5', bird: '#FF7A45', birdWing: '#E85A2A', cloud: '#FFFFFF' },
  { name: 'Desert Sunset', emoji: '🌵', night: false, decor: 'clouds', skyTop: '#FF9A62', skyBottom: '#FFD59A', sun: '#FFF1A8', farHills: '#F2B36B', nearHills: '#E8935A', ground: '#F6CF84', groundEdge: '#D9A55B', groundDots: '#E8B96A', cactus: '#3BA55C', cactusDark: '#24804A', rock: '#B9895F', bird: '#7C4DFF', birdWing: '#5A33D6', cloud: '#FFE3C2' },
  { name: 'Ocean Beach', emoji: '🏖️', night: false, decor: 'bubbles', skyTop: '#5EC8F2', skyBottom: '#C7F0FF', sun: '#FFE066', farHills: '#2FA4D9', nearHills: '#57C7E8', ground: '#FFE2A8', groundEdge: '#EBC27A', groundDots: '#F5D08E', cactus: '#FF6F91', cactusDark: '#D9466E', rock: '#C9B79C', bird: '#F7F7FF', birdWing: '#A9B4C8', cloud: '#FFFFFF' },
  { name: 'Snowy Hills', emoji: '⛄', night: false, decor: 'snow', skyTop: '#9FC8FF', skyBottom: '#EAF4FF', sun: '#FFFFFF', farHills: '#D6E6FA', nearHills: '#BCD3F2', ground: '#F4F8FF', groundEdge: '#C9DAF2', groundDots: '#DCE7F8', cactus: '#2E8B57', cactusDark: '#1F6B42', rock: '#8FA3BF', bird: '#E23E57', birdWing: '#A82539', cloud: '#FFFFFF' },
  { name: 'Candy Land', emoji: '🍭', night: false, decor: 'bubbles', skyTop: '#FFB3D9', skyBottom: '#FFE6F2', sun: '#FFF07A', farHills: '#FFC6E5', nearHills: '#FF9ECF', ground: '#FFD1E8', groundEdge: '#FF8FC5', groundDots: '#FFFFFF', cactus: '#8E5CF7', cactusDark: '#6A3BD6', rock: '#F7C1FF', bird: '#19C2C2', birdWing: '#0E9696', cloud: '#FFFFFF' },
  { name: 'Jungle', emoji: '🌴', night: false, decor: 'leaves', skyTop: '#6FE3B5', skyBottom: '#D6FFF0', sun: '#FFE45E', farHills: '#3DBE7A', nearHills: '#1F9E5C', ground: '#8B6A43', groundEdge: '#6B4E2E', groundDots: '#A07C52', cactus: '#2BB34A', cactusDark: '#1D8A36', rock: '#7D8590', bird: '#FF4F7B', birdWing: '#D12D5A', cloud: '#F0FFF8' },
  { name: 'Starry Night', emoji: '🌙', night: true, decor: 'stars', skyTop: '#1B1446', skyBottom: '#3B2A84', sun: '#FFF6C2', farHills: '#3A3478', nearHills: '#2A2560', ground: '#4B3F99', groundEdge: '#3A3080', groundDots: '#5B4FB0', cactus: '#4DD39D', cactusDark: '#2FA47A', rock: '#8E86C9', bird: '#FFD24A', birdWing: '#E0A800', cloud: '#6B5FC0' },
  { name: 'Volcano Valley', emoji: '🌋', night: false, decor: 'embers', skyTop: '#FF7A59', skyBottom: '#FFD0A8', sun: '#FFE08A', farHills: '#8A4B3A', nearHills: '#6E3A2E', ground: '#5A4A4A', groundEdge: '#3E3232', groundDots: '#7A5F5F', cactus: '#F5A524', cactusDark: '#C77F0A', rock: '#3D3D4F', bird: '#29B6F6', birdWing: '#0288D1', cloud: '#FFC1A6' },
];

export const THEME_COUNT = baseThemes.length;

const colorKeys: ColorKey[] = [
  'skyTop', 'skyBottom', 'sun', 'farHills', 'nearHills', 'ground', 'groundEdge', 'groundDots',
  'cactus', 'cactusDark', 'rock', 'bird', 'birdWing', 'cloud',
];

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`.toUpperCase();
}

export function rotateHue(hex: string, degrees: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex((((h + degrees) % 360) + 360) % 360, s, l);
}

/**
 * The world for a level. The eight base worlds repeat forever, and each repeat
 * turns every color by 37° so level 9 looks different from level 1.
 */
export function themeForLevel(level: number): DinoTheme {
  const index = (Math.max(1, Math.floor(level)) - 1) % THEME_COUNT;
  const round = Math.floor((Math.max(1, Math.floor(level)) - 1) / THEME_COUNT);
  const base = baseThemes[index];
  if (round === 0) return base;
  const shifted: DinoTheme = { ...base, name: `${base.name} ${round + 1}` };
  for (const key of colorKeys) shifted[key] = rotateHue(base[key], round * 37);
  return shifted;
}
