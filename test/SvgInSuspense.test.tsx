import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/fetchAndSanitizeSvgClient', () => ({
    fetchAndSanitizeSvg: vi.fn(),
}));

import { SvgInSuspense } from '../src/SvgIn.suspense.client';
import { fetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgClient';

const mockFetch = vi.mocked(fetchAndSanitizeSvg);

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
