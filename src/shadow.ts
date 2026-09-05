// Standalone entry point for consumers who want just <SvgInShadow /> and
// nothing else - its own physical tsup output/budget (see
// scripts/check-bundle-size.mjs), guaranteed not to pull in <SvgIn />,
// <SvgInSuspense />, or <SvgInProvider /> even for a bundler that doesn't
// tree-shake unused named exports well. Also re-exported from
// 'svgin-react/all' for consumers who'd rather import every component from
// one place - see that entry's own comment for why it's a separate one
// from 'svgin-react/client' rather than folded into it.
export { SvgInShadow } from './SvgIn.shadow.client';
export type { SvgInShadowProps } from './types';
