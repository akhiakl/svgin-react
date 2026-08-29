import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { preloadSvg } from '../src/preload';
import { clearSvgCache, getCachedSvg, setCachedSvg } from '../src/utils/svgCache';

function mockFetchOnce(body: string) {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(body),
        })
    );
}

describe('preloadSvg', () => {
    beforeEach(() => {
        clearSvgCache();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches, sanitizes with the default (server) sanitizer, and populates the shared cache', async () => {
        mockFetchOnce('<svg><script>alert(1)</script><circle r="5"/></svg>');
        await preloadSvg('https://example.com/preload-a.svg');

        const cached = getCachedSvg('https://example.com/preload-a.svg');
        expect(cached).not.toContain('<script');
        expect(cached).toContain('<circle');
    });

    it('does nothing if the shared svg cache already has an entry for the url', async () => {
        // Pre-populate svgCache directly (rather than via a first preloadSvg
        // call) so this exercises preloadSvgImpl's own early-return check
        // rather than the outer setUniversalCache memoization layer.
        setCachedSvg('https://example.com/preload-b.svg', '<svg>already-cached</svg>');

        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await preloadSvg('https://example.com/preload-b.svg');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not write to the shared cache when disableSanitization is set', async () => {
        mockFetchOnce('<svg><script>alert(1)</script></svg>');
        await preloadSvg('https://example.com/preload-c.svg', { disableSanitization: true });
        expect(getCachedSvg('https://example.com/preload-c.svg')).toBeUndefined();
    });

    it('does not write to the shared cache when a custom sanitizeFn is set', async () => {
        mockFetchOnce('<svg>raw</svg>');
        const customSanitize = vi.fn().mockResolvedValue('<svg>custom</svg>');
        await preloadSvg('https://example.com/preload-d.svg', { sanitizeFn: customSanitize });
        expect(getCachedSvg('https://example.com/preload-d.svg')).toBeUndefined();
    });

    it('throws when the fetch response is not ok', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        await expect(preloadSvg('https://example.com/preload-missing.svg')).rejects.toThrow(
            'Failed to fetch SVG'
        );
    });
});
