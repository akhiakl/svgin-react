// Standalone entry point for consumers who want just <SvgInShadow /> and
// nothing else - its own physical tsup output/budget (see
// scripts/check-bundle-size.mjs), guaranteed not to pull in <SvgIn />,
// <SvgInSuspense />, or <SvgInProvider /> even for a bundler that doesn't
// tree-shake unused named exports well. Also re-exported from
// 'svgin-react/client' for consumers who'd rather import every client
// component from one place - see the comment there.
export { SvgInShadow } from './SvgIn.shadow.client';
export type { SvgInShadowProps } from './types';
