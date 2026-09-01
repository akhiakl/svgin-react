import { defineConfig, devices } from '@playwright/test';

// End-to-end tests for the Inspector site (site/), in a real browser -
// covering things a jsdom component test cannot: real DOMPurify script
// execution semantics, real clipboard/file interactions if added later, and
// that the actual built (or dev-served) page works end to end, not just its
// component tree in isolation.
export default defineConfig({
    testDir: './site/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: 'http://localhost:4174',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
    webServer: {
        command: 'pnpm run site:dev',
        url: 'http://localhost:4174',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
