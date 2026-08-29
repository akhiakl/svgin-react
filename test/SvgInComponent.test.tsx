import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SvgInComponent } from '../src/SvgInComponent';

describe('SvgInComponent', () => {
    it('renders null-ish fallback when svg is null', () => {
        const { container } = render(<SvgInComponent svg={null} fallback={<span>loading</span>} />);
        expect(container.textContent).toBe('loading');
    });

    it('renders the inner markup of a sanitized svg string', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg viewBox="0 0 10 10"><circle r="5"/></svg>'} />
        );
        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg?.querySelector('circle')).not.toBeNull();
    });

    it('applies width/height/fill/className/aria-label as real attributes on the outer svg', () => {
        const { container } = render(
            <SvgInComponent
                svg={'<svg><path d="M0 0"/></svg>'}
                width={24}
                height={24}
                fill="#f00"
                className="icon"
                ariaLabel="alert"
            />
        );
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', '24');
        expect(svg).toHaveAttribute('height', '24');
        expect(svg).toHaveAttribute('fill', '#f00');
        expect(svg).toHaveClass('icon');
        expect(svg).toHaveAttribute('aria-label', 'alert');
    });

    it('returns null when the svg string is malformed', () => {
        const { container } = render(<SvgInComponent svg={'<div>not svg</div>'} />);
        expect(container.firstChild).toBeNull();
    });
});
