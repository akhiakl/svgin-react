/**
 * Extracts the inner markup of a sanitized `<svg>...</svg>` string, so it can
 * be rendered via `dangerouslySetInnerHTML` inside a React-controlled `<svg>`
 * element (which owns width/height/fill/className/aria-label as normal,
 * escaped React props - see SvgInComponent).
 */
export function extractSvgInner(svg: string): string | null {
    if (!svg.startsWith('<svg')) return null;
    const match = svg.match(/^<svg[^>]*>([\s\S]*)<\/svg>$/i);
    return match ? match[1] : null;
}
