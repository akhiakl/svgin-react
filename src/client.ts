export { SvgIn } from './SvgIn.client';
export { SvgInProvider } from './SvgInProvider';
export type { SvgInDefaults } from './SvgInContext';
// Neither <SvgInSuspense /> nor <SvgInShadow /> is re-exported here, unlike
// <SvgInProvider>: this file is built into one physical dist/client.js
// (this package's own tsup build doesn't tree-shake within an entry - only
// a *consuming* app's bundler tree-shakes unused named exports, and only if
// it's configured to), so anything re-exported from here is paid for by
// every consumer of 'svgin-react'/'svgin-react/client' whose bundler
// doesn't do that. <SvgInProvider> stays here because it exists
// specifically to configure <SvgIn />'s defaults, so anyone using it
// already pulls in <SvgIn /> too - splitting it out would add an import
// with no real bundle-size benefit. <SvgInSuspense /> (its own
// 'svgin-react/suspense' entry, a BREAKING CHANGE as of the next major
// version - see CHANGELOG) and <SvgInShadow /> (its own
// 'svgin-react/shadow' entry) are both genuinely standalone rendering
// strategies that don't read <SvgInProvider>'s Context at all, so they're
// the ones that actually cost unrelated consumers something by living
// here - measured at ~0.6 KB gzip for <SvgInShadow /> alone. Both are also
// re-exported from 'svgin-react/all' for anyone who wants every component
// behind one import and doesn't mind the extra weight.
