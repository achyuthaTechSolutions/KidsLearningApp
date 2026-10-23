import { copyFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'

/** Project site path: https://achyuthatechsolutions.github.io/KidsLearningApp/ */
const pagesBase = '/KidsLearningApp/'

function githubPagesSpa(): Plugin {
  return {
    name: 'github-pages-spa',
    apply: 'build',
    closeBundle() {
      if (process.env.GITHUB_PAGES !== 'true') return
      const dist = resolve('dist')
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
      writeFileSync(resolve(dist, '.nojekyll'), '')
    },
  }
}

export default defineConfig({
  // Local dev, preview, and the Android shell stay at /. GitHub Pages serves the project site under the repo name.
  base: process.env.GITHUB_PAGES === 'true' ? pagesBase : '/',
  plugins: [react(), githubPagesSpa()],
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
    // Browser tests run with Playwright (`npm run test:e2e`), not Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
