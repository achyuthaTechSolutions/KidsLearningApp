import { spokenQuizLines } from '../../../packages/learning-core/src/speech/lines';
import { cancelSpeech, speak } from '../../services/speech';
import type { QuizQuestion } from './questions';

function speechOptions(rate?: number, voice?: string | null) {
  return { rate, voice: voice || undefined };
}

export function speakQuizQuestion(question: QuizQuestion, rate?: number, voice?: string | null): void {
  const options = speechOptions(rate, voice);
  const [first, followUp] = spokenQuizLines(question);
  cancelSpeech();
  if (followUp) {
    speak(first, {
      ...options,
      onEnd: () => speak(followUp, options),
    });
    return;
  }
  speak(first, options);
}

export function replayQuizWord(question: QuizQuestion, rate?: number, voice?: string | null): void {
  if (!question.spokenWord) return;
  speak(question.spokenWord, speechOptions(rate, voice));
}
