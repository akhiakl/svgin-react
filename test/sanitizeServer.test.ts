import { describe, expect, it, vi } from 'vitest';
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

    it('sanitization keeps working across repeated calls', async () => {
        await sanitizeSvg('<svg><circle r="1"/></svg>');
        const clean = await sanitizeSvg('<svg><script>alert(2)</script></svg>');
        expect(clean).not.toContain('<script');
    });

    it('creates the JSDOM window only once across multiple sanitize calls', async () => {
        // Unlike the tests above, this one actually asserts instance reuse
        // (rather than just that sanitization keeps working). ESM module
        // namespaces aren't configurable, so vi.spyOn can't patch the real
        // "jsdom" export in place - instead, mock the module with a wrapper
        // that counts JSDOM constructions but otherwise behaves identically.
        // Needs a fresh module registry so this test's own call count isn't
        // polluted by sanitizeServer's module-level cache already having been
        // populated by the tests above.
        vi.resetModules();
        let constructCount = 0;
        vi.doMock('jsdom', async () => {
            const actual = await vi.importActual<typeof import('jsdom')>('jsdom');
            class CountingJSDOM extends actual.JSDOM {
                constructor(...args: ConstructorParameters<typeof actual.JSDOM>) {
                    super(...args);
                    constructCount++;
                }
            }
            return { ...actual, JSDOM: CountingJSDOM };
        });

        const { sanitizeSvg: freshSanitizeSvg } = await import('../src/utils/sanitizeServer');
        await freshSanitizeSvg('<svg><circle r="1"/></svg>');
        await freshSanitizeSvg('<svg><script>alert(2)</script></svg>');

        expect(constructCount).toBe(1);
        vi.doUnmock('jsdom');
    });
});
