import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/fetchAndSanitizeSvgClient', () => ({
    fetchAndSanitizeSvg: vi.fn(),
}));

import { SvgIn } from '../src/SvgIn.client';
import { fetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgClient';

const mockFetch = vi.mocked(fetchAndSanitizeSvg);

describe('SvgIn (client component)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders an aria-hidden loading placeholder while the fetch is in flight', () => {
        mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
        const { container } = render(<SvgIn src="/test.svg" />);
        const placeholder = container.querySelector('svg');
        expect(placeholder).not.toBeNull();
        expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders the SVG inline after a successful fetch', async () => {
        mockFetch.mockResolvedValue('<svg viewBox="0 0 24 24"><circle r="12"/></svg>');
        const { container } = render(<SvgIn src="/test.svg" />);
        await waitFor(() => expect(container.querySelector('circle')).not.toBeNull());
        expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('renders the provided fallback when the fetch rejects', async () => {
        mockFetch.mockRejectedValue(new Error('network error'));
        const { container } = render(<SvgIn src="/missing.svg" fallback={<span>fallback</span>} />);
        await waitFor(() => expect(container.textContent).toBe('fallback'));
    });

    it('renders null (no DOM node) when fetch fails and no fallback is provided', async () => {
        mockFetch.mockRejectedValue(new Error('network error'));
        const { container } = render(<SvgIn src="/missing.svg" />);
        await waitFor(() => expect(container.firstChild).toBeNull());
    });

    it('re-fetches when the src prop changes', async () => {
        mockFetch
            .mockResolvedValueOnce('<svg><circle/></svg>')
            .mockResolvedValueOnce('<svg><rect/></svg>');

        const { container, rerender } = render(<SvgIn src="/a.svg" />);
        await waitFor(() => expect(container.querySelector('circle')).not.toBeNull());

        rerender(<SvgIn src="/b.svg" />);
        await waitFor(() => expect(container.querySelector('rect')).not.toBeNull());
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(2, '/b.svg', expect.anything());
    });

    it('re-fetches when disableSanitization changes', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');

        const { rerender } = render(<SvgIn src="/a.svg" disableSanitization={false} />);
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

        rerender(<SvgIn src="/a.svg" disableSanitization={true} />);
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
        expect(mockFetch).toHaveBeenNthCalledWith(2, '/a.svg', expect.objectContaining({ disableSanitization: true }));
    });

    it('re-fetches when switching from no sanitizeFn to a sanitizeFn', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const customFn = vi.fn();

        const { rerender } = render(<SvgIn src="/a.svg" />);
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

        rerender(<SvgIn src="/a.svg" sanitizeFn={customFn} />);
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    });

    it('does not re-fetch when only unrelated props (width, fill) change', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');

        const { rerender } = render(<SvgIn src="/a.svg" width={24} />);
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

        rerender(<SvgIn src="/a.svg" width={48} />);
        // Give React a chance to run any effects if it (wrongly) would.
        await new Promise(r => setTimeout(r, 50));
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('resets to loading state immediately when src changes before new fetch resolves', async () => {
        let resolveB!: (v: string) => void;
        mockFetch
            .mockResolvedValueOnce('<svg><circle/></svg>')
            .mockReturnValueOnce(new Promise(r => { resolveB = r; }));

        const { container, rerender } = render(<SvgIn src="/a.svg" />);
        await waitFor(() => expect(container.querySelector('circle')).not.toBeNull());

        rerender(<SvgIn src="/b.svg" />);
        // After src change and before the second fetch resolves, loading placeholder shows.
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

        resolveB('<svg><rect/></svg>');
        await waitFor(() => expect(container.querySelector('rect')).not.toBeNull());
    });

    it('ignores the fetch result if the component unmounts before it resolves', async () => {
        let resolve!: (v: string) => void;
        mockFetch.mockReturnValue(new Promise(r => { resolve = r; }));

        const { unmount } = render(<SvgIn src="/slow.svg" />);
        unmount();

        // Resolving after unmount must not throw (state update on unmounted component).
        expect(() => resolve('<svg><path/></svg>')).not.toThrow();
        await new Promise(r => setTimeout(r, 20));
    });

    it('passes sanitizeFn and disableSanitization through to fetchAndSanitizeSvg', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const customFn = vi.fn();

        render(<SvgIn src="/a.svg" sanitizeFn={customFn} disableSanitization={false} />);
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

        expect(mockFetch).toHaveBeenCalledWith(
            '/a.svg',
            expect.objectContaining({ sanitizeFn: customFn, disableSanitization: false })
        );
    });
});
