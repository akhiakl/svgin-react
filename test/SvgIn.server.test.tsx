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
});
