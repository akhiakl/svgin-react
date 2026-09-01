import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgServer';
import { SvgInComponent } from './SvgInComponent';
import { nextInstanceId } from './utils/instanceId';

export async function SvgIn(props: SvgInProps) {
    // onMount is intentionally not destructured/used here - there is no DOM
    // to hand back on the server, so it's a client-only prop (see its JSDoc).
    const { src, sanitizeFn, disableSanitization, onError, ...rest } = props;
    try {
        const svg = await fetchAndSanitizeSvg(src, { sanitizeFn, disableSanitization });
        return <SvgInComponent svg={svg} idSuffix={nextInstanceId()} {...rest} />;
    } catch (error) {
        onError?.(error as Error);
        return props.fallback ?? null;
    }
}
