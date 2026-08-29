import { describe, expect, it } from 'vitest';
import { extractSvgInner } from '../src/utils/svgUtils';

describe('extractSvgInner', () => {
    it('returns the markup between the opening and closing svg tags', () => {
        const svg = '<svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>';
        expect(extractSvgInner(svg)).toBe('<path d="M0 0h10v10H0z"/>');
    });

    it('handles an svg tag with no attributes', () => {
        expect(extractSvgInner('<svg><circle r="5"/></svg>')).toBe('<circle r="5"/>');
    });

    it('handles multiline / nested content', () => {
        const svg = '<svg>\n  <g>\n    <rect width="1" height="1"/>\n  </g>\n</svg>';
        expect(extractSvgInner(svg)).toBe('\n  <g>\n    <rect width="1" height="1"/>\n  </g>\n');
    });

    it('returns null for a string that does not start with <svg', () => {
        expect(extractSvgInner('<div>not an svg</div>')).toBeNull();
    });

    it('returns null when there is no matching closing tag', () => {
        expect(extractSvgInner('<svg><path/>')).toBeNull();
    });

    it('returns null for an empty string', () => {
        expect(extractSvgInner('')).toBeNull();
    });
});
