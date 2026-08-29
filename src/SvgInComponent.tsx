import React from 'react';
import type { SvgInProps } from './types';
import { extractSvgInner } from './utils/svgUtils';

/**
 * Pure SVG rendering component. Pass sanitized SVG string as `svg` prop.
 * Used by both client and server wrappers.
 */
export const SvgInComponent: React.FC<Omit<SvgInProps, 'src' | 'sanitizeFn'> & { svg: string | null }> = ({
    svg,
    width,
    height,
    fill,
    fallback = null,
    className,
    ariaLabel,
}) => {
    if (!svg) return fallback;
    const inner = extractSvgInner(svg);
    if (inner !== null) {
        return (
            <svg
                {...(width ? { width } : {})}
                {...(height ? { height } : {})}
                {...(fill ? { fill } : {})}
                {...(className ? { className } : {})}
                {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
                dangerouslySetInnerHTML={{ __html: inner }}
            />
        );
    }
    return null;
}
