import { defineConfig, devices } from '@playwright/test';

// End-to-end browser matrix + stress testing for the built (client-side)
// <SvgIn /> component, against the harness in e2e/playground. This
// exercises real browser DOM/fetch/CSSOM behavior that jsdom (used by the
// Vitest unit suite) does not fully replicate - actual `<script>` execution
// semantics for the sanitization tests, real gradient/clipPath rendering
// for the id-uniqueness tests, and real concurrent fetch/render scheduling
// for the stress tests.
export default defineConfig({
    testDir: './e2e/tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
    webServer: {
        command: 'pnpm exec vite --config e2e/playground/vite.config.mts',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
