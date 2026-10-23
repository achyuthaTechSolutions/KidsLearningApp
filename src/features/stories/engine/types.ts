/**
 * Story content model. Everything here is plain data with no DOM or React imports,
 * so a future React Native app can share it unchanged.
 */

export const LANGUAGES = ['en', 'te', 'hi'] as const;
export type Lang = (typeof LANGUAGES)[number];

/** Text in every supported language. A published story must fill all three. */
export type Localized = Readonly<Record<Lang, string>>;

export const languageInfo: Record<Lang, { label: string; native: string; speechTag: string }> = {
  en: { label: 'English', native: 'English', speechTag: 'en-IN' },
  te: { label: 'Telugu', native: 'తెలుగు', speechTag: 'te-IN' },
  hi: { label: 'Hindi', native: 'हिन्दी', speechTag: 'hi-IN' },
};

export type ObjectiveId =
  | 'counting' | 'comparing' | 'measurement' | 'addition' | 'subtraction' | 'number-line'
  | 'equal-groups' | 'patterns' | 'sequencing' | 'graphs' | 'vocabulary' | 'comprehension'
  | 'cause-effect' | 'prediction' | 'values';

export type CharacterId = 'kalu' | 'rabbit' | 'lion' | 'mouse' | 'monkey' | 'crocodile' | 'dove-king' | 'doves' | 'deer' | 'narrator';
export type Expression = 'idle' | 'speaking' | 'thinking' | 'happy' | 'surprised' | 'sad' | 'action';
export type BackdropId = 'dry-field' | 'forest' | 'forest-well' | 'river' | 'tree-river' | 'meadow' | 'sky';

/** Stable id of a file the app ships or will ship: art, narration, or sound. */
export type AssetId = string;

export interface Line {
  id: string;
  speaker: CharacterId;
  text: Localized;
  /** How the speaker looks while this line plays. */
  expression?: Expression;
  /** Recorded narration per language. Absent means device speech or text only. */
  audio?: Partial<Record<Lang, AssetId>>;
}

interface ActivityBase {
  id: string;
  objectives: ObjectiveId[];
  prompt: Localized;
  hint: Localized;
  /** Shown with the answer after "Show me", or after two tries. */
  explanation: Localized;
}

export interface PebblePotActivity extends ActivityBase {
  kind: 'pebble-pot';
  /** Water starts this many units high. */
  startLevel: number;
  /** Each pebble raises the water this many units. */
  risePerPebble: number;
  /** Kalu can drink when the water reaches this level. */
  drinkLevel: number;
  maxLevel: number;
  /** After this many pebbles, ask how many more are needed. */
  predictAfter: number;
  predictPrompt: Localized;
}

export interface CountActivity extends ActivityBase {
  kind: 'count';
  emoji: string;
  count: number;
  choices: number[];
}

export interface ArithmeticActivity extends ActivityBase {
  kind: 'arithmetic';
  op: 'add' | 'subtract';
  a: number;
  b: number;
  emoji: string;
  choices: number[];
}

export interface NumberLineActivity extends ActivityBase {
  kind: 'number-line';
  min: number;
  max: number;
  start: number;
  /** Moves the child must make. Positive is forward. */
  steps: number;
  emoji: string;
}

export interface EqualGroupsActivity extends ActivityBase {
  kind: 'equal-groups';
  groups: number;
  perGroup: number;
  emoji: string;
  /** Asked after the groups are filled. */
  totalPrompt: Localized;
  choices: number[];
}

export interface PatternActivity extends ActivityBase {
  kind: 'pattern';
  /** The repeating unit, as emoji. */
  unit: string[];
  /** How many items of the pattern to show before the gap. */
  shown: number;
  choices: string[];
}

export interface SequenceActivity extends ActivityBase {
  kind: 'sequence';
  /** Events in the correct order. They are shown shuffled. */
  events: { id: string; emoji: string; text: Localized }[];
}

export interface GraphCategory {
  id: string;
  label: Localized;
  emoji: string;
  /** The real count in the story, which the child builds the bar up to. */
  value: number;
}

export type GraphQuestion =
  | { kind: 'most'; prompt: Localized }
  | { kind: 'least'; prompt: Localized }
  | { kind: 'difference'; a: string; b: string; prompt: Localized };

export interface BarGraphActivity extends ActivityBase {
  kind: 'bar-graph';
  itemEmoji: string;
  categories: GraphCategory[];
  questions: GraphQuestion[];
}

export interface QuestionActivity extends ActivityBase {
  kind: 'question';
  options: { id: string; text: Localized; emoji?: string }[];
  /** Every option that is a fair right answer. */
  correct: string[];
}

export type Activity =
  | PebblePotActivity | CountActivity | ArithmeticActivity | NumberLineActivity | EqualGroupsActivity
  | PatternActivity | SequenceActivity | BarGraphActivity | QuestionActivity;

export type ActivityKind = Activity['kind'];

export interface Choice {
  id: string;
  text: Localized;
  emoji?: string;
  next: string;
}

export interface SceneCharacter {
  id: CharacterId;
  position: 'left' | 'center' | 'right';
  expression?: Expression;
}

/** A picture placed in the scene, such as a pot or a net. `x` is 0 (left) to 100 (right). */
export interface SceneProp {
  id: string;
  emoji: string;
  x: number;
  size?: 'sm' | 'md' | 'lg';
}

export interface Scene {
  id: string;
  backdrop: BackdropId;
  characters: SceneCharacter[];
  props?: SceneProp[];
  lines: Line[];
  activity?: Activity;
  /** A choice that branches the story. Takes precedence over `next`. */
  choices?: Choice[];
  /** Next scene id. Omitted on the last scene. */
  next?: string;
  /** The ending scene's moral, shown and spoken at the end. */
  moral?: Localized;
}

export type TranslationStatus = 'source' | 'draft-needs-native-review' | 'native-reviewed';

export interface StoryManifest {
  id: string;
  /** Raise whenever scenes change, so old saved positions restart safely. */
  version: number;
  status: 'draft' | 'published';
  title: Localized;
  summary: Localized;
  emoji: string;
  backdrop: BackdropId;
  tradition: string;
  provenance: string;
  ageRange: [number, number];
  minutes: number;
  objectives: ObjectiveId[];
  languages: Lang[];
  translation: Record<Lang, TranslationStatus>;
  startScene: string;
  scenes: Scene[];
}
