# Maintainer notes

For the regular contribution workflow (branching, pull requests, local checks), see [CONTRIBUTING.md](../CONTRIBUTING.md). This file covers the release process, which only a maintainer with merge access acts on.

## CI

CI runs lint, typecheck, test, build, and the bundle-size check (across Node 22 and 24 for tests) on every pull request and on every push to `main`.

## Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please), driven entirely by Conventional Commits:

1. `release-please.yml` watches `main` and keeps a standing "chore(main): release X.Y.Z" pull request up to date, with `package.json`'s version bump and a generated `CHANGELOG.md` entry computed from every `feat:`/`fix:`/etc. commit merged since the last release.
2. Merging that pull request creates the GitHub Release and tag.
3. That Release publishing triggers `release.yml`, which re-runs the full lint/typecheck/test/build/size gate against the tagged commit and publishes to npm using [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), no npm token stored in this repo.

So: to ship what is on `main`, find and merge the open release-please pull request. Nothing to run locally.
