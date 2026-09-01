import { setUniversalCache } from './universalCache';

export interface SanitizeSvgStringOptions {
    sanitizeFn?: (svg: string) => Promise<string>;
    disableSanitization?: boolean;
}

/**
 * Mirrors createFetchAndSanitizeSvg's sanitize step (fetchAndSanitizeSvgBase.ts)
 * for a caller-supplied SVG string (the `svg` prop), skipping the
 * fetch/content-type/URL-cache machinery entirely - the markup is already in
 * hand. Wrapped in the same universalCache used everywhere else, so repeated
 * calls with identical markup + options are deduplicated/memoized instead of
 * re-sanitized on every call (e.g. the same icon string rendered by several
 * <SvgIn svg={...} /> instances, or re-rendered with a stable `svg` value).
 */
export function createSanitizeSvgString(sanitizeSvg: (svg: string) => string | Promise<string>) {
    async function sanitizeSvgStringImpl(raw: string, options?: SanitizeSvgStringOptions): Promise<string> {
        if (options?.disableSanitization) return raw;
        if (options?.sanitizeFn) return options.sanitizeFn(raw);
        return sanitizeSvg(raw);
    }
    return setUniversalCache(sanitizeSvgStringImpl);
}
