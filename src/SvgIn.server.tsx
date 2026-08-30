import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgServer';
import { SvgInComponent } from './SvgInComponent';
import { nextInstanceId } from './utils/instanceId';

export async function SvgIn(props: SvgInProps) {
    const { src, sanitizeFn, disableSanitization, ...rest } = props;
    try {
        const svg = await fetchAndSanitizeSvg(src, { sanitizeFn, disableSanitization });
        return <SvgInComponent svg={svg} idSuffix={nextInstanceId()} {...rest} />;
    } catch {
        return props.fallback ?? null;
    }
}
