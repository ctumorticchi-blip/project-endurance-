import { defineConfig, devices } from '@playwright/test'

/**
 * Real-browser accessibility/E2E suite (M1.8) — separate from the Vitest
 * unit suite because jsdom cannot compute actual painted colors, so a
 * genuine WCAG color-contrast check needs a real rendered page. Not part
 * of `npm run check`: it's slower and needs a browser, so it's an
 * explicit `npm run test:e2e` a developer or CI runs deliberately.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // This environment pre-installs Chromium at a fixed path rather than
    // the version Playwright itself would download for this pinned
    // @playwright/test release — point at it explicitly.
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
    },
    viewport: { width: 390, height: 844 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
