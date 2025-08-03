import React from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvg';
import { SvgInComponent } from './SvgInComponent';

export async function SvgIn(props: SvgInProps) {
    const { src, sanitizeFn, ...rest } = props;
    try {
        const svg = await fetchAndSanitizeSvg(src, sanitizeFn);
        return <SvgInComponent svg={svg} {...rest} />;
    } catch {
        return props.fallback ?? null;
    }
}
