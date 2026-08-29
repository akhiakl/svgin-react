import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SvgIn } from '../src/SvgIn.client';

function mockFetchOnce(body: string) {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(body),
        })
    );
}

describe('SvgIn (client component)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders a busy placeholder while loading, then the sanitized svg', async () => {
        mockFetchOnce('<svg><script>alert(1)</script><circle r="5"/></svg>');
        const { container } = render(<SvgIn src="https://example.com/client-a.svg" />);

        expect(container.querySelector('svg')).toHaveAttribute('aria-busy', 'true');

        await waitFor(() => {
            expect(container.querySelector('circle')).not.toBeNull();
        });
        expect(container.querySelector('script')).toBeNull();
    });

    it('renders the fallback when the fetch fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        const { container } = render(
            <SvgIn src="https://example.com/client-missing.svg" fallback={<span>failed</span>} />
        );

        await waitFor(() => {
            expect(container.textContent).toBe('failed');
        });
    });

    it('refetches when src changes', async () => {
        mockFetchOnce('<svg><circle r="1"/></svg>');
        const { container, rerender } = render(<SvgIn src="https://example.com/client-b1.svg" />);
        await waitFor(() => {
            expect(container.querySelector('circle')).toHaveAttribute('r', '1');
        });

        mockFetchOnce('<svg><circle r="2"/></svg>');
        rerender(<SvgIn src="https://example.com/client-b2.svg" />);
        await waitFor(() => {
            expect(container.querySelector('circle')).toHaveAttribute('r', '2');
        });
    });

    it('refetches when switching from the default sanitizer to a custom sanitizeFn', async () => {
        mockFetchOnce('<svg><circle r="1"/></svg>');
        const { container, rerender } = render(<SvgIn src="https://example.com/client-c.svg" />);
        await waitFor(() => {
            expect(container.querySelector('circle')).toHaveAttribute('r', '1');
        });

        mockFetchOnce('<svg>raw</svg>');
        const customSanitize = vi.fn().mockResolvedValue('<svg><circle r="9"/></svg>');
        rerender(<SvgIn src="https://example.com/client-c.svg" sanitizeFn={customSanitize} />);
        await waitFor(() => {
            expect(container.querySelector('circle')).toHaveAttribute('r', '9');
        });
    });

    it('does not refetch when only the sanitizeFn identity changes on re-render', async () => {
        // Documents the known, intentional limitation described in
        // SvgIn.client.tsx: hasSanitizeFn (not sanitizeFn's identity) is the
        // effect dependency, so a fresh inline closure on re-render must not
        // trigger a second fetch.
        mockFetchOnce('<svg><circle r="1"/></svg>');
        const fetchMock = vi.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('<svg><circle r="1"/></svg>'),
        });
        vi.stubGlobal('fetch', fetchMock);

        const { container, rerender } = render(
            <SvgIn src="https://example.com/client-d.svg" sanitizeFn={async (svg) => svg} />
        );
        await waitFor(() => {
            expect(container.querySelector('circle')).not.toBeNull();
        });

        rerender(
            <SvgIn src="https://example.com/client-d.svg" sanitizeFn={async (svg) => svg} />
        );
        // Give any unexpected extra effect run a chance to fire before asserting.
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
