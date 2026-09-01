import { test, expect } from '@playwright/test';

test.describe('SVG internal id collisions', () => {
    test('gives each instance its own gradient/clipPath ids and keeps references pointing at the right one', async ({ page }) => {
        await page.goto('/?src=/fixtures/gradient.svg&count=5');
        await page.waitForFunction(() => window.__svginMounted === 5);

        const gradientIds = await page.locator('linearGradient').evaluateAll((els) => els.map((el) => el.id));
        const clipIds = await page.locator('clipPath').evaluateAll((els) => els.map((el) => el.id));
        expect(gradientIds).toHaveLength(5);
        expect(clipIds).toHaveLength(5);
        expect(new Set(gradientIds).size).toBe(5);
        expect(new Set(clipIds).size).toBe(5);

        // Each rect's fill/clip-path must reference its own instance's
        // gradient/clipPath, never another instance's - actual rendering
        // (not just distinct ids) depends on this being correct.
        const rects = page.locator('rect');
        const count = await rects.count();
        expect(count).toBe(5);
        for (let i = 0; i < count; i++) {
            const rect = rects.nth(i);
            const fill = await rect.getAttribute('fill');
            const clipPath = await rect.getAttribute('clip-path');
            expect(fill).toBe(`url(#${gradientIds[i]})`);
            expect(clipPath).toBe(`url(#${clipIds[i]})`);
        }
        // Note: this fixture's <use href="#base-shape"> is not checked here -
        // DOMPurify's svg profile strips <use> entirely under default
        // sanitization (verified separately below with disableSanitization),
        // so it never reaches the DOM in this default-sanitized render.
    });

    test('rewires <use href> references to the correct per-instance id (disableSanitization)', async ({ page }) => {
        const COUNT = 3;
        await page.goto(`/?src=/fixtures/gradient.svg&count=${COUNT}&unsafe=1`);
        await page.waitForFunction((n) => window.__svginMounted === n, COUNT);

        const uses = page.locator('use');
        await expect(uses).toHaveCount(COUNT);
        for (let i = 0; i < COUNT; i++) {
            const href = await uses.nth(i).getAttribute('href');
            expect(href).toMatch(/^#base-shape-svgin\d+$/);
            const svg = page.locator('svg').nth(i);
            const shapeId = await svg.locator('#' + href!.slice(1)).getAttribute('id');
            expect(shapeId).toBe(href!.slice(1));
        }
        const shapeIds = await page.locator('path#base-shape, path[id^="base-shape-"]').evaluateAll((els) =>
            els.map((el) => el.id)
        );
        expect(new Set(shapeIds).size).toBe(COUNT);
    });
});
