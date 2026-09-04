import { getCachedSvg, setCachedSvg } from './svgCache';
import { setUniversalCache, stableKey } from './universalCache';

export interface FetchAndSanitizeOptions {
    sanitizeFn?: (svg: string) => Promise<string>;
    disableSanitization?: boolean;
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
    return stableKey([url, options?.sanitizeFn, options?.disableSanitization]);
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
        // Only the default sanitizer's output is safe to share across every caller of
        // this URL. `disableSanitization` and custom `sanitizeFn` results are per-call
        // and must never be written to (or read from) the shared cache - otherwise a
        // raw/custom result for one caller could leak out as the "sanitized" result
        // for another caller of the same URL.
        const usesSharedCache = !options?.disableSanitization && !options?.sanitizeFn;

        if (usesSharedCache) {
            const cached = getCachedSvg(url);
            // getCachedSvg returns string | undefined - an explicit undefined check
            // (rather than truthiness) so a cached, sanitized-down-to-empty-string
            // result ("") is still treated as a real cache hit instead of a miss.
            if (cached !== undefined) return cached;
        }

        const res = await fetch(url, { signal: options?.signal });
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
