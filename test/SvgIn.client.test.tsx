import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/fetchAndSanitizeSvgClient', () => ({
    fetchAndSanitizeSvg: vi.fn(),
}));
vi.mock('../src/utils/sanitizeSvgStringClient', () => ({
    sanitizeSvgString: vi.fn(),
}));

import { SvgIn } from '../src/SvgIn.client';
import { SvgInProvider } from '../src/SvgInProvider';
import { fetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgClient';
import { sanitizeSvgString } from '../src/utils/sanitizeSvgStringClient';

const mockFetch = vi.mocked(fetchAndSanitizeSvg);
const mockSanitizeString = vi.mocked(sanitizeSvgString);

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

    it('renders a <title> from the title prop and does not leak it onto the loading placeholder', async () => {
        mockFetch.mockReturnValue(new Promise(() => {})); // stays in the loading state
        const { container } = render(<SvgIn src="/a.svg" title="Alert icon" />);
        // React's `title` prop on a raw DOM element becomes a native tooltip
        // attribute - it must not appear on the loading placeholder.
        expect(container.querySelector('svg')).not.toHaveAttribute('title');
    });

    it('keeps internal ids stable (same suffix) across re-renders of the same mounted instance', async () => {
        const svg = '<svg><linearGradient id="g"/><rect fill="url(#g)"/></svg>';
        mockFetch.mockResolvedValue(svg);

        const { container, rerender } = render(<SvgIn src="/a.svg" width={16} />);
        await waitFor(() => expect(container.querySelector('linearGradient')).not.toBeNull());
        const firstId = container.querySelector('linearGradient')!.id;

        rerender(<SvgIn src="/a.svg" width={32} />);
        await waitFor(() => expect(container.querySelector('svg')).toHaveAttribute('width', '32'));
        expect(container.querySelector('linearGradient')!.id).toBe(firstId);
    });

    it('calls onError with the actual Error when the fetch rejects', async () => {
        const err = new Error('network error');
        mockFetch.mockRejectedValue(err);
        const onError = vi.fn();
        render(<SvgIn src="/missing.svg" onError={onError} />);
        await waitFor(() => expect(onError).toHaveBeenCalledWith(err));
    });

    it('does not call onError on a successful fetch', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const onError = vi.fn();
        const { container } = render(<SvgIn src="/a.svg" onError={onError} />);
        await waitFor(() => expect(container.querySelector('path')).not.toBeNull());
        expect(onError).not.toHaveBeenCalled();
    });

    it('calls onMount with the rendered svg element after a successful render', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const onMount = vi.fn();
        const { container } = render(<SvgIn src="/a.svg" onMount={onMount} />);
        await waitFor(() => expect(onMount).toHaveBeenCalled());
        expect(onMount).toHaveBeenCalledWith(container.querySelector('svg'));
    });

    it('does not call onMount while loading or on error', async () => {
        mockFetch.mockRejectedValue(new Error('fail'));
        const onMount = vi.fn();
        render(<SvgIn src="/missing.svg" onMount={onMount} />);
        await new Promise(r => setTimeout(r, 20));
        expect(onMount).not.toHaveBeenCalled();
    });

    it('calls onMount again when svg changes to a new value on a later fetch', async () => {
        mockFetch
            .mockResolvedValueOnce('<svg><circle/></svg>')
            .mockResolvedValueOnce('<svg><rect/></svg>');
        const onMount = vi.fn();
        const { container, rerender } = render(<SvgIn src="/a.svg" onMount={onMount} />);
        await waitFor(() => expect(container.querySelector('circle')).not.toBeNull());
        expect(onMount).toHaveBeenCalledTimes(1);

        rerender(<SvgIn src="/b.svg" onMount={onMount} />);
        await waitFor(() => expect(container.querySelector('rect')).not.toBeNull());
        expect(onMount).toHaveBeenCalledTimes(2);
    });

    it('gives two separate mounted instances of the same icon distinct internal ids', async () => {
        const svg = '<svg><linearGradient id="g"/><rect fill="url(#g)"/></svg>';
        mockFetch.mockResolvedValue(svg);

        const { container } = render(
            <>
                <SvgIn src="/a.svg" />
                <SvgIn src="/a.svg" />
            </>
        );
        await waitFor(() => expect(container.querySelectorAll('linearGradient')).toHaveLength(2));
        const [first, second] = container.querySelectorAll('linearGradient');
        expect(first.id).not.toBe(second.id);
    });

    describe('svg prop (raw markup, no fetch)', () => {
        it('sanitizes and renders a raw svg prop without calling fetchAndSanitizeSvg', async () => {
            mockSanitizeString.mockResolvedValue('<svg><circle/></svg>');
            const { container } = render(<SvgIn svg="<svg><circle/></svg>" />);
            await waitFor(() => expect(container.querySelector('circle')).not.toBeNull());
            expect(mockFetch).not.toHaveBeenCalled();
            expect(mockSanitizeString).toHaveBeenCalledWith('<svg><circle/></svg>', expect.anything());
        });

        it('prefers svg over src when both are given', async () => {
            mockSanitizeString.mockResolvedValue('<svg><circle/></svg>');
            mockFetch.mockResolvedValue('<svg><rect/></svg>');
            const { container } = render(<SvgIn src="/a.svg" svg="<svg><circle/></svg>" />);
            await waitFor(() => expect(container.querySelector('circle')).not.toBeNull());
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('re-sanitizes when the svg prop value changes', async () => {
            mockSanitizeString
                .mockResolvedValueOnce('<svg><circle/></svg>')
                .mockResolvedValueOnce('<svg><rect/></svg>');
            const { container, rerender } = render(<SvgIn svg="<svg><circle/></svg>" />);
            await waitFor(() => expect(container.querySelector('circle')).not.toBeNull());

            rerender(<SvgIn svg="<svg><rect/></svg>" />);
            await waitFor(() => expect(container.querySelector('rect')).not.toBeNull());
            expect(mockSanitizeString).toHaveBeenCalledTimes(2);
        });

        it('renders the fallback and calls onError when neither src nor svg is given', async () => {
            const onError = vi.fn();
            const { container } = render(
                <SvgIn fallback={<span>bad usage</span>} onError={onError} />
            );
            await waitFor(() => expect(container.textContent).toBe('bad usage'));
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('src') }));
            expect(mockFetch).not.toHaveBeenCalled();
            expect(mockSanitizeString).not.toHaveBeenCalled();
        });
    });

    describe('loadingFallback', () => {
        it('renders the custom loadingFallback instead of the default placeholder while pending', () => {
            mockFetch.mockReturnValue(new Promise(() => {}));
            const { container } = render(<SvgIn src="/a.svg" loadingFallback={<span>spinner</span>} />);
            expect(container.textContent).toBe('spinner');
            expect(container.querySelector('svg')).toBeNull();
        });

        it('renders nothing while loading when loadingFallback is explicitly null', () => {
            mockFetch.mockReturnValue(new Promise(() => {}));
            const { container } = render(<SvgIn src="/a.svg" loadingFallback={null} />);
            expect(container.firstChild).toBeNull();
        });

        it('falls back to the default aria-hidden placeholder when loadingFallback is not given', () => {
            mockFetch.mockReturnValue(new Promise(() => {}));
            const { container } = render(<SvgIn src="/a.svg" />);
            expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        });
    });

    describe('loading="lazy"', () => {
        const observed: Array<{ callback: IntersectionObserverCallback; el: Element }> = [];
        let originalIO: typeof IntersectionObserver | undefined;

        beforeEach(() => {
            observed.length = 0;
            originalIO = globalThis.IntersectionObserver;
            class MockIntersectionObserver {
                callback: IntersectionObserverCallback;
                constructor(callback: IntersectionObserverCallback) {
                    this.callback = callback;
                }
                observe(el: Element) {
                    observed.push({ callback: this.callback, el });
                }
                disconnect() {}
                unobserve() {}
            }
            // @ts-expect-error - minimal mock, not the full IntersectionObserver interface
            globalThis.IntersectionObserver = MockIntersectionObserver;
        });

        afterEach(() => {
            globalThis.IntersectionObserver = originalIO as typeof IntersectionObserver;
        });

        it('does not fetch until the placeholder intersects the viewport', async () => {
            mockFetch.mockResolvedValue('<svg><circle/></svg>');
            render(<SvgIn src="/a.svg" loading="lazy" />);
            await new Promise((r) => setTimeout(r, 10));
            expect(mockFetch).not.toHaveBeenCalled();
            expect(observed).toHaveLength(1);
        });

        it('fetches once the placeholder is reported as intersecting', async () => {
            mockFetch.mockResolvedValue('<svg><circle/></svg>');
            const { container } = render(<SvgIn src="/a.svg" loading="lazy" />);
            await new Promise((r) => setTimeout(r, 10));
            act(() => {
                observed[0].callback(
                    [{ isIntersecting: true } as IntersectionObserverEntry],
                    {} as IntersectionObserver
                );
            });
            await waitFor(() => expect(container.querySelector('circle')).not.toBeNull());
        });

        it('loads eagerly (ignores lazy) when a raw svg prop is given', async () => {
            mockSanitizeString.mockResolvedValue('<svg><circle/></svg>');
            render(<SvgIn svg="<svg><circle/></svg>" loading="lazy" />);
            await waitFor(() => expect(mockSanitizeString).toHaveBeenCalled());
            expect(observed).toHaveLength(0);
        });
    });

    describe('SvgInProvider', () => {
        it('applies provider defaults when a prop is not set explicitly', async () => {
            mockFetch.mockRejectedValue(new Error('fail'));
            const { container } = render(
                <SvgInProvider fallback={<span>provider fallback</span>}>
                    <SvgIn src="/missing.svg" />
                </SvgInProvider>
            );
            await waitFor(() => expect(container.textContent).toBe('provider fallback'));
        });

        it('lets an explicit prop override the provider default', async () => {
            mockFetch.mockRejectedValue(new Error('fail'));
            const { container } = render(
                <SvgInProvider fallback={<span>provider fallback</span>}>
                    <SvgIn src="/missing.svg" fallback={<span>own fallback</span>} />
                </SvgInProvider>
            );
            await waitFor(() => expect(container.textContent).toBe('own fallback'));
        });

        it('applies a provider-level sanitizeFn default', async () => {
            const providerSanitize = vi.fn().mockResolvedValue('ignored');
            mockFetch.mockResolvedValue('<svg><path/></svg>');
            render(
                <SvgInProvider sanitizeFn={providerSanitize}>
                    <SvgIn src="/a.svg" />
                </SvgInProvider>
            );
            await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
            expect(mockFetch).toHaveBeenCalledWith('/a.svg', expect.objectContaining({ sanitizeFn: providerSanitize }));
        });
    });
});
