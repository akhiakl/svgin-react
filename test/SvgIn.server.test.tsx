import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SvgIn } from '../src/SvgIn.server';

function mockFetchOnce(body: string) {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(body),
        })
    );
}

// SvgIn.server is an async function component (as real RSC components are),
// so it is awaited directly to get the element it resolves to, then rendered
// like any other React element.
describe('SvgIn (server component)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders the sanitized svg on success', async () => {
        mockFetchOnce('<svg><script>alert(1)</script><circle r="5"/></svg>');
        const element = await SvgIn({ src: 'https://example.com/server-a.svg' });
        const { container } = render(element);
        expect(container.querySelector('script')).toBeNull();
        expect(container.querySelector('circle')).not.toBeNull();
    });

    it('renders the fallback when the fetch fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        const element = await SvgIn({
            src: 'https://example.com/server-missing.svg',
            fallback: <span>failed</span>,
        });
        const { container } = render(element);
        expect(container.textContent).toBe('failed');
    });

    it('renders null when the fetch fails and there is no fallback', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        const element = await SvgIn({ src: 'https://example.com/server-missing-2.svg' });
        expect(element).toBeNull();
    });

    it('uses a custom sanitizeFn instead of the default sanitizer', async () => {
        mockFetchOnce('<svg>raw</svg>');
        const customSanitize = vi.fn().mockResolvedValue('<svg><circle r="9"/></svg>');
        const element = await SvgIn({
            src: 'https://example.com/server-custom.svg',
            sanitizeFn: customSanitize,
        });
        const { container } = render(element);
        expect(container.querySelector('circle')).toHaveAttribute('r', '9');
    });
});
