// Ultra-fast in-memory SVG cache using a singleton Map
const svgCache = new Map<string, string>();

/**
 * Get a cached SVG string by URL.
 * @param url SVG URL
 */
export const getCachedSvg = (url: string): string | undefined => svgCache.get(url);

/**
 * Cache an SVG string by URL.
 * @param url SVG URL
 * @param svg SVG string
 */
export const setCachedSvg = (url: string, svg: string): void => {
    svgCache.set(url, svg);
};

/**
 * Check if an SVG is cached for a URL.
 * @param url SVG URL
 */
export const hasCachedSvg = (url: string): boolean => svgCache.has(url);

/**
 * Clears one cached entry by URL, or the entire cache if no URL is given.
 *
 * The only other way to force a fresh fetch for a URL already in this cache
 * is a cache-busting query string on `src` - this is the direct way to say
 * "the resource at this URL changed, forget what I have." Only affects the
 * shared cache `<SvgIn src={url} />` (with no `sanitizeFn`/
 * `disableSanitization`) and `preloadSvg` read from and write to; a call
 * using either of those options never touched this cache in the first
 * place, so there is nothing here for it to invalidate.
 * @param url SVG URL to clear. Omit to clear every cached entry.
 */
export const clearSvgCache = (url?: string): void => {
    if (url === undefined) {
        svgCache.clear();
        return;
    }
    svgCache.delete(url);
};
