import type { ReactNode } from 'react';

export interface SvgInProps {
    /** URL of the SVG to fetch. Ignored if `svg` is also given. Either `src` or `svg` is required. */
    src?: string;
    /** Raw SVG markup already in hand (e.g. from a CMS field or API response) - sanitized and rendered directly, skipping the fetch step entirely. Takes precedence over `src` if both are given. */
    svg?: string;
    /**
     * Passed through as the second argument to the `fetch` call for `src` -
     * use this for an authenticated endpoint (an `Authorization` header, a
     * signed request needing `credentials: 'include'`, etc). Ignored when
     * `svg` is given (there is no fetch to configure).
     *
     * A request using `fetchOptions` never reads from or writes to the
     * shared cache keyed on `src`: different options can legitimately return
     * different content for the same URL (e.g. a per-user personalized
     * response), so sharing that result across every caller of the URL
     * would be unsafe, the same reason `sanitizeFn`/`disableSanitization`
     * are excluded from it. See preloadSvg and the README for detail.
     *
     * Pass `headers` as a plain object rather than a `Headers` instance: the
     * per-call request memoization key is derived by serializing this
     * object, and a `Headers` instance has no enumerable own properties to
     * serialize, so two different `Headers` values would be
     * indistinguishable to it (a plain object is unaffected).
     */
    fetchOptions?: RequestInit;
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
     * to eager loading in environments without `IntersectionObserver`, when
     * `svg` is set (there is nothing to fetch), and when `loadingFallback` is
     * set (an arbitrary `ReactNode` has no single DOM node to observe, so
     * deferring there would mean never starting the fetch at all). Not used
     * by <SvgInSuspense /> (Suspense's render-as-you-fetch model always
     * starts eagerly). Default `'eager'`.
     */
    loading?: 'eager' | 'lazy';
}
