import type { SvgIconComponent } from '@mui/icons-material';
import {
  HomeRounded,
  StarRounded,
  KeyboardRounded,
  AbcRounded,
  NumbersRounded,
  PetsRounded,
  MenuBookRounded,
  MusicNoteRounded,
  SportsEsportsRounded,
  DirectionsRunRounded,
  EmojiEventsRounded,
  SettingsRounded,
  PolicyRounded,
} from '@mui/icons-material';
import { activityPaths, sectionCatalog, type SectionGroup, type SectionInfo } from '../../packages/learning-core/src/catalog';

export type { SectionGroup };
export { activityPaths };

export interface Section extends SectionInfo {
  Icon: SvgIconComponent;
}

const icons: Record<string, SvgIconComponent> = {
  '/': HomeRounded,
  '/daily': StarRounded,
  '/dino': DirectionsRunRounded,
  '/keyboard': KeyboardRounded,
  '/alphabet': AbcRounded,
  '/numbers': NumbersRounded,
  '/animals': PetsRounded,
  '/words': MenuBookRounded,
  '/music': MusicNoteRounded,
  '/games': SportsEsportsRounded,
  '/achievements': EmojiEventsRounded,
  '/settings': SettingsRounded,
  '/privacy': PolicyRounded,
};

export const sections: Section[] = sectionCatalog.map((section) => ({
  ...section,
  Icon: icons[section.path],
}));

export function sectionFor(path: string): Section {
  return sections.find((section) => section.path === path) ?? sections[0];
}
