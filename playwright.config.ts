import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { config } from './config/env';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
});

export default defineConfig({
  testDir,
  globalSetup: require.resolve('./support/global-setup'),
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: config.workers,
  forbidOnly: !!process.env.CI,
  retries: config.retries,
  reporter: [
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        environmentInfo: {
          Base_URL: config.baseURL,
          API_URL: config.apiURL,
          Node: process.version,
          Workers: String(config.workers),
          CI: process.env.CI ? 'true' : 'false',
        },
      },
    ],
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: config.baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
