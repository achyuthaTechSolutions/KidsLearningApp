import type { GameDifficulty } from '../learning-games/difficulty';
import { shuffle, type Random } from '../learning-games/random';

export type Emotion = 'happy' | 'sad' | 'surprised' | 'worried' | 'excited' | 'angry' | 'scared' | 'calm';

export const emotions: Record<Emotion, { label: string; emoji: string; tough: boolean }> = {
  happy: { label: 'Happy', emoji: '😊', tough: false },
  sad: { label: 'Sad', emoji: '😢', tough: true },
  surprised: { label: 'Surprised', emoji: '😮', tough: false },
  worried: { label: 'Worried', emoji: '😟', tough: true },
  excited: { label: 'Excited', emoji: '🤩', tough: false },
  angry: { label: 'Angry', emoji: '😠', tough: true },
  scared: { label: 'Scared', emoji: '😨', tough: true },
  calm: { label: 'Calm', emoji: '😌', tough: false },
};

export type ScenarioKind = 'face' | 'story' | 'think';

/**
 * A short moment to talk about. `accepted` lists every feeling that makes sense, because
 * people can feel different things about the same event. `distractors` are only feelings
 * that clearly do not fit, so a "not quite" answer is never unfair. "think" scenarios
 * are for discussion: every answer is welcomed.
 */
export interface Scenario {
  id: string;
  kind: ScenarioKind;
  character: string;
  name: string;
  story: string;
  accepted: Emotion[];
  distractors: Emotion[];
  why: string;
}

export const scenarios: Scenario[] = [
  { id: 'face-happy', kind: 'face', character: '😊', name: 'This face', story: 'Look at this face.', accepted: ['happy'], distractors: ['sad', 'angry', 'scared'], why: 'The big smile shows a happy feeling.' },
  { id: 'face-sad', kind: 'face', character: '😢', name: 'This face', story: 'Look at this face.', accepted: ['sad'], distractors: ['happy', 'excited', 'calm'], why: 'The tear and the turned-down mouth show a sad feeling.' },
  { id: 'face-surprised', kind: 'face', character: '😮', name: 'This face', story: 'Look at this face.', accepted: ['surprised'], distractors: ['sad', 'calm', 'angry'], why: 'The round mouth and wide eyes show surprise.' },
  { id: 'face-angry', kind: 'face', character: '😠', name: 'This face', story: 'Look at this face.', accepted: ['angry'], distractors: ['happy', 'calm', 'excited'], why: 'The frown and tight eyebrows show an angry feeling.' },
  { id: 'face-scared', kind: 'face', character: '😨', name: 'This face', story: 'Look at this face.', accepted: ['scared', 'worried'], distractors: ['happy', 'calm', 'excited'], why: 'The wide eyes and open mouth show a scared feeling.' },
  { id: 'gift', kind: 'story', character: '🐻', name: 'Bear', story: 'Bear opens a birthday present. It is the kite Bear wanted!', accepted: ['happy', 'excited', 'surprised'], distractors: ['sad', 'angry', 'scared'], why: 'Getting something you wished for can feel happy and exciting.' },
  { id: 'lost-toy', kind: 'story', character: '🐰', name: 'Bunny', story: 'Bunny cannot find her favourite teddy anywhere.', accepted: ['sad', 'worried'], distractors: ['happy', 'excited', 'calm'], why: 'Losing something we love can make us feel sad or worried.' },
  { id: 'new-friend', kind: 'story', character: '🦊', name: 'Fox', story: 'Fox meets a new friend at the park, and they play tag together.', accepted: ['happy', 'excited'], distractors: ['sad', 'angry', 'scared'], why: 'Playing with a new friend can feel happy and exciting.' },
  { id: 'tower', kind: 'story', character: '🦁', name: 'Lion', story: 'Lion builds a tall block tower. Then it falls down with a crash!', accepted: ['sad', 'angry', 'surprised'], distractors: ['happy', 'calm', 'excited'], why: 'When something we worked hard on breaks, we might feel sad, cross, or surprised.' },
  { id: 'thunder', kind: 'story', character: '🦉', name: 'Owl', story: 'Owl hears a very loud BOOM of thunder in the night.', accepted: ['scared', 'surprised', 'worried'], distractors: ['happy', 'calm', 'excited'], why: 'A sudden loud noise can make us jump and feel scared.' },
  { id: 'helping', kind: 'story', character: '🐷', name: 'Pig', story: 'Pig helps a friend pick up spilled crayons. The friend says, "Thank you!"', accepted: ['happy', 'calm'], distractors: ['angry', 'scared', 'sad'], why: 'Helping someone can give us a warm, happy feeling.' },
  { id: 'new-school', kind: 'think', character: '🐼', name: 'Panda', story: 'Panda is starting at a new school today.', accepted: ['worried', 'excited', 'happy', 'scared'], distractors: [], why: 'Some friends feel excited about something new. Others feel worried. Both are okay!' },
  { id: 'big-jump', kind: 'think', character: '🐵', name: 'Monkey', story: 'Monkey is about to jump into the swimming pool for the very first time.', accepted: ['excited', 'scared', 'worried', 'happy'], distractors: [], why: 'Trying something new can feel exciting and a little scary at the same time.' },
  { id: 'friend-moving', kind: 'think', character: '🦆', name: 'Duck', story: 'Duck\'s best friend is moving to a new town far away.', accepted: ['sad', 'worried', 'angry'], distractors: [], why: 'Saying goodbye can feel sad. Some friends feel worried or even cross. All of those feelings are okay.' },
  { id: 'quiet-time', kind: 'think', character: '🐢', name: 'Turtle', story: 'Turtle sits under a tree, listening to the birds sing.', accepted: ['calm', 'happy'], distractors: [], why: 'Quiet moments can help us feel calm and happy.' },
];

export const kindFor: Record<GameDifficulty, ScenarioKind> = { beginner: 'face', intermediate: 'story', advanced: 'think' };
export const choicesFor: Record<GameDifficulty, number> = { beginner: 2, intermediate: 3, advanced: 4 };
export const EMOTION_ROUNDS = 5;

export interface EmotionQuestion {
  scenario: Scenario;
  choices: Emotion[];
}

export function questionFor(scenario: Scenario, count: number, random: Random = Math.random): EmotionQuestion {
  if (scenario.kind === 'think') {
    const others = shuffle((Object.keys(emotions) as Emotion[]).filter((emotion) => !scenario.accepted.includes(emotion)), random);
    const accepted = shuffle(scenario.accepted, random);
    const picked = [...accepted.slice(0, Math.max(2, count - 1)), ...others].slice(0, count);
    return { scenario, choices: shuffle(picked, random) };
  }
  const right = scenario.accepted[0];
  return { scenario, choices: shuffle([right, ...shuffle(scenario.distractors, random).slice(0, count - 1)], random) };
}

export function buildEmotionRound(difficulty: GameDifficulty, random: Random = Math.random): EmotionQuestion[] {
  const pool = scenarios.filter((scenario) => scenario.kind === kindFor[difficulty]);
  return shuffle(pool, random).slice(0, EMOTION_ROUNDS).map((scenario) => questionFor(scenario, choicesFor[difficulty], random));
}

export type EmotionAnswer = 'fits' | 'not-quite' | 'discuss';

export function judgeEmotion(scenario: Scenario, emotion: Emotion): EmotionAnswer {
  if (scenario.kind === 'think') return 'discuss';
  return scenario.accepted.includes(emotion) ? 'fits' : 'not-quite';
}

export const SUPPORT_TIP = 'All feelings are okay. When a feeling is big or hard, you can tell a grown-up you trust. They can help.';

/** Kind, never shaming, feedback for any answer. */
export function feedbackFor(scenario: Scenario, emotion: Emotion): string {
  const label = emotions[emotion].label.toLowerCase();
  const verdict = judgeEmotion(scenario, emotion);
  if (verdict === 'discuss') {
    return `${scenario.name} might feel ${label}. ${scenario.why} How would you feel?`;
  }
  if (verdict === 'fits') return `Yes, ${scenario.name === 'This face' ? 'this face looks' : `${scenario.name} might feel`} ${label}. ${scenario.why}`;
  const fits = scenario.accepted.map((item) => emotions[item].label.toLowerCase()).join(' or ');
  return `Good thinking! Most friends would feel ${fits} here. ${scenario.why}`;
}

export function needsSupportTip(scenario: Scenario, emotion: Emotion): boolean {
  return emotions[emotion].tough || scenario.accepted.some((item) => emotions[item].tough);
}
