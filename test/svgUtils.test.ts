import { describe, expect, it } from 'vitest';
import { extractSvgAttrs, extractSvgInner, uniquifyIds } from '../src/utils/svgUtils';

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

describe('uniquifyIds', () => {
    it('suffixes a defined id and its url(#id) reference', () => {
        const svg = '<defs><linearGradient id="g"/></defs><rect fill="url(#g)"/>';
        const result = uniquifyIds(svg, 'x1');
        expect(result).toContain('id="g-x1"');
        expect(result).toContain('url(#g-x1)');
        expect(result).not.toContain('id="g"');
    });

    it('suffixes href and xlink:href references to a defined id', () => {
        const svg = '<clipPath id="c"><rect/></clipPath><use href="#c"/><use xlink:href="#c"/>';
        const result = uniquifyIds(svg, 'x2');
        expect(result).toContain('id="c-x2"');
        expect(result).toContain('href="#c-x2"');
        expect(result).toContain('xlink:href="#c-x2"');
    });

    it('does not rewrite a reference whose id is not actually defined in this SVG', () => {
        // Guards against mangling a legitimate external/dangling reference.
        const svg = '<use href="#not-defined-here"/>';
        expect(uniquifyIds(svg, 'x3')).toBe(svg);
    });

    it('leaves an undefined url()/href reference untouched even when other ids are defined and rewritten', () => {
        // Same guard as above, but exercised on the code path taken once the
        // SVG has at least one real id (rather than the early-return path
        // taken when there are none at all).
        const svg =
            '<linearGradient id="g"/><rect fill="url(#g)"/>' +
            '<rect fill="url(#undefined-gradient)"/><use href="#external-fragment"/>';
        const result = uniquifyIds(svg, 'x5');
        expect(result).toContain('id="g-x5"');
        expect(result).toContain('url(#g-x5)');
        expect(result).toContain('url(#undefined-gradient)');
        expect(result).toContain('href="#external-fragment"');
    });

    it('returns the input unchanged when there are no ids at all', () => {
        const svg = '<path d="M0 0h1v1H0z"/>';
        expect(uniquifyIds(svg, 'x4')).toBe(svg);
    });

    it('gives two different suffixes distinct, non-colliding ids for the same markup', () => {
        const svg = '<linearGradient id="g"/><rect fill="url(#g)"/>';
        const a = uniquifyIds(svg, 'a');
        const b = uniquifyIds(svg, 'b');
        expect(a).not.toBe(b);
        expect(a).toContain('id="g-a"');
        expect(b).toContain('id="g-b"');
    });
});
