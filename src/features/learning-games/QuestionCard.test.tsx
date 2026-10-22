import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QuestionCard from './QuestionCard';
import { LISTEN_PROMPT, REPLAY_WORD_LABEL } from './questions';

const listenQuestion = {
  type: 'listen' as const,
  prompt: LISTEN_PROMPT,
  correctAnswer: 'Apple',
  spokenWord: 'Apple',
  options: ['Apple', 'Ball', 'Cat', 'Dog'],
};

describe('Listen and Choose question card', () => {
  it('does not reveal the target word before an answer is chosen', () => {
    render(
      <QuestionCard
        question={listenQuestion}
        answered={null}
        onAnswer={vi.fn()}
        onReplay={vi.fn()}
        speechEnabled
      />,
    );

    const prompt = screen.getByTestId('quiz-prompt');
    expect(prompt.textContent).toContain(LISTEN_PROMPT);
    expect(prompt.textContent?.toLowerCase()).not.toContain('apple');
    expect(screen.queryByText(/the answer is/i)).toBeNull();

    const replay = screen.getByRole('button', { name: REPLAY_WORD_LABEL });
    expect(replay.textContent?.toLowerCase()).not.toContain('apple');
    document.querySelectorAll('[aria-label]').forEach((element) => {
      expect(element.getAttribute('aria-label')?.toLowerCase()).not.toContain('apple');
    });
  });
});
