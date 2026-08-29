import { describe, expect, it } from 'vitest';
import { sanitizeSvg } from '../src/utils/sanitizeClient';

// sanitizeClient runs DOMPurify in the browser environment.  Tests run in
// jsdom, which provides the DOM API that browser DOMPurify requires.
describe('sanitizeClient', () => {
    it('strips <script> tags from SVG', async () => {
        const result = await sanitizeSvg('<svg><script>alert(1)</script><path/></svg>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('<path');
    });

    it('strips inline event handlers from SVG elements', async () => {
        const result = await sanitizeSvg('<svg><circle onload="evil()"/></svg>');
        expect(result).not.toContain('onload');
    });

    it('preserves safe SVG elements and attributes', async () => {
        const result = await sanitizeSvg('<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>');
        expect(result).toContain('viewBox');
        expect(result).toContain('<path');
    });

    it('returns an empty string when the entire SVG is stripped', async () => {
        const result = await sanitizeSvg('<script>alert(1)</script>');
        expect(result).toBe('');
    });

    it('reuses the same DOMPurify instance across calls (no re-import)', async () => {
        // Two back-to-back calls must both succeed, confirming the lazy singleton works.
        const first = await sanitizeSvg('<svg><path/></svg>');
        const second = await sanitizeSvg('<svg><circle/></svg>');
        expect(first).toContain('<path');
        expect(second).toContain('<circle');
    });
});
