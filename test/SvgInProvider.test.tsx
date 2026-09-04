import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/fetchAndSanitizeSvgClient', () => ({
    fetchAndSanitizeSvg: vi.fn(),
    releaseFetchAndSanitizeSvg: vi.fn(),
}));

import { SvgIn } from '../src/SvgIn.client';
import { SvgInProvider } from '../src/SvgInProvider';
import { fetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgClient';

const mockFetch = vi.mocked(fetchAndSanitizeSvg);

describe('SvgInProvider', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders children normally without a provider (defaults are an empty object)', () => {
        mockFetch.mockReturnValue(new Promise(() => {}));
        const { container } = render(<SvgIn src="/a.svg" />);
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies a loadingFallback default from the nearest provider', () => {
        mockFetch.mockReturnValue(new Promise(() => {}));
        const { container } = render(
            <SvgInProvider loadingFallback={<span>spinner</span>}>
                <SvgIn src="/a.svg" />
            </SvgInProvider>
        );
        expect(container.textContent).toBe('spinner');
    });

    it('applies a className default from the nearest provider', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const { container } = render(
            <SvgInProvider className="icon-default">
                <SvgIn src="/a.svg" />
            </SvgInProvider>
        );
        await waitFor(() => expect(container.querySelector('svg')).toHaveClass('icon-default'));
    });

    it('lets an explicit className override the provider default', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const { container } = render(
            <SvgInProvider className="icon-default">
                <SvgIn src="/a.svg" className="icon-explicit" />
            </SvgInProvider>
        );
        await waitFor(() => expect(container.querySelector('svg')).toHaveClass('icon-explicit'));
        expect(container.querySelector('svg')).not.toHaveClass('icon-default');
    });

    it('applies an onError default from the nearest provider', async () => {
        const err = new Error('network error');
        mockFetch.mockRejectedValue(err);
        const onError = vi.fn();
        render(
            <SvgInProvider onError={onError}>
                <SvgIn src="/missing.svg" />
            </SvgInProvider>
        );
        await waitFor(() => expect(onError).toHaveBeenCalledWith(err));
    });

    it('lets a nested provider override an outer provider default', () => {
        mockFetch.mockReturnValue(new Promise(() => {}));
        const { container } = render(
            <SvgInProvider loadingFallback={<span>outer</span>}>
                <SvgInProvider loadingFallback={<span>inner</span>}>
                    <SvgIn src="/a.svg" />
                </SvgInProvider>
            </SvgInProvider>
        );
        expect(container.textContent).toBe('inner');
    });

    it('applies a disableSanitization default from the nearest provider', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        render(
            <SvgInProvider disableSanitization>
                <SvgIn src="/a.svg" />
            </SvgInProvider>
        );
        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
        expect(mockFetch).toHaveBeenCalledWith('/a.svg', expect.objectContaining({ disableSanitization: true }));
    });
});
