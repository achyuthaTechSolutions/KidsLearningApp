export interface DinoColor {
  id: string;
  name: string;
  body: string;
  belly: string;
  spikes: string;
  dark: string;
}

export const dinoColors: DinoColor[] = [
  { id: 'green', name: 'Green', body: '#3CC46B', belly: '#C8F5B0', spikes: '#FFB21E', dark: '#1F8A47' },
  { id: 'blue', name: 'Blue', body: '#3D8BFF', belly: '#CFE4FF', spikes: '#FF7AB6', dark: '#1F5FC2' },
  { id: 'pink', name: 'Pink', body: '#FF6FAE', belly: '#FFE0EE', spikes: '#7C4DFF', dark: '#C93F7E' },
  { id: 'orange', name: 'Orange', body: '#FF8A3D', belly: '#FFE3C8', spikes: '#2BB3A3', dark: '#C85D16' },
  { id: 'purple', name: 'Purple', body: '#8E5CF7', belly: '#E6DBFF', spikes: '#FFD24A', dark: '#5F35C4' },
];

export function dinoColorById(id: string): DinoColor {
  return dinoColors.find((color) => color.id === id) ?? dinoColors[0];
}
