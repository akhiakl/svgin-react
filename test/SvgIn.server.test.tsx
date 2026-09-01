import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/fetchAndSanitizeSvgServer', () => ({
    fetchAndSanitizeSvg: vi.fn(),
}));

import { SvgIn } from '../src/SvgIn.server';
import { fetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgServer';

const mockFetch = vi.mocked(fetchAndSanitizeSvg);

describe('SvgIn (server component)', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders the inline SVG on success', async () => {
        mockFetch.mockResolvedValue('<svg viewBox="0 0 24 24"><circle r="12"/></svg>');
        const element = await SvgIn({ src: '/test.svg' });
        const { container } = render(element as React.ReactElement);
        expect(container.querySelector('circle')).not.toBeNull();
        expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('returns the provided fallback when the fetch rejects', async () => {
        mockFetch.mockRejectedValue(new Error('fetch failed'));
        const element = await SvgIn({ src: '/missing.svg', fallback: <span>error</span> });
        const { container } = render(element as React.ReactElement);
        expect(container.textContent).toBe('error');
    });

    it('returns null when fetch rejects and no fallback is provided', async () => {
        mockFetch.mockRejectedValue(new Error('fetch failed'));
        const result = await SvgIn({ src: '/missing.svg' });
        expect(result).toBeNull();
    });

    it('passes sanitizeFn and disableSanitization to fetchAndSanitizeSvg', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const customFn = vi.fn();
        await SvgIn({ src: '/a.svg', sanitizeFn: customFn, disableSanitization: false });
        expect(mockFetch).toHaveBeenCalledWith(
            '/a.svg',
            expect.objectContaining({ sanitizeFn: customFn, disableSanitization: false })
        );
    });

    it('renders a <title>/<desc> from the title/description props', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const element = await SvgIn({ src: '/a.svg', title: 'Alert icon', description: 'Warns the user' });
        const { container } = render(element as React.ReactElement);
        expect(container.querySelector('title')?.textContent).toBe('Alert icon');
        expect(container.querySelector('desc')?.textContent).toBe('Warns the user');
    });

    it('calls onError with the actual Error when the fetch rejects', async () => {
        const err = new Error('fetch failed');
        mockFetch.mockRejectedValue(err);
        const onError = vi.fn();
        await SvgIn({ src: '/missing.svg', onError });
        expect(onError).toHaveBeenCalledWith(err);
    });

    it('does not call onError on a successful fetch', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const onError = vi.fn();
        await SvgIn({ src: '/a.svg', onError });
        expect(onError).not.toHaveBeenCalled();
    });

    it('gives two separate render calls of the same icon distinct internal ids', async () => {
        const svg = '<svg><linearGradient id="g"/><rect fill="url(#g)"/></svg>';
        mockFetch.mockResolvedValue(svg);
        const [elementA, elementB] = await Promise.all([
            SvgIn({ src: '/a.svg' }),
            SvgIn({ src: '/a.svg' }),
        ]);
        const { container } = render(
            <>
                {elementA as React.ReactElement}
                {elementB as React.ReactElement}
            </>
        );
        const [first, second] = container.querySelectorAll('linearGradient');
        expect(first.id).not.toBe(second.id);
    });
});
