import { createContext } from 'react';
import type { SvgInProps } from './types';

// Defaults an <SvgInProvider> can set once for every <SvgIn /> beneath it,
// instead of every consumer repeating the same handful of props on every
// icon (the actual reason people end up writing their own wrapper
// component around a fetch-and-inline library). Explicit props on a given
// <SvgIn /> always win over these - see the merge in SvgIn.client.tsx.
//
// No `suspense` entry: <SvgInSuspense /> is a separate component (not a
// prop on <SvgIn />) precisely so it isn't reachable from <SvgIn />'s own
// code path, which is what lets a consumer who never imports it avoid
// bundling any Suspense/use() code at all - reading from this same context
// would defeat that by making <SvgInSuspense /> depend on the Provider
// module again. It intentionally does not consult <SvgInProvider>.
export type SvgInDefaults = Pick<
    SvgInProps,
    'sanitizeFn' | 'disableSanitization' | 'fallback' | 'loadingFallback' | 'className' | 'onError' | 'loading'
>;

export const SvgInContext = createContext<SvgInDefaults>({});
