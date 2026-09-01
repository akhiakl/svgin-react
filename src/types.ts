import type { ReactNode } from 'react';

export interface SvgInProps {
    /** URL of the SVG to fetch. Ignored if `svg` is also given. Either `src` or `svg` is required. */
    src?: string;
    /** Raw SVG markup already in hand (e.g. from a CMS field or API response) - sanitized and rendered directly, skipping the fetch step entirely. Takes precedence over `src` if both are given. */
    svg?: string;
    width?: number | string;
    height?: number | string;
    fill?: string;
    /** Not used by <SvgInSuspense /> - pair that component with a <Suspense fallback> instead. */
    fallback?: ReactNode;
    /** Client component only. Rendered while the fetch/sanitize is pending, instead of the default `aria-hidden` placeholder `<svg>`. Pass `null` explicitly to render nothing while loading. Not used by <SvgInSuspense />. */
    loadingFallback?: ReactNode;
    className?: string;
    ariaLabel?: string;
    /** Injects/overrides a <title> element inside the rendered SVG (accessible name, also shown as a tooltip in most browsers). */
    title?: string;
    /** Injects/overrides a <desc> element inside the rendered SVG (a longer accessible description than title). */
    description?: string;
    sanitizeFn?: (svg: string) => Promise<string>;
    disableSanitization?: boolean;
    /** Called when the fetch or sanitization fails, alongside rendering `fallback` - for logging/telemetry. <SvgInSuspense /> also calls this as a side notification, but it does not itself handle the error there - pair that component with an error boundary. */
    onError?: (error: Error) => void;
    /** Client component only: called with the rendered `<svg>` DOM element right after it mounts or updates. No-op on the server component (there is no DOM to hand back). */
    onMount?: (svg: SVGSVGElement) => void;
    /**
     * Client component only. `'lazy'` defers the fetch/sanitize until the
     * rendered placeholder scrolls near the viewport (via
     * `IntersectionObserver`, similar to `<img loading="lazy">`). Falls back
     * to eager loading in environments without `IntersectionObserver`, and
     * is ignored when `svg` is set (there is nothing to fetch). Not used by
     * <SvgInSuspense /> (Suspense's render-as-you-fetch model always starts
     * eagerly). Default `'eager'`.
     */
    loading?: 'eager' | 'lazy';
}
