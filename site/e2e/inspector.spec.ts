import { test, expect } from '@playwright/test';

test.describe('Inspector', () => {
    test('loads with the clean example rendered and sanitized', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        // Main preview tile + the two-copy id-uniquify demo = 3 <svg>.
        await expect(page.locator('svg')).toHaveCount(3);
    });

    test('reports no removed elements/attributes for the clean example', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /^what changed$/i }).click();
        await expect(page.getByText(/nothing was removed/i)).toBeVisible();
    });

    test('sanitizes the untrusted payload example: no <script>, no inline handlers in the DOM', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /untrusted payload/i }).click();

        const previewSvg = page.locator('.preview-tile').first().locator('svg');
        await expect(previewSvg.locator('script')).toHaveCount(0);
        expect(await previewSvg.getAttribute('onload')).toBeNull();
        expect(await previewSvg.locator('circle').getAttribute('onmouseover')).toBeNull();
    });

    test('reports exactly what was stripped from the untrusted payload example', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /untrusted payload/i }).click();
        await page.getByRole('button', { name: /what changed/i }).click();

        const changes = page.locator('.changes-area');
        await expect(changes.getByText('<script>')).toBeVisible();
        await expect(changes.getByText('onload', { exact: true })).toBeVisible();
        await expect(changes.getByText('onmouseover', { exact: true })).toBeVisible();
        await expect(changes.getByText(/\d+ fewer bytes/)).toBeVisible();
    });

    test('the "What changed" tab shows a dot marker once something is actually removed', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('button', { name: /^what changed$/i })).toBeVisible();
        await page.getByRole('button', { name: /untrusted payload/i }).click();
        await expect(page.getByRole('button', { name: /what changed ●/i })).toBeVisible();
    });

    test('"show unsanitized too" reveals the raw markup, still without executing anything against the visitor', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /untrusted payload/i }).click();
        await expect(page.locator('.preview-tile.danger')).toHaveCount(0);

        const dialogs: string[] = [];
        page.on('dialog', (d) => { dialogs.push(d.message()); void d.dismiss(); });

        await page.getByRole('checkbox', { name: /show unsanitized/i }).check();
        const dangerTile = page.locator('.preview-tile.danger');
        await expect(dangerTile).toHaveCount(1);
        // The raw <script> tag is present in the DOM (proving sanitization was
        // actually skipped) - browsers never execute a <script> element
        // inserted via innerHTML, so this does not pop an alert either way.
        await expect(dangerTile.locator('script')).toHaveCount(1);
        await page.waitForTimeout(200);
        expect(dialogs).toEqual([]);

        await page.getByRole('checkbox', { name: /show unsanitized/i }).uncheck();
        await expect(page.locator('.preview-tile.danger')).toHaveCount(0);
    });

    test('gives the two-copy id-uniquify demo distinct gradient ids for the gradient example', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /gradient \+ defs/i }).click();

        const gradients = page.locator('.dupe-row linearGradient');
        await expect(gradients).toHaveCount(2);
        const [first, second] = await gradients.evaluateAll((els) => els.map((el) => el.id));
        expect(first).not.toBe(second);
        expect(first).toBeTruthy();
        expect(second).toBeTruthy();
    });

    test('renders custom pasted markup and deselects the active preset', async ({ page }) => {
        await page.goto('/');
        const textarea = page.locator('.code-input');
        await textarea.fill('<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>');

        await expect(page.locator('.chip-active')).toHaveCount(0);
        await expect(page.locator('.preview-tile').first().locator('rect')).toHaveCount(1);
    });

    test('shows the sanitized markup as text on the "Sanitized markup" tab', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /sanitized markup/i }).click();
        await expect(page.locator('.code-output')).toContainText('<svg');
    });

    test('shows a CORS-flavored error message when loading from an unreachable URL', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder(/load from a url/i).fill('https://this-domain-does-not-exist.invalid/icon.svg');
        await page.getByRole('button', { name: /^load$/i }).click();
        await expect(page.getByText(/CORS restriction/i)).toBeVisible({ timeout: 15_000 });
    });
});
