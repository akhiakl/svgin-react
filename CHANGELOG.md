# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/). [release-please](https://github.com/googleapis/release-please) generates entries here automatically from Conventional Commits on every release - do not hand-edit below this point.

## [0.9.2](https://github.com/akhiakl/svgin-react/compare/v0.9.1...v0.9.2) (2026-09-02)


### Documentation

* link the live demo site in the README ([6d8ab9c](https://github.com/akhiakl/svgin-react/commit/6d8ab9cc2670f5d8b0b1b83c117ec2ee219e2750))
* link the live demo site in the README ([31cb803](https://github.com/akhiakl/svgin-react/commit/31cb80377a8a9397bb9886d8529df552cfe64483))

## [0.9.1](https://github.com/akhiakl/svgin-react/compare/v0.9.0...v0.9.1) (2026-09-01)


### Bug Fixes

* exclude ignored src from the suspense promise cache key when svg is set ([8f8c1f4](https://github.com/akhiakl/svgin-react/commit/8f8c1f4bb310b2bd409c353b8b0d4b7ce2fe8c1a))
* stop SvgInSuspense retrying forever on a persistently failing fetch ([d9c49eb](https://github.com/akhiakl/svgin-react/commit/d9c49eb416b29becde8effd9ba8815e95887b8f0))
* stop SvgInSuspense retrying forever on a persistently failing fetch ([57ce059](https://github.com/akhiakl/svgin-react/commit/57ce059fb637b5dd42e1c000b2f180ef3ce5d69c))

## [0.9.0](https://github.com/akhiakl/svgin-react/compare/v0.8.0...v0.9.0) (2026-09-01)


### Features

* add svg prop, SvgInSuspense, SvgInProvider, loadingFallback, and lazy loading ([8d41bd4](https://github.com/akhiakl/svgin-react/commit/8d41bd402311e7672ce16a24b697cb5f910714da))
* add svg prop, SvgInSuspense, SvgInProvider, loadingFallback, and lazy loading ([33d525c](https://github.com/akhiakl/svgin-react/commit/33d525c0a3f8d202d5764f9e0b3e21fc0449a470))


### Bug Fixes

* address Copilot review findings on lazy loading and Suspense onError ([7a9a981](https://github.com/akhiakl/svgin-react/commit/7a9a98125e09763223975a65d04bd841c755cedd))


### Documentation

* add SVGR (@svgr/core) comparison to README and llms.txt ([ebde99b](https://github.com/akhiakl/svgin-react/commit/ebde99b05a5440196210268eb6963e2ec880b03c))
* explain Socket/scanner alerts on jsdom's dependency tree in SECURITY.md ([46c4fcb](https://github.com/akhiakl/svgin-react/commit/46c4fcba00f0c90921ebee5ceb22d53c03deedde))

## [0.8.0](https://github.com/akhiakl/svgin-react/compare/v0.7.2...v0.8.0) (2026-09-01)


### Features

* add onError/onMount callbacks and aria wiring for title/description ([10bd249](https://github.com/akhiakl/svgin-react/commit/10bd24928146b637f3ca66e484bc285a4ba3a231))
* add title/description props and per-instance id uniquification ([b8f6163](https://github.com/akhiakl/svgin-react/commit/b8f61637591c039322529c1b57d0d0cb4a83b694))
* add title/description props and per-instance id uniquification ([5c7966b](https://github.com/akhiakl/svgin-react/commit/5c7966bef9c3f8ee68918c6eefb05b1eb7ffb911))


### Bug Fixes

* remove unused param lint error in universalCache dedup test ([386580c](https://github.com/akhiakl/svgin-react/commit/386580c4b0d92b4435a4eb3ae504e8fabd291e11))


### Documentation

* remove duplicate/phantom changelog entries ([3a8acb3](https://github.com/akhiakl/svgin-react/commit/3a8acb39ffb28324650e5f52497e0e9f1646b139))
* remove duplicate/phantom changelog entries ([b6d6a2c](https://github.com/akhiakl/svgin-react/commit/b6d6a2c11065b01a3df837e34114fce04dbd3536))

## [0.7.2](https://github.com/akhiakl/svgin-react/compare/v0.7.0...v0.7.2) (2026-08-29)

The first version actually published to npm since this changelog was introduced. `0.7.1` was tagged and released on GitHub but never reached npm (a bug in this repo's own publish workflow caught it first) - it's a phantom version and does not exist on the npm registry, so this jumps straight from the `0.7.0` baseline below.


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

## [0.7.0]

Initial version tracked before this changelog was introduced. See the git history for details.
