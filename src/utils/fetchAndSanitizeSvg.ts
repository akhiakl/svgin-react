import { getCachedSvg, setCachedSvg } from './svgCache';
import { sanitizeSvg } from './sanitize';

/**
 * Fetches and sanitizes an SVG from a URL, with optional custom sanitizer and caching.
 * Returns the sanitized SVG string, or throws on error.
 */

// Try to get react/cache if available (React 19+), else fallback to in-memory cache

let reactCache: (<T extends (...args: unknown[]) => unknown>(fn: T) => T) | undefined = undefined;
let triedReactCache = false;

async function getReactCache() {
    if (!triedReactCache) {
        triedReactCache = true;
        try {
            // @ts-expect-error: Dynamic import for optional react/cache support
            const mod = await import('react/cache');
            reactCache = mod.cache;
        } catch {
            reactCache = undefined;
        }
    }
    return reactCache;
}

const inMemoryCache = new Map<string, Promise<string>>();

interface FetchAndSanitizeOptions {
    sanitizeFn?: (svg: string) => Promise<string>;
    disableSanitization?: boolean;
}

async function fetchAndSanitizeSvgImpl(
    url: string,
    options?: FetchAndSanitizeOptions
): Promise<string> {
    const cached = getCachedSvg(url);
    if (cached) return cached;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch SVG: ${url}`);
    const raw = await res.text();
    let sanitized: string;
    if (options?.disableSanitization) {
        sanitized = raw;
    } else if (options?.sanitizeFn) {
        sanitized = await options.sanitizeFn(raw);
    } else {
        sanitized = await sanitizeSvg(raw);
    }
    setCachedSvg(url, sanitized);
    return sanitized;
}

export async function fetchAndSanitizeSvg(
    url: string,
    options?: FetchAndSanitizeOptions
): Promise<string> {
    const cache = await getReactCache();
    if (cache) {
        const cachedFetcher = cache((...args: unknown[]) => fetchAndSanitizeSvgImpl(args[0] as string, args[1] as FetchAndSanitizeOptions));
        return cachedFetcher(url, options) as Promise<string>;
    } else {
        const cacheKey = options?.disableSanitization ? `${url}__noSanitize` : url;
        if (!inMemoryCache.has(cacheKey)) {
            inMemoryCache.set(cacheKey, fetchAndSanitizeSvgImpl(url, options));
        }
        return inMemoryCache.get(cacheKey)!;
    }
}
