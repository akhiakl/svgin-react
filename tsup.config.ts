import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/client.ts',
        'src/server.ts',
        'src/core.ts'
    ],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'isomorphic-dompurify']
});