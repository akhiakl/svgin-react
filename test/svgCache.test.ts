import { beforeEach, describe, expect, it } from 'vitest';
import { clearSvgCache, getCachedSvg, hasCachedSvg, setCachedSvg } from '../src/utils/svgCache';

describe('svgCache', () => {
    beforeEach(() => {
        clearSvgCache();
    });

    it('returns undefined for a url that has not been cached', () => {
        expect(getCachedSvg('https://example.com/a.svg')).toBeUndefined();
        expect(hasCachedSvg('https://example.com/a.svg')).toBe(false);
    });

    it('stores and retrieves an svg by url', () => {
        setCachedSvg('https://example.com/a.svg', '<svg></svg>');
        expect(getCachedSvg('https://example.com/a.svg')).toBe('<svg></svg>');
        expect(hasCachedSvg('https://example.com/a.svg')).toBe(true);
    });

    it('keeps different urls independent', () => {
        setCachedSvg('https://example.com/a.svg', '<svg id="a"></svg>');
        setCachedSvg('https://example.com/b.svg', '<svg id="b"></svg>');
        expect(getCachedSvg('https://example.com/a.svg')).toBe('<svg id="a"></svg>');
        expect(getCachedSvg('https://example.com/b.svg')).toBe('<svg id="b"></svg>');
    });

    it('clears every entry', () => {
        setCachedSvg('https://example.com/a.svg', '<svg></svg>');
        clearSvgCache();
        expect(hasCachedSvg('https://example.com/a.svg')).toBe(false);
    });
});
