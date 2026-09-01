import React, { useEffect, useRef, useState } from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgClient';
import { SvgInComponent } from './SvgInComponent';
import { nextInstanceId } from './utils/instanceId';

export const SvgIn: React.FC<SvgInProps> = (props) => {
    // title/description/onError/onMount are pulled out of `rest` too: none
    // of them are valid attributes on the raw placeholder <svg> below (title
    // would be misread as a native tooltip attribute; the others would just
    // warn as unknown DOM attributes).
    const { src, sanitizeFn, disableSanitization, title, description, onError, onMount, ...rest } = props;
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

    useEffect(() => {
        let mounted = true;
        setSvg(null);
        setError(null);
        fetchAndSanitizeSvg(src, { sanitizeFn: sanitizeFnRef.current, disableSanitization })
            .then(sanitized => { if (mounted) setSvg(sanitized); })
            .catch(e => { if (mounted) { setError(e); onErrorRef.current?.(e); } });
        return () => { mounted = false; };
    }, [src, disableSanitization, hasSanitizeFn]);

    // Fires after the rendered <svg> DOM node is available (or updated) -
    // this is the closest client-side equivalent to react-svg's
    // beforeInjection: a hook for imperative DOM work the declarative props
    // above don't cover.
    useEffect(() => {
        if (svg && svgRef.current) onMountRef.current?.(svgRef.current);
    }, [svg]);

    if (error) return props.fallback ?? null;
    if (!svg) {
        return (
            <svg
                {...rest}
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
            {...rest}
        />
    );
};
