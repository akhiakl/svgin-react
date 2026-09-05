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

    it('forwards arbitrary native SVG/DOM props (style, onClick, role, tabIndex, data-*) to the rendered element', () => {
        const onClick = () => {};
        const { container } = render(
            <SvgInComponent
                svg={'<svg><path d="M0 0"/></svg>'}
                style={{ color: 'red' }}
                onClick={onClick}
                role="img"
                tabIndex={0}
                data-testid="icon"
            />
        );
        const svg = container.querySelector('svg');
        expect(svg).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(svg).toHaveAttribute('role', 'img');
        expect(svg).toHaveAttribute('tabindex', '0');
        expect(svg).toHaveAttribute('data-testid', 'icon');
    });

    it('lets an explicit native SVG prop override the same attribute on the source svg', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg role="presentation"><path d="M0 0"/></svg>'} role="img" />
        );
        expect(container.querySelector('svg')).toHaveAttribute('role', 'img');
    });

    it('returns null when the svg string is malformed', () => {
        const { container } = render(<SvgInComponent svg={'<div>not svg</div>'} />);
        expect(container.firstChild).toBeNull();
    });

    it('forwards viewBox from the source SVG to the rendered element', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg viewBox="0 0 24 24"><path/></svg>'} />
        );
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('forwards a single-quoted source attribute', () => {
        const { container } = render(
            <SvgInComponent svg={"<svg viewBox='0 0 8 8'><path/></svg>"} />
        );
        expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 8 8');
    });

    it('forwards a bare (valueless) source attribute as an empty string', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg data-generated><path/></svg>'} />
        );
        expect(container.querySelector('svg')).toHaveAttribute('data-generated', '');
    });

    it('explicit props override matching source SVG attributes', () => {
        const { container } = render(
            <SvgInComponent
                svg={'<svg fill="blue" viewBox="0 0 100 100"><path/></svg>'}
                fill="#f00"
                width={24}
            />
        );
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('fill', '#f00');
        expect(svg).toHaveAttribute('width', '24');
        expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    });

    it('renders null fallback (default) when svg is null and no fallback provided', () => {
        const { container } = render(<SvgInComponent svg={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('injects a <title> and <desc> when title/description are provided, title first', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg><path/></svg>'} title="Alert icon" description="Warns the user" />
        );
        const svg = container.querySelector('svg');
        expect(svg?.querySelector('title')?.textContent).toBe('Alert icon');
        expect(svg?.querySelector('desc')?.textContent).toBe('Warns the user');
        // title must be the first child per SVG accessibility conventions.
        expect(svg?.firstElementChild?.tagName.toLowerCase()).toBe('title');
    });

    it('does not inject title/desc elements when not provided', () => {
        const { container } = render(<SvgInComponent svg={'<svg><path/></svg>'} />);
        const svg = container.querySelector('svg');
        expect(svg?.querySelector('title')).toBeNull();
        expect(svg?.querySelector('desc')).toBeNull();
    });

    it('uniquifies internal ids when idSuffix is provided, avoiding collisions between instances', () => {
        const svg = '<svg><defs><linearGradient id="g"/></defs><rect fill="url(#g)"/></svg>';
        const { container } = render(
            <>
                <SvgInComponent svg={svg} idSuffix="a" />
                <SvgInComponent svg={svg} idSuffix="b" />
            </>
        );
        const gradients = container.querySelectorAll('linearGradient');
        expect(gradients).toHaveLength(2);
        expect(gradients[0].id).not.toBe(gradients[1].id);
        // Each rect's fill must reference its own instance's gradient, not the other's.
        const rects = container.querySelectorAll('rect');
        expect(rects[0].getAttribute('fill')).toBe(`url(#${gradients[0].id})`);
        expect(rects[1].getAttribute('fill')).toBe(`url(#${gradients[1].id})`);
    });

    it('leaves ids untouched when idSuffix is not provided', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg><linearGradient id="g"/></svg>'} />
        );
        expect(container.querySelector('linearGradient')?.id).toBe('g');
    });

    it('wires aria-labelledby to the injected title id when title is provided', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg><path/></svg>'} title="Alert icon" idSuffix="x" />
        );
        const svg = container.querySelector('svg');
        const titleEl = svg?.querySelector('title');
        expect(titleEl?.id).toBeTruthy();
        expect(svg).toHaveAttribute('aria-labelledby', titleEl!.id);
    });

    it('wires aria-describedby to the injected desc id when description is provided', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg><path/></svg>'} description="Warns the user" idSuffix="x" />
        );
        const svg = container.querySelector('svg');
        const descEl = svg?.querySelector('desc');
        expect(descEl?.id).toBeTruthy();
        expect(svg).toHaveAttribute('aria-describedby', descEl!.id);
    });

    it('wires both aria-labelledby and aria-describedby when both title and description are provided', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg><path/></svg>'} title="Alert icon" description="Warns the user" idSuffix="x" />
        );
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('aria-labelledby', svg?.querySelector('title')?.id);
        expect(svg).toHaveAttribute('aria-describedby', svg?.querySelector('desc')?.id);
    });

    it('lets an explicit ariaLabel win over the auto-wired aria-labelledby', () => {
        const { container } = render(
            <SvgInComponent svg={'<svg><path/></svg>'} title="Alert icon" ariaLabel="Custom label" idSuffix="x" />
        );
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('aria-label', 'Custom label');
        expect(svg).not.toHaveAttribute('aria-labelledby');
    });

    it('does not set aria-labelledby/aria-describedby when title/description are absent', () => {
        const { container } = render(<SvgInComponent svg={'<svg><path/></svg>'} />);
        const svg = container.querySelector('svg');
        expect(svg).not.toHaveAttribute('aria-labelledby');
        expect(svg).not.toHaveAttribute('aria-describedby');
    });

    it('forwards a ref to the rendered svg element', () => {
        const ref = { current: null as SVGSVGElement | null };
        render(<SvgInComponent svg={'<svg><path/></svg>'} ref={ref} />);
        expect(ref.current).toBeInstanceOf(SVGSVGElement);
    });
});
