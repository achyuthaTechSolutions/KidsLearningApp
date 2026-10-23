import { LANGUAGES, type Lang, type Localized, type StoryManifest, type TranslationStatus } from '../engine/types';
import { characters } from './characters';
import { allStories } from './library';
import { objectiveLabels, uiKeys, uiStrings } from './uiText';

/** One piece of child-facing text, in every language, with where it appears. */
export interface TextEntry {
  /** `ui`, `objectives`, `characters`, or a story id. */
  group: string;
  /** Stable key, for example `thirsty-crow/s1/l2` or `ui.next`. */
  key: string;
  /** What a reviewer needs to know, such as who says it or that it is a hint. */
  context: string;
  text: Localized;
}

/** Every story's text, in reading order. Activity text follows its scene's lines. */
export function storyTextEntries(story: StoryManifest): TextEntry[] {
  const entries: TextEntry[] = [];
  const add = (key: string, context: string, text: Localized | undefined) => {
    if (text) entries.push({ group: story.id, key: `${story.id}/${key}`, context, text });
  };
  add('title', 'Story title', story.title);
  add('summary', 'Story card summary', story.summary);
  for (const scene of story.scenes) {
    for (const line of scene.lines) add(`${scene.id}/${line.id}`, `Line: ${characters[line.speaker].name.en}`, line.text);
    const activity = scene.activity;
    if (activity) {
      const at = `${scene.id}/${activity.id}`;
      add(`${at}.prompt`, `Activity (${activity.kind}): question`, activity.prompt);
      if (activity.kind === 'pebble-pot') add(`${at}.predictPrompt`, 'Activity: prediction question', activity.predictPrompt);
      if (activity.kind === 'equal-groups') add(`${at}.totalPrompt`, 'Activity: total question', activity.totalPrompt);
      if (activity.kind === 'question') activity.options.forEach((option) => add(`${at}/${option.id}`, `Answer option${activity.correct.includes(option.id) ? ' (correct)' : ''}`, option.text));
      if (activity.kind === 'sequence') activity.events.forEach((event) => add(`${at}/${event.id}`, 'Event to put in order', event.text));
      if (activity.kind === 'bar-graph') {
        activity.categories.forEach((category) => add(`${at}/${category.id}`, `Bar label (value ${category.value})`, category.label));
        activity.questions.forEach((question, i) => add(`${at}/question-${i + 1}`, `Graph question (${question.kind})`, question.prompt));
      }
      add(`${at}.hint`, 'Activity: hint after a wrong answer', activity.hint);
      add(`${at}.explanation`, 'Activity: explanation with the answer', activity.explanation);
    }
    for (const choice of scene.choices ?? []) add(`${scene.id}/choice-${choice.id}`, 'Story choice', choice.text);
    add(`${scene.id}.moral`, 'Moral at the end', scene.moral);
  }
  return entries;
}

/** Interface words, learning goals, and character names, shared by every story. */
export function sharedTextEntries(): TextEntry[] {
  return [
    ...uiKeys.map((key) => ({ group: 'ui', key: `ui.${key}`, context: 'Button, label, or message', text: uiStrings[key] })),
    ...Object.entries(objectiveLabels).map(([id, text]) => ({ group: 'objectives', key: `objective.${id}`, context: 'Learning goal on a story card', text })),
    ...Object.values(characters).map((character) => ({ group: 'characters', key: `character.${character.id}`, context: 'Character name', text: character.name })),
  ];
}

export function allTextEntries(stories: StoryManifest[] = allStories): TextEntry[] {
  return [...sharedTextEntries(), ...stories.flatMap(storyTextEntries)];
}

/** `{n}`-style slots in a string, sorted, so languages can be compared. */
export function placeholdersOf(text: string): string[] {
  return (text.match(/\{[a-z]+\}/g) ?? []).sort();
}

/**
 * Numbers written with digits, sorted. Telugu and Devanagari digits count as their values.
 * Hindi says "3 each" as "3-3", so a number repeated with a hyphen counts once.
 */
export function numbersOf(text: string): string[] {
  const western = text
    .replace(/[౦-౯]/g, (digit) => String(digit.charCodeAt(0) - 0x0c66))
    .replace(/[०-९]/g, (digit) => String(digit.charCodeAt(0) - 0x0966))
    .replace(/\b(\d+)-\1\b/g, '$1');
  return (western.match(/\d+/g) ?? []).sort();
}

const scripts: Record<Exclude<Lang, 'en'>, RegExp> = { te: /[ఀ-౿]/, hi: /[ऀ-ॿ]/ };

/** Problems a machine can find before a person reviews the text. */
export function textProblems(entry: TextEntry): string[] {
  const problems: string[] = [];
  const { en } = entry.text;
  for (const lang of LANGUAGES) {
    const value = entry.text[lang] ?? '';
    if (!value.trim()) {
      problems.push(`${lang}: missing`);
      continue;
    }
    if (value !== value.trim() || /\s{2,}/.test(value)) problems.push(`${lang}: extra spaces`);
    if (placeholdersOf(value).join() !== placeholdersOf(en).join()) problems.push(`${lang}: slots ${placeholdersOf(value).join(' ') || 'none'} differ from English ${placeholdersOf(en).join(' ') || 'none'}`);
    if (numbersOf(value).join() !== numbersOf(en).join()) problems.push(`${lang}: numbers ${numbersOf(value).join(' ') || 'none'} differ from English ${numbersOf(en).join(' ') || 'none'}`);
    if (lang !== 'en') {
      if (!scripts[lang].test(value)) problems.push(`${lang}: no ${lang === 'te' ? 'Telugu' : 'Devanagari'} letters`);
      const other = scripts[lang === 'te' ? 'hi' : 'te'];
      if (other.test(value)) problems.push(`${lang}: contains the other Indic script`);
      // Latin letters usually mean an untranslated word. Slots like {a} are fine.
      if (/[A-Za-z]{2,}/.test(value.replace(/\{[a-z]+\}/g, ''))) problems.push(`${lang}: contains Latin letters`);
      if (value === en) problems.push(`${lang}: same as English`);
    }
  }
  return problems;
}

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/**
 * The reviewer's sheet: one row per string, with an empty verdict and notes column per
 * language. Opens in any spreadsheet app.
 */
export function reviewSheetCsv(entries: TextEntry[]): string {
  const header = ['key', 'context', 'en', 'te', 'te_verdict', 'te_notes', 'hi', 'hi_verdict', 'hi_notes'];
  const rows = entries.map((entry) => [entry.key, entry.context, entry.text.en, entry.text.te, '', '', entry.text.hi, '', '']);
  return `${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

/** Per story and language: review status and how much text a reviewer has to read. */
export function reviewStatusMarkdown(stories: StoryManifest[] = allStories): string {
  const status: Record<TranslationStatus, string> = { source: 'Source text', 'draft-needs-native-review': 'Draft, needs native review', 'native-reviewed': 'Reviewed by a native speaker' };
  const shared = sharedTextEntries();
  const lines = [
    '# Story Time translation status',
    '',
    'Generated by `src/features/stories/content/localization.test.ts` from the story data. Do not edit by hand.',
    'To change a status, edit `translation` in the story file. Mark a language `native-reviewed` only after a qualified native speaker has signed off its review sheet.',
    '',
    '| Story | Strings | Words (en) | English | Telugu | Hindi |',
    '| --- | ---: | ---: | --- | --- | --- |',
    ...stories.map((story) => {
      const entries = storyTextEntries(story);
      const words = entries.reduce((sum, entry) => sum + entry.text.en.split(/\s+/).filter(Boolean).length, 0);
      return `| ${story.title.en} (\`${story.id}\`) | ${entries.length} | ${words} | ${status[story.translation.en]} | ${status[story.translation.te]} | ${status[story.translation.hi]} |`;
    }),
    `| Shared interface words, goals, and names | ${shared.length} | ${shared.reduce((sum, entry) => sum + entry.text.en.split(/\s+/).filter(Boolean).length, 0)} | Source text | Draft, needs native review | Draft, needs native review |`,
    '',
  ];
  return lines.join('\n');
}
