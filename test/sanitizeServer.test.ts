import { describe, expect, it } from 'vitest';
import { sanitizeSvg } from '../src/utils/sanitizeServer';

// Integration tests against the real DOMPurify + jsdom pipeline - these are
// the actual security guarantee this library exists to provide, so they
// exercise real DOMPurify behavior rather than a mock.
describe('sanitizeSvg (server, real DOMPurify + jsdom)', () => {
    it('strips <script> tags', async () => {
        const dirty = '<svg><script>alert(1)</script><circle r="5"/></svg>';
        const clean = await sanitizeSvg(dirty);
        expect(clean).not.toContain('<script');
        expect(clean).toContain('<circle');
    });

    it('strips inline event handler attributes', async () => {
        const dirty = '<svg><rect width="1" height="1" onload="alert(1)"/></svg>';
        const clean = await sanitizeSvg(dirty);
        expect(clean).not.toContain('onload');
    });

    it('strips javascript: URIs', async () => {
        const dirty = '<svg><a href="javascript:alert(1)"><rect width="1" height="1"/></a></svg>';
        const clean = await sanitizeSvg(dirty);
        expect(clean).not.toContain('javascript:');
    });

    it('keeps well-formed, benign SVG markup intact', async () => {
        const benign = '<svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z" fill="#f00"/></svg>';
        const clean = await sanitizeSvg(benign);
        expect(clean).toContain('<path');
        expect(clean).toContain('fill="#f00"');
    });

    it('reuses the same DOMPurify instance across calls', async () => {
        await sanitizeSvg('<svg><circle r="1"/></svg>');
        const clean = await sanitizeSvg('<svg><script>alert(2)</script></svg>');
        expect(clean).not.toContain('<script');
    });
});
