import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/fetchAndSanitizeSvgClient', () => ({
    fetchAndSanitizeSvg: vi.fn(),
}));
vi.mock('../src/utils/sanitizeSvgStringClient', () => ({
    sanitizeSvgString: vi.fn(),
}));

import { SvgInSuspense } from '../src/SvgIn.suspense.client';
import { fetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgClient';
import { sanitizeSvgString } from '../src/utils/sanitizeSvgStringClient';

const mockFetch = vi.mocked(fetchAndSanitizeSvg);
const mockSanitizeString = vi.mocked(sanitizeSvgString);

class ErrorBoundary extends React.Component<
    { children: React.ReactNode; onError?: (error: Error) => void },
    { error: Error | null }
> {
    state: { error: Error | null } = { error: null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error) {
        this.props.onError?.(error);
    }
    render() {
        if (this.state.error) return <span>caught: {this.state.error.message}</span>;
        return this.props.children;
    }
}

describe('SvgInSuspense (client component)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('shows the Suspense fallback while pending, then the resolved svg', async () => {
        let resolve!: (v: string) => void;
        mockFetch.mockReturnValue(new Promise((r) => { resolve = r; }));

        let container!: HTMLElement;
        await act(async () => {
            ({ container } = render(
                <React.Suspense fallback={<span>loading...</span>}>
                    <SvgInSuspense src="/a.svg" />
                </React.Suspense>
            ));
        });
        expect(container.textContent).toBe('loading...');

        await act(async () => {
            resolve('<svg><circle/></svg>');
        });
        expect(container.querySelector('circle')).not.toBeNull();
    });

    it('is caught by the nearest error boundary on a rejected fetch', async () => {
        let reject!: (e: Error) => void;
        mockFetch.mockReturnValue(new Promise((_r, rj) => { reject = rj; }));

        let container!: HTMLElement;
        await act(async () => {
            ({ container } = render(
                <ErrorBoundary>
                    <React.Suspense fallback={<span>loading...</span>}>
                        <SvgInSuspense src="/missing.svg" />
                    </React.Suspense>
                </ErrorBoundary>
            ));
        });

        await act(async () => {
            reject(new Error('boom'));
        });
        expect(container.textContent).toBe('caught: boom');
    });

    it('still calls onError as a side notification alongside the error boundary catching it', async () => {
        let reject!: (e: Error) => void;
        mockFetch.mockReturnValue(new Promise((_r, rj) => { reject = rj; }));
        const onError = vi.fn();

        await act(async () => {
            render(
                <ErrorBoundary>
                    <React.Suspense fallback={<span>loading...</span>}>
                        <SvgInSuspense src="/missing.svg" onError={onError} />
                    </React.Suspense>
                </ErrorBoundary>
            );
        });

        await act(async () => {
            reject(new Error('boom'));
        });
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
    });

    it('calls onError only once, even if the component re-renders while the same promise is still pending', async () => {
        // Regression test: promise.catch(onError) used to be attached on
        // every render, so a re-render before settlement (e.g. a parent
        // re-rendering for an unrelated reason) attached a second handler,
        // and the eventual rejection called onError twice.
        let reject!: (e: Error) => void;
        mockFetch.mockReturnValue(new Promise((_r, rj) => { reject = rj; }));
        const onError = vi.fn();

        let rerender!: (ui: React.ReactElement) => void;
        await act(async () => {
            ({ rerender } = render(
                <ErrorBoundary>
                    <React.Suspense fallback={<span>loading...</span>}>
                        <SvgInSuspense src="/missing.svg" onError={onError} title="first" />
                    </React.Suspense>
                </ErrorBoundary>
            ));
        });
        // Same src (same cached promise identity) - just a re-render while
        // still pending.
        await act(async () => {
            rerender(
                <ErrorBoundary>
                    <React.Suspense fallback={<span>loading...</span>}>
                        <SvgInSuspense src="/missing.svg" onError={onError} title="second" />
                    </React.Suspense>
                </ErrorBoundary>
            );
        });

        await act(async () => {
            reject(new Error('boom'));
        });
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it('calls onMount with the rendered svg element once resolved', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const onMount = vi.fn();

        let container!: HTMLElement;
        await act(async () => {
            ({ container } = render(
                <React.Suspense fallback={<span>loading...</span>}>
                    <SvgInSuspense src="/a.svg" onMount={onMount} />
                </React.Suspense>
            ));
        });

        await waitFor(() => expect(onMount).toHaveBeenCalledWith(container.querySelector('svg')));
    });

    it('sanitizes and renders a raw svg prop without calling fetchAndSanitizeSvg', async () => {
        mockSanitizeString.mockResolvedValue('<svg><circle/></svg>');

        let container!: HTMLElement;
        await act(async () => {
            ({ container } = render(
                <React.Suspense fallback={<span>loading...</span>}>
                    <SvgInSuspense svg="<svg><circle/></svg>" />
                </React.Suspense>
            ));
        });

        expect(container.querySelector('circle')).not.toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockSanitizeString).toHaveBeenCalledWith('<svg><circle/></svg>', expect.anything());
    });

    it('is caught by the nearest error boundary when neither src nor svg is given', async () => {
        let container!: HTMLElement;
        await act(async () => {
            ({ container } = render(
                <ErrorBoundary>
                    <React.Suspense fallback={<span>loading...</span>}>
                        <SvgInSuspense />
                    </React.Suspense>
                </ErrorBoundary>
            ));
        });
        expect(container.textContent).toContain('caught:');
        expect(container.textContent).toContain('src');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('renders title/description and uniquifies ids the same way as the non-suspense mode', async () => {
        mockFetch.mockResolvedValue('<svg><linearGradient id="g"/><rect fill="url(#g)"/></svg>');

        let container!: HTMLElement;
        await act(async () => {
            ({ container } = render(
                <React.Suspense fallback={null}>
                    <SvgInSuspense src="/a.svg" title="Alert" description="Warns the user" />
                </React.Suspense>
            ));
        });

        expect(container.querySelector('linearGradient')).not.toBeNull();
        expect(container.querySelector('title')?.textContent).toBe('Alert');
        expect(container.querySelector('desc')?.textContent).toBe('Warns the user');
        const svg = container.querySelector('svg');
        const rect = container.querySelector('rect');
        const gradientId = container.querySelector('linearGradient')!.id;
        expect(rect?.getAttribute('fill')).toBe(`url(#${gradientId})`);
        expect(svg).toHaveAttribute('aria-labelledby', container.querySelector('title')!.id);
    });
});
