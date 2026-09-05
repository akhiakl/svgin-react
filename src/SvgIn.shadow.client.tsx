import React, { useEffect, useRef, useState } from 'react';
import type { SvgInShadowProps } from './types';
import { releaseFetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgClient';
import { resolveSvgPromiseClient } from './utils/resolveSvgPromiseClient';
import { buildSvgMarkup } from './utils/buildSvgMarkup';
import { nextInstanceId } from './utils/instanceId';

/**
 * Renders the sanitized SVG inside a shadow root attached to a host element,
 * instead of directly into the light DOM - see SvgInShadowProps for why
 * that's worth an extra component rather than a prop on `<SvgIn />`.
 *
 * A separate component (not a `shadow` prop on `<SvgIn />`) for the same
 * tree-shaking reason as `<SvgInSuspense />`: a consumer who never imports
 * this one never bundles its shadow-root/imperative-DOM code at all, which a
 * runtime branch inside the shared `<SvgIn />` code path could never achieve
 * regardless of how the bundler is configured. It's exported both from
 * `svgin-react/client` (tree-shaken away there if unused, same as
 * `<SvgInSuspense />`/`<SvgInProvider>`) and from its own `svgin-react/shadow`
 * entry point, for consumers who'd rather import it standalone.
 *
 * Client-only: Shadow DOM is a browser API, so there is no server-component
 * equivalent (nothing to attach a shadow root to before any DOM exists).
 * Does not read `<SvgInProvider>` defaults, for the same bundle-isolation
 * reason `<SvgInSuspense />` doesn't - that context lives in `client.ts`
 * alongside `<SvgIn />`, and reading from it here would pull this file into
 * every consumer's bundle graph regardless of whether they use it.
 *
 * No `loading`/`loadingFallback` (lazy loading and a custom pending state
 * aren't implemented yet - the host element simply renders empty while a
 * fetch is pending, same as before the first resolve or after a rejected
 * one), and no arbitrary native SVG/DOM props: the rendered `<svg>` lives
 * inside a shadow tree owned imperatively by this component (a shadow
 * root's `innerHTML`), not as a React element the usual prop-spreading
 * approach could reach.
 */
export const SvgInShadow: React.FC<SvgInShadowProps> = ({
    src,
    svg: svgProp,
    fetchOptions,
    sanitizeFn,
    disableSanitization,
    width,
    height,
    fill,
    ariaLabel,
    fallback = null,
    title,
    description,
    onError,
    onMount,
    styles,
    mode = 'open',
    as: Tag = 'span',
    className,
    style,
}) => {
    const hostRef = useRef<HTMLElement | null>(null);
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const idSuffix = useRef<string | undefined>(undefined);
    if (idSuffix.current === undefined) idSuffix.current = nextInstanceId();

    // Same reasoning as the matching refs in SvgIn.client.tsx: read from a
    // ref rather than depend on the value directly, so a consumer's inline
    // closure/object literal doesn't cause an unnecessary re-fetch.
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const onMountRef = useRef(onMount);
    onMountRef.current = onMount;
    const sanitizeFnRef = useRef(sanitizeFn);
    sanitizeFnRef.current = sanitizeFn;
    const hasSanitizeFn = sanitizeFn !== undefined;
    const fetchOptionsRef = useRef(fetchOptions);
    fetchOptionsRef.current = fetchOptions;
    const hasFetchOptions = svgProp === undefined && fetchOptions !== undefined;

    // Fetch/sanitize effect - deliberately separate from the DOM-writing
    // effect below, so that changing a purely presentational prop (title,
    // width, styles, ...) updates the shadow root's content without
    // re-fetching, the same split SvgIn.client.tsx/SvgInComponent get for
    // free from React re-rendering with new props.
    useEffect(() => {
        let mounted = true;
        setSvg(null);
        setError(null);
        const currentSanitizeFn = sanitizeFnRef.current;
        const currentFetchOptions = fetchOptionsRef.current;
        resolveSvgPromiseClient('<SvgInShadow />', src, svgProp, currentSanitizeFn, disableSanitization, currentFetchOptions)
            .then((sanitized) => { if (mounted) setSvg(sanitized); })
            .catch((e) => { if (mounted) { setError(e); onErrorRef.current?.(e); } });
        return () => {
            mounted = false;
            // See the matching comment in SvgIn.client.tsx: only release
            // when this instance actually acquired a share (svg takes
            // precedence over src, so it never called fetchAndSanitizeSvg
            // when svg is given).
            if (svgProp === undefined && src !== undefined) {
                releaseFetchAndSanitizeSvg(src, {
                    sanitizeFn: currentSanitizeFn,
                    disableSanitization,
                    fetchOptions: currentFetchOptions,
                });
            }
        };
    }, [src, svgProp, disableSanitization, hasSanitizeFn, hasFetchOptions]);

    // Writes the resolved markup into the shadow root. Imperative rather
    // than JSX/dangerouslySetInnerHTML: a shadow root's content isn't part
    // of React's own tree, so there's nothing for React to reconcile here -
    // this component owns that DOM subtree directly, the same way a
    // non-React widget library would.
    useEffect(() => {
        const host = hostRef.current;
        // Defensive only: this effect runs after the host element has
        // committed (it's always rendered when there's no error - see the
        // `if (error) return fallback ?? null;` below), so host is never
        // actually null in practice. Same reasoning as the matching guard in
        // SvgIn.client.tsx.
        /* v8 ignore next */
        if (!host) return;
        if (!svg) {
            // Nothing resolved yet (or the last resolution failed) - don't
            // leave a previous src/svg's stale content showing.
            if (host.shadowRoot) host.shadowRoot.innerHTML = '';
            return;
        }
        const markup = buildSvgMarkup(svg, {
            title,
            description,
            idSuffix: idSuffix.current,
            attrs: { width, height, fill, 'aria-label': ariaLabel },
        });
        if (markup === null) return;
        const root = host.shadowRoot ?? host.attachShadow({ mode });
        root.innerHTML = (styles ? `<style>${styles}</style>` : '') + markup;
        const mountedSvg = root.querySelector('svg');
        if (mountedSvg) onMountRef.current?.(mountedSvg);
    }, [svg, title, description, width, height, fill, ariaLabel, styles, mode]);

    if (error) return fallback ?? null;
    // React.createElement rather than JSX: `as` is a dynamic tag name
    // ('span' | 'div'), and JSX's typing for a variable element name can't
    // reconcile a single shared `ref` against per-tag DOM element types the
    // way createElement's looser typing can.
    return React.createElement(Tag, { ref: hostRef, className, style });
};
