import { fetchAndSanitizeSvg } from './fetchAndSanitizeSvgClient';
import { sanitizeSvgString } from './sanitizeSvgStringClient';

/**
 * Resolves to the sanitized SVG markup for either the `svg` (raw markup, no
 * fetch) or `src` (fetch) path - the same precedence rule (`svg` wins over
 * `src`) shared by every client component. Rejects when neither is given.
 * `componentName` is only used in that rejection's message (e.g.
 * `'<SvgIn />'`), so each caller's error still names itself.
 */
export function resolveSvgPromiseClient(
    componentName: string,
    src: string | undefined,
    svgProp: string | undefined,
    sanitizeFn: ((svg: string) => Promise<string>) | undefined,
    disableSanitization: boolean | undefined,
    fetchOptions: RequestInit | undefined
): Promise<string> {
    if (svgProp !== undefined) return sanitizeSvgString(svgProp, { sanitizeFn, disableSanitization });
    if (src !== undefined) return fetchAndSanitizeSvg(src, { sanitizeFn, disableSanitization, fetchOptions });
    return Promise.reject(new Error(`${componentName} requires either \`src\` or \`svg\`.`));
}
