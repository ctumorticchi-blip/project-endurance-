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
  retries: process.env.CI ? 2 : 0,
  // On CI, 'github' annotates failures inline on the run; the HTML report
  // is written alongside it (never opened automatically) so a failure can
  // upload it as an artifact for a full trace/screenshot, not just a message.
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // This sandbox pre-installs Chromium at a fixed path rather than the
    // version Playwright itself would download for this pinned
    // @playwright/test release — point at it explicitly. On CI (GitHub
    // Actions sets `CI`), that path doesn't exist: `playwright install`
    // puts the browser wherever Playwright's own cache expects it, so
    // leave `executablePath` unset there and let it find it itself.
    launchOptions: {
      executablePath: process.env.CI
        ? undefined
        : (process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'),
    },
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
