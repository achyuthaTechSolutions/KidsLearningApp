import { cancelSpeech, speak } from '../../services/speech';
import type { QuizQuestion } from './questions';

function speechOptions(rate?: number, voice?: string | null) {
  return { rate, voice: voice || undefined };
}

export function speakQuizQuestion(question: QuizQuestion, rate?: number, voice?: string | null): void {
  const options = speechOptions(rate, voice);
  cancelSpeech();
  if (question.type === 'listen' && question.spokenWord) {
    const word = question.spokenWord;
    speak(question.prompt, {
      ...options,
      onEnd: () => speak(word, options),
    });
    return;
  }
  speak(question.prompt, options);
}

export function replayQuizWord(question: QuizQuestion, rate?: number, voice?: string | null): void {
  if (!question.spokenWord) return;
  speak(question.spokenWord, speechOptions(rate, voice));
}
