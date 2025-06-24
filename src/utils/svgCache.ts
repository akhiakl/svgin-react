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
 * Clear the entire SVG cache.
 */
export const clearSvgCache = (): void => {
    svgCache.clear();
};
