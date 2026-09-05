import React from 'react';
import type { SvgInProps } from './types';
import { escapeHtml, extractSvgAttrs, extractSvgInner, uniquifyIds } from './utils/svgUtils';

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
 * props passed by the consumer always take precedence - this includes any
 * other standard SVG/DOM prop (`style`, `onClick`, `stroke`, `role`,
 * `tabIndex`, `data-*`, native `aria-*`, etc.), which SvgInProps accepts via
 * `SVGProps<SVGSVGElement>` and this component spreads onto the rendered
 * element after the source attributes.
 */
export const SvgInComponent: React.FC<
    // 'svg' is also omitted: SvgInProps.svg is the caller-supplied *raw*
    // markup (input to sanitization), while this component's own `svg` prop
    // below is the already-sanitized markup ready to render - same name,
    // different meaning at different pipeline stages. The other omissions
    // are props this component never reads and never forwards to the DOM:
    // they're either handled entirely by the client/server/suspense
    // wrappers before this component ever sees them (fetchOptions,
    // disableSanitization, onError, onMount, loadingFallback, loading), or -
    // for onError specifically - would otherwise conflict with the native
    // SVG `onError` DOM event handler now pulled in via SVGProps, which has
    // an incompatible signature.
    Omit<
        SvgInProps,
        | 'src'
        | 'sanitizeFn'
        | 'svg'
        | 'fetchOptions'
        | 'disableSanitization'
        | 'onError'
        | 'onMount'
        | 'loadingFallback'
        | 'loading'
    > & {
        svg: string | null;
        idSuffix?: string;
        // React 19 passes `ref` through to function components as a normal
        // prop (no forwardRef needed) - forwarded to the rendered <svg> so
        // SvgIn.client.tsx can hand it to the onMount callback.
        ref?: React.Ref<SVGSVGElement>;
    }
> = ({ svg, width, height, fill, fallback = null, className, ariaLabel, title, description, idSuffix, ref, ...rest }) => {
    if (!svg) return fallback;
    let inner = extractSvgInner(svg);
    if (inner !== null) {
        if (idSuffix) inner = uniquifyIds(inner, idSuffix);
        // Ids for the <title>/<desc> elements this injects, so the root <svg>
        // can point aria-labelledby/aria-describedby at them - the more
        // broadly-compatible way to wire an accessible name/description than
        // relying on assistive tech to treat a bare <title>/<desc> as implicit
        // labelling, which not every screen reader does consistently.
        const titleId = title ? `svgin-title-${idSuffix ?? ''}` : undefined;
        const descId = description ? `svgin-desc-${idSuffix ?? ''}` : undefined;
        if (description) inner = `<desc id="${descId}">${escapeHtml(description)}</desc>${inner}`;
        if (title) inner = `<title id="${titleId}">${escapeHtml(title)}</title>${inner}`;
        const sourceAttrs = parseSvgAttrs(extractSvgAttrs(svg));
        // Explicit ariaLabel always wins over the auto-wired title id, same
        // precedence as every other explicit prop in this component.
        return (
            <svg
                ref={ref}
                {...sourceAttrs}
                {...rest}
                {...(width !== undefined ? { width } : {})}
                {...(height !== undefined ? { height } : {})}
                {...(fill ? { fill } : {})}
                {...(className ? { className } : {})}
                {...(ariaLabel ? { 'aria-label': ariaLabel } : titleId ? { 'aria-labelledby': titleId } : {})}
                {...(descId ? { 'aria-describedby': descId } : {})}
                dangerouslySetInnerHTML={{ __html: inner }}
            />
        );
    }
    return null;
}
