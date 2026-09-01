import { test, expect } from '@playwright/test';

test.describe('basic rendering', () => {
    test('renders a fetched SVG inline as a real <svg> element, not an <img>', async ({ page }) => {
        await page.goto('/?src=/fixtures/plain.svg');
        const svg = page.locator('svg').first();
        await expect(svg).toBeVisible();
        await expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        await expect(svg.locator('circle')).toHaveCount(1);
        await expect(page.locator('img')).toHaveCount(0);
    });

    test('applies width/height props to the rendered element', async ({ page }) => {
        await page.goto('/?src=/fixtures/plain.svg');
        const svg = page.locator('svg').first();
        await expect(svg).toHaveAttribute('width', '24');
        await expect(svg).toHaveAttribute('height', '24');
    });

    test('calls onMount with the real mounted svg element', async ({ page }) => {
        await page.goto('/?src=/fixtures/plain.svg');
        await page.waitForFunction(() => window.__svginMounted === 1);
    });

    test('calls onError and renders no svg for a broken URL', async ({ page }) => {
        await page.goto('/?src=/fixtures/does-not-exist.svg');
        await page.waitForFunction(() => window.__svginErrors.length === 1);
        await expect(page.locator('svg')).toHaveCount(0);
    });
});

test.describe('accessibility wiring', () => {
    test('wires aria-labelledby/aria-describedby to injected title/desc', async ({ page }) => {
        await page.goto('/?src=/fixtures/plain.svg&a11y=1');
        const svg = page.locator('svg').first();
        const titleId = await svg.locator('title').getAttribute('id');
        const descId = await svg.locator('desc').getAttribute('id');
        expect(titleId).toBeTruthy();
        expect(descId).toBeTruthy();
        await expect(svg).toHaveAttribute('aria-labelledby', titleId!);
        await expect(svg).toHaveAttribute('aria-describedby', descId!);
        await expect(svg.locator('title')).toHaveText('Test icon');
        await expect(svg.locator('desc')).toHaveText('A test icon for e2e assertions');
    });
});
