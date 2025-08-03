/* eslint-disable @typescript-eslint/no-explicit-any */
// Universal cache: uses react/cache if available, else falls back to in-memory cache
type CacheWrapper<T extends (...args: any[]) => any> = (fn: T) => T;
let cacheImpl: CacheWrapper<any> | undefined;

export function setUniversalCache<T extends (...args: any[]) => any>(fn: T): T {
    if (cacheImpl === undefined) {
        try {
            // @ts-expect-error: react/cache is optional
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            cacheImpl = require('react/cache').cache;
        } catch {
            cacheImpl = (<F extends (...args: any[]) => any>(fn: F) => {
                const inMemoryCache = new Map<string, ReturnType<F>>();
                return ((...args: Parameters<F>): ReturnType<F> => {
                    const key = JSON.stringify(args);
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
