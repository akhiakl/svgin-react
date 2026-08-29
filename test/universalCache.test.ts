import { describe, expect, it, vi } from 'vitest';
import { setUniversalCache } from '../src/utils/universalCache';

// These tests run in Node without react/cache available, so setUniversalCache
// always exercises its in-memory fallback and the stableKey serializer inside
// it (see the comment in universalCache.ts for why plain JSON.stringify was
// unsafe here).
describe('setUniversalCache (fallback in-memory cache)', () => {
    it('memoizes calls with identical primitive arguments', () => {
        const impl = vi.fn((n: number) => n * 2);
        const cached = setUniversalCache(impl);

        expect(cached(2)).toBe(4);
        expect(cached(2)).toBe(4);
        expect(impl).toHaveBeenCalledTimes(1);
    });

    it('does not memoize calls with different primitive arguments', () => {
        const impl = vi.fn((n: number) => n * 2);
        const cached = setUniversalCache(impl);

        expect(cached(2)).toBe(4);
        expect(cached(3)).toBe(6);
        expect(impl).toHaveBeenCalledTimes(2);
    });

    it('does not collide a function-valued option with an equivalent-looking plain object', () => {
        const impl = vi.fn((_url: string, options: { sanitizeFn?: () => void }) =>
            options.sanitizeFn ? 'custom' : 'default'
        );
        const cached = setUniversalCache(impl);
        const sanitizeFn = () => {};

        // JSON.stringify(['url', { sanitizeFn }]) === JSON.stringify(['url', {}])
        // because JSON.stringify drops function-valued properties. Both calls
        // below must be treated as distinct.
        expect(cached('url', { sanitizeFn })).toBe('custom');
        expect(cached('url', {})).toBe('default');
        expect(impl).toHaveBeenCalledTimes(2);
    });

    it('treats two different function references as different cache entries', () => {
        const impl = vi.fn((_url: string, options: { sanitizeFn: () => string }) =>
            options.sanitizeFn()
        );
        const cached = setUniversalCache(impl);
        const fnA = () => 'a';
        const fnB = () => 'b';

        expect(cached('url', { sanitizeFn: fnA })).toBe('a');
        expect(cached('url', { sanitizeFn: fnB })).toBe('b');
        expect(impl).toHaveBeenCalledTimes(2);
    });

    it('reuses the cache entry when the same function reference is passed again', () => {
        const impl = vi.fn((_url: string, options: { sanitizeFn: () => string }) =>
            options.sanitizeFn()
        );
        const cached = setUniversalCache(impl);
        const sanitizeFn = () => 'result';

        expect(cached('url', { sanitizeFn })).toBe('result');
        expect(cached('url', { sanitizeFn })).toBe('result');
        expect(impl).toHaveBeenCalledTimes(1);
    });

    it('treats two different symbol arguments as different cache entries', () => {
        // JSON.stringify(Symbol('x')) returns undefined rather than a string,
        // so a naive serializer could map every distinct symbol to the same
        // key. stableKey must not do that.
        const impl = vi.fn((s: symbol) => s.toString());
        const cached = setUniversalCache(impl);
        const symA = Symbol('a');
        const symB = Symbol('b');

        expect(cached(symA)).toBe('Symbol(a)');
        expect(cached(symB)).toBe('Symbol(b)');
        expect(impl).toHaveBeenCalledTimes(2);
    });

    it('does not collide NaN, Infinity, or -Infinity with null or each other', () => {
        // JSON.stringify(NaN), JSON.stringify(Infinity), JSON.stringify(-Infinity),
        // and JSON.stringify(null) all produce the same string, "null".
        const impl = vi.fn((n: unknown) => String(n));
        const cached = setUniversalCache(impl);

        expect(cached(NaN)).toBe('NaN');
        expect(cached(Infinity)).toBe('Infinity');
        expect(cached(-Infinity)).toBe('-Infinity');
        expect(cached(null)).toBe('null');
        expect(impl).toHaveBeenCalledTimes(4);
    });

    it('handles a bigint argument instead of throwing', () => {
        // JSON.stringify(1n) throws "Do not know how to serialize a BigInt".
        const impl = vi.fn((n: bigint) => n.toString());
        const cached = setUniversalCache(impl);

        expect(() => cached(1n)).not.toThrow();
        expect(cached(1n)).toBe('1');
        expect(cached(2n)).toBe('2');
        expect(impl).toHaveBeenCalledTimes(2);
    });

    it('does not collide -0 with 0', () => {
        // JSON.stringify(-0) === JSON.stringify(0) === "0", even though
        // Object.is(-0, 0) is false and code can observe the difference
        // (e.g. 1 / -0 === -Infinity).
        const impl = vi.fn((n: number) => 1 / n);
        const cached = setUniversalCache(impl);

        expect(cached(-0)).toBe(-Infinity);
        expect(cached(0)).toBe(Infinity);
        expect(impl).toHaveBeenCalledTimes(2);
    });

    it('evicts a rejected promise so the next call retries instead of replaying the rejection', async () => {
        // The fallback cache stores the Promise before it settles. If a
        // rejection stayed cached forever, every future call with the same
        // arguments would replay that rejection with no way to recover
        // without a reload.
        let attempt = 0;
        const impl = vi.fn((url: string): Promise<string> => {
            attempt += 1;
            if (attempt === 1) return Promise.reject(new Error(`network error: ${url}`));
            return Promise.resolve('ok');
        });
        const cached = setUniversalCache(impl);

        await expect(cached('url')).rejects.toThrow('network error');
        await expect(cached('url')).resolves.toBe('ok');
        expect(impl).toHaveBeenCalledTimes(2);
    });

    it('does not wrap a synchronous return value in a Promise', () => {
        // Regression test for a review finding: the eviction logic must only
        // wrap an actual thenable, not allocate a Promise for every call
        // regardless of what fn returns.
        const impl = vi.fn((n: number) => n * 2);
        const cached = setUniversalCache(impl);

        const result = cached(2);
        expect(result).toBe(4);
        expect(result).not.toHaveProperty('then');
    });

    it('does not expose the raw promise returned by fn, so an ignored rejection can still surface as unhandled', async () => {
        // Regression test for a review finding: attaching a rejection handler
        // directly to fn's own promise (e.g. via Promise.resolve(result).catch(...),
        // which for a real Promise is just result.catch(...)) marks that exact
        // promise as handled. If that same promise were then returned to the
        // caller, a caller who never awaits or handles it would no longer
        // trigger Node/the browser's unhandledrejection warning, silently
        // hiding a real bug in their code.
        //
        // The fix derives a *new* promise for eviction (via .then, not
        // .catch on the original), and caches and returns that derived
        // promise instead of fn's own. This asserts the returned promise is
        // not the same object fn returned - fn's own promise is only ever
        // observed internally, so it staying "handled" is not user-visible.
        let rawPromise: Promise<string> | undefined;
        const impl = vi.fn((): Promise<string> => {
            rawPromise = Promise.reject(new Error('boom'));
            return rawPromise;
        });
        const cached = setUniversalCache(impl);

        const returned = cached();
        expect(returned).not.toBe(rawPromise);
        await expect(returned).rejects.toThrow('boom');
    });

    it('keeps memoizing a resolved promise across repeated calls', async () => {
        const impl = vi.fn(async (n: number) => n * 2);
        const cached = setUniversalCache(impl);

        await expect(cached(2)).resolves.toBe(4);
        await expect(cached(2)).resolves.toBe(4);
        expect(impl).toHaveBeenCalledTimes(1);
    });

    it('reuses the cache entry when the same symbol is passed again', () => {
        const impl = vi.fn((s: symbol) => s.toString());
        const cached = setUniversalCache(impl);
        const sym = Symbol('reused');

        expect(cached(sym)).toBe('Symbol(reused)');
        expect(cached(sym)).toBe('Symbol(reused)');
        expect(impl).toHaveBeenCalledTimes(1);
    });

    it('removes a rejected promise from the cache so the next call retries', async () => {
        let callCount = 0;
        const impl = vi.fn(async () => {
            callCount++;
            if (callCount === 1) throw new Error('first call fails');
            return 'success on retry';
        });
        const cached = setUniversalCache(impl);

        // First call rejects; the rejection should be removed from the cache.
        await expect(cached()).rejects.toThrow('first call fails');
        // Flush the microtask that deletes the cache entry.
        await new Promise(r => setTimeout(r, 0));
        // Second call must retry the underlying function, not return the cached rejection.
        const result = await cached();
        expect(result).toBe('success on retry');
        expect(impl).toHaveBeenCalledTimes(2);
    });

    it('does not collide -0 with 0 in the cache key', () => {
        const impl = vi.fn((n: number) => (1 / n === Infinity ? 'positive-zero' : 'negative-zero'));
        const cached = setUniversalCache(impl);

        expect(cached(0)).toBe('positive-zero');
        expect(cached(-0)).toBe('negative-zero');
        expect(impl).toHaveBeenCalledTimes(2);
    });
});
