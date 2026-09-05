# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/). [release-please](https://github.com/googleapis/release-please) generates entries here automatically from Conventional Commits on every release - do not hand-edit below this point.

## [1.0.0](https://github.com/akhiakl/svgin-react/compare/v0.10.0...v1.0.0) (2026-09-05)


### Features

* accept and forward arbitrary native SVG/DOM props ([dbbdd66](https://github.com/akhiakl/svgin-react/commit/dbbdd66d4b94a06dbce0f416c458bf05b63a2c33))
* accept and forward arbitrary native SVG/DOM props ([4327fe9](https://github.com/akhiakl/svgin-react/commit/4327fe9554ad20316bbffaadaa13f0e1e95dd56d))
* add SvgInShadow (shadow DOM encapsulation) and dedicated subpath entries ([0b046bd](https://github.com/akhiakl/svgin-react/commit/0b046bde31a0d33b0d20887df0a77d5a4114fa2d))
* forward native host-element props on SvgInShadow; docs ([c1ccfff](https://github.com/akhiakl/svgin-react/commit/c1ccfff72907285370aa986eaeea586320e8a5a1))
* move SvgInSuspense to its own svgin-react/suspense entry point ([6799c70](https://github.com/akhiakl/svgin-react/commit/6799c70e26867eb480cd996ed60d6c4ee1127770))


### Bug Fixes

* aria-label precedence, styles XSS footgun, and React.FC children typing ([d8a5f7f](https://github.com/akhiakl/svgin-react/commit/d8a5f7fd7d81a581e449d8cb25d4dbd731a15d5e))
* closed-mode shadow root updates and unescaped-quote attribute injection ([ae73d78](https://github.com/akhiakl/svgin-react/commit/ae73d7804b0402c8220f633311a9041fd7e93e18))
* stale shadow root reused after host element replacement ([a3c1236](https://github.com/akhiakl/svgin-react/commit/a3c12360e00c608cf61b37cb885e4640f833b31d))


### Documentation

* fix inaccurate useLatestRef doc comment ([906120d](https://github.com/akhiakl/svgin-react/commit/906120d4b8cd8cd4bee79403147ae97daa0ef4c4))
* fix misleading "client entry" label on tree-shaken size comparison ([36f29bf](https://github.com/akhiakl/svgin-react/commit/36f29bfcefd789439e6c078fea7aa39b7bde2e31))
* refresh stale bundle-size comparison numbers ([4bf6571](https://github.com/akhiakl/svgin-react/commit/4bf6571840862349afd824402ee08bc1ca5b3294))


### ⚠ BREAKING CHANGES

* `import { SvgInSuspense } from 'svgin-react/client'` no longer works. Update it to `import { SvgInSuspense } from 'svgin-react/suspense'`. `import { SvgIn, SvgInProvider } from 'svgin-react/client'` is unaffected.

## [0.10.0](https://github.com/akhiakl/svgin-react/compare/v0.9.2...v0.10.0) (2026-09-04)


### Features

* add fetchOptions for authenticated SVG endpoints ([886d9c9](https://github.com/akhiakl/svgin-react/commit/886d9c97f78c91a9990d5a9ae2684528a554415c))
* add fetchOptions for authenticated SVG endpoints ([705ef07](https://github.com/akhiakl/svgin-react/commit/705ef07c77dad431ebb71e486c311fdb83f0ba74))
* cancel in-flight fetch when SvgIn unmounts or its src changes ([722745c](https://github.com/akhiakl/svgin-react/commit/722745c3355fda0e8e2164d8f1bf784377981fde))
* cancel in-flight fetch when SvgIn unmounts or its src changes ([1fab857](https://github.com/akhiakl/svgin-react/commit/1fab857d5f313bd4fd0ed2924d457bf24646c3bf))
* export clearSvgCache and hasCachedSvg from svgin-react/core ([1a3ed4a](https://github.com/akhiakl/svgin-react/commit/1a3ed4a1941ae46614cb5d47bbff2fb6a78b60ab))
* export clearSvgCache and hasCachedSvg from svgin-react/core ([f28a98b](https://github.com/akhiakl/svgin-react/commit/f28a98bd58915951da405477ebada605c4e7950d))


### Bug Fixes

* avoid passing undefined fetch init when fetchOptions is absent ([4a3f10d](https://github.com/akhiakl/svgin-react/commit/4a3f10d3d231f99fea7c11d378cb3e246a3ff062))
* don't re-sanitize on fetchOptions toggle when using the svg prop ([de2fc96](https://github.com/akhiakl/svgin-react/commit/de2fc96f81e4301c5ff86745d39b4cf2036902b1))
* feature-detect AbortSignal.any, fix cancellation docs wording ([ef00203](https://github.com/akhiakl/svgin-react/commit/ef00203698ec9a449b19b69b2dfb2de44df469bb))
* remove fallback signal combiner's abort listeners on settle ([ba643eb](https://github.com/akhiakl/svgin-react/commit/ba643eb47b04e5d433a8d26bd95f26926d0c013b))
* remove stale fetchOptions reference from clearSvgCache docs ([9337c28](https://github.com/akhiakl/svgin-react/commit/9337c2824d45a444179746fc4a86114a349598f6))
* scope pending-request bookkeeping per instance, fix svg+src release ([63f6216](https://github.com/akhiakl/svgin-react/commit/63f6216326dd221a4af6934b3c88f473f51da962))
* treat a caller's own fetchOptions.signal as an early release ([f61dd02](https://github.com/akhiakl/svgin-react/commit/f61dd02c65769c1077ed838cafdd32fde84aaff8))


### Documentation

* clarify uniquifyIds only rewrites ids in the SVG's inner markup ([bd17e46](https://github.com/akhiakl/svgin-react/commit/bd17e46a2ffde5100c6494f12620115f4088a5f9))
* document that inline &lt;style&gt; in a source SVG is not scoped ([40562ff](https://github.com/akhiakl/svgin-react/commit/40562ff2b460d646f3eb4baa71e85eeff3934681))
* document that inline &lt;style&gt; in a source SVG is not scoped ([0d53df6](https://github.com/akhiakl/svgin-react/commit/0d53df627b568a1620f3a90be32e09899af95f61))
* mention fetchOptions in clearSvgCache's shared-cache scope note ([e62c7df](https://github.com/akhiakl/svgin-react/commit/e62c7df44d26224a07d44689f6fc4bac4f462b1d))
* mention fetchOptions in clearSvgCache/hasCachedSvg scope note ([304230f](https://github.com/akhiakl/svgin-react/commit/304230f1180e92f580edea16659752493a079fbb))
* mention xlink:href in the uniquifyIds reference-rewriting note ([2f8e39e](https://github.com/akhiakl/svgin-react/commit/2f8e39ed982e1763013c3bfc57a4c36234d18dcf))
* use an unambiguous example in the uniquifyIds limitation note ([d07cc21](https://github.com/akhiakl/svgin-react/commit/d07cc21f2f5846414cfd4d829e7b15542836889b))

## [0.9.2](https://github.com/akhiakl/svgin-react/compare/v0.9.1...v0.9.2) (2026-09-02)


### Documentation

* link the live demo site in the README ([6d8ab9c](https://github.com/akhiakl/svgin-react/commit/6d8ab9cc2670f5d8b0b1b83c117ec2ee219e2750), [31cb803](https://github.com/akhiakl/svgin-react/commit/31cb80377a8a9397bb9886d8529df552cfe64483))

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
