

import { getCachedSvg, setCachedSvg } from './utils/svgCache';
import { SvgInProps } from './types';
import { setUniversalCache } from './utils/universalCache';
import { sanitizeSvg } from './utils/sanitizeServer';



async function preloadSvgImpl(url: string, options?: Pick<SvgInProps, 'disableSanitization' | 'sanitizeFn'>): Promise<void> {
    if (getCachedSvg(url)) return;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch SVG: ${url}`);
    let svg = await res.text();
    if (options?.disableSanitization) {
        setCachedSvg(url, svg);
        return;
    }
    if (options?.sanitizeFn) {
        svg = await options.sanitizeFn(svg);
    } else {
        svg = await sanitizeSvg(svg);
    }
    setCachedSvg(url, svg);
}

export const preloadSvg = setUniversalCache(preloadSvgImpl);
