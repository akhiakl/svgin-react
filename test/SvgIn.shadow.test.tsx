import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/fetchAndSanitizeSvgClient', () => ({
    fetchAndSanitizeSvg: vi.fn(),
    releaseFetchAndSanitizeSvg: vi.fn(),
}));
vi.mock('../src/utils/sanitizeSvgStringClient', () => ({
    sanitizeSvgString: vi.fn(),
}));

import { SvgInShadow } from '../src/SvgIn.shadow.client';
import { fetchAndSanitizeSvg, releaseFetchAndSanitizeSvg } from '../src/utils/fetchAndSanitizeSvgClient';
import { sanitizeSvgString } from '../src/utils/sanitizeSvgStringClient';

const mockFetch = vi.mocked(fetchAndSanitizeSvg);
const mockRelease = vi.mocked(releaseFetchAndSanitizeSvg);
const mockSanitizeString = vi.mocked(sanitizeSvgString);

// Throws (rather than returning null/undefined via optional chaining) so
// waitFor's own retry-until-no-throw semantics correctly keep polling until
// attachShadow has actually happened, instead of an `undefined` from
// `host.shadowRoot?.querySelector(...)` satisfying a `.not.toBeNull()`
// assertion before the shadow root even exists.
function shadowRoot(host: Element): ShadowRoot {
    if (!host.shadowRoot) throw new Error('expected a shadow root to be attached by now');
    return host.shadowRoot;
}

describe('SvgInShadow (client component)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing in the shadow root while the fetch is in flight', () => {
        mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
        const { container } = render(<SvgInShadow src="/test.svg" />);
        const host = container.querySelector('span');
        expect(host).not.toBeNull();
        expect(host!.shadowRoot).toBeNull();
    });

    it('fetches, sanitizes, and renders the svg inside a shadow root attached to the host span', async () => {
        mockFetch.mockResolvedValue('<svg viewBox="0 0 24 24"><circle r="12"/></svg>');
        const { container } = render(<SvgInShadow src="/test.svg" />);
        const host = container.querySelector('span')!;

        await waitFor(() => {
            expect(host.shadowRoot).not.toBeNull();
            expect(host.shadowRoot!.querySelector('circle')).not.toBeNull();
        });
        expect(host.shadowRoot!.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');
        // The SVG is only reachable through the shadow root, not as a direct
        // light-DOM child of the host - the whole point of the component.
        expect(container.querySelector('svg')).toBeNull();
    });

    it('sanitizes and renders a raw svg prop without calling fetchAndSanitizeSvg', async () => {
        mockSanitizeString.mockResolvedValue('<svg><circle/></svg>');
        const { container } = render(<SvgInShadow svg="<svg><circle/></svg>" />);
        const host = container.querySelector('span')!;

        await waitFor(() => expect(shadowRoot(host).querySelector('circle')).not.toBeNull());
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockSanitizeString).toHaveBeenCalledWith('<svg><circle/></svg>', expect.anything());
    });

    it('injects the styles prop as a <style> element inside the shadow root', async () => {
        mockFetch.mockResolvedValue('<svg><circle/></svg>');
        const { container } = render(<SvgInShadow src="/test.svg" styles="circle { fill: red; }" />);
        const host = container.querySelector('span')!;

        await waitFor(() => expect(shadowRoot(host).querySelector('circle')).not.toBeNull());
        expect(shadowRoot(host).querySelector('style')?.textContent).toBe('circle { fill: red; }');
    });

    it('applies width/height/fill/ariaLabel and injects title/description, same precedence as SvgInComponent', async () => {
        mockFetch.mockResolvedValue('<svg fill="blue"><path/></svg>');
        const { container } = render(
            <SvgInShadow
                src="/test.svg"
                width={24}
                height={24}
                fill="#f00"
                ariaLabel="alert"
                title="Alert"
                description="Warns"
            />
        );
        const host = container.querySelector('span')!;
        await waitFor(() => expect(shadowRoot(host).querySelector('svg')).not.toBeNull());
        const svg = shadowRoot(host).querySelector('svg')!;
        expect(svg).toHaveAttribute('width', '24');
        expect(svg).toHaveAttribute('height', '24');
        expect(svg).toHaveAttribute('fill', '#f00'); // explicit prop wins over the source's fill="blue"
        expect(svg).toHaveAttribute('aria-label', 'alert');
        expect(svg.querySelector('title')?.textContent).toBe('Alert');
        expect(svg.querySelector('desc')?.textContent).toBe('Warns');
    });

    it('calls onMount with the svg element inside the shadow root once resolved', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const onMount = vi.fn();
        const { container } = render(<SvgInShadow src="/test.svg" onMount={onMount} />);
        const host = container.querySelector('span')!;

        await waitFor(() => expect(onMount).toHaveBeenCalled());
        expect(onMount).toHaveBeenCalledWith(host.shadowRoot!.querySelector('svg'));
    });

    it('renders the fallback (in the light DOM) when the fetch rejects, and calls onError', async () => {
        mockFetch.mockRejectedValue(new Error('network error'));
        const onError = vi.fn();
        const { container } = render(
            <SvgInShadow src="/missing.svg" fallback={<span>fallback</span>} onError={onError} />
        );
        await waitFor(() => expect(container.textContent).toBe('fallback'));
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'network error' }));
    });

    it('renders null (no DOM node) when the fetch rejects and no fallback is given', async () => {
        mockFetch.mockRejectedValue(new Error('network error'));
        const { container } = render(<SvgInShadow src="/missing.svg" />);
        await waitFor(() => expect(container.firstChild).toBeNull());
    });

    it('ignores a resolved fetch if the component unmounts before it resolves', async () => {
        let resolve!: (v: string) => void;
        mockFetch.mockReturnValue(new Promise((r) => { resolve = r; }));
        const { container, unmount } = render(<SvgInShadow src="/test.svg" />);
        const host = container.querySelector('span')!;
        unmount();
        resolve('<svg><circle/></svg>');
        await new Promise((r) => setTimeout(r, 10));
        // Detached from the document by unmount(), so there's no shadow root
        // to have written into even if the effect had (wrongly) tried to.
        expect(host.shadowRoot).toBeNull();
    });

    it('ignores a rejected fetch if the component unmounts before it rejects', async () => {
        let reject!: (e: Error) => void;
        mockFetch.mockReturnValue(new Promise((_r, rj) => { reject = rj; }));
        const onError = vi.fn();
        const { unmount } = render(<SvgInShadow src="/test.svg" onError={onError} />);
        unmount();
        reject(new Error('boom'));
        await new Promise((r) => setTimeout(r, 10));
        expect(onError).not.toHaveBeenCalled();
    });

    it('does not touch the shadow root when the resolved value is not a well-formed svg string', async () => {
        mockFetch.mockResolvedValue('not an svg at all');
        const onMount = vi.fn();
        const { container } = render(<SvgInShadow src="/test.svg" onMount={onMount} />);
        const host = container.querySelector('span')!;
        await waitFor(() => expect(mockFetch).toHaveBeenCalled());
        await new Promise((r) => setTimeout(r, 10));
        expect(host.shadowRoot).toBeNull();
        expect(onMount).not.toHaveBeenCalled();
    });

    it('renders a div host instead of a span when as="div" is given', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const { container } = render(<SvgInShadow src="/test.svg" as="div" />);
        expect(container.querySelector('div')).not.toBeNull();
        expect(container.querySelector('span')).toBeNull();
    });

    it('applies className/style to the host element, not the svg inside the shadow root', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const { container } = render(
            <SvgInShadow src="/test.svg" className="icon-host" style={{ display: 'inline-block' }} />
        );
        const host = container.querySelector('span')!;
        expect(host).toHaveClass('icon-host');
        expect(host).toHaveStyle({ display: 'inline-block' });
    });

    it('forwards arbitrary native props (onClick, role, tabIndex, data-*) to the host element', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const onClick = vi.fn();
        const { container } = render(
            <SvgInShadow src="/test.svg" onClick={onClick} role="img" tabIndex={0} data-testid="icon-host" />
        );
        const host = container.querySelector('span')!;
        expect(host).toHaveAttribute('role', 'img');
        expect(host).toHaveAttribute('tabindex', '0');
        expect(host).toHaveAttribute('data-testid', 'icon-host');
        host.click();
        expect(onClick).toHaveBeenCalledTimes(1);
        // Native props land on the host (light DOM), never inside the
        // shadow-encapsulated svg - the whole point of the component.
        await waitFor(() => expect(shadowRoot(host).querySelector('svg')).not.toBeNull());
        expect(shadowRoot(host).querySelector('svg')).not.toHaveAttribute('role');
    });

    it('passes a closed mode through to attachShadow (hides the shadow tree from host.shadowRoot)', async () => {
        mockFetch.mockResolvedValue('<svg><path/></svg>');
        const onMount = vi.fn();
        const { container } = render(<SvgInShadow src="/test.svg" mode="closed" onMount={onMount} />);
        const host = container.querySelector('span')!;

        // onMount still fires with the real (rendered) svg element - proving
        // attachShadow actually ran with mode: 'closed' - even though
        // host.shadowRoot itself stays null from the outside, exactly as a
        // closed shadow root should behave.
        await waitFor(() => expect(onMount).toHaveBeenCalledWith(expect.objectContaining({ tagName: 'svg' })));
        expect(host.shadowRoot).toBeNull();
    });

    it('re-fetches when the src prop changes, and clears the old shadow root content first', async () => {
        mockFetch
            .mockResolvedValueOnce('<svg><circle/></svg>')
            .mockReturnValueOnce(new Promise(() => {})); // second fetch never resolves in this test

        const { container, rerender } = render(<SvgInShadow src="/a.svg" />);
        const host = container.querySelector('span')!;
        await waitFor(() => expect(shadowRoot(host).querySelector('circle')).not.toBeNull());

        rerender(<SvgInShadow src="/b.svg" />);
        await waitFor(() => expect(shadowRoot(host).innerHTML).toBe(''));
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('releases the in-flight fetch on unmount', async () => {
        mockFetch.mockReturnValue(new Promise(() => {}));
        const { unmount } = render(<SvgInShadow src="/test.svg" />);
        unmount();
        expect(mockRelease).toHaveBeenCalledWith('/test.svg', expect.objectContaining({ disableSanitization: undefined }));
    });

    it('does not release anything on unmount when svg took precedence over src', async () => {
        mockSanitizeString.mockReturnValue(new Promise(() => {}));
        const { unmount } = render(<SvgInShadow svg="<svg/>" src="/unused.svg" />);
        unmount();
        expect(mockRelease).not.toHaveBeenCalled();
    });

    it('renders the fallback when neither src nor svg is given', async () => {
        const { container } = render(<SvgInShadow fallback={<span>fallback</span>} />);
        await waitFor(() => expect(container.textContent).toBe('fallback'));
    });
});
