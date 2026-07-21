import { defineConfig, devices } from '@playwright/test';

const frontendPort = process.env.E2E_FRONTEND_PORT ?? '5174';
const frontendURL = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: frontendURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: `npm run dev -- --port ${frontendPort}`, url: frontendURL, reuseExistingServer: false, timeout: 120_000, env: { VITE_DEV_API_PROXY_TARGET: process.env.E2E_API_URL ?? 'http://localhost:8080' } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
