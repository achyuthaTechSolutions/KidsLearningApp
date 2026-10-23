import type { QuizQuestion } from '../quiz/questions';

export function letterSpeech(letter: string, word: string): string {
  return `Letter ${letter}. ${letter} is for ${word}. ${word} starts with the sound ${letter}.`;
}

export function numberSpeech(word: string, description: string): string {
  return `${word}! ${description}`;
}

export function animalSpeech(name: string, description: string, sound: string): string {
  return `${name}! ${description} ${name} says ${sound}!`;
}

export function countAloudSpeech(value: number): string {
  let countText = 'Let\'s count! ';
  for (let i = 1; i <= value; i++) countText += `${i}. `;
  return countText;
}

/** Lines spoken for a quiz question. Listen questions speak the word only after the prompt. */
export function spokenQuizLines(question: QuizQuestion): string[] {
  if (question.type === 'listen' && question.spokenWord) return [question.prompt, question.spokenWord];
  return [question.prompt];
}

export const QUESTIONS_PER_GAME = 5;
