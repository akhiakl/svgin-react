import type { ReactNode } from 'react';

export interface SvgInProps {
    src: string;
    width?: number | string;
    height?: number | string;
    fill?: string;
    fallback?: ReactNode;
    className?: string;
    ariaLabel?: string;
    sanitizeFn?: (svg: string) => Promise<string>;
}
