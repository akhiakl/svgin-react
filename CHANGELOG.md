# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/). Once [release-please](https://github.com/googleapis/release-please) is fully wired up (see `.github/workflows/release-please.yml`), it will generate entries here automatically from Conventional Commits and replace the `[Unreleased]` section below with the real version it cuts.

## [Unreleased]

Merged to `main` since `0.7.0` (currently on npm), not yet published:

### Fixed
- The SVG cache no longer mixes results across sanitization modes: fetching or preloading a URL with `disableSanitization` or a custom `sanitizeFn` could previously leak that result into the cache entry a later default-sanitized call to the same URL would read.
- `dompurify` and `jsdom` are now correctly declared as optional peer dependencies, matching how they are actually used at runtime.
- A failed fetch is no longer cached forever: the in-memory fallback cache used outside React Server Components now evicts a rejected promise so the next call retries, instead of replaying the same failure indefinitely. The fix also avoids marking that promise as internally "handled" in a way that would hide an unhandled-rejection warning from a caller who never awaits or catches it.
- Fixed a cache-key collision between `-0` and `0` in the internal cache key serializer.
- Removed a catastrophic-backtracking (ReDoS) risk in the SVG markup extraction, which used to rely on an unbounded regex.
- The client component now clears its previous result immediately when `src` changes, instead of briefly continuing to show the old SVG while the new one loads.
- Fetching now validates the response's `Content-Type` and rejects with a clear error when it is obviously not SVG (e.g. an HTML error page returned by a misbehaving server), instead of trying to sanitize and render it anyway.

### Changed
- DOMPurify (and jsdom, on the server) are loaded lazily and cached on first use, instead of being imported eagerly.
- The client component no longer refetches and re-sanitizes on every render when passed a fresh inline `sanitizeFn` closure.
- Source SVG attributes (`viewBox`, `preserveAspectRatio`, `xmlns`, etc.) are now automatically forwarded from the fetched SVG to the rendered element; explicit props (`width`, `height`, `fill`, `className`, `ariaLabel`) still take precedence. Note for existing consumers: if you were relying on the fetched SVG's own `viewBox` being dropped, this now preserves it.
- Published bundles are now minified, roughly halving the gzip size of every entry point (`client`, `server`, `core`).

### Added
- A full test suite (Vitest), with coverage enforced at a minimum of 85%.

No commit in this range used a `!` or `BREAKING CHANGE` marker, so this is expected to release as a patch or minor version. The `Content-Type` validation and automatic attribute forwarding above are the two behavior changes most likely to affect an existing integration; both are called out specifically for that reason.

## [0.7.0]

Initial version tracked before this changelog was introduced. See the git history for details.
