import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgBase';
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

describe('createFetchAndSanitizeSvg', () => {
    beforeEach(() => {
        clearSvgCache();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('sanitizes with the default sanitizer and caches the result', async () => {
        mockFetchOnce('<svg><script>evil()</script></svg>');
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>clean</svg>');
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(defaultSanitize);

        const first = await fetchAndSanitizeSvg('https://example.com/a.svg');
        expect(first).toBe('<svg>clean</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(1);

        // Second call for the same URL should hit the cache: no new fetch, no
        // second sanitize call.
        const second = await fetchAndSanitizeSvg('https://example.com/a.svg');
        expect(second).toBe('<svg>clean</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('throws when the fetch response is not ok', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(vi.fn());
        await expect(fetchAndSanitizeSvg('https://example.com/missing.svg')).rejects.toThrow(
            'Failed to fetch SVG'
        );
    });

    it('does not poison the shared cache with a disableSanitization result', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>sanitized</svg>');
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(defaultSanitize);

        // A raw/untrusted call for this URL happens first.
        mockFetchOnce('<svg><script>evil()</script></svg>');
        const raw = await fetchAndSanitizeSvg('https://example.com/shared.svg', {
            disableSanitization: true,
        });
        expect(raw).toBe('<svg><script>evil()</script></svg>');

        // A later default-sanitizer call for the *same* URL must still run the
        // default sanitizer and must never see the unsanitized result that came
        // back from the disableSanitization call above.
        mockFetchOnce('<svg><script>evil()</script></svg>');
        const sanitized = await fetchAndSanitizeSvg('https://example.com/shared.svg');
        expect(sanitized).toBe('<svg>sanitized</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
    });

    it('does not poison the shared cache with a custom sanitizeFn result', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>default-clean</svg>');
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(defaultSanitize);
        const customSanitize = vi.fn().mockResolvedValue('<svg>custom-clean</svg>');

        mockFetchOnce('<svg>raw</svg>');
        const custom = await fetchAndSanitizeSvg('https://example.com/shared2.svg', {
            sanitizeFn: customSanitize,
        });
        expect(custom).toBe('<svg>custom-clean</svg>');

        mockFetchOnce('<svg>raw</svg>');
        const defaultResult = await fetchAndSanitizeSvg('https://example.com/shared2.svg');
        expect(defaultResult).toBe('<svg>default-clean</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
    });

    it('does not share the cache across disableSanitization and custom sanitizeFn calls either', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ ok: true, text: () => Promise.resolve('<svg>raw</svg>') });
        vi.stubGlobal('fetch', fetchMock);

        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(vi.fn());
        const customSanitize = vi.fn().mockResolvedValue('<svg>custom</svg>');

        await fetchAndSanitizeSvg('https://example.com/shared3.svg', { disableSanitization: true });
        const custom = await fetchAndSanitizeSvg('https://example.com/shared3.svg', {
            sanitizeFn: customSanitize,
        });

        expect(custom).toBe('<svg>custom</svg>');
        // Neither call was served from a cached entry belonging to the other mode.
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not collide a custom sanitizeFn call with an explicit default-mode {} call on the outer memoization layer', async () => {
        // Regression test for a real bug found in review: the setUniversalCache
        // fallback used to key its own memoization with JSON.stringify(args).
        // JSON.stringify drops object properties whose value is a function, so
        // { sanitizeFn: someFn } and {} both stringified to the same "{}" - a
        // custom-sanitizeFn call could collide with, and short-circuit to, an
        // unrelated default-mode call's cached *promise*, before
        // fetchAndSanitizeSvgImpl's own mode-aware svgCache logic ever ran.
        // Passing an explicit {} (rather than omitting the options argument)
        // reproduces the exact shape that used to collide.
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ ok: true, text: () => Promise.resolve('<svg>raw</svg>') });
        vi.stubGlobal('fetch', fetchMock);

        const defaultSanitize = vi.fn().mockResolvedValue('<svg>default-clean</svg>');
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(defaultSanitize);
        const customSanitize = vi.fn().mockResolvedValue('<svg>custom-clean</svg>');

        const custom = await fetchAndSanitizeSvg('https://example.com/shared4.svg', {
            sanitizeFn: customSanitize,
        });
        const defaultResult = await fetchAndSanitizeSvg('https://example.com/shared4.svg', {});

        expect(custom).toBe('<svg>custom-clean</svg>');
        expect(defaultResult).toBe('<svg>default-clean</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('still shares a cache entry when the same sanitizeFn reference is reused', async () => {
        // The fix must not turn every custom-sanitizeFn call into a permanent
        // cache miss: the same function reference for the same URL should
        // still be memoized like any other call.
        mockFetchOnce('<svg>raw</svg>');
        const customSanitize = vi.fn().mockResolvedValue('<svg>custom-clean</svg>');
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(vi.fn());

        const first = await fetchAndSanitizeSvg('https://example.com/reuse.svg', {
            sanitizeFn: customSanitize,
        });
        const second = await fetchAndSanitizeSvg('https://example.com/reuse.svg', {
            sanitizeFn: customSanitize,
        });

        expect(first).toBe('<svg>custom-clean</svg>');
        expect(second).toBe('<svg>custom-clean</svg>');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('treats a cached empty string as a real cache hit, not a miss', async () => {
        // Regression test: getCachedSvg returns string | undefined, so the cache
        // check must use `!== undefined` rather than truthiness. A svg that
        // sanitizes down to an empty string (e.g. every child element was
        // stripped) is a legitimate, cacheable result and should not force a
        // refetch on every subsequent call.
        mockFetchOnce('<svg><script>evil()</script></svg>');
        const defaultSanitize = vi.fn().mockResolvedValue('');
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(defaultSanitize);

        const first = await fetchAndSanitizeSvg('https://example.com/empty.svg');
        const second = await fetchAndSanitizeSvg('https://example.com/empty.svg');

        expect(first).toBe('');
        expect(second).toBe('');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('throws when the response Content-Type is clearly not SVG', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            headers: { get: () => 'text/html; charset=utf-8' },
            text: () => Promise.resolve('<html>not an svg</html>'),
        }));
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(vi.fn());
        await expect(
            fetchAndSanitizeSvg('https://example.com/page.html')
        ).rejects.toThrow('Unexpected content-type');
    });

    it('accepts a response with image/svg+xml Content-Type', async () => {
        const sanitize = vi.fn().mockResolvedValue('<svg><path/></svg>');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            headers: { get: () => 'image/svg+xml' },
            text: () => Promise.resolve('<svg><path/></svg>'),
        }));
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(sanitize);
        await expect(
            fetchAndSanitizeSvg('https://example.com/icon.svg')
        ).resolves.toBe('<svg><path/></svg>');
    });

    it('shares a single fetch between two concurrent (unawaited) calls for the same URL', async () => {
        // Proves request deduplication end to end, not just at the
        // universalCache layer: two overlapping calls for the same URL,
        // fired before either has resolved, must only hit fetch once.
        let resolveText!: (v: string) => void;
        const fetchMock = vi.fn().mockReturnValue({
            ok: true,
            text: () => new Promise<string>(r => { resolveText = r; }),
        });
        vi.stubGlobal('fetch', fetchMock);
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>clean</svg>');
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(defaultSanitize);

        const first = fetchAndSanitizeSvg('https://example.com/concurrent.svg');
        const second = fetchAndSanitizeSvg('https://example.com/concurrent.svg');
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Let the microtask queue drain up to the `res.text()` call inside
        // the implementation (which happens after an `await fetch(...)`)
        // before resolving it.
        await new Promise(r => setTimeout(r, 0));
        resolveText('<svg>raw</svg>');
        await expect(first).resolves.toBe('<svg>clean</svg>');
        await expect(second).resolves.toBe('<svg>clean</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
    });

    it('passes fetchOptions through as the second argument to fetch', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ ok: true, text: () => Promise.resolve('<svg>raw</svg>') });
        vi.stubGlobal('fetch', fetchMock);
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(vi.fn().mockResolvedValue('<svg>clean</svg>'));

        const fetchOptions = { headers: { Authorization: 'Bearer token' }, credentials: 'include' as const };
        await fetchAndSanitizeSvg('https://example.com/auth.svg', { fetchOptions });

        expect(fetchMock).toHaveBeenCalledWith('https://example.com/auth.svg', fetchOptions);
    });

    it('does not poison the shared cache with a fetchOptions result, and does not read from it either', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>anonymous-clean</svg>');
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(defaultSanitize);

        // An authenticated call for this URL happens first, returning
        // content that must not leak into the shared cache.
        mockFetchOnce('<svg>private content</svg>');
        const authed = await fetchAndSanitizeSvg('https://example.com/personalized.svg', {
            fetchOptions: { headers: { Authorization: 'Bearer secret' } },
        });
        expect(authed).toBe('<svg>anonymous-clean</svg>');

        // A later default (no fetchOptions) call for the same URL must still
        // fetch and sanitize fresh, not reuse the authenticated response.
        mockFetchOnce('<svg>public content</svg>');
        const anonymous = await fetchAndSanitizeSvg('https://example.com/personalized.svg');
        expect(anonymous).toBe('<svg>anonymous-clean</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(2);
    });

    it('does not collide two different fetchOptions values for the same URL on the outer memoization layer', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ ok: true, text: () => Promise.resolve('<svg>raw</svg>') });
        vi.stubGlobal('fetch', fetchMock);
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(vi.fn().mockResolvedValue('<svg>clean</svg>'));

        await fetchAndSanitizeSvg('https://example.com/multi-user.svg', {
            fetchOptions: { headers: { Authorization: 'Bearer alice' } },
        });
        await fetchAndSanitizeSvg('https://example.com/multi-user.svg', {
            fetchOptions: { headers: { Authorization: 'Bearer bob' } },
        });

        // Two distinct plain-object fetchOptions must not be treated as the
        // same call - each is a real, separate fetch.
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('accepts a response with no Content-Type header (headers absent)', async () => {
        // Many test/mock environments omit the headers object entirely.
        // The check must be a no-op when content-type is absent.
        const sanitize = vi.fn().mockResolvedValue('<svg><path/></svg>');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<svg><path/></svg>'),
        }));
        const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(sanitize);
        await expect(
            fetchAndSanitizeSvg('https://example.com/icon2.svg')
        ).resolves.toBe('<svg><path/></svg>');
    });
});
