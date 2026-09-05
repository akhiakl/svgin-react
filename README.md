# svgin-react

[![npm version](https://img.shields.io/npm/v/svgin-react.svg)](https://npmjs.com/package/svgin-react)
[![npm downloads](https://img.shields.io/npm/dm/svgin-react.svg)](https://npmjs.com/package/svgin-react)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/svgin-react)](https://bundlephobia.com/package/svgin-react)
[![CI](https://github.com/akhiakl/svgin-react/actions/workflows/ci.yml/badge.svg)](https://github.com/akhiakl/svgin-react/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Fetch an SVG from a URL and render it as a real, styleable React element — not an `<img>`. Sanitized by default, so it's safe with SVGs you didn't create yourself. Works in the browser and in React Server Components (Next.js App Router, plain SSR, and everywhere else).

```tsx
import { SvgIn } from 'svgin-react';

<SvgIn src="/icons/alert.svg" width={24} fill="#f00" />
```

**[Try it live](https://svgin-react-tryit.vercel.app)** — paste your own SVG markup and see exactly what the sanitizer strips, or click through the RSC, Suspense, provider-defaults, and lazy-loading demos.

## Why not just use an `<img>` tag?

An `<img src="icon.svg">` can't be styled with CSS: no color changes, no path animation, no targeting inner elements. To do any of that, the SVG markup has to be inlined into the page.

Inlining raw SVG markup from a URL you don't fully control is a real security risk — an SVG can carry `<script>` tags, `onload` handlers, and other ways to run JavaScript. svgin-react fetches the SVG, sanitizes it with [DOMPurify](https://github.com/cure53/DOMPurify), and inlines it as a normal React element.

## Why svgin-react over react-svg or react-inlinesvg?

|                                       | **svgin-react** | react-svg | react-inlinesvg |
| ------------------------------------- | :--------------: | :-------: | :--------------: |
| Sanitized by default                  |        ✅         | opt-in only | ❌ none          |
| Minzipped size (single `SvgIn`/equivalent import, tree-shaken) |     **~2.7 KB**     |   ~3.8 KB  |     ~7.7 KB       |
| React Server Components support       |        ✅         |     ❌     |        ❌         |
| Real React element (not DOM injection)|        ✅         |     ❌     |        ✅         |
| Forced runtime dependency             |    none (optional peers) | `@tanem/svg-injector` | `react-from-dom` |
| Multi-instance id collision handling  |        ✅         |     ✅     |        ✅         |
| `title` / `desc` accessibility props  |        ✅         |     ✅     |        ✅         |
| npm provenance (verified build)       |        ✅         |     —      |        —          |

Sizes measured by bundling `{ SvgIn }` (or each alternative's equivalent single import) from source with esbuild - minified, gzipped, `react`/`react-dom`/`react/jsx-runtime` externalized, the way a consuming app's own bundler would tree-shake it, not the whole un-tree-shaken entry file. See [`llms.txt`](llms.txt) for the raw numbers, and re-measure with `esbuild --bundle --minify` against each package's own single-component export to verify - these drift as each package's code changes. react-inlinesvg in particular ships with no sanitization option at all, opt-in or otherwise.

### What about SVGR (`@svgr/core`)?

[SVGR](https://www.npmjs.com/package/@svgr/core) isn't really a competitor to svgin-react - it solves a different problem, and the two are often used together rather than instead of each other:

|                          | **svgin-react**                          | SVGR (`@svgr/core`)                          |
| ------------------------ | :---------------------------------------: | :--------------------------------------------: |
| When it runs             | Runtime (in the browser / on request)     | Build time (webpack/rollup/Vite loader, CLI, or Node API) |
| What it takes             | A URL, or a raw SVG string you already have | An SVG **file in your repo**                    |
| Output                   | A rendered `<svg>` element                | Generated React component **source code**       |
| Fits SVGs whose content isn't known until runtime (CMS fields, user uploads, a URL from an API response) | ✅ | ❌ - the file has to exist in your project at build time |
| Sanitizes untrusted markup | ✅ (DOMPurify by default)                 | Not its job - it optimizes/transforms SVGs you already trust as part of your own codebase, it isn't built to run against untrusted input |
| Runtime bundle cost of the tool itself | ~2.7 KB (tree-shaken single import, see above) | None - it's a build-time devDependency, not shipped to the browser |

If your icons are static files that ship with your app (a logo, a fixed icon set), SVGR is the better fit - it does its work once at build time and adds nothing to your runtime bundle. Reach for svgin-react when the SVG's content isn't known until runtime: fetched from a URL, returned by an API, stored in a database, or otherwise not a file sitting in your repo when you build.

## Install

```sh
npm install svgin-react
```

The default sanitizer needs [DOMPurify](https://github.com/cure53/DOMPurify), and on the server it also needs [jsdom](https://github.com/jsdom/jsdom). Install whichever side you use:

```sh
# Client component
npm install dompurify

# Server component
npm install dompurify jsdom
```

If you always pass your own `sanitizeFn`, or always use `disableSanitization` (only for SVGs you trust completely), you don't need `dompurify` or `jsdom` at all — they're optional peer dependencies, loaded lazily only when the default sanitizer actually runs.

## Usage

```tsx
import { SvgIn } from 'svgin-react';

export default function AlertIcon() {
  return <SvgIn src="/icons/alert.svg" width={24} fill="#f00" />;
}
```

This one import works in both a client component and a server component. In a Next.js App Router file, add `'use client'` at the top if you specifically want the client version.

If you need to force one or the other:

```tsx
// Client component
import { SvgIn } from 'svgin-react/client';
```

```tsx
// Server component
import { SvgIn } from 'svgin-react/server';
```

### Framework support

Works with any React 19+ setup: Next.js (Pages Router and App Router), Remix, Vite + React, Create React App, Astro (React islands), and plain Node SSR.

### Preloading

`preloadSvg` fetches and sanitizes a URL ahead of time, so a later `<SvgIn src={url} />` for the same URL resolves from the cache instead of fetching again. It's `async`, so await it (or handle a rejected fetch) rather than treating it as fire-and-forget:

```ts
import { preloadSvg } from 'svgin-react/core';

await preloadSvg('/icons/alert.svg');
```

To avoid pulling in `jsdom` when calling `preloadSvg` from browser code, pass a `sanitizeFn` that uses browser DOMPurify directly:

```ts
import DOMPurify from 'dompurify';
import { preloadSvg } from 'svgin-react/core';

await preloadSvg('/icons/alert.svg', {
  sanitizeFn: async (svg) => DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } }),
});
```

## API

### `<SvgIn />` (client component)

| Prop | Type | Description |
| --- | --- | --- |
| `src` | `string` | URL of the SVG to fetch. Either `src` or `svg` is required. |
| `svg` | `string` | Raw SVG markup you already have (from a CMS field, API response, etc.) - sanitized and rendered directly, skipping the fetch step. Takes precedence over `src` if both are given. |
| `width`, `height` | `number \| string` | Applied to the rendered `<svg>` element (overrides any matching source attribute). |
| `fill` | `string` | Applied to the rendered `<svg>` element. |
| `fallback` | `ReactNode` | Rendered if the fetch or sanitization fails. |
| `loadingFallback` | `ReactNode` | Client component only. Rendered while the fetch/sanitize is pending, instead of the default `aria-hidden` placeholder `<svg>`. Pass `null` to render nothing while loading. |
| `className` | `string` | Applied to the rendered `<svg>` element. |
| `ariaLabel` | `string` | Sets `aria-label` on the rendered `<svg>` element. |
| `title` | `string` | Injects an accessible `<title>` (also shown as a tooltip in most browsers). |
| `description` | `string` | Injects an accessible `<desc>` — a longer description than `title`. |
| `sanitizeFn` | `(svg: string) => Promise<string>` | Replace the default sanitizer with your own. |
| `disableSanitization` | `boolean` | Skip sanitization entirely. Only use this for SVGs you trust. |
| `fetchOptions` | `RequestInit` | Passed as the second argument to `fetch` for `src` - use for an authenticated endpoint (an `Authorization` header, `credentials: 'include'`, etc). Ignored when `svg` is given. See the note below. |
| `onError` | `(error: Error) => void` | Called when the fetch or sanitization fails, alongside rendering `fallback` - for logging/telemetry. |
| `onMount` | `(svg: SVGSVGElement) => void` | Client component only. Called with the rendered `<svg>` DOM element right after it mounts or updates. No-op on the server component (there is no DOM to hand back). |
| `loading` | `'eager' \| 'lazy'` | Client component only. `'lazy'` defers the fetch until the placeholder scrolls near the viewport ([`IntersectionObserver`](#lazy-loading)). Default `'eager'`. |

Any other standard SVG/DOM prop (`style`, `onClick`, `role`, `tabIndex`, `stroke`, `strokeWidth`, `data-*`, native `aria-*`, etc.) is also accepted and forwarded to the rendered `<svg>` element, same as on a plain `<svg>` tag - `<SvgInProps>` extends `React.SVGProps<SVGSVGElement>` for everything not already listed above with its own meaning.

Need Suspense instead? See [`<SvgInSuspense />`](#svginsuspense-client-component) below - it's a separate component (imported from its own `svgin-react/suspense` entry point, not `svgin-react/client`) rather than a prop on `<SvgIn />`, specifically so it costs nothing to consumers who never import it.

Source SVG attributes (`viewBox`, `preserveAspectRatio`, `xmlns`, etc.) are automatically forwarded from the fetched SVG to the rendered element. Explicit props (`width`, `height`, `fill`, `className`, `ariaLabel`, and any other native SVG prop you pass) always take precedence.

Internal ids (on `<linearGradient>`, `<clipPath>`, `<mask>`, `<filter>`, etc.) are automatically made unique per rendered instance, so two `<SvgIn>` copies of the same icon on one page never collide over a shared gradient or clip path.

When `title` and/or `description` are set, the rendered `<svg>` also gets `aria-labelledby`/`aria-describedby` pointing at the injected `<title>`/`<desc>` ids - the more broadly-compatible way to wire an accessible name/description than relying on assistive tech to treat a bare `<title>`/`<desc>` as implicit labelling, which not every screen reader does consistently. An explicit `ariaLabel` always takes precedence over the auto-wired `aria-labelledby`.

> **`sanitizeFn` identity note:** switching from *no* custom sanitizer to *any* custom sanitizer (or back) triggers a re-fetch. Replacing one custom sanitizer with a *different* one while `sanitizeFn` is already defined does **not** trigger a re-fetch, because the component tracks presence rather than identity to avoid unnecessary re-fetches from inline arrow functions. If you need to force a re-fetch when the sanitizer logic changes, change the `src` prop or remount the component.

> **`fetchOptions` note:** a request using `fetchOptions` never reads from or writes to the shared cache keyed on `src` - different options can legitimately return different content for the same URL (a per-user personalized response, a request that would otherwise 401 without auth), so sharing that result across every caller of the URL would be unsafe. The same presence-not-identity tracking as `sanitizeFn` applies here too: switching between no `fetchOptions` and some triggers a re-fetch, but changing the *contents* of an already-present `fetchOptions` on a re-render does not - change `src` or remount to force a refresh with new header values. Pass `headers` as a plain object rather than a `Headers` instance so repeated identical calls are still deduplicated correctly.

### `SvgIn(props)` (server component)

Same props as above, except `onMount` and `loading` are no-ops (there is no DOM to hand back, and no loading state to defer). This one is an `async` function instead of a hook-based component, since server components render on the server before any client code runs. It's already Suspense-friendly on its own - see below.

### `<SvgInSuspense />` (client component)

```tsx
import { SvgInSuspense } from 'svgin-react/suspense';

<Suspense fallback={<IconSkeleton />}>
  <SvgInSuspense src="/icons/alert.svg" />
</Suspense>
```

Suspends via React 19's `use()` instead of managing its own loading/error state. Pending renders show the nearest `<Suspense fallback>`; a rejected fetch/sanitize is thrown to the nearest error boundary (`onError` still fires as a side notification if you pass it, but doesn't itself handle the error - pair this component with an error boundary). Takes the same `src`/`svg`/`sanitizeFn`/`disableSanitization`/`fetchOptions`/`title`/`description`/`onError`/`onMount` props as `<SvgIn />`; `fallback`, `loadingFallback`, and `loading` don't apply here (there's no internal loading state to customize - Suspense's render-as-you-fetch model always starts eagerly, and the pending UI is the `<Suspense fallback>` instead).

**A failed `src`/`svg` combination stays failed:** once a given `src` (or `svg`) + `sanitizeFn` + `disableSanitization` + `fetchOptions` combination rejects, `<SvgInSuspense />` keeps throwing that same rejection to the error boundary on every subsequent render with those exact props - it does not silently retry, even if the underlying resource becomes available later. This is deliberate: `use()` requires a stable promise per render, and a component that re-fetched on every render would suspend forever against a URL that fails consistently (this used to be a real bug - a persistently-failing fetch caused an unbounded retry loop, never reaching the error boundary). To retry, change one of those props - e.g. append a cache-busting query string to `src` - or point your "Retry" UI at that.

**Why a separate component (and its own entry point) instead of a `suspense` prop on `<SvgIn />`:** a boolean prop decided at render time can never be tree-shaken out of a bundler's output, even for an app that never sets it - the branch is still reachable code inside the one component everyone imports. A wholly separate export *can* be dropped by any bundler that tree-shakes ESM (which is most of them) if a given app never imports it. It's also kept out of `svgin-react/client` specifically (rather than re-exported there alongside `<SvgIn />`): this package's own build bundles a whole entry file into one physical output regardless of which of its exports you actually use, so re-exporting it from `client.ts` would cost every `svgin-react/client` consumer something whether or not they use Suspense mode - measured at roughly 9% of `client.js`'s own size. Importing it from `svgin-react/suspense` instead guarantees it costs you nothing unless you use it.

The server component needs no equivalent - it's already Suspense-friendly for free, since it's a plain `async` function component; wrapping its usage in `<Suspense fallback={...}>` just works.

### `<SvgInProvider>` (client component)

Sets shared defaults for every `<SvgIn />` beneath it, so you don't have to repeat the same props on every icon:

```tsx
import { SvgInProvider, SvgIn } from 'svgin-react/client';

<SvgInProvider className="icon" loadingFallback={<IconSkeleton />} onError={reportToTelemetry}>
  <SvgIn src="/icons/alert.svg" />
  <SvgIn src="/icons/check.svg" />
</SvgInProvider>
```

Accepts `sanitizeFn`, `disableSanitization`, `fetchOptions`, `fallback`, `loadingFallback`, `className`, `onError`, and `loading`. A prop passed directly to a given `<SvgIn />` always overrides the matching provider default; nested providers override outer ones. Client component only - Context providers require a client boundary in React Server Components, and the async server `<SvgIn />` cannot read context at all. Not read by `<SvgInSuspense />` either, for the same bundle-size reason `<SvgInSuspense />` lives in its own entry point (see above) - depending on the provider's Context module would pull it into every consumer's bundle whether or not they use `<SvgInProvider>`. Unlike `<SvgInSuspense />`, `<SvgInProvider>` stays in `svgin-react/client` rather than getting its own entry: it exists specifically to configure `<SvgIn />`'s defaults, so anyone using it already imports `<SvgIn />` too - splitting it out would add an import with no real bundle-size benefit.

### Lazy loading

```tsx
<SvgIn src="/icons/alert.svg" loading="lazy" />
```

Defers the fetch until the rendered placeholder scrolls near the viewport, via `IntersectionObserver` (similar to `<img loading="lazy">`) - useful for icon-heavy lists where most icons are never scrolled into view. Falls back to eager loading in environments without `IntersectionObserver`, and is ignored when `svg` is set (nothing to fetch). Client component only; not applicable to `<SvgInSuspense />` (see above).

### Fetch cancellation

The client `<SvgIn />` cancels its underlying `fetch` when it unmounts, or when the fetch key changes (`src`/`disableSanitization`, or `sanitizeFn`/`fetchOptions` toggling between absent and present) before the previous fetch resolves - so navigating away from an icon-heavy view, or swapping `src` quickly, doesn't leave abandoned requests running in the background. As with the `sanitizeFn` identity note above, replacing `sanitizeFn` or `fetchOptions` with a *different* value while one stays present the whole time does not by itself trigger a new fetch/cancellation - presence, not identity or content, is what's tracked.

Cancellation is reference-counted: if two mounted `<SvgIn />` instances are fetching the same `src` (with the same `sanitizeFn`/`disableSanitization`/`fetchOptions`) at once, unmounting one of them does not cancel the other's still-needed fetch - the request is only actually aborted once every instance that started it has unmounted or moved on. This is transparent; there is nothing to configure. `<SvgInSuspense />`, the server component, and `preloadSvg` don't participate (nothing to cancel from - `<SvgInSuspense />`'s pending promise is meant to be reused by a later render of the same key, an async server component runs to completion once invoked, and `preloadSvg` is deliberately fire-and-forget), but still share the same in-flight-request deduplication described above.

If you also pass your own `signal` inside `fetchOptions` (your own timeout logic, say), firing it has the same effect as that specific caller unmounting: it releases only that caller's share, so it can never abort a fetch another concurrent caller with an identical `src`/`sanitizeFn`/`disableSanitization`/`fetchOptions` still needs. The underlying request is only ever actually aborted once every such caller - including ones using their own `signal` - has released.

### `preloadSvg(url, options?)`

Fetches and caches an SVG ahead of time. Accepts the same `sanitizeFn`, `disableSanitization`, and `fetchOptions` options as `<SvgIn />`.

### `clearSvgCache(url?)` / `hasCachedSvg(url)`

`clearSvgCache` forgets a cached entry - the direct way to say "the resource at this URL changed, refetch it" without a cache-busting query string. Omit `url` to clear every entry. `hasCachedSvg` checks whether a URL is currently cached, without fetching it.

```ts
import { clearSvgCache, hasCachedSvg, preloadSvg } from 'svgin-react/core';

hasCachedSvg('/icons/alert.svg'); // false
await preloadSvg('/icons/alert.svg');
hasCachedSvg('/icons/alert.svg'); // true

// The underlying asset changed - the next <SvgIn src="/icons/alert.svg" />
// (or preloadSvg call) should fetch fresh instead of reusing the old one.
clearSvgCache('/icons/alert.svg');
```

Both only see the same shared cache `<SvgIn src={url} />` (with no `sanitizeFn`/`disableSanitization`/`fetchOptions`) and `preloadSvg` read from and write to - a call using any of those options was never stored there to begin with, so there is nothing for `clearSvgCache`/`hasCachedSvg` to see for it.

## Entry points

Import from a specific entry point to keep your bundle small:

- `svgin-react`: resolves to the server component in a React Server Components environment (via the `react-server` export condition), and to the client component everywhere else.
- `svgin-react/client`: `<SvgIn />` and `<SvgInProvider>`.
- `svgin-react/server`: the server component only.
- `svgin-react/core`: `preloadSvg`, `clearSvgCache`, `hasCachedSvg`, and shared types only, no React component.
- `svgin-react/suspense`: `<SvgInSuspense />` only. Kept out of `svgin-react/client` on purpose - see [`<SvgInSuspense />`](#svginsuspense-client-component) above for why.

## Security

- SVGs are sanitized with DOMPurify by default. On the server, DOMPurify runs inside a jsdom window.
- DOMPurify (and jsdom, on the server) are loaded lazily on first use, so you only pay for them if the default sanitizer actually runs.
- Fetch responses are checked against their `Content-Type` header, so an unexpected non-SVG response (e.g. an HTML error page from a misbehaving server) is rejected instead of being sanitized and rendered anyway.
- You can supply your own `sanitizeFn`, or set `disableSanitization`, if you trust the SVG source and want to skip the default sanitizer.
- Published bundles carry [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations, so you can verify a release was built from this exact repository by GitHub Actions, not published from someone's laptop.
- See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## Known limitations

**An inline `<style>` block inside a source SVG is not scoped to that SVG.** svgin-react renders the sanitized SVG as real DOM content (via `dangerouslySetInnerHTML`), not inside a shadow root or an `<iframe>`. If the SVG contains a `<style>` element, the rules it defines behave like any other `<style>` tag inserted into the page: they apply globally, not just to that one `<svg>`. Two consequences:

- A class or id selector in that `<style>` block (e.g. `.icon-fill { fill: red; }`) can match same-named elements anywhere else on the page, not only inside the SVG it came from.
- [`uniquifyIds`](src/utils/svgUtils.ts) (the automatic id-collision handling mentioned above) only rewrites `id="..."` attributes inside the SVG's *inner* markup (its child elements - it's never applied to the outer `<svg>` element itself, which React renders and only forwards source attributes onto) and references to those ids via `url(#id)`, `href="#id"`, or `xlink:href="#id"` - it does not rewrite CSS selectors inside a `<style>` block. For example, a `<style>#gradient-a { stop-color: red; }</style>` rule targeting an inner `<stop id="gradient-a">` by id: `uniquifyIds` suffixes the `id` attribute on that inner `<stop>` element (turning it into e.g. `gradient-a-svgin3`), but the `#gradient-a` selector inside `<style>` is left as-is, so it keeps targeting the *original*, now-nonexistent id - the rule silently stops matching anything. (The outer `<svg>` element's own `id`, if the source SVG had one, is never touched by `uniquifyIds` either way - see above - so a selector targeting that one specifically isn't affected by this.)

If a source SVG uses `<style>` with id/class selectors and you control that source, prefer moving those rules to `fill`/`stroke`/etc. presentation attributes instead (which `uniquifyIds` and normal React styling both handle correctly), or scope the selectors defensively (e.g. a class name unlikely to collide) if you can't avoid `<style>` entirely. There is no prop to auto-scope or strip `<style>` blocks - sanitization removes genuinely unsafe content (`<script>`, event handler attributes, etc.) but intentionally leaves well-formed `<style>` rules in place, since removing them outright would silently break SVGs that rely on them for legitimate styling.

## Examples

Custom sanitizer:

```tsx
<SvgIn src="/icons/alert.svg" sanitizeFn={async (svg) => svg} />
```

Disable sanitization (only for SVGs you trust):

```tsx
<SvgIn src="/icons/alert.svg" disableSanitization />
```

Fetching from an authenticated endpoint:

```tsx
<SvgIn src="/api/user-uploaded-icon" fetchOptions={{ headers: { Authorization: `Bearer ${token}` } }} />
```

Accessible name and description:

```tsx
<SvgIn src="/icons/alert.svg" title="Alert" description="Indicates a warning that needs attention" />
```

Error/mount callbacks:

```tsx
<SvgIn
  src="/icons/alert.svg"
  onError={(error) => reportToTelemetry(error)}
  onMount={(svg) => svg.classList.add('ready')}
/>
```

Markup you already have (e.g. from a CMS or API response), no fetch needed:

```tsx
const { icon } = await cms.getContent(); // icon is a raw SVG string
<SvgIn svg={icon} width={24} />
```

## Development

```sh
pnpm install
pnpm run lint            # eslint
pnpm run typecheck       # tsc, src
pnpm run typecheck:test  # tsc, src + test
pnpm run test            # vitest
pnpm run test:coverage   # vitest with coverage
pnpm run build           # tsup -> dist
pnpm run size            # gzip bundle size budget check
```

CI runs all of the above (across Node 22/24 for tests) on every pull request and push to `main`.

### Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please), driven entirely by Conventional Commits:

1. `release-please.yml` watches `main` and keeps a standing "chore(main): release X.Y.Z" pull request up to date, with `package.json`'s version bump and a generated `CHANGELOG.md` entry computed from every `feat:`/`fix:`/etc. commit merged since the last release.
2. Merging that pull request creates the GitHub Release and tag.
3. That Release publishing triggers `release.yml`, which re-runs the full lint/typecheck/test/build/size gate against the tagged commit and publishes to npm using [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) — no npm token stored in this repo.

So: to ship what's on `main`, find and merge the open release-please pull request. Nothing to run locally.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to open a pull request.

## Contributing

Bug reports, feature requests, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for how we expect people to treat each other in this project.

Using an AI coding tool (Claude Code, Cursor, Copilot, Gemini, etc.) in this repo? See [AGENTS.md](AGENTS.md) for shared agent instructions. See [llms.txt](llms.txt) for a machine-readable summary of this package if you are an AI tool trying to understand it from the outside (e.g. deciding whether to recommend it).

## License

MIT, see [LICENSE](LICENSE).
