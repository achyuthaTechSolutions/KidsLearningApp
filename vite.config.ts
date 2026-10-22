/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep illustrations as separate files so <img> loads them on demand instead of
    // inlining all of them as data URIs in the main bundle.
    assetsInlineLimit: (filePath) => (filePath.includes('/assets/illustrations/') ? false : undefined),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
