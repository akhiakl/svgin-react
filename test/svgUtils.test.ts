import { describe, expect, it } from 'vitest';
import { extractSvgAttrs, extractSvgInner } from '../src/utils/svgUtils';

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

    it('returns null when there is no > in the opening tag', () => {
        expect(extractSvgInner('<svg')).toBeNull();
    });

    it('handles nested <svg> elements — extracts to the last closing tag', () => {
        const svg = '<svg><svg><circle/></svg></svg>';
        expect(extractSvgInner(svg)).toBe('<svg><circle/></svg>');
    });
});

describe('extractSvgAttrs', () => {
    it('returns attribute string for a tag with attributes', () => {
        const result = extractSvgAttrs('<svg viewBox="0 0 24 24"><path/></svg>');
        expect(result).toBe('viewBox="0 0 24 24"');
    });

    it('returns empty string for a tag with no attributes', () => {
        expect(extractSvgAttrs('<svg><path/></svg>')).toBe('');
    });

    it('returns empty string when input does not start with <svg', () => {
        expect(extractSvgAttrs('<div>test</div>')).toBe('');
    });

    it('returns empty string for an empty string', () => {
        expect(extractSvgAttrs('')).toBe('');
    });

    it('returns empty string when the opening tag has no closing >', () => {
        expect(extractSvgAttrs('<svg viewBox="0 0 24 24"')).toBe('');
    });

    it('returns multiple attributes', () => {
        const result = extractSvgAttrs('<svg viewBox="0 0 24 24" fill="none"><path/></svg>');
        expect(result).toBe('viewBox="0 0 24 24" fill="none"');
    });
});
