# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- The SVG cache no longer mixes results across sanitization modes. Fetching or preloading a URL with `disableSanitization` or a custom `sanitizeFn` could previously leak that result into the cache entry a later default-sanitized call to the same URL would read.
- `dompurify` and `jsdom` are now declared as optional peer dependencies, matching how they are actually used at runtime.

### Changed
- DOMPurify (and jsdom, on the server) are now loaded lazily and cached on first use, instead of being imported eagerly.
- Dropped unused dead code in the SVG rendering path (see the pull request history for details).

### Added
- A test suite (vitest), covering the cache fix above with a regression test.
- CI: lint, typecheck, test (Node 18/20/22), build, and a bundle size budget on every pull request.
- A release workflow that publishes to npm when a GitHub Release is published.

## [0.7.0]

Initial version tracked before this changelog was introduced. See the git history for details.
