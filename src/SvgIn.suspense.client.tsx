import React, { use, useEffect, useRef } from 'react';
import type { SvgInProps } from './types';
import { fetchAndSanitizeSvg } from './utils/fetchAndSanitizeSvgClient';
import { sanitizeSvgString } from './utils/sanitizeSvgStringClient';
import { SvgInComponent } from './SvgInComponent';
import { nextInstanceId } from './utils/instanceId';

// Tracks which (promise, onError) pairs have already been notified, keyed at
// module scope rather than per-component-instance: when use() throws a
// rejection, React re-invokes this component multiple times as part of its
// own error-recovery pass (remounting a fresh instance - fresh refs/state -
// to confirm the error isn't transient before committing to the error
// boundary), so a per-instance ref cannot dedupe across those internal
// retries. A promise settles once, so entries here are naturally bounded and
// this WeakMap/WeakSet pair lets both the promise and the callback be
// garbage-collected once nothing else references them.
const notifiedErrors = new WeakMap<Promise<unknown>, WeakSet<(error: Error) => void>>();

function notifyOnErrorOnce(promise: Promise<string>, onError: (error: Error) => void): void {
    let seen = notifiedErrors.get(promise);
    if (!seen) {
        seen = new WeakSet();
        notifiedErrors.set(promise, seen);
    }
    if (seen.has(onError)) return;
    seen.add(onError);
    promise.catch(onError);
}

function resolvePromise(
    src: string | undefined,
    svgProp: string | undefined,
    sanitizeFn: ((svg: string) => Promise<string>) | undefined,
    disableSanitization: boolean | undefined
): Promise<string> {
    if (svgProp !== undefined) return sanitizeSvgString(svgProp, { sanitizeFn, disableSanitization });
    if (src !== undefined) return fetchAndSanitizeSvg(src, { sanitizeFn, disableSanitization });
    // A plain synchronous throw, not a rejected Promise: use() requires a
    // *cached*, stable-identity promise (fetchAndSanitizeSvg/sanitizeSvgString
    // both provide that via setUniversalCache) - a fresh Promise.reject(...)
    // created inline on every render would violate that contract and cause
    // React to loop instead of suspending properly. A synchronous throw here
    // needs no such caching: it's caught by the nearest error boundary the
    // same way any other render-time exception is. Note this means onError's
    // .catch() below never sees this specific case (there is no promise to
    // attach it to) - the error boundary is this misuse case's only handler.
    throw new Error('<SvgInSuspense /> requires either `src` or `svg`.');
}

/**
 * Suspends via React 19's use() instead of managing its own loading/error
 * state: pending renders throw the shared cached promise (caught by the
 * nearest <Suspense>), a rejection throws the reason (caught by the nearest
 * error boundary). fetchAndSanitizeSvg/sanitizeSvgString are both memoized
 * (setUniversalCache), so calling them again on every render returns the
 * *same* promise for the same arguments instead of starting a new fetch -
 * exactly the stable identity use() needs to avoid re-suspending forever.
 *
 * A standalone component rather than a `suspense` prop on <SvgIn />
 * on purpose: keeping it out of <SvgIn />'s own code path means a consumer
 * who never imports <SvgInSuspense /> never bundles the use()/Suspense code
 * at all (a runtime-prop branch inside a component everyone imports can
 * never be tree-shaken, no matter how the bundler is configured). Does not
 * read <SvgInProvider> defaults for the same reason - that would pull the
 * context module into every consumer's bundle whether or not they use it.
 *
 * `fallback` is not a prop here; use the nearest <Suspense fallback> for
 * the pending state. `loadingFallback` and `loading` (lazy) don't apply -
 * Suspense's render-as-you-fetch model doesn't have an internal loading
 * state to customize, and always starts eagerly.
 */
export const SvgInSuspense: React.FC<Omit<SvgInProps, 'fallback' | 'loadingFallback' | 'loading' | 'suspense'>> = (
    props
) => {
    const { src, svg: svgProp, sanitizeFn, disableSanitization, title, description, onError, onMount, ...rest } =
        props;
    const idSuffix = useRef<string | undefined>(undefined);
    if (idSuffix.current === undefined) idSuffix.current = nextInstanceId();
    const svgRef = useRef<SVGSVGElement>(null);
    const onMountRef = useRef(onMount);
    onMountRef.current = onMount;

    const promise = resolvePromise(src, svgProp, sanitizeFn, disableSanitization);
    // A side-channel notification only: subscribing a .catch() handler does
    // not change what use() itself sees or throws below, so onError can fire
    // without interfering with Suspense/error-boundary behavior. Deduped by
    // (promise, onError) at module scope - see notifyOnErrorOnce - rather
    // than by a ref on this instance, since it must survive React re-
    // invoking this component during its own error-recovery pass, not just
    // an ordinary re-render.
    if (onError) notifyOnErrorOnce(promise, onError);
    const resolved = use(promise);

    useEffect(() => {
        if (svgRef.current) onMountRef.current?.(svgRef.current);
    }, [resolved]);

    return (
        <SvgInComponent
            svg={resolved}
            title={title}
            description={description}
            idSuffix={idSuffix.current}
            ref={svgRef}
            {...rest}
        />
    );
};
