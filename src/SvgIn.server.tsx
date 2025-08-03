import React from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgServer';
import { SvgInComponent } from './SvgInComponent';

export async function SvgIn(props: SvgInProps) {
    const { src, sanitizeFn, disableSanitization, ...rest } = props;
    try {
        const svg = await fetchAndSanitizeSvg(src, { sanitizeFn, disableSanitization });
        return <SvgInComponent svg={svg} {...rest} />;
    } catch {
        return props.fallback ?? null;
    }
}
