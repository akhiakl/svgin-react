// Convenience entry point for consumers who'd rather not think about which
// subpath to import from: everything client-side (SvgIn, SvgInSuspense,
// SvgInProvider, SvgInShadow) plus everything platform-agnostic (preloadSvg,
// clearSvgCache, hasCachedSvg, and every exported type) behind one import.
//
// Deliberately does not include the server component: an async React
// Server Component can't be re-exported alongside client components from
// one module without breaking the 'use client'/'use server' boundary each
// side actually needs - import { SvgIn } from 'svgin-react/server' (or the
// main 'svgin-react' entry, which resolves to it automatically in a server
// context) for that one.
//
// This is the opposite tradeoff from every other entry point in this
// package: it pulls in strictly more code than most consumers need (offset
// only by whatever a bundler still manages to tree-shake), in exchange for
// a single, unambiguous import path. Prefer 'svgin-react/client',
// 'svgin-react/server', 'svgin-react/core', or 'svgin-react/shadow'
// individually if bundle size matters to you.
export * from './client';
export * from './core';
// Named re-export (not `export *`) for the value only: `./core`'s
// `export * from './types'` already re-exports the SvgInShadowProps type,
// so `export *`-ing './shadow' too would re-export that same type a second
// time and collide.
export { SvgInShadow } from './shadow';
