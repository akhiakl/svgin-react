/* eslint-disable @typescript-eslint/no-explicit-any */
// Universal cache: uses react/cache if available, else falls back to in-memory cache
type CacheWrapper<T extends (...args: any[]) => any> = (fn: T) => T;
let cacheImpl: CacheWrapper<any> | undefined;

// Assigns a stable id to each distinct function reference seen, so two calls
// with the *same* function (e.g. a memoized sanitizeFn) can still share a
// cache entry, while two calls with *different* functions never collide.
let fnIdCounter = 0;
const fnIds = new WeakMap<object, number>();

// Same idea as fnIds, but for symbols: WeakMap can't key on primitives (a
// symbol is a primitive, not an object), so distinct symbols get their own
// id via a regular Map instead. Symbols aren't used anywhere in this
// library's own call signatures today, but stableKey is a general-purpose
// serializer, so it should not silently mis-key on one just because nothing
// currently passes one in.
let symbolIdCounter = 0;
const symbolIds = new Map<symbol, number>();

/**
 * Serializes call arguments into a cache key that, unlike plain
 * `JSON.stringify`, does not silently drop function-valued or `undefined`
 * properties. `JSON.stringify` turns both `{ sanitizeFn: someFn }` and `{}`
 * into the same `"{}"` string (object properties whose value is a function
 * or `undefined` are omitted), which would let a call using a custom
 * sanitizer collide with, and return the cached result of, an unrelated
 * default-mode call for the same URL. See fetchAndSanitizeSvgBase.ts.
 */
function stableKey(value: unknown): string {
    if (typeof value === 'function') {
        let id = fnIds.get(value);
        if (id === undefined) {
            id = fnIdCounter++;
            fnIds.set(value, id);
        }
        return `fn#${id}`;
    }
    if (typeof value === 'symbol') {
        // JSON.stringify(someSymbol) returns undefined, not a string - handling
        // this case explicitly (instead of falling through to the JSON.stringify
        // branch below) keeps stableKey's return type an actual string and
        // keeps distinct symbols from silently colliding on the same key.
        let id = symbolIds.get(value);
        if (id === undefined) {
            id = symbolIdCounter++;
            symbolIds.set(value, id);
        }
        return `sym#${id}`;
    }
    if (value === undefined) return 'undefined';
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableKey).join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableKey((value as Record<string, unknown>)[k])}`).join(',')}}`;
}

export function setUniversalCache<T extends (...args: any[]) => any>(fn: T): T {
    if (cacheImpl === undefined) {
        try {
            // react/cache is optional (only present in a React Server Components
            // runtime) and has no bundled types; `require` may also be undefined in
            // pure-ESM environments, which throws here too and is handled below.
            cacheImpl = (require as any)('react/cache').cache;
        } catch {
            cacheImpl = (<F extends (...args: any[]) => any>(fn: F) => {
                const inMemoryCache = new Map<string, ReturnType<F>>();
                return ((...args: Parameters<F>): ReturnType<F> => {
                    const key = stableKey(args);
                    if (!inMemoryCache.has(key)) {
                        inMemoryCache.set(key, fn(...args) as ReturnType<F>);
                    }
                    return inMemoryCache.get(key)!;
                }) as F;
            }) as CacheWrapper<any>;
        }
    }
    if (!cacheImpl) throw new Error('Universal cache implementation missing');
    return cacheImpl(fn);
}
