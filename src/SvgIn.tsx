import React from 'react';
import type { SvgInProps } from './types';
import { parseAndInjectSvg } from './utils/svgUtils';

/**
 * Pure SVG rendering component. Pass sanitized SVG string as `svg` prop.
 * Used by both client and server wrappers.
 */
export const SvgIn: React.FC<Omit<SvgInProps, 'src' | 'sanitizeFn'> & { svg: string | null }> = ({
    svg,
    width,
    height,
    fill,
    fallback = null,
    className,
    ariaLabel,
}) => {
    if (!svg) return fallback;
    const parsed = parseAndInjectSvg(svg, { width, height, fill });
    if (parsed) {
        return (
            <svg
                {...(width ? { width } : {})}
                {...(height ? { height } : {})}
                {...(fill ? { fill } : {})}
                {...(className ? { className } : {})}
                {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
                dangerouslySetInnerHTML={{ __html: parsed.inner }}
            />
        );
    }
    return null;
}
