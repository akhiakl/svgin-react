#!/usr/bin/env node
// Lightweight bundle-size budget check for the "lightweight and performant"
// requirement on this library: fails CI if the built client/server/core
// entry points grow past a small, deliberately tight gzip budget. Bump the
// budget (with a comment explaining why) if a change legitimately needs it -
// this is meant to catch accidental bloat, not to block every change.
import { gzipSync } from 'node:zlib';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

// Budgets are for the CJS build (dist/*.js), which is the worst case for
// bundle size since ESM output is the one bundlers tree-shake most
// aggressively. dompurify/jsdom are external (not bundled) either way, so
// these numbers reflect this package's own code, not its peer dependencies.
const BUDGETS_KB_GZIP = {
    'client.js': 3,
    'server.js': 3,
    'core.js': 2,
};

let failed = false;

for (const [file, budgetKb] of Object.entries(BUDGETS_KB_GZIP)) {
    const path = join(DIST, file);
    let raw;
    try {
        raw = readFileSync(path);
    } catch {
        console.error(`✖ ${file}: not found at ${path} - did the build run?`);
        failed = true;
        continue;
    }
    const gzipBytes = gzipSync(raw).length;
    const gzipKb = gzipBytes / 1024;
    const rawKb = statSync(path).size / 1024;
    const status = gzipKb <= budgetKb ? '✓' : '✖';
    console.log(
        `${status} ${file}: ${rawKb.toFixed(2)} KB raw, ${gzipKb.toFixed(2)} KB gzip (budget: ${budgetKb} KB gzip)`
    );
    if (gzipKb > budgetKb) failed = true;
}

if (failed) {
    console.error('\nBundle size budget exceeded. See scripts/check-bundle-size.mjs.');
    process.exit(1);
}
