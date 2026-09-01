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
    /** Called when the fetch or sanitization fails, alongside rendering `fallback` - for logging/telemetry. */
    onError?: (error: Error) => void;
    /** Client component only: called with the rendered `<svg>` DOM element right after it mounts or updates. No-op on the server component (there is no DOM to hand back). */
    onMount?: (svg: SVGSVGElement) => void;
}
