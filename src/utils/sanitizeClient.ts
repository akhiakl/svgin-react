import type { DOMPurify } from 'dompurify';

// DOMPurify is loaded lazily and cached, so it only ends up in a consumer's
// bundle (and only runs the one-time init cost) if SVG sanitization is
// actually used - callers that always pass `disableSanitization` or their own
// `sanitizeFn` never pay for it.
let purifyPromise: Promise<DOMPurify> | undefined;

function getPurify(): Promise<DOMPurify> {
    if (!purifyPromise) {
        purifyPromise = import('dompurify').then((mod) => mod.default);
    }
    return purifyPromise;
}

export async function sanitizeSvg(svg: string): Promise<string> {
    const DOMPurify = await getPurify();
    return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
}
