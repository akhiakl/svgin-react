export { SvgIn } from './SvgIn.client';
export { SvgInSuspense } from './SvgIn.suspense.client';
export { SvgInProvider } from './SvgInProvider';
export type { SvgInDefaults } from './SvgInContext';
// <SvgInShadow /> is deliberately NOT re-exported here, unlike
// <SvgInSuspense />/<SvgInProvider>: this file is built into one physical
// dist/client.js (this package's own tsup build doesn't tree-shake within
// an entry - only a *consuming* app's bundler tree-shakes unused named
// exports, and only if it's configured to), so anything re-exported from
// here is paid for by every consumer of 'svgin-react'/'svgin-react/client'
// whose bundler doesn't do that. Measured at ~0.6 KB gzip for
// <SvgInShadow /> alone - real weight for a feature most consumers won't
// use - so it gets its own dedicated 'svgin-react/shadow' entry instead
// (also re-exported from 'svgin-react/all' for anyone who wants every
// component behind one import and doesn't mind the extra weight).
