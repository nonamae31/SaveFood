import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for SaveFood E2E Tests.
 * See https://playwright.dev/docs/test-configuration.
 *
 * NOTE: Servers (Frontend & Backend) are NOT started automatically here.
 * The qa-engineer and e2e-flow-writer skills are responsible for starting
 * them as background tasks before invoking Playwright.
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/results',

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: './tests/e2e/html-report', open: 'never' }],
  ],

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Default timeout for actions */
    actionTimeout: 10000,

    /* Default navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
