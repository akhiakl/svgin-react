import type { DOMPurify } from 'dompurify';

// jsdom + DOMPurify are loaded lazily and the JSDOM window + DOMPurify instance
// are created once and reused across calls, instead of on every sanitize call:
//   - `jsdom` is a heavy dependency (it isn't needed at all if a consumer
//     always uses `disableSanitization` or a custom `sanitizeFn`), so it's
//     only imported the first time the default sanitizer actually runs.
//   - Spinning up a new JSDOM window per call was pure overhead; the window
//     is never mutated by DOMPurify.sanitize beyond what it cleans up itself,
//     so one shared instance is safe to reuse.
let purifyPromise: Promise<DOMPurify> | undefined;

async function getPurify(): Promise<DOMPurify> {
    if (!purifyPromise) {
        purifyPromise = Promise.all([
            import('jsdom'),
            import('dompurify'),
        ]).then(([{ JSDOM }, { default: createDOMPurify }]) => {
            const window = new JSDOM('').window;
            return createDOMPurify(window);
        });
    }
    return purifyPromise;
}

export async function sanitizeSvg(svg: string): Promise<string> {
    const purify = await getPurify();
    return purify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
}
