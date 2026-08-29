import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgClient';
import { clearSvgCache } from '../src/utils/svgCache';

function mockFetchOnce(body: string) {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(body),
        })
    );
}

// This wires the real client sanitizer (DOMPurify against the jsdom global
// window) through createFetchAndSanitizeSvg, unlike
// fetchAndSanitizeSvgBase.test.ts which passes a mock sanitizer.
describe('fetchAndSanitizeSvg (client entry point, real DOMPurify)', () => {
    beforeEach(() => {
        clearSvgCache();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches and sanitizes with the real client sanitizer', async () => {
        mockFetchOnce('<svg><script>alert(1)</script><circle r="5"/></svg>');
        const result = await fetchAndSanitizeSvg('https://example.com/client.svg');
        expect(result).not.toContain('<script');
        expect(result).toContain('<circle');
    });

    it('skips sanitization when disableSanitization is set', async () => {
        mockFetchOnce('<svg><script>alert(1)</script></svg>');
        const result = await fetchAndSanitizeSvg('https://example.com/client-raw.svg', {
            disableSanitization: true,
        });
        expect(result).toContain('<script');
    });
});
