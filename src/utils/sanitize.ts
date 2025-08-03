
// Dynamically import the correct sanitizer based on environment
export async function sanitizeSvg(svg: string): Promise<string> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        const mod = await import('./sanitizeServer');
        return mod.sanitizeSvg(svg);
    } else {
        const mod = await import('./sanitizeClient');
        return mod.sanitizeSvg(svg);
    }
}
