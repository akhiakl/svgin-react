

import { getCachedSvg, setCachedSvg } from './utils/svgCache';
import { SvgInProps } from './types';
import { setUniversalCache } from './utils/universalCache';
import { sanitizeSvg } from './utils/sanitizeServer';



async function preloadSvgImpl(url: string, options?: Pick<SvgInProps, 'disableSanitization' | 'sanitizeFn'>): Promise<void> {
    // See fetchAndSanitizeSvgBase.ts: only the default-sanitizer result is safe to
    // share via the module-level cache. Preloading with `disableSanitization` or a
    // custom `sanitizeFn` must not poison the cache entry that a later default
    // `<SvgIn src={url} />` call would read.
    const usesSharedCache = !options?.disableSanitization && !options?.sanitizeFn;

    if (usesSharedCache && getCachedSvg(url)) return;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch SVG: ${url}`);
    let svg = await res.text();
    if (options?.disableSanitization || options?.sanitizeFn) {
        // Non-default modes are intentionally not cached (see comment above), so
        // there's nothing safe to store here beyond warming the browser/HTTP cache
        // for the `fetch` call itself.
        return;
    }
    svg = await sanitizeSvg(svg);
    setCachedSvg(url, svg);
}

export const preloadSvg = setUniversalCache(preloadSvgImpl);
