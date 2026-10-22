module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@kids/learning-core$': '<rootDir>/../packages/learning-core/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
