import { getCachedSvg, setCachedSvg } from './svgCache';
import { setUniversalCache } from './universalCache';

export interface FetchAndSanitizeOptions {
    sanitizeFn?: (svg: string) => Promise<string>;
    disableSanitization?: boolean;
}

export function createFetchAndSanitizeSvg(sanitizeSvg: (svg: string) => string | Promise<string>) {
    async function fetchAndSanitizeSvgImpl(
        url: string,
        options?: FetchAndSanitizeOptions
    ): Promise<string> {
        // Only the default sanitizer's output is safe to share across every caller of
        // this URL. `disableSanitization` and custom `sanitizeFn` results are per-call
        // and must never be written to (or read from) the shared cache - otherwise a
        // raw/custom result for one caller could leak out as the "sanitized" result
        // for another caller of the same URL.
        const usesSharedCache = !options?.disableSanitization && !options?.sanitizeFn;

        if (usesSharedCache) {
            const cached = getCachedSvg(url);
            // getCachedSvg returns string | undefined - an explicit undefined check
            // (rather than truthiness) so a cached, sanitized-down-to-empty-string
            // result ("") is still treated as a real cache hit instead of a miss.
            if (cached !== undefined) return cached;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch SVG: ${url}`);
        const contentType = res.headers?.get('content-type') ?? '';
        if (contentType && !contentType.includes('svg') && !contentType.includes('xml') && !contentType.includes('octet-stream') && !contentType.includes('text/plain')) {
            throw new Error(`Unexpected content-type for SVG: ${contentType}`);
        }
        const raw = await res.text();
        let sanitized: string;
        if (options?.disableSanitization) {
            sanitized = raw;
        } else if (options?.sanitizeFn) {
            sanitized = await options.sanitizeFn(raw);
        } else {
            sanitized = await sanitizeSvg(raw);
        }

        if (usesSharedCache) {
            setCachedSvg(url, sanitized);
        }
        return sanitized;
    }
    return setUniversalCache(fetchAndSanitizeSvgImpl);
}
