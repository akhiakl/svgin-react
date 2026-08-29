import React from 'react';
import type { SvgInProps } from './types';
import { extractSvgAttrs, extractSvgInner } from './utils/svgUtils';

/**
 * Parses the attribute string from the source `<svg>` opening tag and returns
 * an object of attribute name → value pairs, so that attributes like
 * `viewBox`, `xmlns`, `preserveAspectRatio`, and `version` written by the
 * SVG author are forwarded to the rendered element.
 *
 * Explicit props passed by the consumer (`width`, `height`, `fill`,
 * `className`, `ariaLabel`) always take precedence over the source
 * attributes.
 */
function parseSvgAttrs(attrString: string): Record<string, string> {
    const result: Record<string, string> = {};
    // Match name="value", name='value', or bare name (boolean attrs)
    const re = /([a-zA-Z_:][a-zA-Z0-9_:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(attrString)) !== null) {
        const name = m[1];
        const value = m[2] ?? m[3] ?? m[4] ?? '';
        result[name] = value;
    }
    return result;
}

/**
 * Pure SVG rendering component. Pass sanitized SVG string as `svg` prop.
 * Used by both client and server wrappers.
 *
 * Attributes from the source `<svg>` tag (e.g. `viewBox`, `xmlns`,
 * `preserveAspectRatio`) are forwarded to the rendered element. Explicit
 * props passed by the consumer always take precedence.
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
        const sourceAttrs = parseSvgAttrs(extractSvgAttrs(svg));
        return (
            <svg
                {...sourceAttrs}
                {...(width !== undefined ? { width } : {})}
                {...(height !== undefined ? { height } : {})}
                {...(fill ? { fill } : {})}
                {...(className ? { className } : {})}
                {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
                dangerouslySetInnerHTML={{ __html: inner }}
            />
        );
    }
    return null;
}
