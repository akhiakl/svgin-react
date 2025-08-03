import React, { useEffect, useState } from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgClient';
import { SvgInComponent } from './SvgInComponent';

export const SvgIn: React.FC<SvgInProps> = (props) => {
    const { src, sanitizeFn, disableSanitization, ...rest } = props;
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        fetchAndSanitizeSvg(src, { sanitizeFn, disableSanitization })
            .then(sanitized => { if (mounted) setSvg(sanitized); })
            .catch(e => { if (mounted) setError(e); });
        return () => { mounted = false; };
    }, [src, sanitizeFn, disableSanitization]);

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
