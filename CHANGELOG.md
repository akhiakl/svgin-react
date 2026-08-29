# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/). Starting with the next release, this file is generated automatically by [release-please](https://github.com/googleapis/release-please) from Conventional Commits merged to `main` - do not hand-edit entries below this point going forward.

## [0.7.0]

- Fixed: the SVG cache no longer mixes results across sanitization modes. Fetching or preloading a URL with `disableSanitization` or a custom `sanitizeFn` could previously leak that result into the cache entry a later default-sanitized call to the same URL would read.
- Fixed: `dompurify` and `jsdom` are now declared as optional peer dependencies, matching how they are actually used at runtime.
- Changed: DOMPurify (and jsdom, on the server) are now loaded lazily and cached on first use, instead of being imported eagerly.
- Changed: dropped unused dead code in the SVG rendering path.
- Added: a test suite (vitest), covering the cache fix above with a regression test.
- Added: CI running lint, typecheck, tests, build, and a bundle size budget on every pull request.
- Added: a release workflow that publishes to npm when a GitHub Release is published.

Earlier versions were not tracked in this changelog. See the git history for details.
