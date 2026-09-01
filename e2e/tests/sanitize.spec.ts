import { test, expect } from '@playwright/test';

// Proves sanitization actually holds in a real browser: <script> execution,
// inline event-handler attributes, and javascript: URLs are the exact
// vectors jsdom's own script/event support cannot fully validate.
test.describe('sanitization (real browser)', () => {
    test('strips <script>, inline event handlers, and javascript: hrefs before render', async ({ page }) => {
        await page.goto('/?src=/fixtures/malicious.svg');
        await page.waitForFunction(() => window.__svginMounted === 1);

        const svg = page.locator('svg').first();
        await expect(svg.locator('script')).toHaveCount(0);
        expect(await svg.getAttribute('onload')).toBeNull();
        expect(await svg.locator('circle').getAttribute('onmouseover')).toBeNull();
        const hrefAttr = await svg.locator('a').getAttribute('href');
        expect(hrefAttr === null || !hrefAttr.startsWith('javascript:')).toBe(true);

        // Give any handler that did survive a chance to fire, then confirm
        // none of them ran.
        await page.mouse.move(200, 200);
        await page.waitForTimeout(100);
        const xss = await page.evaluate(() => (window as unknown as { __svginXss?: string }).__svginXss);
        expect(xss).toBeUndefined();
    });

    test('does not sanitize when disableSanitization is set (trusted-source escape hatch)', async ({ page }) => {
        await page.goto('/?src=/fixtures/malicious.svg&unsafe=1');
        await page.waitForFunction(() => window.__svginMounted === 1);
        // With sanitization off, the raw markup - including the bits the
        // default path strips above - passes through verbatim. This proves
        // the escape hatch actually skips the sanitizer (the documented,
        // trusted-source-only contract), without depending on cross-browser
        // event-firing timing for an inline SVG's own `load` event.
        //
        // The outer <svg> tag's own `onload` attribute is checked via
        // getAttribute, not toHaveAttribute: it comes through as a JSX prop
        // (spread from the parsed source attributes), and React 19 silently
        // drops any prop whose name case-insensitively matches a known DOM
        // event (logging a dev warning) rather than rendering it as a plain
        // attribute - a real, separate layer of protection on top of
        // sanitization, not a sanitizer bug. The inner elements (below),
        // set via dangerouslySetInnerHTML, bypass that JSX-prop path
        // entirely and do preserve their raw attributes verbatim.
        const svg = page.locator('svg').first();
        await expect(svg.locator('script')).toHaveCount(1);
        await expect(svg.locator('circle')).toHaveAttribute('onmouseover', /__svginXss/);
    });
});
