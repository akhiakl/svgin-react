import React, { useEffect, useRef, useState } from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgClient';
import { SvgInComponent } from './SvgInComponent';

export const SvgIn: React.FC<SvgInProps> = (props) => {
    const { src, sanitizeFn, disableSanitization, ...rest } = props;
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // sanitizeFn is intentionally read from a ref rather than listed as an
    // effect dependency: consumers commonly pass an inline arrow function,
    // whose identity changes every render. Depending on it directly would
    // re-fetch and re-sanitize the same SVG on every re-render instead of
    // only when `src`/`disableSanitization` actually change.
    const sanitizeFnRef = useRef(sanitizeFn);
    sanitizeFnRef.current = sanitizeFn;

    useEffect(() => {
        let mounted = true;
        fetchAndSanitizeSvg(src, { sanitizeFn: sanitizeFnRef.current, disableSanitization })
            .then(sanitized => { if (mounted) setSvg(sanitized); })
            .catch(e => { if (mounted) setError(e); });
        return () => { mounted = false; };
    }, [src, disableSanitization]);

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
