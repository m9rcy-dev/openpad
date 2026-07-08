import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright smoke-test configuration.
 *
 * These are end-to-end sanity checks against a production build, not a
 * substitute for the unit/component suite (`npm test`) — see PROGRESS.md
 * M9 for the split of responsibility. `webServer` builds once and serves
 * the static output, matching what actually ships to GitHub Pages.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
