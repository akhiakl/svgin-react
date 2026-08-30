import type { ReactNode } from 'react';

export interface SvgInProps {
    src: string;
    width?: number | string;
    height?: number | string;
    fill?: string;
    fallback?: ReactNode;
    className?: string;
    ariaLabel?: string;
    /** Injects/overrides a <title> element inside the rendered SVG (accessible name, also shown as a tooltip in most browsers). */
    title?: string;
    /** Injects/overrides a <desc> element inside the rendered SVG (a longer accessible description than title). */
    description?: string;
    sanitizeFn?: (svg: string) => Promise<string>;
    disableSanitization?: boolean;
}
