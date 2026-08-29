import { describe, expect, it, vi } from 'vitest';
import { sanitizeSvg } from '../src/utils/sanitizeClient';

// Integration tests against the real DOMPurify pipeline (running against the
// jsdom global window this test file already runs under), mirroring
// sanitizeServer.test.ts - this is the actual security guarantee this
// library exists to provide, so it exercises real DOMPurify behavior rather
// than a mock.
describe('sanitizeSvg (client, real DOMPurify)', () => {
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

    it('keeps well-formed, benign SVG markup intact', async () => {
        const benign = '<svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z" fill="#f00"/></svg>';
        const clean = await sanitizeSvg(benign);
        expect(clean).toContain('<path');
        expect(clean).toContain('fill="#f00"');
    });

    it('loads DOMPurify only once across multiple sanitize calls', async () => {
        // Mirrors sanitizeServer.test.ts's "creates the JSDOM window only
        // once" test: dynamic import() can't be spied on directly, so use a
        // fresh module registry and mock "dompurify" with a wrapper that
        // counts how many times the factory is actually invoked.
        vi.resetModules();
        let callCount = 0;
        vi.doMock('dompurify', async () => {
            const actual = await vi.importActual<typeof import('dompurify')>('dompurify');
            callCount++;
            return actual;
        });

        const { sanitizeSvg: freshSanitizeSvg } = await import('../src/utils/sanitizeClient');
        await freshSanitizeSvg('<svg><circle r="1"/></svg>');
        await freshSanitizeSvg('<svg><script>alert(2)</script></svg>');

        expect(callCount).toBe(1);
        vi.doUnmock('dompurify');
    });
});
