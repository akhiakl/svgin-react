import { getCachedSvg, setCachedSvg } from './utils/svgCache';
import { SvgInProps } from './types';
import { setUniversalCache } from './utils/universalCache';

async function preloadSvgImpl(url: string, options?: Pick<SvgInProps, 'disableSanitization' | 'sanitizeFn'>): Promise<void> {
    // See fetchAndSanitizeSvgBase.ts: only the default-sanitizer result is safe to
    // share via the module-level cache. Preloading with `disableSanitization` or a
    // custom `sanitizeFn` must not poison the cache entry that a later default
    // `<SvgIn src={url} />` call would read.
    const usesSharedCache = !options?.disableSanitization && !options?.sanitizeFn;

    // getCachedSvg returns string | undefined - an explicit undefined check
    // (rather than truthiness) so a cached, sanitized-down-to-empty-string
    // result ("") still counts as already preloaded.
    if (usesSharedCache && getCachedSvg(url) !== undefined) return;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch SVG: ${url}`);
    const contentType = res.headers?.get('content-type') ?? '';
    if (contentType && !contentType.includes('svg') && !contentType.includes('xml') && !contentType.includes('octet-stream') && !contentType.includes('text/plain')) {
        throw new Error(`Unexpected content-type for SVG: ${contentType}`);
    }
    const svgText = await res.text();

    if (options?.disableSanitization) {
        // Non-default modes are intentionally not cached (see comment above), so
        // there's nothing safe to store here beyond warming the browser/HTTP cache
        // for the `fetch` call itself.
        return;
    }
    if (options?.sanitizeFn) {
        // Custom sanitizer result is caller-specific, not stored in shared cache.
        await options.sanitizeFn(svgText);
        return;
    }

    // Default sanitizer: lazily import the server sanitizer (jsdom + DOMPurify).
    // On the client, consumers should pass a `sanitizeFn` using `dompurify`
    // directly to avoid bundling jsdom.
    const { sanitizeSvg } = await import('./utils/sanitizeServer');
    const sanitized = await sanitizeSvg(svgText);
    setCachedSvg(url, sanitized);
}

export const preloadSvg = setUniversalCache(preloadSvgImpl);
