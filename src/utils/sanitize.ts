import type { default as DOMPurifyType } from 'isomorphic-dompurify';

let domPurifyPromise: Promise<typeof DOMPurifyType> | null = null;

async function getDOMPurify() {
    if (!domPurifyPromise) {
        domPurifyPromise = import('isomorphic-dompurify').then(mod => mod.default);
    }
    return domPurifyPromise;
}

// Lazy-load DOMPurify only when needed
export async function sanitizeSvg(svg: string): Promise<string> {
    const DOMPurify = await getDOMPurify();
    // DOMPurify.sanitize is synchronous, but we keep async for custom sanitize fn compatibility
    return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
}
