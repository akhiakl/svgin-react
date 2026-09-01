import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { examples } from '../src/examples';

// App.tsx calls the real sanitizeSvg (real DOMPurify, running in jsdom -
// see test/sanitizeClient.test.ts in the main package for why that works),
// not a mock: the point of this page is showing real sanitizer behavior, so
// these tests exercise the same code path a visitor actually sees.
describe('Inspector App', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('renders the default (clean) example, sanitized, on load', async () => {
        render(<App />);
        // Three <svg> render on load: the main preview tile + the two-copy
        // id-uniquify demo. The "show unsanitized" tile is opt-in and absent.
        await waitFor(() => expect(document.querySelectorAll('svg').length).toBe(3));
    });

    it('shows "nothing was removed" for the clean example on the What changed tab', async () => {
        const user = userEvent.setup();
        render(<App />);
        await user.click(screen.getByRole('button', { name: /what changed/i }));
        await waitFor(() => expect(screen.getByText(/nothing was removed/i)).toBeInTheDocument());
    });

    it('reports the exact elements/attributes stripped from the untrusted payload example', async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole('button', { name: /untrusted payload/i }));
        await user.click(screen.getByRole('button', { name: /what changed/i }));

        await waitFor(() => expect(screen.getByText('<script>')).toBeInTheDocument());
        const changesArea = document.querySelector('.changes-area')!;
        expect(within(changesArea as HTMLElement).getByText('onload')).toBeInTheDocument();
        expect(within(changesArea as HTMLElement).getByText('onmouseover')).toBeInTheDocument();
    });

    it('marks the "What changed" tab with a dot only when something was actually removed', async () => {
        const user = userEvent.setup();
        render(<App />);
        // Default example is clean - no dot yet.
        expect(screen.getByRole('button', { name: /^what changed$/i })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /untrusted payload/i }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /what changed ●/i })).toBeInTheDocument()
        );
    });

    it('shows a second, unsanitized preview tile only when the danger toggle is checked', async () => {
        const user = userEvent.setup();
        render(<App />);
        expect(document.querySelector('.preview-tile.danger')).toBeNull();

        await user.click(screen.getByRole('checkbox', { name: /show unsanitized/i }));
        await waitFor(() => expect(document.querySelector('.preview-tile.danger')).not.toBeNull());

        await user.click(screen.getByRole('checkbox', { name: /show unsanitized/i }));
        expect(document.querySelector('.preview-tile.danger')).toBeNull();
    });

    it('deselects the active example chip when the textarea is edited directly', async () => {
        const user = userEvent.setup();
        render(<App />);
        const activeChip = document.querySelector('.chip-active');
        expect(activeChip).not.toBeNull();

        const textarea = document.querySelector('.code-input') as HTMLTextAreaElement;
        await user.clear(textarea);
        await user.type(textarea, '<svg><rect/></svg>');

        expect(document.querySelector('.chip-active')).toBeNull();
    });

    it('shows the sanitized markup as text on the "Sanitized markup" tab', async () => {
        const user = userEvent.setup();
        render(<App />);
        await user.click(screen.getByRole('button', { name: /sanitized markup/i }));
        await waitFor(() => expect(document.querySelector('.code-output')?.textContent).toContain('<svg'));
        expect(document.querySelector('.code-output')?.textContent).not.toContain('…');
    });

    it('loads markup from a URL and switches the input to it', async () => {
        const svg = '<svg><rect width="10" height="10"/></svg>';
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(svg) })
        );
        const user = userEvent.setup();
        render(<App />);

        await user.type(screen.getByPlaceholderText(/load from a url/i), 'https://example.com/icon.svg');
        await user.click(screen.getByRole('button', { name: /^load$/i }));

        await waitFor(() => expect((document.querySelector('.code-input') as HTMLTextAreaElement).value).toBe(svg));
        expect(document.querySelector('.chip-active')).toBeNull();
    });

    it('shows a CORS-flavored error message when the URL fetch fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
        const user = userEvent.setup();
        render(<App />);

        await user.type(screen.getByPlaceholderText(/load from a url/i), 'https://blocked.example.com/icon.svg');
        await user.click(screen.getByRole('button', { name: /^load$/i }));

        await waitFor(() => expect(screen.getByText(/CORS restriction/i)).toBeInTheDocument());
    });

    it('shows an error message when the URL fetch responds not-ok', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })
        );
        const user = userEvent.setup();
        render(<App />);

        await user.type(screen.getByPlaceholderText(/load from a url/i), 'https://example.com/missing.svg');
        await user.click(screen.getByRole('button', { name: /^load$/i }));

        await waitFor(() => expect(screen.getByText(/404/)).toBeInTheDocument());
    });

    it('does not attempt a fetch when the URL field is empty', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole('button', { name: /^load$/i }));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ships one preset per entry in examples.ts, each selectable', () => {
        render(<App />);
        for (const ex of examples) {
            expect(screen.getByRole('button', { name: ex.label })).toBeInTheDocument();
        }
    });
});
