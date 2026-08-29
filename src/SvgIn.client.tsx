import React, { useEffect, useRef, useState } from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgClient';
import { SvgInComponent } from './SvgInComponent';

export const SvgIn: React.FC<SvgInProps> = (props) => {
    const { src, sanitizeFn, disableSanitization, ...rest } = props;
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // sanitizeFn is read from a ref rather than depended on directly:
    // consumers commonly pass an inline arrow function, whose identity
    // changes every render, and depending on that identity would re-fetch
    // and re-sanitize the same SVG on every re-render. The effect still
    // depends on hasSanitizeFn (whether a custom sanitizer is present at
    // all), so switching between the default sanitizer and a custom one -
    // an actual change in sanitization behavior, not just a new closure -
    // still triggers a refetch.
    const sanitizeFnRef = useRef(sanitizeFn);
    sanitizeFnRef.current = sanitizeFn;
    const hasSanitizeFn = sanitizeFn !== undefined;

    useEffect(() => {
        let mounted = true;
        fetchAndSanitizeSvg(src, { sanitizeFn: sanitizeFnRef.current, disableSanitization })
            .then(sanitized => { if (mounted) setSvg(sanitized); })
            .catch(e => { if (mounted) setError(e); });
        return () => { mounted = false; };
    }, [src, disableSanitization, hasSanitizeFn]);

    if (error) return props.fallback ?? null;
    if (!svg) {
        return (
            <svg
                {...rest}
                aria-busy="true"
                aria-label="Loading SVG"
                focusable="false"
                tabIndex={-1}
            />
        );
    }
    return <SvgInComponent svg={svg} {...rest} />;
};
