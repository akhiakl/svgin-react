import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

export function sanitizeSvg(svg: string): string {
    const window = new JSDOM('').window;
    const purify = createDOMPurify(window);
    return purify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
}
