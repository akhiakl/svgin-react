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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(defaultSanitize);

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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());
        await expect(fetchAndSanitizeSvg('https://example.com/missing.svg')).rejects.toThrow(
            'Failed to fetch SVG'
        );
    });

    it('does not poison the shared cache with a disableSanitization result', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>sanitized</svg>');
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(defaultSanitize);

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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(defaultSanitize);
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

        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());
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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(defaultSanitize);
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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());

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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(defaultSanitize);

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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());
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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(sanitize);
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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(defaultSanitize);

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

    it('passes fetchOptions through as part of the second argument to fetch', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ ok: true, text: () => Promise.resolve('<svg>raw</svg>') });
        vi.stubGlobal('fetch', fetchMock);
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn().mockResolvedValue('<svg>clean</svg>'));

        const fetchOptions = { headers: { Authorization: 'Bearer token' }, credentials: 'include' as const };
        await fetchAndSanitizeSvg('https://example.com/auth.svg', { fetchOptions });

        // Called with fetchOptions' fields plus the reference-counted
        // cancellation signal fetchAndSanitizeSvg attaches to every call.
        expect(fetchMock).toHaveBeenCalledWith(
            'https://example.com/auth.svg',
            expect.objectContaining({ ...fetchOptions, signal: expect.anything() })
        );
    });

    it('does not poison the shared cache with a fetchOptions result, and does not read from it either', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>anonymous-clean</svg>');
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(defaultSanitize);

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
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn().mockResolvedValue('<svg>clean</svg>'));

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

    it('treats a caller-supplied fetchOptions.signal firing as that caller releasing its own share', () => {
        // Design: a caller's own fetchOptions.signal is never combined
        // directly into the shared fetch - it's treated as an early
        // release instead, so the underlying fetch still only aborts once
        // every sharer of this key is gone (single-caller case here: n
        // reaches 0 immediately).
        let capturedSignal: AbortSignal | undefined;
        const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
            capturedSignal = init?.signal ?? undefined;
            return new Promise(() => {});
        });
        vi.stubGlobal('fetch', fetchMock);
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());
        const callerController = new AbortController();

        fetchAndSanitizeSvg('https://example.com/caller-signal.svg', {
            fetchOptions: { signal: callerController.signal },
        });

        expect(capturedSignal?.aborted).toBe(false);
        callerController.abort();
        expect(capturedSignal?.aborted).toBe(true);
    });

    it('releases immediately when the caller-supplied fetchOptions.signal is already aborted', () => {
        // 'abort' never fires on a signal that was already aborted before a
        // listener was attached, so this has to be checked explicitly.
        let capturedSignal: AbortSignal | undefined;
        const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
            capturedSignal = init?.signal ?? undefined;
            return new Promise(() => {});
        });
        vi.stubGlobal('fetch', fetchMock);
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());
        const alreadyAborted = new AbortController();
        alreadyAborted.abort();

        fetchAndSanitizeSvg('https://example.com/pre-aborted.svg', {
            fetchOptions: { signal: alreadyAborted.signal },
        });

        expect(capturedSignal?.aborted).toBe(true);
    });

    it('does not let one concurrent caller\'s own signal abort a fetch another concurrent caller still needs', () => {
        // Regression test for a real bug found in review: two concurrent
        // callers sharing the same in-flight request (same url and
        // otherwise-identical fetchOptions - a signal has no enumerable own
        // properties, see stableKey's documented caveat, so it doesn't
        // affect the dedup key) can each supply their own distinct
        // fetchOptions.signal. Combining only the *first* caller's signal
        // directly into the shared fetch would make a later caller's own
        // signal silently do nothing (order-dependent) - or, if combined
        // too, would let any one caller unilaterally kill a fetch the other
        // still needs. Both must instead only release that caller's own
        // share: the underlying fetch keeps running until BOTH release.
        let capturedSignal: AbortSignal | undefined;
        const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
            capturedSignal = init?.signal ?? undefined;
            return new Promise(() => {});
        });
        vi.stubGlobal('fetch', fetchMock);
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());
        const controllerA = new AbortController();
        const controllerB = new AbortController();

        fetchAndSanitizeSvg('https://example.com/shared-signal.svg', { fetchOptions: { signal: controllerA.signal } });
        fetchAndSanitizeSvg('https://example.com/shared-signal.svg', { fetchOptions: { signal: controllerB.signal } });

        // B still needs it - A's own signal firing must not abort the fetch.
        controllerA.abort();
        expect(capturedSignal?.aborted).toBe(false);

        // Now both have released - only now is the fetch actually aborted.
        controllerB.abort();
        expect(capturedSignal?.aborted).toBe(true);
    });

    it('removes the caller-signal listener once the request settles normally', async () => {
        // Regression test for a real bug found in review: the earlier
        // signal-combining approach could leave an 'abort' listener
        // attached to a caller-supplied fetchOptions.signal indefinitely if
        // the request settled without it ever firing - a real leak risk
        // since such a signal can be long-lived/reused across many
        // requests. The current design (release-on-abort, not combine)
        // must clean up the same way.
        mockFetchOnce('<svg>ok</svg>');
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn().mockResolvedValue('<svg>ok</svg>'));
        const callerController = new AbortController();
        const removeSpy = vi.spyOn(AbortSignal.prototype, 'removeEventListener');

        await fetchAndSanitizeSvg('https://example.com/cleanup.svg', {
            fetchOptions: { signal: callerController.signal },
        });

        const abortRemovals = removeSpy.mock.calls.filter(([event]) => event === 'abort');
        expect(abortRemovals.length).toBe(1);
    });

    it('accepts a response with no Content-Type header (headers absent)', async () => {
        // Many test/mock environments omit the headers object entirely.
        // The check must be a no-op when content-type is absent.
        const sanitize = vi.fn().mockResolvedValue('<svg><path/></svg>');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<svg><path/></svg>'),
        }));
        const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(sanitize);
        await expect(
            fetchAndSanitizeSvg('https://example.com/icon2.svg')
        ).resolves.toBe('<svg><path/></svg>');
    });

    describe('releaseFetchAndSanitizeSvg', () => {
        it('is a no-op when nothing is pending for that url/options', () => {
            const { releaseFetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());
            expect(() => releaseFetchAndSanitizeSvg('https://example.com/never-called.svg')).not.toThrow();
        });

        it('does not abort the underlying fetch while another caller still holds a share of it', async () => {
            let capturedSignal: AbortSignal | undefined;
            const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
                capturedSignal = init?.signal ?? undefined;
                return new Promise(() => {}); // never resolves
            });
            vi.stubGlobal('fetch', fetchMock);
            const { fetchAndSanitizeSvg, releaseFetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());

            // Two "callers" acquire a share of the same in-flight request.
            fetchAndSanitizeSvg('https://example.com/refcount.svg');
            fetchAndSanitizeSvg('https://example.com/refcount.svg');
            expect(fetchMock).toHaveBeenCalledTimes(1);

            releaseFetchAndSanitizeSvg('https://example.com/refcount.svg');
            expect(capturedSignal?.aborted).toBe(false);

            releaseFetchAndSanitizeSvg('https://example.com/refcount.svg');
            expect(capturedSignal?.aborted).toBe(true);
        });

        it('aborts immediately when a single caller releases its only share', () => {
            let capturedSignal: AbortSignal | undefined;
            const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
                capturedSignal = init?.signal ?? undefined;
                return new Promise(() => {});
            });
            vi.stubGlobal('fetch', fetchMock);
            const { fetchAndSanitizeSvg, releaseFetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());

            fetchAndSanitizeSvg('https://example.com/single.svg');
            releaseFetchAndSanitizeSvg('https://example.com/single.svg');
            expect(capturedSignal?.aborted).toBe(true);
        });

        it('keys release by the same sanitizeFn/disableSanitization as acquire, not just the url', () => {
            let signalA: AbortSignal | undefined;
            let signalB: AbortSignal | undefined;
            let call = 0;
            const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
                call += 1;
                if (call === 1) signalA = init?.signal ?? undefined;
                else signalB = init?.signal ?? undefined;
                return new Promise(() => {});
            });
            vi.stubGlobal('fetch', fetchMock);
            const { fetchAndSanitizeSvg, releaseFetchAndSanitizeSvg } = createFetchAndSanitizeSvg(vi.fn());
            const customFn = vi.fn();

            fetchAndSanitizeSvg('https://example.com/keyed.svg');
            fetchAndSanitizeSvg('https://example.com/keyed.svg', { sanitizeFn: customFn });
            expect(fetchMock).toHaveBeenCalledTimes(2);

            // Releasing the custom-sanitizeFn share must not abort the
            // unrelated default-mode request for the same url, and vice versa.
            releaseFetchAndSanitizeSvg('https://example.com/keyed.svg', { sanitizeFn: customFn });
            expect(signalB?.aborted).toBe(true);
            expect(signalA?.aborted).toBe(false);

            releaseFetchAndSanitizeSvg('https://example.com/keyed.svg');
            expect(signalA?.aborted).toBe(true);
        });

        it('is a no-op once the request has already settled', async () => {
            mockFetchOnce('<svg>ok</svg>');
            const { fetchAndSanitizeSvg, releaseFetchAndSanitizeSvg } = createFetchAndSanitizeSvg(
                vi.fn().mockResolvedValue('<svg>ok</svg>')
            );

            await fetchAndSanitizeSvg('https://example.com/settled.svg');
            // The pending entry is torn down once the promise settles, so this
            // release (arriving after resolution, e.g. a component unmounting
            // after its data already arrived) must not throw or affect anything.
            expect(() => releaseFetchAndSanitizeSvg('https://example.com/settled.svg')).not.toThrow();
        });

        it('keeps bookkeeping fully separate between two createFetchAndSanitizeSvg instances', async () => {
            // Regression test for a real bug found in review: pendingByKey used
            // to live at module scope, shared across every createFetchAndSanitizeSvg
            // call (e.g. the client and server entry points, which could both be
            // loaded in the same JS process by a framework that SSRs client
            // components alongside RSC server components). Two instances using
            // the exact same url/sanitizeFn/disableSanitization key must not
            // share a PendingEntry - releasing one instance's share must never
            // abort the other instance's independent underlying fetch.
            let signalA: AbortSignal | undefined;
            let signalB: AbortSignal | undefined;
            const fetchMockA = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
                signalA = init?.signal ?? undefined;
                return new Promise(() => {});
            });
            const fetchMockB = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
                signalB = init?.signal ?? undefined;
                return new Promise(() => {});
            });

            const instanceA = createFetchAndSanitizeSvg(vi.fn());
            vi.stubGlobal('fetch', fetchMockA);
            instanceA.fetchAndSanitizeSvg('https://example.com/isolated.svg');

            const instanceB = createFetchAndSanitizeSvg(vi.fn());
            vi.stubGlobal('fetch', fetchMockB);
            instanceB.fetchAndSanitizeSvg('https://example.com/isolated.svg');

            // Releasing instance B's only share aborts instance B's fetch, but
            // must leave instance A's still-in-flight fetch untouched.
            instanceB.releaseFetchAndSanitizeSvg('https://example.com/isolated.svg');
            expect(signalB?.aborted).toBe(true);
            expect(signalA?.aborted).toBe(false);

            instanceA.releaseFetchAndSanitizeSvg('https://example.com/isolated.svg');
            expect(signalA?.aborted).toBe(true);
        });
    });
});
