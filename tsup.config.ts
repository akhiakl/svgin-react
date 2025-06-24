import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/SvgIn.tsx'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react']
});
