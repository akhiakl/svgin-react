import { useRef } from 'react';

/**
 * A ref that's always kept in sync with the latest render's value, without
 * itself being an effect dependency - the same "read a fresh value from a
 * stable ref inside a callback/effect that shouldn't re-run just because a
 * consumer passed a new inline closure/object" pattern used throughout
 * SvgIn.client.tsx and SvgIn.suspense.client.tsx (onError, onMount,
 * sanitizeFn, fetchOptions), collapsed into one shared two-line function
 * instead of repeating `const xRef = useRef(x); xRef.current = x;` at every
 * call site.
 */
export function useLatestRef<T>(value: T): { current: T } {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}
