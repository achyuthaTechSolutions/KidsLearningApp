export interface ParentChallenge {
  prompt: string;
  answer: number;
}

/** A short addition check so a young child does not reset progress or leave the app. */
export function createParentChallenge(random: () => number = Math.random): ParentChallenge {
  const left = 6 + Math.floor(random() * 7);
  const right = 4 + Math.floor(random() * 6);
  return {
    prompt: `What is ${left} + ${right}?`,
    answer: left + right,
  };
}

export function isParentAnswer(challenge: ParentChallenge, value: string): boolean {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  return Number(trimmed) === challenge.answer;
}
