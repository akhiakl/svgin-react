import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSvgCache, getCachedSvg, setCachedSvg } from '../src/utils/svgCache';

// Mock the server sanitizer so tests don't load jsdom
vi.mock('../src/utils/sanitizeServer', () => ({
    sanitizeSvg: vi.fn().mockResolvedValue('<svg>sanitized</svg>'),
}));

import { preloadSvg } from '../src/preload';
import { sanitizeSvg } from '../src/utils/sanitizeServer';

const mockSanitize = vi.mocked(sanitizeSvg);

function mockFetchOk(body: string, contentType?: string) {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
            ok: true,
            headers: contentType ? { get: () => contentType } : undefined,
            text: () => Promise.resolve(body),
        })
    );
}

describe('preloadSvg', () => {
    beforeEach(() => {
        clearSvgCache();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches, sanitizes and caches the SVG for the default mode', async () => {
        mockFetchOk('<svg><path/></svg>');
        await preloadSvg('https://example.com/preload-default.svg');
        expect(getCachedSvg('https://example.com/preload-default.svg')).toBe('<svg>sanitized</svg>');
        expect(mockSanitize).toHaveBeenCalledWith('<svg><path/></svg>');
    });

    it('skips the fetch entirely when the URL is already cached in default mode', async () => {
        // Pre-populates the shared cache directly (as a prior fetchAndSanitizeSvg
        // call, or an earlier preloadSvg for a *different* set of options, would
        // have) rather than via preloadSvg itself - preloadSvg's own outer
        // memoization would otherwise short-circuit a second identical call
        // before ever reaching this cache check again.
        setCachedSvg('https://example.com/already-cached.svg', '<svg>already-cached</svg>');
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        await preloadSvg('https://example.com/already-cached.svg');

        expect(fetchMock).not.toHaveBeenCalled();
        expect(mockSanitize).not.toHaveBeenCalled();
    });

    it('skips the fetch if the URL is already in the shared cache', async () => {
        mockFetchOk('<svg><path/></svg>');
        await preloadSvg('https://example.com/preload-skip.svg');
        await preloadSvg('https://example.com/preload-skip.svg');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('throws when the fetch response is not ok', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        await expect(
            preloadSvg('https://example.com/preload-fail.svg')
        ).rejects.toThrow('Failed to fetch SVG');
    });

    it('throws when the Content-Type is clearly not SVG', async () => {
        mockFetchOk('<html>not svg</html>', 'text/html');
        await expect(
            preloadSvg('https://example.com/preload-html.svg')
        ).rejects.toThrow('Unexpected content-type');
    });

    it('fetches but does not cache when disableSanitization is true', async () => {
        mockFetchOk('<svg><script>evil()</script></svg>');
        await preloadSvg('https://example.com/preload-raw.svg', { disableSanitization: true });
        expect(getCachedSvg('https://example.com/preload-raw.svg')).toBeUndefined();
        expect(mockSanitize).not.toHaveBeenCalled();
    });

    it('calls the provided sanitizeFn but does not store in shared cache', async () => {
        const customFn = vi.fn().mockResolvedValue('<svg>custom</svg>');
        mockFetchOk('<svg><path/></svg>');
        await preloadSvg('https://example.com/preload-custom.svg', { sanitizeFn: customFn });
        expect(customFn).toHaveBeenCalledWith('<svg><path/></svg>');
        expect(getCachedSvg('https://example.com/preload-custom.svg')).toBeUndefined();
        // Default sanitizer must NOT have been called.
        expect(mockSanitize).not.toHaveBeenCalled();
    });

    it('does not return a cached result for a disableSanitization call even if the URL was previously preloaded', async () => {
        // First: standard preload (stores in cache).
        mockFetchOk('<svg><path/></svg>');
        await preloadSvg('https://example.com/preload-mixed.svg');
        expect(fetch).toHaveBeenCalledTimes(1);

        // Second: disableSanitization — usesSharedCache is false, must still fetch.
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<svg><path/></svg>'),
        }));
        await preloadSvg('https://example.com/preload-mixed.svg', { disableSanitization: true });
        expect(fetch).toHaveBeenCalledTimes(1); // second stub's count
    });

    it('passes fetchOptions through to fetch and does not store the result in the shared cache', async () => {
        mockFetchOk('<svg><path/></svg>');
        const fetchOptions = { headers: { Authorization: 'Bearer token' } };
        await preloadSvg('https://example.com/preload-auth.svg', { fetchOptions });
        expect(fetch).toHaveBeenCalledWith('https://example.com/preload-auth.svg', fetchOptions);
        expect(getCachedSvg('https://example.com/preload-auth.svg')).toBeUndefined();
    });

    it('does not return a cached result for a fetchOptions call even if the URL was previously preloaded', async () => {
        mockFetchOk('<svg><path/></svg>');
        await preloadSvg('https://example.com/preload-mixed2.svg');
        expect(fetch).toHaveBeenCalledTimes(1);

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<svg><path/></svg>'),
        }));
        await preloadSvg('https://example.com/preload-mixed2.svg', {
            fetchOptions: { headers: { Authorization: 'Bearer token' } },
        });
        expect(fetch).toHaveBeenCalledTimes(1); // second stub's count
    });
});
