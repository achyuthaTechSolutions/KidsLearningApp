import {
  equalGroupsTotal, numberLineTarget, patternAnswer, pebblesNeeded, arithmeticAnswer,
} from './activities';
import { LANGUAGES, type Activity, type Localized, type StoryManifest } from './types';

export interface Issue {
  level: 'error' | 'warning';
  code: string;
  where: string;
  message: string;
}

export interface ValidationContext {
  characters: string[];
  backdrops: string[];
  /** True when a picture for this emoji is bundled. */
  hasPicture: (emoji: string) => boolean;
  /** True when a recorded audio file with this id is bundled. */
  hasAudio: (id: string) => boolean;
}

const SUPPORTED_KINDS: Activity['kind'][] = ['pebble-pot', 'count', 'arithmetic', 'number-line', 'equal-groups', 'pattern', 'sequence', 'bar-graph', 'question'];

/** Checks one story. Errors block publishing; warnings are worth a look. */
export function validateStory(story: StoryManifest, context: ValidationContext): Issue[] {
  const issues: Issue[] = [];
  const error = (code: string, where: string, message: string) => issues.push({ level: 'error', code, where, message });
  const warn = (code: string, where: string, message: string) => issues.push({ level: 'warning', code, where, message });

  const text = (value: Localized | undefined, where: string) => {
    if (!value) {
      error('missing-field', where, 'Text is missing.');
      return;
    }
    for (const lang of LANGUAGES) {
      if (!value[lang]?.trim()) error('missing-translation', where, `No ${lang} text.`);
    }
  };
  const picture = (emoji: string, where: string) => {
    if (!emoji || !context.hasPicture(emoji)) error('missing-asset', where, `No bundled picture for "${emoji}".`);
  };

  if (!story.id) error('missing-field', 'story', 'Story id is missing.');
  if (!Number.isInteger(story.version) || story.version < 1) error('bad-version', story.id, 'Version must be a whole number from 1.');
  if (story.ageRange[0] > story.ageRange[1] || story.ageRange[0] < 2) error('bad-age', story.id, 'Age range is not valid.');
  if (story.minutes <= 0) error('missing-field', story.id, 'Estimated minutes must be above zero.');
  if (!story.tradition.trim() || !story.provenance.trim()) error('missing-provenance', story.id, 'Source tradition and provenance are required.');
  if (story.objectives.length === 0) error('missing-objectives', story.id, 'The story has no learning objectives.');
  for (const lang of LANGUAGES) {
    if (!story.languages.includes(lang)) error('missing-language', story.id, `Language ${lang} is not listed.`);
    if (!story.translation[lang]) error('missing-translation-status', story.id, `No translation status for ${lang}.`);
  }
  text(story.title, `${story.id}.title`);
  text(story.summary, `${story.id}.summary`);
  picture(story.emoji, `${story.id}.emoji`);
  if (!context.backdrops.includes(story.backdrop)) error('missing-asset', `${story.id}.backdrop`, `Unknown backdrop ${story.backdrop}.`);

  const sceneIds = new Set<string>();
  for (const scene of story.scenes) {
    if (sceneIds.has(scene.id)) error('duplicate-scene', scene.id, 'Scene id is used twice.');
    sceneIds.add(scene.id);
  }
  if (!sceneIds.has(story.startScene)) error('bad-reference', `${story.id}.startScene`, `Start scene ${story.startScene} does not exist.`);

  const lineIds = new Set<string>();
  const activityIds = new Set<string>();
  const practised = new Set<string>();

  for (const scene of story.scenes) {
    const where = `${story.id}/${scene.id}`;
    if (!context.backdrops.includes(scene.backdrop)) error('missing-asset', where, `Unknown backdrop ${scene.backdrop}.`);
    for (const character of scene.characters) {
      if (!context.characters.includes(character.id)) error('bad-reference', where, `Unknown character ${character.id}.`);
    }
    for (const prop of scene.props ?? []) {
      picture(prop.emoji, `${where}/prop ${prop.id}`);
      if (prop.x < 0 || prop.x > 100) error('bad-prop', `${where}/prop ${prop.id}`, 'Prop position must be 0 to 100.');
    }
    if (scene.lines.length === 0 && !scene.activity && !scene.choices?.length) error('empty-scene', where, 'Scene has nothing to show.');
    for (const line of scene.lines) {
      if (lineIds.has(line.id)) error('duplicate-line', `${where}/${line.id}`, 'Line id is used twice.');
      lineIds.add(line.id);
      if (!context.characters.includes(line.speaker)) error('bad-reference', `${where}/${line.id}`, `Unknown speaker ${line.speaker}.`);
      text(line.text, `${where}/${line.id}`);
      for (const [lang, id] of Object.entries(line.audio ?? {})) {
        if (id && !context.hasAudio(id)) error('missing-asset', `${where}/${line.id}`, `Narration ${id} (${lang}) is not bundled.`);
      }
    }
    if (scene.next && !sceneIds.has(scene.next)) error('bad-reference', where, `Next scene ${scene.next} does not exist.`);
    for (const choice of scene.choices ?? []) {
      text(choice.text, `${where}/choice ${choice.id}`);
      if (!sceneIds.has(choice.next)) error('bad-reference', `${where}/choice ${choice.id}`, `Choice goes to missing scene ${choice.next}.`);
      if (choice.emoji) picture(choice.emoji, `${where}/choice ${choice.id}`);
    }
    if (scene.moral) text(scene.moral, `${where}.moral`);
    if (scene.activity) {
      const activity = scene.activity;
      const at = `${where}/${activity.id}`;
      if (activityIds.has(activity.id)) error('duplicate-activity', at, 'Activity id is used twice.');
      activityIds.add(activity.id);
      if (!SUPPORTED_KINDS.includes(activity.kind)) error('unsupported-activity', at, `Activity type ${activity.kind} is not supported.`);
      if (activity.objectives.length === 0) error('missing-objectives', at, 'Activity has no learning objectives.');
      activity.objectives.forEach((objective) => practised.add(objective));
      text(activity.prompt, `${at}.prompt`);
      text(activity.hint, `${at}.hint`);
      text(activity.explanation, `${at}.explanation`);
      for (const problem of activityProblems(activity)) error('bad-activity', at, problem);
      for (const emoji of activityPictures(activity)) picture(emoji, at);
      if (activity.kind === 'pebble-pot') text(activity.predictPrompt, `${at}.predictPrompt`);
      if (activity.kind === 'equal-groups') text(activity.totalPrompt, `${at}.totalPrompt`);
      if (activity.kind === 'sequence') activity.events.forEach((event) => text(event.text, `${at}/${event.id}`));
      if (activity.kind === 'bar-graph') {
        activity.categories.forEach((category) => text(category.label, `${at}/${category.id}`));
        activity.questions.forEach((question, i) => text(question.prompt, `${at}/question ${i + 1}`));
      }
      if (activity.kind === 'question') activity.options.forEach((option) => text(option.text, `${at}/${option.id}`));
    }
  }

  for (const objective of story.objectives) {
    if (!practised.has(objective) && objective !== 'values' && objective !== 'vocabulary') {
      warn('objective-not-practised', story.id, `Objective ${objective} has no activity.`);
    }
  }

  // Every scene must be reachable from the start, and some path must reach an ending.
  const reachable = new Set<string>();
  const queue = sceneIds.has(story.startScene) ? [story.startScene] : [];
  while (queue.length) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const scene = story.scenes.find((item) => item.id === id);
    if (!scene) continue;
    for (const target of [scene.next, ...(scene.choices ?? []).map((choice) => choice.next)]) {
      if (target && sceneIds.has(target)) queue.push(target);
    }
  }
  for (const scene of story.scenes) {
    if (!reachable.has(scene.id)) error('unreachable-scene', `${story.id}/${scene.id}`, 'No path from the start reaches this scene.');
  }
  const endings = story.scenes.filter((scene) => reachable.has(scene.id) && !scene.next && !scene.choices?.length);
  if (endings.length === 0) error('no-ending', story.id, 'No ending can be reached.');
  if (!endings.some((scene) => scene.moral)) error('missing-moral', story.id, 'No reachable ending has a moral.');

  return issues;
}

/** Problems with an activity's numbers or options that would make it unfair or unwinnable. */
export function activityProblems(activity: Activity): string[] {
  const problems: string[] = [];
  const uniqueChoices = (choices: (number | string)[], answer: number | string) => {
    if (new Set(choices).size !== choices.length) problems.push('Choices repeat.');
    if (!choices.includes(answer)) problems.push(`Choices do not include the answer ${answer}.`);
    if (choices.length < 2) problems.push('Needs at least two choices.');
  };
  switch (activity.kind) {
    case 'pebble-pot': {
      if (activity.risePerPebble <= 0) problems.push('Each pebble must raise the water.');
      if (activity.drinkLevel <= activity.startLevel) problems.push('The crow can already drink.');
      if (activity.drinkLevel > activity.maxLevel) problems.push('The drinking level is above the pot.');
      const needed = pebblesNeeded(activity);
      if (activity.predictAfter < 1 || activity.predictAfter >= needed) problems.push('The prediction must come before the last pebble.');
      break;
    }
    case 'count':
      if (activity.count < 1) problems.push('Count must be at least one.');
      uniqueChoices(activity.choices, activity.count);
      break;
    case 'arithmetic': {
      const answer = arithmeticAnswer(activity);
      if (answer < 0) problems.push('Subtraction must not go below zero.');
      uniqueChoices(activity.choices, answer);
      break;
    }
    case 'number-line': {
      const target = numberLineTarget(activity);
      if (activity.steps === 0) problems.push('The marker must move.');
      if (activity.start < activity.min || activity.start > activity.max) problems.push('Start is off the line.');
      if (target < activity.min || target > activity.max) problems.push('Target is off the line.');
      if (activity.max - activity.min > 20) problems.push('Keep number lines to 20 steps or fewer.');
      break;
    }
    case 'equal-groups':
      if (activity.groups < 2 || activity.perGroup < 1) problems.push('Needs at least two groups.');
      uniqueChoices(activity.choices, equalGroupsTotal(activity));
      break;
    case 'pattern':
      if (activity.unit.length < 2 || new Set(activity.unit).size < 2) problems.push('A pattern needs at least two different items.');
      if (activity.shown < activity.unit.length * 2) problems.push('Show the unit at least twice before the gap.');
      uniqueChoices(activity.choices, patternAnswer(activity));
      break;
    case 'sequence':
      if (activity.events.length < 3) problems.push('Needs at least three events.');
      if (new Set(activity.events.map((event) => event.id)).size !== activity.events.length) problems.push('Event ids repeat.');
      break;
    case 'bar-graph': {
      const ids = activity.categories.map((category) => category.id);
      const values = activity.categories.map((category) => category.value);
      if (activity.categories.length < 2) problems.push('A graph needs at least two bars.');
      if (new Set(ids).size !== ids.length) problems.push('Category ids repeat.');
      if (values.some((value) => value < 1 || value > 10)) problems.push('Bar values must be 1 to 10.');
      for (const question of activity.questions) {
        if (question.kind === 'most' && values.filter((value) => value === Math.max(...values)).length > 1) problems.push('Two bars tie for most.');
        if (question.kind === 'least' && values.filter((value) => value === Math.min(...values)).length > 1) problems.push('Two bars tie for least.');
        if (question.kind === 'difference' && (!ids.includes(question.a) || !ids.includes(question.b))) problems.push('Difference question names a missing bar.');
        if (question.kind === 'difference' && question.a === question.b) problems.push('Difference question compares a bar with itself.');
      }
      if (activity.questions.length === 0) problems.push('A graph needs at least one question.');
      break;
    }
    case 'question': {
      const ids = activity.options.map((option) => option.id);
      if (activity.options.length < 2) problems.push('Needs at least two options.');
      if (new Set(ids).size !== ids.length) problems.push('Option ids repeat.');
      if (activity.correct.length === 0) problems.push('No correct option.');
      if (activity.correct.some((id) => !ids.includes(id))) problems.push('A correct answer is not an option.');
      if (activity.correct.length === activity.options.length) problems.push('Every option is correct, so there is nothing to choose.');
      break;
    }
  }
  return problems;
}

function activityPictures(activity: Activity): string[] {
  switch (activity.kind) {
    case 'count': case 'arithmetic': case 'number-line': case 'equal-groups': return [activity.emoji];
    case 'pattern': return [...activity.unit, ...activity.choices];
    case 'sequence': return activity.events.map((event) => event.emoji);
    case 'bar-graph': return [activity.itemEmoji, ...activity.categories.map((category) => category.emoji)];
    case 'question': return activity.options.flatMap((option) => (option.emoji ? [option.emoji] : []));
    default: return [];
  }
}

export function errorsOf(issues: Issue[]): Issue[] {
  return issues.filter((issue) => issue.level === 'error');
}
