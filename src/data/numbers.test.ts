import { describe, it, expect } from 'vitest';
import { numberData } from './numbers';

describe('Number Data', () => {
  it('contains numbers 0-20', () => {
    expect(numberData).toHaveLength(21);
    for (let i = 0; i <= 20; i++) {
      expect(numberData[i].value).toBe(i);
    }
  });

  it('has required fields for every number', () => {
    for (const n of numberData) {
      expect(n.word).toBeTruthy();
      expect(n.description).toBeTruthy();
      expect(n.emoji).toBeTruthy();
      expect(n.objects).toBeTruthy();
    }
  });

  it('zero word is "Zero"', () => {
    expect(numberData[0].word).toBe('Zero');
  });
});
