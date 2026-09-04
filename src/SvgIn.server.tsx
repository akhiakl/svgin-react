import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgServer';
import { sanitizeSvgString } from './utils/sanitizeSvgStringServer';
import { SvgInComponent } from './SvgInComponent';
import { nextInstanceId } from './utils/instanceId';

export async function SvgIn(props: SvgInProps) {
    // onMount/loading/suspense are intentionally not destructured/used here:
    // there is no DOM to hand back on the server (onMount), no "loading"
    // state to defer (this function itself only resolves once the SVG is
    // ready), and this async server component is already Suspense-friendly
    // on its own - a parent can wrap its usage in <Suspense> for free. All
    // three are client-only, documented on their own prop in types.ts.
    const { src, svg: svgProp, sanitizeFn, disableSanitization, fetchOptions, onError, ...rest } = props;
    try {
        let svg: string;
        if (svgProp !== undefined) {
            svg = await sanitizeSvgString(svgProp, { sanitizeFn, disableSanitization });
        } else if (src !== undefined) {
            svg = await fetchAndSanitizeSvg(src, { sanitizeFn, disableSanitization, fetchOptions });
        } else {
            throw new Error('<SvgIn /> requires either `src` or `svg`.');
        }
        return <SvgInComponent svg={svg} idSuffix={nextInstanceId()} {...rest} />;
    } catch (error) {
        onError?.(error as Error);
        return props.fallback ?? null;
    }
}
