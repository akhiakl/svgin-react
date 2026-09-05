import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.ts'],
        include: ['test/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'json-summary'],
            include: ['src/**/*.{ts,tsx}'],
            // Enforced at 100%: the codebase is small enough that every
            // branch should be either exercised by a real test or, where a
            // branch is genuinely unreachable through the public API (a
            // defensive guard, an invariant enforced elsewhere), explicitly
            // excluded with a `/* v8 ignore next */` comment explaining why
            // - see fetchAndSanitizeSvgBase.ts, universalCache.ts, and
            // SvgIn.client.tsx for examples. A number below 100% here should
            // mean a real gap to close, not a threshold to raise later.
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100,
            },
        },
    },
});
