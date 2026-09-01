#!/usr/bin/env node
// Guards against a real mistake this repo made once already: release-please
// bumps the npm package version (and triggers a real `npm publish`) from any
// `feat:`/`fix:` commit anywhere in the repo, regardless of which files it
// touches - it has no path filtering. A `feat:`/`fix:` commit that only
// touches site/, e2e config, docs, or workflow files would ship an
// empty-diff npm release. This script fails CI if that happens, so it is
// caught before merge instead of after a release runs.
//
// Usage: node scripts/check-release-scope.mjs <baseSha> <headSha>
//
// A commit counts as "package-relevant" if any changed file falls under one
// of PACKAGE_PATHS. site/, test/, e2e config, docs, and CI/deploy workflows
// do not - use chore:/docs:/test:/ci:/build: for changes confined to those.
import { execFileSync } from 'node:child_process';

const PACKAGE_PATHS = ['src/', 'tsup.config.ts'];
// package.json is both this repo's tooling manifest and the published
// package's manifest - "the commit touched package.json" is too coarse
// (a site:* script or a devDependency bump would false-positive as
// package-relevant). Only these top-level fields actually affect what gets
// published.
const PACKAGE_JSON_FIELDS = ['dependencies', 'peerDependencies', 'peerDependenciesMeta', 'exports', 'main', 'module', 'types', 'files', 'sideEffects'];
const BUMP_TYPES = /^(feat|fix)(\([^)]*\))?!?:/;

const [baseSha, headSha] = process.argv.slice(2);
if (!baseSha || !headSha) {
    console.error('Usage: node scripts/check-release-scope.mjs <baseSha> <headSha>');
    process.exit(2);
}

function git(...args) {
    return execFileSync('git', args, { encoding: 'utf8' });
}

function readPackageJsonAt(sha) {
    try {
        return JSON.parse(git('show', `${sha}:package.json`));
    } catch {
        return null; // file didn't exist at this revision
    }
}

function packageJsonChangedRelevantly(sha) {
    const before = readPackageJsonAt(`${sha}^`);
    const after = readPackageJsonAt(sha);
    if (!before || !after) return true; // package.json was added/removed - be conservative
    return PACKAGE_JSON_FIELDS.some((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]));
}

const commits = git('rev-list', '--reverse', `${baseSha}..${headSha}`).trim().split('\n').filter(Boolean);

let failed = false;
for (const sha of commits) {
    const subject = git('log', '-1', '--format=%s', sha).trim();
    if (!BUMP_TYPES.test(subject)) continue;

    const changedFiles = git('diff-tree', '--no-commit-id', '--name-only', '-r', sha)
        .trim()
        .split('\n')
        .filter(Boolean);
    const touchesPackage =
        changedFiles.some((f) => PACKAGE_PATHS.some((p) => f.startsWith(p))) ||
        (changedFiles.includes('package.json') && packageJsonChangedRelevantly(sha));

    if (!touchesPackage) {
        failed = true;
        console.error(`\n✖ ${sha.slice(0, 7)} "${subject}"`);
        console.error('  Uses feat:/fix: but changes nothing under src/ (or package.json/tsup.config.ts).');
        console.error('  This would trigger a real npm version bump and publish with an empty package diff.');
        console.error('  Changed files:');
        for (const f of changedFiles) console.error(`    ${f}`);
        console.error('  Reword to chore:/docs:/test:/ci:/build: instead (see AGENTS.md).');
    }
}

if (failed) {
    console.error('\nSee "Release scope" in AGENTS.md for why this is checked.');
    process.exit(1);
}
console.log('✓ Every feat:/fix: commit in range touches something package-relevant.');
