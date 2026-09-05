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
 * regardless of how the bundler is configured. Exported from its own
 * `svgin-react/shadow` entry point (deliberately *not* also from
 * `svgin-react/client` - see client.ts's own comment on why) and from
 * `svgin-react/all`, for consumers who'd rather have every component behind
 * one import.
 *
 * Client-only: Shadow DOM is a browser API, so there is no server-component
 * equivalent (nothing to attach a shadow root to before any DOM exists).
 * Does not read `<SvgInProvider>` defaults, for the same bundle-isolation
 * reason `<SvgInSuspense />` doesn't - that context lives in `client.ts`
 * alongside `<SvgIn />`, and reading from it here would pull this file into
 * every consumer's bundle graph regardless of whether they use it.
 *
 * Also accepts any other standard `<span>`/`<div>` prop (native props are
 * forwarded to the *host* element, not the shadow-rendered `<svg>` - see
 * SvgInShadowProps).
 *
 * No `loading`/`loadingFallback` (lazy loading and a custom pending state
 * aren't implemented yet - the host element simply renders empty while a
 * fetch is pending, same as before the first resolve or after a rejected
 * one). Any other native prop (`style`, `onClick`, `id`, `role`, `tabIndex`,
 * `data-*`, native `aria-*`, etc.) is forwarded to the *host* element - see
 * SvgInShadowProps for why the host rather than the inner `<svg>`.
 */
// A plain function typed directly on SvgInShadowProps, not React.FC<...>:
// SvgInShadowProps deliberately omits `children` (there's nothing for a
// consumer to pass as children of a component that owns its own rendered
// content imperatively), and while the currently-pinned @types/react no
// longer has React.FC silently reintroduce an implicit `children?: ReactNode`
// (verified: `<SvgInShadow>text</SvgInShadow>` is a type error either way),
// older/different @types/react versions have behaved differently - avoiding
// React.FC here removes any doubt rather than relying on that being true for
// every consumer's installed type version.
export function SvgInShadow({
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
    ...rest
}: SvgInShadowProps): React.ReactNode {
    const hostRef = useRef<HTMLElement | null>(null);
    // Tracked in a ref rather than read back via `host.shadowRoot`: a
    // `mode: 'closed'` shadow root is not reachable that way from the
    // outside (that's the whole point of "closed") - `host.shadowRoot`
    // stays `null` even after a successful `attachShadow`. Relying on it
    // for closed mode would both re-attempt `attachShadow` on every update
    // (throwing, since a shadow root already exists) and never be able to
    // clear stale content before writing new content in. `mode` itself
    // can't be changed after the first attach (a real Shadow DOM
    // constraint, not one this component adds).
    //
    // Paired with the `host` it was created for (not just the `ShadowRoot`
    // alone): the host element itself is replaced whenever `as` changes
    // (React unmounts the old `<span>`/`<div>` and mounts a new one), or
    // whenever this component re-renders `fallback` on error and later
    // recovers (a fresh host element commits once `error` clears) - in
    // either case `hostRef.current` becomes a *different* DOM node, and a
    // shadow root created for the old, now-detached one is worthless. The
    // effect below resets this ref when its `host` no longer matches
    // `hostRef.current`, rather than reusing a stale root.
    const shadowRootRef = useRef<{ host: HTMLElement; root: ShadowRoot } | null>(null);
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
        // Discard a shadow root that belonged to a previous, now-detached
        // host element (see the ref's own comment) - it must not be reused
        // for the current one.
        if (shadowRootRef.current && shadowRootRef.current.host !== host) {
            shadowRootRef.current = null;
        }
        if (!svg) {
            // Nothing resolved yet (or the last resolution failed) - don't
            // leave a previous src/svg's stale content showing.
            if (shadowRootRef.current) shadowRootRef.current.root.innerHTML = '';
            return;
        }
        const markup = buildSvgMarkup(svg, {
            title,
            description,
            idSuffix: idSuffix.current,
            attrs: { width, height, fill, 'aria-label': ariaLabel },
        });
        if (markup === null) return;
        // attachShadow throws if the host already has one - only ever call
        // it once per host, via shadowRootRef (see its own comment above).
        const root = shadowRootRef.current?.root ?? host.attachShadow({ mode });
        if (!shadowRootRef.current) shadowRootRef.current = { host, root };
        // `markup` alone goes through innerHTML (it's already a well-formed
        // <svg> string assembled by buildSvgMarkup, with every attribute/
        // text value escaped). `styles`, though, is arbitrary consumer-
        // supplied CSS text, not HTML - concatenating it into an innerHTML
        // string as `<style>${styles}</style>` would let a value containing
        // `</style><script>...` break out and inject real markup. Building
        // a real <style> element and assigning textContent instead treats
        // it purely as text, the same way a native <style> tag's content
        // always would, with no HTML-injection risk regardless of content.
        root.innerHTML = markup;
        if (styles) {
            const styleEl = document.createElement('style');
            styleEl.textContent = styles;
            root.prepend(styleEl);
        }
        const mountedSvg = root.querySelector('svg');
        // Defensive only: buildSvgMarkup returned non-null above, which is
        // only ever a well-formed `<svg ...>...</svg>` string (see its own
        // contract) - the querySelector immediately after setting it as
        // innerHTML always finds that same element in practice.
        /* v8 ignore next */
        if (!mountedSvg) return;
        onMountRef.current?.(mountedSvg);
    }, [svg, title, description, width, height, fill, ariaLabel, styles, mode, Tag]);

    if (error) return fallback ?? null;
    // React.createElement rather than JSX: `as` is a dynamic tag name
    // ('span' | 'div'), and JSX's typing for a variable element name can't
    // reconcile a single shared `ref` against per-tag DOM element types the
    // way createElement's looser typing can.
    return React.createElement(Tag, { ref: hostRef, className, style, ...rest });
};
