export { SvgIn } from './SvgIn.client';
export { SvgInProvider } from './SvgInProvider';
export type { SvgInDefaults } from './SvgInContext';
// <SvgInSuspense /> moved to its own 'svgin-react/suspense' entry (BREAKING
// CHANGE as of the next major version - see CHANGELOG). <SvgInProvider>
// stays here, unlike <SvgInSuspense />: it exists specifically to configure
// <SvgIn />'s defaults, so anyone using it already pulls in <SvgIn /> too -
// splitting it out would add an import with no real bundle-size benefit.
// <SvgInSuspense /> is a genuinely standalone rendering strategy that
// doesn't read <SvgInProvider>'s Context at all (see its own file), so it's
// the one that actually costs unrelated consumers something by living here.
