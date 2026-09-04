#!/usr/bin/env node
// Lightweight bundle-size budget check for the "lightweight and performant"
// requirement on this library: fails CI if the built client/server/core
// entry points grow past a small, deliberately tight gzip budget. Bump the
// budget (with a comment explaining why) if a change legitimately needs it -
// this is meant to catch accidental bloat, not to block every change.
//
// Usage:
//   node scripts/check-bundle-size.mjs             human-readable, exits 1 over budget
//   node scripts/check-bundle-size.mjs --json       prints a JSON array to stdout instead
//   node scripts/check-bundle-size.mjs --json --no-fail   also skip the non-zero exit code
//
// --json is used by the PR size/coverage report (see scripts/pr-report.mjs)
// to compare a pull request's bundle size against its base branch.
import { gzipSync } from 'node:zlib';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

// Budgets are for the CJS build (dist/*.js), which is the worst case for
// bundle size since ESM output is the one bundlers tree-shake most
// aggressively. dompurify/jsdom are external (not bundled) either way, so
// these numbers reflect this package's own code, not its peer dependencies.
const BUDGETS_KB_GZIP = {
    // Bumped from 3 to 3.3: the reference-counted abort-in-flight-fetch
    // feature (releaseFetchAndSanitizeSvg, called on unmount/src change so a
    // no-longer-needed fetch is actually cancelled instead of left running)
    // needed a small amount of real code the client bundle already had no
    // slack for. Property names in the new bookkeeping map are deliberately
    // single-letter to keep this bump as small as possible. The 3.1 -> 3.15
    // step was a review fix that scopes the pending-request map per
    // createFetchAndSanitizeSvg instance instead of sharing one at module
    // scope. The 3.15 -> 3.22 step is from combining the refcounted
    // cancellation signal with a caller-supplied fetchOptions.signal (via
    // AbortSignal.any) once this feature was rebased onto the fetchOptions
    // feature (PR #51) - either signal must be able to abort the fetch. The
    // 3.22 -> 3.3 step is a review fix that feature-detects AbortSignal.any
    // (Node < 20.3/Safari < 17.4/Firefox < 124 lack it) and falls back to a
    // manual AbortController-based combiner instead of throwing at runtime.
    'client.js': 3.3,
    'server.js': 3,
    'core.js': 2,
};

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const noFail = args.includes('--no-fail');

let failed = false;
const results = [];

for (const [file, budgetKb] of Object.entries(BUDGETS_KB_GZIP)) {
    const path = join(DIST, file);
    let raw;
    try {
        raw = readFileSync(path);
    } catch {
        failed = true;
        results.push({ file, found: false, budgetKb });
        if (!jsonMode) console.error(`✖ ${file}: not found at ${path} - did the build run?`);
        continue;
    }
    const gzipBytes = gzipSync(raw).length;
    const gzipKb = gzipBytes / 1024;
    const rawKb = statSync(path).size / 1024;
    const overBudget = gzipKb > budgetKb;
    if (overBudget) failed = true;
    results.push({ file, found: true, rawKb, gzipKb, budgetKb, overBudget });
    if (!jsonMode) {
        const status = overBudget ? '✖' : '✓';
        console.log(
            `${status} ${file}: ${rawKb.toFixed(2)} KB raw, ${gzipKb.toFixed(2)} KB gzip (budget: ${budgetKb} KB gzip)`
        );
    }
}

if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
} else if (failed) {
    console.error('\nBundle size budget exceeded. See scripts/check-bundle-size.mjs.');
}

if (failed && !noFail) {
    process.exit(1);
}
