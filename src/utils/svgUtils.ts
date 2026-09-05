/**
 * Minimal HTML-escaping for text inserted into `<title>`/`<desc>` via
 * dangerouslySetInnerHTML (SvgInComponent) or a shadow root's innerHTML
 * (SvgInShadow). title/description come from the consumer's own code (not
 * the untrusted fetched SVG), so this is about not breaking the surrounding
 * markup on stray `<`/`&`, not sanitization.
 */
export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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

/**
 * Rewrites every `id="..."` in the SVG, and every internal reference to
 * those ids (`url(#id)`, `href="#id"`, `xlink:href="#id"`), by appending a
 * suffix - so that multiple instances of the same icon rendered on one page
 * don't silently share (and fight over) the same `<linearGradient>`,
 * `<clipPath>`, `<mask>`, or `<filter>` definition via a collided id.
 *
 * Only touches references that match an id actually defined in this SVG; an
 * `href` pointing to an external file/URL fragment is left untouched. Uses
 * bounded character classes (no `[\s\S]*`-style quantifiers) for the same
 * reason extractSvgInner does - avoiding catastrophic backtracking on large
 * or malformed input.
 */
export function uniquifyIds(svg: string, suffix: string): string {
    const ids = new Set<string>();
    const idRe = /\bid="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = idRe.exec(svg)) !== null) {
        ids.add(m[1]);
    }
    if (ids.size === 0) return svg;

    return svg
        // Every id="..." this matches was already found by the scan above
        // (same pattern), so it is always in `ids` - no membership check needed.
        .replace(/\bid="([^"]+)"/g, (_full, id: string) => `id="${id}-${suffix}"`)
        .replace(/url\(#([^)"']+)\)/g, (full, id: string) => (ids.has(id) ? `url(#${id}-${suffix})` : full))
        .replace(/((?:xlink:)?href)="#([^"]+)"/g, (full, attr: string, id: string) =>
            ids.has(id) ? `${attr}="#${id}-${suffix}"` : full
        );
}
