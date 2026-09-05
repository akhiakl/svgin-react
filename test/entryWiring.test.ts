import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSvgCache } from '../src/utils/svgCache';

// These thin one-line wrapper modules (createFetchAndSanitizeSvg/
// createSanitizeSvgString applied to a concrete sanitizer) are mocked out in
// every other test file that touches the components built on top of them, so
// their own export line never actually runs anywhere else. These tests
// import them directly, unmocked, to prove the wiring itself is correct -
// the real sanitizer for that side (client DOMPurify, server DOMPurify+jsdom)
// actually gets called and actually sanitizes.
describe('entry point wiring (real sanitizers, not mocked)', () => {
    beforeEach(() => {
        // Vitest isolates modules per test file by default, so these
        // dynamic imports already get the real, unmocked module graph
        // rather than another file's vi.mock of the same specifier.
        // Resetting explicitly here makes that independent of that default
        // (e.g. if isolation were ever turned off project-wide) and of
        // vi.doMock/vi.mock leaking between the `it` blocks in this file.
        vi.resetModules();
        vi.doUnmock('../src/utils/fetchAndSanitizeSvgClient');
        vi.doUnmock('../src/utils/fetchAndSanitizeSvgServer');
        vi.doUnmock('../src/utils/sanitizeSvgStringServer');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        clearSvgCache();
    });

    it('fetchAndSanitizeSvgClient wires the real client sanitizer', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('<svg><script>alert(1)</script><path/></svg>'),
            })
        );
        const { fetchAndSanitizeSvg } = await import('../src/utils/fetchAndSanitizeSvgClient');

        const result = await fetchAndSanitizeSvg('https://example.com/wiring-client.svg');
        expect(result).not.toContain('<script>');
        expect(result).toContain('<path');
    });

    it('fetchAndSanitizeSvgServer wires the real server sanitizer', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('<svg><script>alert(1)</script><circle r="1"/></svg>'),
            })
        );
        const { fetchAndSanitizeSvg } = await import('../src/utils/fetchAndSanitizeSvgServer');

        const result = await fetchAndSanitizeSvg('https://example.com/wiring-server.svg');
        expect(result).not.toContain('<script');
        expect(result).toContain('<circle');
    });

    it('sanitizeSvgStringServer wires the real server sanitizer', async () => {
        const { sanitizeSvgString } = await import('../src/utils/sanitizeSvgStringServer');

        const result = await sanitizeSvgString('<svg><script>alert(1)</script><rect/></svg>');
        expect(result).not.toContain('<script');
        expect(result).toContain('<rect');
    });
});
