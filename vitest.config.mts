import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.ts'],
        // site/test covers site/src (the Inspector demo, not the published
        // package) - included here so its tests run in the same `vitest run`,
        // but deliberately left out of coverage.include below: the 85%
        // threshold gate is scoped to the package's own src/, not the site.
        include: ['test/**/*.test.{ts,tsx}', 'site/test/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'json-summary'],
            include: ['src/**/*.{ts,tsx}'],
            // v8's `include` glob alone still picked up site/src (it isn't
            // anchored to the repo root the way it looks) - excluded
            // explicitly so the threshold gate stays scoped to the
            // package's own src/, matching the comment above.
            exclude: ['site/**'],
            thresholds: {
                statements: 85,
                branches: 85,
                functions: 85,
                lines: 85,
            },
        },
    },
});
