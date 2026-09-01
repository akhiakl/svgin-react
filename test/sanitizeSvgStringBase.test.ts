import { describe, expect, it, vi } from 'vitest';
import { createSanitizeSvgString } from '../src/utils/sanitizeSvgStringBase';

describe('createSanitizeSvgString', () => {
    it('sanitizes with the default sanitizer', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>clean</svg>');
        const sanitizeSvgString = createSanitizeSvgString(defaultSanitize);

        const result = await sanitizeSvgString('<svg><script>evil()</script></svg>');
        expect(result).toBe('<svg>clean</svg>');
        expect(defaultSanitize).toHaveBeenCalledWith('<svg><script>evil()</script></svg>');
    });

    it('returns the raw string unmodified when disableSanitization is set', async () => {
        const defaultSanitize = vi.fn();
        const sanitizeSvgString = createSanitizeSvgString(defaultSanitize);

        const result = await sanitizeSvgString('<svg><script>evil()</script></svg>', { disableSanitization: true });
        expect(result).toBe('<svg><script>evil()</script></svg>');
        expect(defaultSanitize).not.toHaveBeenCalled();
    });

    it('uses a custom sanitizeFn instead of the default sanitizer when given', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>default-clean</svg>');
        const customSanitize = vi.fn().mockResolvedValue('<svg>custom-clean</svg>');
        const sanitizeSvgString = createSanitizeSvgString(defaultSanitize);

        const result = await sanitizeSvgString('<svg>raw</svg>', { sanitizeFn: customSanitize });
        expect(result).toBe('<svg>custom-clean</svg>');
        expect(customSanitize).toHaveBeenCalledWith('<svg>raw</svg>');
        expect(defaultSanitize).not.toHaveBeenCalled();
    });

    it('memoizes repeated calls with the identical markup and options', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>clean</svg>');
        const sanitizeSvgString = createSanitizeSvgString(defaultSanitize);

        await sanitizeSvgString('<svg>raw</svg>');
        await sanitizeSvgString('<svg>raw</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
    });

    it('does not share a cache entry across different markup', async () => {
        const defaultSanitize = vi.fn().mockImplementation(async (s: string) => `clean:${s}`);
        const sanitizeSvgString = createSanitizeSvgString(defaultSanitize);

        const a = await sanitizeSvgString('<svg>a</svg>');
        const b = await sanitizeSvgString('<svg>b</svg>');
        expect(a).toBe('clean:<svg>a</svg>');
        expect(b).toBe('clean:<svg>b</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(2);
    });

    it('does not share a cache entry between default, disableSanitization, and a custom sanitizeFn for the same markup', async () => {
        const defaultSanitize = vi.fn().mockResolvedValue('<svg>default-clean</svg>');
        const customSanitize = vi.fn().mockResolvedValue('<svg>custom-clean</svg>');
        const sanitizeSvgString = createSanitizeSvgString(defaultSanitize);
        const raw = '<svg>same-markup</svg>';

        const viaDefault = await sanitizeSvgString(raw);
        const viaDisabled = await sanitizeSvgString(raw, { disableSanitization: true });
        const viaCustom = await sanitizeSvgString(raw, { sanitizeFn: customSanitize });

        expect(viaDefault).toBe('<svg>default-clean</svg>');
        expect(viaDisabled).toBe(raw);
        expect(viaCustom).toBe('<svg>custom-clean</svg>');
        expect(defaultSanitize).toHaveBeenCalledTimes(1);
    });
});
