import React from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvg';
import { SvgIn } from './SvgIn';

export async function SvgInServer(props: SvgInProps) {
    const { src, sanitizeFn, ...rest } = props;
    try {
        const svg = await fetchAndSanitizeSvg(src, sanitizeFn);
        return <SvgIn svg={svg} {...rest} />;
    } catch {
        return props.fallback ?? null;
    }
}
