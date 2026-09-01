import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Minimal dev server for the Playwright e2e harness: serves this directory
// (index.html + main.tsx, which import the library straight from src/) plus
// the fixture SVGs under public/. No React plugin is needed - esbuild's
// default JSX transform (driven by the repo's tsconfig `jsx: "react-jsx"`)
// is enough for a one-shot render harness with no HMR requirements.
export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    server: {
        port: 4173,
        strictPort: true,
    },
});
