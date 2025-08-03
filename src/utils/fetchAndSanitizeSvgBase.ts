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
    return setUniversalCache(fetchAndSanitizeSvgImpl);
}
