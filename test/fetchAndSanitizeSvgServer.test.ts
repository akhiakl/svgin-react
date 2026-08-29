import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgServer';
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

// This wires the real server sanitizer (DOMPurify inside a jsdom window)
// through createFetchAndSanitizeSvg, unlike fetchAndSanitizeSvgBase.test.ts
// which passes a mock sanitizer.
describe('fetchAndSanitizeSvg (server entry point, real DOMPurify + jsdom)', () => {
    beforeEach(() => {
        clearSvgCache();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches and sanitizes with the real server sanitizer', async () => {
        mockFetchOnce('<svg><script>alert(1)</script><circle r="5"/></svg>');
        const result = await fetchAndSanitizeSvg('https://example.com/server.svg');
        expect(result).not.toContain('<script');
        expect(result).toContain('<circle');
    });

    it('runs a custom sanitizeFn instead of the default sanitizer', async () => {
        mockFetchOnce('<svg>raw</svg>');
        const customSanitize = vi.fn().mockResolvedValue('<svg>custom</svg>');
        const result = await fetchAndSanitizeSvg('https://example.com/server-custom.svg', {
            sanitizeFn: customSanitize,
        });
        expect(result).toBe('<svg>custom</svg>');
        expect(customSanitize).toHaveBeenCalledWith('<svg>raw</svg>');
    });
});
