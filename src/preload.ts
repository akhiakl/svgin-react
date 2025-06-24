import { getCachedSvg, setCachedSvg } from './utils/svgCache';
import { sanitizeSvg } from './utils/sanitize';

export async function preloadSvg(url: string, sanitizeFn?: (svg: string) => Promise<string>): Promise<void> {
    if (getCachedSvg(url)) return;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch SVG: ${url}`);
    let svg = await res.text();
    if (sanitizeFn) {
        svg = await sanitizeFn(svg);
    } else {
        svg = await sanitizeSvg(svg);
    }
    setCachedSvg(url, svg);
}
