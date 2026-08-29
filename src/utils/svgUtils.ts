/**
 * Extracts the inner markup of a sanitized `<svg>...</svg>` string, so it can
 * be rendered via `dangerouslySetInnerHTML` inside a React-controlled `<svg>`
 * element (which owns width/height/fill/className/aria-label as normal,
 * escaped React props - see SvgInComponent).
 *
 * Uses indexOf/lastIndexOf instead of a regex to avoid catastrophic
 * backtracking on large or malformed SVG strings (an unbounded `[\s\S]*`
 * quantifier is O(n²) when the closing tag is absent).
 */
export function extractSvgInner(svg: string): string | null {
    if (!svg.startsWith('<svg')) return null;
    const openEnd = svg.indexOf('>');
    if (openEnd === -1) return null;
    const closeStart = svg.lastIndexOf('</svg>');
    if (closeStart === -1 || closeStart <= openEnd) return null;
    return svg.slice(openEnd + 1, closeStart);
}

/**
 * Extracts the attribute string from the opening `<svg ...>` tag of an SVG
 * string so that `SvgInComponent` can forward attributes like `viewBox`,
 * `xmlns`, and `preserveAspectRatio` that the source SVG author intended.
 *
 * Returns an empty string when the string does not start with `<svg` or the
 * opening tag has no attributes.
 */
export function extractSvgAttrs(svg: string): string {
    if (!svg.startsWith('<svg')) return '';
    const openEnd = svg.indexOf('>');
    if (openEnd === -1) return '';
    // Content between "<svg" (4 chars) and the closing ">" of the opening tag.
    return svg.slice(4, openEnd).trim();
}
