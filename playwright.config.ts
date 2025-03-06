import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: '크롬',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '파이어폭스',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: '모바일 크롬',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: '모바일 사파리',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}); 