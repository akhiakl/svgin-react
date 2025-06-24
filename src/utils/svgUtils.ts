import type { SvgInProps } from '../types';

/**
 * Injects width, height, fill into the <svg> tag and returns { attrs, inner }.
 */
export function parseAndInjectSvg(svg: string, props: Pick<SvgInProps, 'width' | 'height' | 'fill'>) {
    if (!svg.startsWith('<svg')) return null;
    const { width, height, fill } = props;
    const injected = svg.replace(
        /<svg([^>]*)>/,
        (m: string, attrs: string) => {
            let newAttrs = attrs;
            if (width) newAttrs = newAttrs.replace(/width="[^"]*"/, '');
            if (height) newAttrs = newAttrs.replace(/height="[^"]*"/, '');
            if (fill) newAttrs = newAttrs.replace(/fill="[^"]*"/, '');
            if (width) newAttrs += ` width="${width}"`;
            if (height) newAttrs += ` height="${height}"`;
            if (fill) newAttrs += ` fill="${fill}"`;
            return `<svg${newAttrs}>`;
        }
    );
    const match = injected.match(/^<svg([^>]*)>([\s\S]*)<\/svg>$/i);
    if (!match) return null;
    return { attrs: match[1], inner: match[2] };
}
