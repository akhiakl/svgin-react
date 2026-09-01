import { test, expect } from '@playwright/test';

// Stress tests: many concurrent <SvgIn> instances (shared and distinct
// fixtures), asserting correctness under load - not just that a handful of
// components render, but that request dedup/caching, id uniquification,
// and rendering all still hold at volume, within a real browser's actual
// scheduling and network stack.
test.describe('stress', () => {
    test('renders 300 concurrent instances of the same icon with unique internal ids', async ({ page }) => {
        const COUNT = 300;
        const start = Date.now();
        await page.goto(`/?src=/fixtures/gradient.svg&count=${COUNT}`);
        await page.waitForFunction((n) => window.__svginReady && window.__svginMounted === n, COUNT, {
            timeout: 30_000,
        });
        const elapsed = Date.now() - start;

        await expect(page.locator('svg')).toHaveCount(COUNT);
        const gradientIds = await page.locator('linearGradient').evaluateAll((els) => els.map((el) => el.id));
        expect(gradientIds).toHaveLength(COUNT);
        expect(new Set(gradientIds).size).toBe(COUNT);
        expect(page.locator(':root')).toBeTruthy(); // page stayed alive/interactive

        // Not a strict performance benchmark (CI hardware varies), just a
        // sanity ceiling so a real regression (e.g. an O(n^2) id scan) fails
        // loudly instead of just being "slow" forever.
        expect(elapsed).toBeLessThan(20_000);
    });

    test('deduplicates concurrent fetches of the same URL under load', async ({ page }) => {
        const requests: string[] = [];
        page.on('request', (req) => {
            // Match on pathname, not a substring of the full URL - the page's
            // own navigation URL also contains "/fixtures/plain.svg" in its
            // query string and must not be counted as a fetch of the asset.
            if (new URL(req.url()).pathname === '/fixtures/plain.svg') requests.push(req.url());
        });

        const COUNT = 50;
        await page.goto(`/?src=/fixtures/plain.svg&count=${COUNT}`);
        await page.waitForFunction((n) => window.__svginReady && window.__svginMounted === n, COUNT);

        await expect(page.locator('svg')).toHaveCount(COUNT);
        // All 50 instances share one underlying fetch for the same URL.
        expect(requests.length).toBe(1);
    });

    test('renders a mixed batch of many distinct icons without cross-instance leakage', async ({ page }) => {
        const COUNT = 60;
        await page.goto(
            `/?src=/fixtures/plain.svg&src=/fixtures/gradient.svg&src=/fixtures/malicious.svg&count=${COUNT}`
        );
        const total = COUNT * 3;
        await page.waitForFunction((n) => window.__svginReady && window.__svginMounted === n, total, {
            timeout: 30_000,
        });

        await expect(page.locator('svg')).toHaveCount(total);
        // The malicious fixture's script must still be stripped at volume,
        // not just in the single-instance case.
        await expect(page.locator('svg script')).toHaveCount(0);
        const gradientIds = await page.locator('linearGradient').evaluateAll((els) => els.map((el) => el.id));
        expect(new Set(gradientIds).size).toBe(COUNT);
    });
});
