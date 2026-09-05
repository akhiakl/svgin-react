// Standalone entry point for <SvgInSuspense /> - its own physical tsup
// output/budget (see scripts/check-bundle-size.mjs), so it costs nothing to
// consumers of 'svgin-react/client' who don't use it. Moved out of
// client.ts as of the next major version (BREAKING CHANGE - see
// CHANGELOG): update `import { SvgInSuspense } from 'svgin-react/client'`
// to `import { SvgInSuspense } from 'svgin-react/suspense'`.
export { SvgInSuspense } from './SvgIn.suspense.client';
