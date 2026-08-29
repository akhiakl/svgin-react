# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/). Once [release-please](https://github.com/googleapis/release-please) is fully wired up (see `.github/workflows/release-please.yml`), it will generate entries here automatically from Conventional Commits and replace the `[Unreleased]` section below with the real version it cuts.

## [0.7.2](https://github.com/akhiakl/svgin-react/compare/v0.7.1...v0.7.2) (2026-08-29)


### Bug Fixes

* bugs, perf, ≥85% test coverage, wider audience docs ([1f6571b](https://github.com/akhiakl/svgin-react/commit/1f6571bb3fad7a0ae5ba85063a4c273423102a03))
* cache eviction, regex backtracking, viewBox forwarding, content-type guard, 96% coverage ([87c8463](https://github.com/akhiakl/svgin-react/commit/87c846326dde2549fbf6c0a37832f77738673229))
* declare dompurify/jsdom as peer dependencies, drop unused isomorphic-dompurify ([#12](https://github.com/akhiakl/svgin-react/issues/12)) ([80e033e](https://github.com/akhiakl/svgin-react/commit/80e033e9988909606017735a27b712b82d16df14))
* evict rejected promises from universalCache fallback ([#23](https://github.com/akhiakl/svgin-react/issues/23)) ([50f5276](https://github.com/akhiakl/svgin-react/commit/50f5276e3285659a1d2270c39910ccbae966a5f9))
* handle component-prefixed release tags in version check ([#39](https://github.com/akhiakl/svgin-react/issues/39)) ([94f6f8e](https://github.com/akhiakl/svgin-react/commit/94f6f8ec2c3ba32f1a982010f082551987c40fc4))
* point pnpm/action-setup at head/package.json in pr-report job ([#26](https://github.com/akhiakl/svgin-react/issues/26)) ([44c153e](https://github.com/akhiakl/svgin-react/commit/44c153efffe44e3c3be65d997642cb3cb7f85c1e))
* prevent sanitization cache poisoning across sanitize modes ([#11](https://github.com/akhiakl/svgin-react/issues/11)) ([195a654](https://github.com/akhiakl/svgin-react/commit/195a6545ac0f6ee721cbf99f781c15f6029ae370))
* prevent stableKey from colliding -0 with 0 ([#22](https://github.com/akhiakl/svgin-react/issues/22)) ([d2aaa99](https://github.com/akhiakl/svgin-react/commit/d2aaa99b0fc234e9892a6e5fb067f19cd7f24eef))
* remove unused _ params in test stubs (lint) ([3236efd](https://github.com/akhiakl/svgin-react/commit/3236efde66fc38fc91d3c829b0451588019b0f4b))
* resolve merge conflicts with main ([278dc17](https://github.com/akhiakl/svgin-react/commit/278dc17a5d5357c9820f47140a637082dc0543dc))
* stop universalCache eviction from suppressing unhandled rejections ([#28](https://github.com/akhiakl/svgin-react/issues/28)) ([a1a115a](https://github.com/akhiakl/svgin-react/commit/a1a115af7448072e65bbb4544681faffa4ed1601))


### Performance

* lazy-load and cache DOMPurify/jsdom instead of per-call setup ([#13](https://github.com/akhiakl/svgin-react/issues/13)) ([0d8d067](https://github.com/akhiakl/svgin-react/commit/0d8d06712450ee89b57b7ac08a7c73eb7bcb310f))
* stop refetching SVG on every render when sanitizeFn is inline ([#15](https://github.com/akhiakl/svgin-react/issues/15)) ([7535462](https://github.com/akhiakl/svgin-react/commit/753546250008d9df306d20df1d25cef5cdf5f41b))


### Code Refactoring

* drop dead width/height/fill regex injection in svgUtils ([#14](https://github.com/akhiakl/svgin-react/issues/14)) ([2f8c83a](https://github.com/akhiakl/svgin-react/commit/2f8c83a92488cc5e9235e69f39cd41d8b8877d46))


### Documentation

* add shared AGENTS.md instructions for AI coding tools ([#27](https://github.com/akhiakl/svgin-react/issues/27)) ([3a6fb84](https://github.com/akhiakl/svgin-react/commit/3a6fb849488b1325c3249199833d68614dd78d87))
* document sanitizeFn identity-swap limitation prominently ([#24](https://github.com/akhiakl/svgin-react/issues/24)) ([6677eaf](https://github.com/akhiakl/svgin-react/commit/6677eaf02d68a40172c7ca9dde4706f38af0d706))
* fix incorrect changelog attribution to 0.7.0 ([776a79a](https://github.com/akhiakl/svgin-react/commit/776a79af63978ee6fe71d08783f179a20585bfa7))
* fix incorrect changelog attribution to 0.7.0 ([f104727](https://github.com/akhiakl/svgin-react/commit/f10472729730ba6d60bb562f7b3cab1cdbf3744f))
* fold stale CHANGELOG unreleased section into 0.7.0 ([#35](https://github.com/akhiakl/svgin-react/issues/35)) ([78906eb](https://github.com/akhiakl/svgin-react/commit/78906ebcfb96c1ad33180f88d7cea2498019715f))
* rewrite README, add OSS project files, and fill in package.json metadata ([#18](https://github.com/akhiakl/svgin-react/issues/18)) ([4243ab3](https://github.com/akhiakl/svgin-react/commit/4243ab3ec3137f8c7c61f20b4b2d9f8a224706de))
* write the real Unreleased changelog entry and fix a stray comment ([f36fb24](https://github.com/akhiakl/svgin-react/commit/f36fb245f17a48370ebc20afa021d9bc50ef4d41))

## [0.7.1](https://github.com/akhiakl/svgin-react/compare/svgin-react-v0.7.0...svgin-react-v0.7.1) (2026-08-29)


### Bug Fixes

* bugs, perf, ≥85% test coverage, wider audience docs ([1f6571b](https://github.com/akhiakl/svgin-react/commit/1f6571bb3fad7a0ae5ba85063a4c273423102a03))
* cache eviction, regex backtracking, viewBox forwarding, content-type guard, 96% coverage ([87c8463](https://github.com/akhiakl/svgin-react/commit/87c846326dde2549fbf6c0a37832f77738673229))
* declare dompurify/jsdom as peer dependencies, drop unused isomorphic-dompurify ([#12](https://github.com/akhiakl/svgin-react/issues/12)) ([80e033e](https://github.com/akhiakl/svgin-react/commit/80e033e9988909606017735a27b712b82d16df14))
* evict rejected promises from universalCache fallback ([#23](https://github.com/akhiakl/svgin-react/issues/23)) ([50f5276](https://github.com/akhiakl/svgin-react/commit/50f5276e3285659a1d2270c39910ccbae966a5f9))
* point pnpm/action-setup at head/package.json in pr-report job ([#26](https://github.com/akhiakl/svgin-react/issues/26)) ([44c153e](https://github.com/akhiakl/svgin-react/commit/44c153efffe44e3c3be65d997642cb3cb7f85c1e))
* prevent sanitization cache poisoning across sanitize modes ([#11](https://github.com/akhiakl/svgin-react/issues/11)) ([195a654](https://github.com/akhiakl/svgin-react/commit/195a6545ac0f6ee721cbf99f781c15f6029ae370))
* prevent stableKey from colliding -0 with 0 ([#22](https://github.com/akhiakl/svgin-react/issues/22)) ([d2aaa99](https://github.com/akhiakl/svgin-react/commit/d2aaa99b0fc234e9892a6e5fb067f19cd7f24eef))
* remove unused _ params in test stubs (lint) ([3236efd](https://github.com/akhiakl/svgin-react/commit/3236efde66fc38fc91d3c829b0451588019b0f4b))
* resolve merge conflicts with main ([278dc17](https://github.com/akhiakl/svgin-react/commit/278dc17a5d5357c9820f47140a637082dc0543dc))
* stop universalCache eviction from suppressing unhandled rejections ([#28](https://github.com/akhiakl/svgin-react/issues/28)) ([a1a115a](https://github.com/akhiakl/svgin-react/commit/a1a115af7448072e65bbb4544681faffa4ed1601))


### Performance

* lazy-load and cache DOMPurify/jsdom instead of per-call setup ([#13](https://github.com/akhiakl/svgin-react/issues/13)) ([0d8d067](https://github.com/akhiakl/svgin-react/commit/0d8d06712450ee89b57b7ac08a7c73eb7bcb310f))
* stop refetching SVG on every render when sanitizeFn is inline ([#15](https://github.com/akhiakl/svgin-react/issues/15)) ([7535462](https://github.com/akhiakl/svgin-react/commit/753546250008d9df306d20df1d25cef5cdf5f41b))


### Code Refactoring

* drop dead width/height/fill regex injection in svgUtils ([#14](https://github.com/akhiakl/svgin-react/issues/14)) ([2f8c83a](https://github.com/akhiakl/svgin-react/commit/2f8c83a92488cc5e9235e69f39cd41d8b8877d46))


### Documentation

* add shared AGENTS.md instructions for AI coding tools ([#27](https://github.com/akhiakl/svgin-react/issues/27)) ([3a6fb84](https://github.com/akhiakl/svgin-react/commit/3a6fb849488b1325c3249199833d68614dd78d87))
* document sanitizeFn identity-swap limitation prominently ([#24](https://github.com/akhiakl/svgin-react/issues/24)) ([6677eaf](https://github.com/akhiakl/svgin-react/commit/6677eaf02d68a40172c7ca9dde4706f38af0d706))
* fix incorrect changelog attribution to 0.7.0 ([776a79a](https://github.com/akhiakl/svgin-react/commit/776a79af63978ee6fe71d08783f179a20585bfa7))
* fix incorrect changelog attribution to 0.7.0 ([f104727](https://github.com/akhiakl/svgin-react/commit/f10472729730ba6d60bb562f7b3cab1cdbf3744f))
* fold stale CHANGELOG unreleased section into 0.7.0 ([#35](https://github.com/akhiakl/svgin-react/issues/35)) ([78906eb](https://github.com/akhiakl/svgin-react/commit/78906ebcfb96c1ad33180f88d7cea2498019715f))
* rewrite README, add OSS project files, and fill in package.json metadata ([#18](https://github.com/akhiakl/svgin-react/issues/18)) ([4243ab3](https://github.com/akhiakl/svgin-react/commit/4243ab3ec3137f8c7c61f20b4b2d9f8a224706de))
* write the real Unreleased changelog entry and fix a stray comment ([f36fb24](https://github.com/akhiakl/svgin-react/commit/f36fb245f17a48370ebc20afa021d9bc50ef4d41))

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
