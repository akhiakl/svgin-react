import { describe, expect, it } from 'vitest';
import { buildSvgMarkup } from '../src/utils/buildSvgMarkup';

describe('buildSvgMarkup', () => {
    it('returns null for a malformed svg string', () => {
        expect(buildSvgMarkup('<div>not svg</div>')).toBeNull();
    });

    it('returns the outer <svg>...</svg> string unchanged when given no options', () => {
        expect(buildSvgMarkup('<svg viewBox="0 0 10 10"><circle r="5"/></svg>')).toBe(
            '<svg viewBox="0 0 10 10"><circle r="5"/></svg>'
        );
    });

    it('lets an explicit attr override a matching source attribute', () => {
        const markup = buildSvgMarkup('<svg fill="blue"><path/></svg>', { attrs: { fill: '#f00', width: 24 } });
        expect(markup).toContain('fill="#f00"');
        expect(markup).toContain('width="24"');
        expect(markup).not.toContain('fill="blue"');
    });

    it('leaves a source attribute untouched when the matching attrs override is undefined or empty', () => {
        const markup = buildSvgMarkup('<svg fill="blue"><path/></svg>', {
            attrs: { fill: undefined, width: '' },
        });
        // attrs only override when a real value is given - an unset/empty
        // override is not treated as "delete this attribute".
        expect(markup).toContain('fill="blue"');
        expect(markup).not.toContain('width=');
    });

    it('injects title/desc (title first) and wires aria-labelledby/aria-describedby', () => {
        const markup = buildSvgMarkup('<svg><path/></svg>', {
            title: 'Alert',
            description: 'Warns the user',
            idSuffix: 'x',
        });
        expect(markup).toMatch(/<title id="svgin-title-x">Alert<\/title>.*<desc id="svgin-desc-x">Warns the user<\/desc>/s);
        expect(markup).toContain('aria-labelledby="svgin-title-x"');
        expect(markup).toContain('aria-describedby="svgin-desc-x"');
    });

    it('lets an explicit aria-label attr win over the auto-wired aria-labelledby', () => {
        const markup = buildSvgMarkup('<svg><path/></svg>', {
            title: 'Alert',
            idSuffix: 'x',
            attrs: { 'aria-label': 'Custom label' },
        });
        expect(markup).toContain('aria-label="Custom label"');
        expect(markup).not.toContain('aria-labelledby');
    });

    it('still auto-wires aria-labelledby when the source SVG (not an explicit attrs override) already has its own aria-label', () => {
        // Regression test: checking the *merged* attrs (source + overrides)
        // for an existing aria-label - rather than only an explicit
        // `attrs['aria-label']` override - would incorrectly skip wiring
        // aria-labelledby here, diverging from SvgInComponent's own
        // behavior (which always wires aria-labelledby to the injected
        // title unless the *consumer* passes an explicit aria-label).
        const markup = buildSvgMarkup('<svg aria-label="from source"><path/></svg>', {
            title: 'Alert',
            idSuffix: 'x',
        });
        expect(markup).toContain('aria-labelledby="svgin-title-x"');
    });

    it('uniquifies internal ids when idSuffix is given', () => {
        const markup = buildSvgMarkup('<svg><linearGradient id="g"/><rect fill="url(#g)"/></svg>', {
            idSuffix: 'a',
        });
        expect(markup).toContain('id="g-a"');
        expect(markup).toContain('fill="url(#g-a)"');
    });

    it('forwards single-quoted and bare (valueless) source attributes', () => {
        const markup = buildSvgMarkup("<svg viewBox='0 0 8 8' data-generated><path/></svg>");
        expect(markup).toContain('viewBox="0 0 8 8"');
        expect(markup).toContain('data-generated=""');
    });

    it('injects title/desc ids without a "-" suffix when idSuffix is not given', () => {
        const markup = buildSvgMarkup('<svg><path/></svg>', { title: 'Alert', description: 'Warns' });
        expect(markup).toContain('<title id="svgin-title-">Alert</title>');
        expect(markup).toContain('<desc id="svgin-desc-">Warns</desc>');
    });

    it('injects a description without a title (and vice versa)', () => {
        const withDescOnly = buildSvgMarkup('<svg><path/></svg>', { description: 'Warns', idSuffix: 'x' });
        expect(withDescOnly).toContain('<desc id="svgin-desc-x">Warns</desc>');
        expect(withDescOnly).not.toContain('<title');
        expect(withDescOnly).toContain('aria-describedby="svgin-desc-x"');
        expect(withDescOnly).not.toContain('aria-labelledby');

        const withTitleOnly = buildSvgMarkup('<svg><path/></svg>', { title: 'Alert', idSuffix: 'x' });
        expect(withTitleOnly).toContain('<title id="svgin-title-x">Alert</title>');
        expect(withTitleOnly).not.toContain('<desc');
    });

    it('escapes title/description text content', () => {
        const markup = buildSvgMarkup('<svg><path/></svg>', { title: '<script>alert(1)</script>' });
        expect(markup).not.toContain('<script>');
        expect(markup).toContain('&lt;script&gt;');
    });

    it('escapes a double quote in an attrs value so it cannot break out of the attribute', () => {
        // Regression test: an unescaped `"` in a value written into
        // `key="${value}"` would close the attribute early and let the rest
        // of the string inject further markup/attributes into the shadow
        // root's innerHTML.
        const markup = buildSvgMarkup('<svg><path/></svg>', {
            attrs: { 'aria-label': '"><script>alert(1)</script>' },
        });
        expect(markup).not.toContain('<script>');
        expect(markup).toContain('aria-label="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
    });

    it('escapes a single quote too, defensively', () => {
        const markup = buildSvgMarkup('<svg><path/></svg>', { attrs: { 'aria-label': "o'brien" } });
        expect(markup).toContain('aria-label="o&#39;brien"');
    });
});
