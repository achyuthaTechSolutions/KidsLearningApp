import { describe, it, expect } from 'vitest';
import { specialKeyData, punctuationData } from './specialKeys';

describe('Special Key Data', () => {
  it('includes space, enter, backspace, tab, escape, shift', () => {
    expect(specialKeyData[' ']).toBeDefined();
    expect(specialKeyData['Enter']).toBeDefined();
    expect(specialKeyData['Backspace']).toBeDefined();
    expect(specialKeyData['Tab']).toBeDefined();
    expect(specialKeyData['Escape']).toBeDefined();
    expect(specialKeyData['Shift']).toBeDefined();
  });

  it('includes all arrow keys', () => {
    expect(specialKeyData['ArrowUp']).toBeDefined();
    expect(specialKeyData['ArrowDown']).toBeDefined();
    expect(specialKeyData['ArrowLeft']).toBeDefined();
    expect(specialKeyData['ArrowRight']).toBeDefined();
  });

  it('has name and description for all special keys', () => {
    for (const key of Object.values(specialKeyData)) {
      expect(key.name).toBeTruthy();
      expect(key.description).toBeTruthy();
    }
  });

  it('has punctuation data for common symbols', () => {
    expect(punctuationData['.']).toBeDefined();
    expect(punctuationData[',']).toBeDefined();
    expect(punctuationData['!']).toBeDefined();
    expect(punctuationData['?']).toBeDefined();
  });
});
