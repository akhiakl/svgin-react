import React, { useContext, useEffect, useRef, useState } from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgClient';
import { sanitizeSvgString } from './utils/sanitizeSvgStringClient';
import { SvgInComponent } from './SvgInComponent';
import { nextInstanceId } from './utils/instanceId';
import { SvgInContext } from './SvgInContext';

function resolveSvgPromise(
    src: string | undefined,
    svgProp: string | undefined,
    sanitizeFn: ((svg: string) => Promise<string>) | undefined,
    disableSanitization: boolean | undefined
): Promise<string> {
    if (svgProp !== undefined) return sanitizeSvgString(svgProp, { sanitizeFn, disableSanitization });
    if (src !== undefined) return fetchAndSanitizeSvg(src, { sanitizeFn, disableSanitization });
    return Promise.reject(new Error('<SvgIn /> requires either `src` or `svg`.'));
}

export const SvgIn: React.FC<SvgInProps> = (props) => {
    const defaults = useContext(SvgInContext);
    // Explicit props always win over an <SvgInProvider>'s defaults.
    // title/description/onError/onMount/loadingFallback/loading/fallback are
    // all pulled out of `rest` too: none of them are valid attributes to
    // spread onto the raw placeholder <svg> below or meaningful passed twice
    // to SvgInComponent.
    const {
        src,
        svg: svgProp,
        sanitizeFn = defaults.sanitizeFn,
        disableSanitization = defaults.disableSanitization,
        title,
        description,
        onError = defaults.onError,
        onMount,
        loadingFallback = defaults.loadingFallback,
        loading = defaults.loading ?? 'eager',
        fallback = defaults.fallback,
        className = defaults.className,
        ...rest
    } = props;
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    // Stable for the lifetime of this mounted component, so ids inside the
    // rendered SVG don't change (and force a needless DOM update) on every
    // re-render - only a fresh mount gets a new suffix, same as a real DOM
    // element would.
    const idSuffix = useRef<string | undefined>(undefined);
    if (idSuffix.current === undefined) idSuffix.current = nextInstanceId();
    const svgRef = useRef<SVGSVGElement>(null);

    // Read from refs rather than depended on directly, same reasoning as
    // sanitizeFnRef below: consumers commonly pass fresh inline closures,
    // and depending on their identity would re-run effects unnecessarily.
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const onMountRef = useRef(onMount);
    onMountRef.current = onMount;

    // sanitizeFn is read from a ref rather than depended on directly:
    // consumers commonly pass an inline arrow function, whose identity
    // changes every render, and depending on that identity would re-fetch
    // and re-sanitize the same SVG on every re-render. The effect still
    // depends on hasSanitizeFn (whether a custom sanitizer is present at
    // all), so switching between the default sanitizer and a custom one -
    // an actual change in sanitization behavior, not just a new closure -
    // still triggers a refetch.
    //
    // Limitation: replacing sanitizeFn with a *different* function while
    // keeping hasSanitizeFn === true does not trigger a re-fetch (see the
    // README's "sanitizeFn identity note"). If the sanitizer's behavior
    // needs to change at runtime, change the src prop or remount the
    // component to force a refresh - there is no dedicated prop for this.
    const sanitizeFnRef = useRef(sanitizeFn);
    sanitizeFnRef.current = sanitizeFn;
    const hasSanitizeFn = sanitizeFn !== undefined;

    // Lazy loading: don't start the fetch until the placeholder scrolls near
    // the viewport. Only applies when the *default* placeholder actually
    // renders: a custom `loadingFallback` is an arbitrary ReactNode with no
    // guaranteed single DOM node to attach `svgRef`/observe, so deferring in
    // that case would mean never observing anything and the fetch never
    // starting - ignore `loading="lazy"` there instead (falls back to eager,
    // never a silent deadlock). Also ignored when `svg` is given directly
    // (there is nothing to fetch) or IntersectionObserver isn't available.
    // Checked live (not cached at module scope) so a polyfill installed
    // after this module first loads is still picked up.
    const canDefer =
        loading === 'lazy' &&
        loadingFallback === undefined &&
        svgProp === undefined &&
        typeof IntersectionObserver !== 'undefined';
    const [shouldLoad, setShouldLoad] = useState(!canDefer);
    useEffect(() => {
        if (!canDefer) {
            // Covers both "never deferring" and deferral turning off after
            // mount (e.g. `loading` switching from 'lazy' to 'eager', or
            // `loadingFallback` being set) - a no-op once already true.
            setShouldLoad(true);
            return;
        }
        if (shouldLoad) return;
        const el = svgRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [canDefer, shouldLoad]);

    useEffect(() => {
        if (!shouldLoad) return;
        let mounted = true;
        setSvg(null);
        setError(null);
        resolveSvgPromise(src, svgProp, sanitizeFnRef.current, disableSanitization)
            .then((sanitized) => { if (mounted) setSvg(sanitized); })
            .catch((e) => { if (mounted) { setError(e); onErrorRef.current?.(e); } });
        return () => { mounted = false; };
    }, [shouldLoad, src, svgProp, disableSanitization, hasSanitizeFn]);

    // Fires after the rendered <svg> DOM node is available (or updated) -
    // this is the closest client-side equivalent to react-svg's
    // beforeInjection: a hook for imperative DOM work the declarative props
    // above don't cover.
    useEffect(() => {
        if (svg && svgRef.current) onMountRef.current?.(svgRef.current);
    }, [svg]);

    if (error) return fallback ?? null;
    if (!svg) {
        if (loadingFallback !== undefined) return loadingFallback;
        return (
            <svg
                ref={svgRef}
                width={rest.width}
                height={rest.height}
                fill={rest.fill}
                className={className}
                aria-hidden="true"
                focusable="false"
                tabIndex={-1}
            />
        );
    }
    return (
        <SvgInComponent
            svg={svg}
            title={title}
            description={description}
            idSuffix={idSuffix.current}
            ref={svgRef}
            className={className}
            {...rest}
        />
    );
};
