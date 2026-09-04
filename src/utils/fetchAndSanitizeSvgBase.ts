import { getCachedSvg, setCachedSvg } from './svgCache';
import { setUniversalCache, stableKey } from './universalCache';

export interface FetchAndSanitizeOptions {
    sanitizeFn?: (svg: string) => Promise<string>;
    disableSanitization?: boolean;
    fetchOptions?: RequestInit;
}

// Short property names deliberately: this is internal-only bookkeeping and
// every byte here counts toward the bundle-size budget (esbuild's minifier
// does not shorten object property names, only local variable names).
// `c` = the AbortController for this in-flight request. `n` = the number of
// callers currently waiting on it - only the caller that brings this to 0
// via releaseFetchAndSanitizeSvg actually aborts the underlying request, as
// long as at least one other caller still needs the result, the fetch keeps
// running for their sake too.
interface PendingEntry {
    c: AbortController;
    n: number;
}

function computeKey(url: string, options?: FetchAndSanitizeOptions): string {
    return stableKey([url, options?.sanitizeFn, options?.disableSanitization, options?.fetchOptions]);
}

// AbortSignal.any (Node 20.3+, Safari 17.4+, Firefox 124+) is not available
// everywhere this library runs - calling it unconditionally would throw and
// break fetching entirely in an older runtime. Feature-detect and fall back
// to a manual combiner: a fresh AbortController that aborts as soon as
// either input signal does.
function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
    if (typeof AbortSignal.any === 'function') return AbortSignal.any([a, b]);
    if (a.aborted) return a;
    if (b.aborted) return b;
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    a.addEventListener('abort', onAbort, { once: true });
    b.addEventListener('abort', onAbort, { once: true });
    return controller.signal;
}

export function createFetchAndSanitizeSvg(sanitizeSvg: (svg: string) => string | Promise<string>) {
    // Scoped to this createFetchAndSanitizeSvg call, not module scope: the
    // client and server entry points each call this factory once with their
    // own sanitizer, and a framework can load both modules in the same JS
    // process (e.g. a server rendering both RSC server components and the
    // client bundle's SSR/hydration path for the same request). A shared,
    // module-level map keyed only on url+sanitizeFn+disableSanitization
    // would let a client-side and server-side request for the same key
    // collide on one PendingEntry despite running two entirely separate
    // underlying fetches - the first to settle would tear down bookkeeping
    // the other still needs, and a release for one could abort the other's
    // fetch. A map per factory instance keeps client and server requests in
    // fully separate bookkeeping regardless of what else shares the process.
    const pendingByKey = new Map<string, PendingEntry>();

    async function fetchAndSanitizeSvgImpl(
        url: string,
        options?: FetchAndSanitizeOptions & { signal?: AbortSignal }
    ): Promise<string> {
        // Only the default sanitizer's output, fetched with no special
        // request options, is safe to share across every caller of this URL.
        // `disableSanitization` and custom `sanitizeFn` results are per-call
        // and must never be written to (or read from) the shared cache -
        // otherwise a raw/custom result for one caller could leak out as the
        // "sanitized" result for another caller of the same URL.
        // `fetchOptions` gets the same treatment: different headers/credentials
        // can legitimately return different content for the same URL (a
        // personalized response, a request that would otherwise 401 without
        // auth), so its result must stay scoped to that call too.
        const usesSharedCache = !options?.disableSanitization && !options?.sanitizeFn && !options?.fetchOptions;

        if (usesSharedCache) {
            const cached = getCachedSvg(url);
            // getCachedSvg returns string | undefined - an explicit undefined check
            // (rather than truthiness) so a cached, sanitized-down-to-empty-string
            // result ("") is still treated as a real cache hit instead of a miss.
            if (cached !== undefined) return cached;
        }

        // options?.signal is the reference-counted cancellation signal (see
        // fetchAndSanitizeSvg/releaseFetchAndSanitizeSvg below); a caller
        // can independently supply their own signal via fetchOptions.signal
        // (e.g. their own timeout/abort logic). When both are present,
        // combine them so either one aborts the fetch. Only pass a second
        // argument to fetch at all when there is actually something to pass
        // (an init object or a signal): an explicit `fetch(url, undefined)`
        // changes call arity vs `fetch(url)`, which can break a fetch
        // wrapper/mock that branches on arguments.length instead of
        // checking the second argument's value.
        const callerSignal = options?.fetchOptions?.signal;
        const signal = options?.signal && callerSignal
            ? combineSignals(options.signal, callerSignal)
            : (options?.signal ?? callerSignal);
        const res = options?.fetchOptions
            ? await fetch(url, { ...options.fetchOptions, signal })
            : signal
                ? await fetch(url, { signal })
                : await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch SVG: ${url}`);
        const contentType = res.headers?.get('content-type') ?? '';
        if (contentType && !contentType.includes('svg') && !contentType.includes('xml') && !contentType.includes('octet-stream') && !contentType.includes('text/plain')) {
            throw new Error(`Unexpected content-type for SVG: ${contentType}`);
        }
        const raw = await res.text();
        let sanitized: string;
        if (options?.disableSanitization) {
            sanitized = raw;
        } else if (options?.sanitizeFn) {
            sanitized = await options.sanitizeFn(raw);
        } else {
            sanitized = await sanitizeSvg(raw);
        }

        if (usesSharedCache) {
            setCachedSvg(url, sanitized);
        }
        return sanitized;
    }
    const dedupedFetch = setUniversalCache(fetchAndSanitizeSvgImpl);

    // Wraps dedupedFetch to add reference-counted cancellation: every call
    // acquires a share of the in-flight fetch for this key (creating one if
    // none exists yet), and releaseFetchAndSanitizeSvg below releases it.
    // The underlying fetch is only actually aborted once every caller that
    // acquired a share has released it - never on the first release while
    // others still need the result.
    function fetchAndSanitizeSvg(url: string, options?: FetchAndSanitizeOptions): Promise<string> {
        const key = computeKey(url, options);
        let pending = pendingByKey.get(key);
        if (!pending) pendingByKey.set(key, (pending = { c: new AbortController(), n: 0 }));
        pending.n++;

        const promise = dedupedFetch(url, { ...options, signal: pending.c.signal });
        // Tear down the bookkeeping once the request settles naturally
        // (resolves or rejects), regardless of remaining refCount - this
        // covers callers that never call releaseFetchAndSanitizeSvg (the
        // server component, SvgInSuspense, preloadSvg) so this map never
        // accumulates stale entries for requests that already finished. The
        // `pendingByKey.get(key) === pending` check guards against a new
        // request for the same key having already started (and been stored
        // under the same key) by the time this one settles.
        const settle = () => { if (pendingByKey.get(key) === pending) pendingByKey.delete(key); };
        promise.then(settle, settle);
        return promise;
    }

    // Releases one caller's share of the in-flight fetch identified by
    // `url` + `options` (the same arguments passed to fetchAndSanitizeSvg
    // above). Only aborts the underlying fetch once every caller that
    // acquired a share of it has released - a no-op if the request already
    // settled, was never started, or other callers still need it.
    function releaseFetchAndSanitizeSvg(url: string, options?: FetchAndSanitizeOptions): void {
        const key = computeKey(url, options);
        const pending = pendingByKey.get(key);
        if (!pending) return;
        if (--pending.n <= 0) {
            pending.c.abort();
            pendingByKey.delete(key);
        }
    }

    return { fetchAndSanitizeSvg, releaseFetchAndSanitizeSvg };
}
