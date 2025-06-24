import React, { useEffect, useState } from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvg';
import { SvgIn } from './SvgIn';

export const SvgInClient: React.FC<SvgInProps> = (props) => {
    const { src, sanitizeFn, ...rest } = props;
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        fetchAndSanitizeSvg(src, sanitizeFn)
            .then(sanitized => { if (mounted) setSvg(sanitized); })
            .catch(e => { if (mounted) setError(e); });
        return () => { mounted = false; };
    }, [src, sanitizeFn]);

    if (error || !svg) return props.fallback ?? null;
    return <SvgIn svg={svg} {...rest} />;
};
