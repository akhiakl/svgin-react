#!/usr/bin/env node
// Builds the markdown body for the "PR size & coverage report" comment (see
// .github/workflows/ci.yml, job pr-report). Compares the pull request's head
// commit against its base branch for two things: bundle size (gzip, per
// entry point) and test coverage (line %), so a reviewer can see at a glance
// whether a change made things better or worse, not just whether it passed.
//
// Usage: node scripts/pr-report.mjs <head-size.json> <base-size.json> <head-coverage.json> <base-coverage.json>
// Any input file that is missing or unreadable is treated as "no data" for
// that side, so the report still renders (e.g. the base branch predates one
// of these files).
import { readFileSync } from 'node:fs';

const [headSizePath, baseSizePath, headCoveragePath, baseCoveragePath] = process.argv.slice(2);

function readJson(path) {
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return null;
    }
}

function fmtKb(n) {
    return typeof n === 'number' ? `${n.toFixed(2)} KB` : 'n/a';
}

function fmtPct(n) {
    return typeof n === 'number' ? `${n.toFixed(1)}%` : 'n/a';
}

function diffArrow(headVal, baseVal, { lowerIsBetter }) {
    if (typeof headVal !== 'number' || typeof baseVal !== 'number') return '';
    const delta = headVal - baseVal;
    if (Math.abs(delta) < 0.01) return '(no change)';
    const better = lowerIsBetter ? delta < 0 : delta > 0;
    const arrow = delta > 0 ? '↑' : '↓';
    const sign = delta > 0 ? '+' : '';
    const icon = better ? '🟢' : '🔴';
    return `${icon} ${arrow} ${sign}${delta.toFixed(2)}`;
}

function sizeTable(headSize, baseSize) {
    const files = (headSize ?? baseSize ?? []).map((r) => r.file);
    const headByFile = Object.fromEntries((headSize ?? []).map((r) => [r.file, r]));
    const baseByFile = Object.fromEntries((baseSize ?? []).map((r) => [r.file, r]));

    const rows = files.map((file) => {
        const head = headByFile[file];
        const base = baseByFile[file];
        const headGzip = head?.found ? head.gzipKb : undefined;
        const baseGzip = base?.found ? base.gzipKb : undefined;
        const status = head?.found ? (head.overBudget ? '❌ over budget' : '✅') : '❓ not found';
        return `| \`${file}\` | ${fmtKb(baseGzip)} | ${fmtKb(headGzip)} | ${diffArrow(headGzip, baseGzip, { lowerIsBetter: true })} | ${head?.budgetKb ?? '?'} KB | ${status} |`;
    });

    return [
        '| File | Base (gzip) | This PR (gzip) | Change | Budget | Status |',
        '| --- | --- | --- | --- | --- | --- |',
        ...rows,
    ].join('\n');
}

function coverageRow(label, headTotal, baseTotal, key) {
    const head = headTotal?.[key]?.pct;
    const base = baseTotal?.[key]?.pct;
    return `| ${label} | ${fmtPct(base)} | ${fmtPct(head)} | ${diffArrow(head, base, { lowerIsBetter: false })} |`;
}

function coverageTable(headCoverage, baseCoverage) {
    const headTotal = headCoverage?.total;
    const baseTotal = baseCoverage?.total;
    return [
        '| Metric | Base | This PR | Change |',
        '| --- | --- | --- | --- |',
        coverageRow('Lines', headTotal, baseTotal, 'lines'),
        coverageRow('Statements', headTotal, baseTotal, 'statements'),
        coverageRow('Functions', headTotal, baseTotal, 'functions'),
        coverageRow('Branches', headTotal, baseTotal, 'branches'),
    ].join('\n');
}

const headSize = readJson(headSizePath);
const baseSize = readJson(baseSizePath);
const headCoverage = readJson(headCoveragePath);
const baseCoverage = readJson(baseCoveragePath);

const sizeFailed = (headSize ?? []).some((r) => r.overBudget || !r.found);

const lines = [
    '## Size & coverage report',
    '',
    sizeFailed ? '**Bundle size: over budget.** See the table below.' : '**Bundle size: within budget.**',
    '',
    '### Bundle size (gzip)',
    '',
    sizeTable(headSize, baseSize),
    '',
    '### Test coverage',
    '',
    headCoverage ? coverageTable(headCoverage, baseCoverage) : '_No coverage data for this pull request._',
    '',
    '<sub>Base branch numbers come from rebuilding its current head in this same workflow run. 🟢/🔴 mark whether this PR made that number better or worse; missing data (base predates a script, coverage failed to generate) is shown as n/a rather than counted either way.</sub>',
].join('\n');

console.log(lines);
