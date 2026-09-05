import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/client.ts',
        'src/server.ts',
        'src/core.ts',
        'src/suspense.ts',
        'src/shadow.ts',
        'src/all.ts'
    ],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    external: ['react', 'dompurify', 'jsdom']
});