import { describe, expect, it } from 'vitest';

// The engine and the story files are meant to be shared with a React Native app
// (docs/architecture/MOBILE_ARCHITECTURE.md), so they may import only each other.
const sources = {
  ...import.meta.glob('./*.ts', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob(['../content/{thirstyCrow,cleverRabbit,lionMouse,monkeyCrocodile,cooperativeDoves,characters}.ts'], { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>;

describe('Shareable story domain', () => {
  it('imports no React, DOM, browser, or bundler code', () => {
    const files = Object.entries(sources).filter(([file]) => !file.endsWith('.test.ts'));
    expect(files.length).toBeGreaterThan(10);
    for (const [file, source] of files) {
      const imports = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1]);
      for (const path of imports) expect(path, `${file} imports ${path}`).toMatch(/^\.\/[a-zA-Z]+$|^\.\.\/engine\/[a-zA-Z]+$/);
      expect(source, file).not.toMatch(/import\.meta|window\.|document\.|localStorage/);
    }
  });
});
