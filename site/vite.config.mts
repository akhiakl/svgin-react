import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Standalone static site (deployed to GitHub Pages), separate from the
// published package build (tsup). Imports svgin-react straight from ../src
// so the demo always reflects the current code, same pattern as e2e uses
// for its playground. No React plugin needed - esbuild's default JSX
// transform (driven by the repo's tsconfig `jsx: "react-jsx"`) is enough.
//
// `base` matters for GitHub Pages project sites (served from
// /<repo>/, not /) - overridden by the deploy workflow via
// VITE_BASE so local `pnpm run site:dev`/`site:build` still work at `/`.
export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    base: process.env.VITE_BASE ?? '/',
    build: {
        outDir: 'dist',
        rollupOptions: {
            // src/utils/universalCache.ts does `require('react/cache')` inside a
            // try/catch, as an optional RSC-only fallback path this browser-only
            // site never takes. Vite's production bundler otherwise tries to
            // statically resolve that require() at build time and fails, since
            // 'react/cache' isn't exported under React's browser condition -
            // marking it external leaves it as a runtime call, which the
            // surrounding try/catch already handles safely (it just throws
            // ReferenceError: require is not defined, caught the same way a
            // resolution failure would be).
            external: ['react/cache'],
        },
    },
    server: {
        port: 4174,
    },
});
