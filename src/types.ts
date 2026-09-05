import type { CSSProperties, HTMLAttributes, ReactNode, SVGProps } from 'react';

export interface SvgInProps
    extends Omit<
        SVGProps<SVGSVGElement>,
        // Each of these is redeclared below with its own (narrower, or
        // differently-typed) meaning specific to this component, so the
        // native DOM attribute of the same name is excluded here rather
        // than silently shadowed by it.
        | 'width'
        | 'height'
        | 'fill'
        | 'className'
        | 'title'
        | 'onError'
        | 'children'
        | 'dangerouslySetInnerHTML'
        | 'ref'
    > {
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

/**
 * Props for `<SvgInShadow />` - a separate, client-only component (see its
 * own file for why) rather than a mode/prop on `<SvgIn />`. It renders into
 * a shadow root instead of directly into the light DOM, so the SVG's own
 * markup and any `styles` given here are fully encapsulated: page CSS never
 * reaches in (an ancestor's `svg { fill: ... }` rule can't leak through the
 * shadow boundary), and nothing inside leaks back out onto the page. This is
 * the fix for the inline-`<style>` scoping limitation documented for
 * `<SvgIn />`/`<SvgInSuspense />` in the README's "Known limitations".
 *
 * Deliberately a smaller prop surface than `SvgInProps` in one respect: no
 * `loading`/`loadingFallback` (lazy loading and a custom pending state
 * aren't supported yet - see the README). It does accept the same kind of
 * arbitrary native prop forwarding `SvgInProps` does, but onto the *host*
 * element (`style`, `onClick`, `id`, `role`, `tabIndex`, `data-*`, native
 * `aria-*`, etc. - the same set as a plain `<span>`/`<div>`) rather than the
 * `<svg>` inside it: that `<svg>` lives inside a shadow tree this component
 * owns imperatively (via a shadow root's `innerHTML`), not as a React
 * element the usual prop-spreading approach could reach. `width`/`height`/
 * `fill`/`ariaLabel` below are the exception - forwarded to the inner `<svg>`
 * same as `SvgInProps`, just listed explicitly since they can't come from
 * `HTMLAttributes`.
 */
export interface SvgInShadowProps
    extends Omit<
        HTMLAttributes<HTMLElement>,
        'title' | 'children' | 'dangerouslySetInnerHTML' | 'className' | 'style' | 'onError'
    > {
    /** URL of the SVG to fetch. Ignored if `svg` is also given. Either `src` or `svg` is required. */
    src?: string;
    /** Raw SVG markup already in hand - sanitized and rendered directly, skipping the fetch step. Takes precedence over `src` if both are given. */
    svg?: string;
    /** Passed through as the second argument to `fetch` for `src`. See `SvgInProps.fetchOptions` for the full caching caveat - it applies here too. */
    fetchOptions?: RequestInit;
    width?: number | string;
    height?: number | string;
    fill?: string;
    /** Rendered (outside the shadow root, in the light DOM) if the fetch or sanitization fails. */
    fallback?: ReactNode;
    ariaLabel?: string;
    /** Injects/overrides a <title> element inside the rendered SVG. */
    title?: string;
    /** Injects/overrides a <desc> element inside the rendered SVG. */
    description?: string;
    sanitizeFn?: (svg: string) => Promise<string>;
    disableSanitization?: boolean;
    /** Called when the fetch or sanitization fails, alongside rendering `fallback`. */
    onError?: (error: Error) => void;
    /** Called with the rendered `<svg>` element (inside the shadow root) right after it mounts or updates. */
    onMount?: (svg: SVGSVGElement) => void;
    /**
     * Extra CSS injected inside the shadow root alongside the SVG, via a
     * `<style>` element - fully scoped by the shadow boundary in both
     * directions: these rules never leak out onto the page, and the page's
     * own CSS never reaches in to affect them (or the SVG's own inline
     * `<style>`/presentation attributes). Use this to style the SVG's inner
     * elements (`svg :is(path, circle) { fill: ... }`, `:host { ... }` for
     * the host element itself, etc.) without any risk of collateral effects
     * outside this one instance.
     */
    styles?: string;
    /** Shadow root mode passed to `attachShadow`. `'closed'` hides the shadow tree from `element.shadowRoot` (still inspectable via browser devtools). Default `'open'`. */
    mode?: 'open' | 'closed';
    /** Tag name for the host element the shadow root attaches to. Default `'span'`. */
    as?: 'span' | 'div';
    /** Applied to the *host* element (outside the shadow boundary) - not the SVG inside it, which ordinary page CSS can never reach by design. */
    className?: string;
    /** Applied to the *host* element (outside the shadow boundary), same as `className`. */
    style?: CSSProperties;
}
