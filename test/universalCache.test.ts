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

    it('reuses the cache entry when the same symbol is passed again', () => {
        const impl = vi.fn((s: symbol) => s.toString());
        const cached = setUniversalCache(impl);
        const sym = Symbol('reused');

        expect(cached(sym)).toBe('Symbol(reused)');
        expect(cached(sym)).toBe('Symbol(reused)');
        expect(impl).toHaveBeenCalledTimes(1);
    });
});
