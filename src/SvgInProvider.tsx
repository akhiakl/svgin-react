import React from 'react';
import { SvgInContext, type SvgInDefaults } from './SvgInContext';

/**
 * Sets shared defaults (sanitizeFn, disableSanitization, fallback,
 * loadingFallback, className, onError, loading) for every <SvgIn /> beneath
 * it. A prop passed directly to a given <SvgIn /> always overrides the
 * matching default from the nearest provider.
 *
 * Client component only - Context providers require a client boundary in
 * React Server Components, and the async server <SvgIn /> cannot read
 * context at all (see its own doc comment). Import from 'svgin-react/client'
 * (or the main entry, which resolves to the client build outside an RSC
 * graph) and add 'use client' in the consuming file if needed, same as
 * <SvgIn /> itself.
 */
export const SvgInProvider: React.FC<React.PropsWithChildren<SvgInDefaults>> = ({ children, ...defaults }) => (
    <SvgInContext.Provider value={defaults}>{children}</SvgInContext.Provider>
);
