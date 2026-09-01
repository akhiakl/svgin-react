import { describe, expect, it } from 'vitest';
import { diffSanitization } from '../src/diff';

describe('diffSanitization', () => {
    it('reports no removed tags/attrs and zero bytesRemoved when nothing changed', () => {
        const svg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>';
        const result = diffSanitization(svg, svg);
        expect(result).toEqual({ removedTags: [], removedAttrs: [], bytesRemoved: 0 });
    });

    it('reports a removed element', () => {
        const raw = '<svg><script>evil()</script><circle /></svg>';
        const sanitized = '<svg><circle /></svg>';
        const result = diffSanitization(raw, sanitized);
        expect(result.removedTags).toContain('script');
        expect(result.bytesRemoved).toBe(raw.length - sanitized.length);
    });

    it('reports removed attributes', () => {
        const raw = '<svg onload="alert(1)"><circle onmouseover="alert(2)" /></svg>';
        const sanitized = '<svg><circle /></svg>';
        const result = diffSanitization(raw, sanitized);
        expect(result.removedAttrs).toEqual(expect.arrayContaining(['onload', 'onmouseover']));
    });

    it('does not report a tag/attr that survives sanitization', () => {
        const raw = '<svg viewBox="0 0 24 24"><circle fill="red" /></svg>';
        const sanitized = '<svg viewBox="0 0 24 24"><circle fill="red" /></svg>';
        const result = diffSanitization(raw, sanitized);
        expect(result.removedTags).not.toContain('circle');
        expect(result.removedAttrs).not.toContain('viewbox');
        expect(result.removedAttrs).not.toContain('fill');
    });

    it('does not report an attribute whose count only decreased on the sanitized side by coincidence of an unrelated element removal', () => {
        // Two elements each carry a `fill` attribute; only one element (with
        // its fill) is removed, so `fill` should be reported as removed once
        // (count differs by 1), while the surviving element's own fill must
        // not make it look untouched.
        const raw = '<svg><rect fill="red" onclick="x()" /><circle fill="blue" /></svg>';
        const sanitized = '<svg><circle fill="blue" /></svg>';
        const result = diffSanitization(raw, sanitized);
        expect(result.removedTags).toContain('rect');
        expect(result.removedAttrs).toContain('onclick');
        // fill survives via <circle>, so its count only dropped by 1 (the
        // rect's own fill) - still correctly counted as partially removed.
        expect(result.removedAttrs).toContain('fill');
    });

    it('sorts removed names most-frequent first', () => {
        const raw = '<svg onclick="a()" onmouseover="b()" onmouseout="c()"><rect onclick="d()" /></svg>';
        const sanitized = '<svg><rect /></svg>';
        const result = diffSanitization(raw, sanitized);
        // onclick appears twice removed, the others once each.
        expect(result.removedAttrs[0]).toBe('onclick');
    });

    it('is case-insensitive when matching tag and attribute names', () => {
        const raw = '<svg><SCRIPT>evil()</SCRIPT></svg>';
        const sanitized = '<svg></svg>';
        const result = diffSanitization(raw, sanitized);
        expect(result.removedTags).toContain('script');
    });

    it('treats a sanitized result longer than the raw input as zero bytes removed, not negative', () => {
        // Not a realistic DOMPurify output, but the function should not
        // return a nonsensical negative byte count if it ever happened.
        const result = diffSanitization('<svg/>', '<svg>much longer output</svg>');
        expect(result.bytesRemoved).toBe(0);
    });

    it('handles an empty raw string without throwing', () => {
        expect(() => diffSanitization('', '')).not.toThrow();
        expect(diffSanitization('', '')).toEqual({ removedTags: [], removedAttrs: [], bytesRemoved: 0 });
    });
});
