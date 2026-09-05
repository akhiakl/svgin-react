# svgin-react

[![npm version](https://img.shields.io/npm/v/svgin-react.svg)](https://npmjs.com/package/svgin-react)
[![npm downloads](https://img.shields.io/npm/dm/svgin-react.svg)](https://npmjs.com/package/svgin-react)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/svgin-react)](https://bundlephobia.com/package/svgin-react)
[![CI](https://github.com/akhiakl/svgin-react/actions/workflows/ci.yml/badge.svg)](https://github.com/akhiakl/svgin-react/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

svgin-react fetches an SVG from a URL, or takes raw SVG markup you already have, and renders it as a real, styleable React `<svg>` element instead of an `<img>`. Sanitized by default with [DOMPurify](https://github.com/cure53/DOMPurify), so it is safe with SVGs you did not create yourself. Works in the browser and in React Server Components.

```tsx
import { SvgIn } from 'svgin-react';

<SvgIn src="/icons/alert.svg" width={24} fill="#f00" />
```

**[Try it live](https://svgin-react-tryit.vercel.app)**: paste your own SVG markup and see exactly what the sanitizer strips, or click through the RSC, Suspense, Shadow DOM, provider-defaults, and lazy-loading demos.

## Why svgin-react

An `<img src="icon.svg">` cannot be styled with CSS: no color changes, no path animation, no targeting inner elements. Inlining the SVG markup fixes that, but inlining raw markup from a URL you do not fully control is a real security risk (an SVG can carry `<script>` tags, `onload` handlers, and other ways to run JavaScript). svgin-react fetches the SVG, sanitizes it, and inlines it as a normal React element.

For a static icon set that ships with your app, [SVGR](https://www.npmjs.com/package/@svgr/core) is the better fit; it works at build time with zero runtime cost. Reach for svgin-react when the SVG's content is not known until runtime: fetched from a URL, returned by an API, or stored in a database.

## Install

```sh
npm install svgin-react
```

The default sanitizer needs [DOMPurify](https://github.com/cure53/DOMPurify), and on the server it also needs [jsdom](https://github.com/jsdom/jsdom):

```sh
npm install dompurify        # client component
npm install dompurify jsdom  # server component
```

If you always pass your own `sanitizeFn`, or always use `disableSanitization`, you do not need either. They are optional peer dependencies, loaded lazily only when the default sanitizer actually runs.

## Quick start

```tsx
import { SvgIn } from 'svgin-react';

export default function AlertIcon() {
  return <SvgIn src="/icons/alert.svg" width={24} fill="#f00" />;
}
```

This one import works in both a client component and a server component. In a Next.js App Router file, add `'use client'` at the top if you specifically want the client version.

To force one or the other:

```tsx
import { SvgIn } from 'svgin-react/client'; // client component
import { SvgIn } from 'svgin-react/server'; // server component
```

Works with any React 19+ setup: Next.js (Pages Router and App Router), Remix, Vite + React, Create React App, Astro (React islands), and plain Node SSR.

<details>
<summary><strong>More examples</strong>: raw markup, authenticated fetch, accessibility, custom sanitizer, callbacks, lazy loading</summary>

Raw markup you already have (from a CMS or API response), no fetch needed:

```tsx
const { icon } = await cms.getContent(); // icon is a raw SVG string
<SvgIn svg={icon} width={24} />
```

Fetching from an authenticated endpoint:

```tsx
<SvgIn src="/api/user-uploaded-icon" fetchOptions={{ headers: { Authorization: `Bearer ${token}` } }} />
```

Accessible name and description:

```tsx
<SvgIn src="/icons/alert.svg" title="Alert" description="Indicates a warning that needs attention" />
```

Custom sanitizer, or skip sanitization for SVGs you trust completely:

```tsx
<SvgIn src="/icons/alert.svg" sanitizeFn={async (svg) => svg} />
<SvgIn src="/icons/alert.svg" disableSanitization />
```

Error and mount callbacks:

```tsx
<SvgIn
  src="/icons/alert.svg"
  onError={(error) => reportToTelemetry(error)}
  onMount={(svg) => svg.classList.add('ready')}
/>
```

Deferring the fetch until the icon scrolls near the viewport, for icon-heavy lists:

```tsx
<SvgIn src="/icons/alert.svg" loading="lazy" />
```

Sharing defaults (`className`, `fallback`, `onError`, etc.) across many icons with `<SvgInProvider>`, and every other prop, are covered in [docs/api.md](docs/api.md).

</details>

<details>
<summary><strong>Suspense</strong>: <code>&lt;SvgInSuspense /&gt;</code> suspends via React 19's <code>use()</code> instead of managing its own loading/error state</summary>

```tsx
import { SvgInSuspense } from 'svgin-react/suspense';

<Suspense fallback={<IconSkeleton />}>
  <SvgInSuspense src="/icons/alert.svg" />
</Suspense>
```

Pair it with a `<Suspense>` boundary and an error boundary instead of `fallback`/`loadingFallback`. It does not automatically retry a failed `src`, see [docs/advanced.md](docs/advanced.md#suspense-retry-semantics) for why and how to force one. Full props in [docs/api.md](docs/api.md#svginsuspense--client-component).

</details>

<details>
<summary><strong>Shadow DOM</strong>: <code>&lt;SvgInShadow /&gt;</code> encapsulates the SVG's style in a shadow root, in both directions</summary>

```tsx
import { SvgInShadow } from 'svgin-react/shadow';

<SvgInShadow src="/icons/alert.svg" styles="path { fill: red; }" />
```

Page CSS cannot reach in to affect the SVG, and the `styles` prop's CSS can never leak out onto the page. Use it when a source SVG's inline `<style>` block needs to stay scoped to that one instance, see [docs/advanced.md](docs/advanced.md#inline-style-scoping-limitation) for the limitation this solves. Full props in [docs/api.md](docs/api.md#svginshadow--client-component).

</details>

<details>
<summary><strong>Preloading and cache utilities</strong>: warm the cache ahead of render, invalidate it on demand</summary>

```ts
import { clearSvgCache, hasCachedSvg, preloadSvg } from 'svgin-react/core';

await preloadSvg('/icons/alert.svg'); // fetches and caches ahead of render
hasCachedSvg('/icons/alert.svg');     // true, no fetch
clearSvgCache('/icons/alert.svg');    // forget one entry (or clearSvgCache() for all)
```

A later `<SvgIn src={url} />` for the same URL resolves from the cache instead of fetching again. See [docs/api.md](docs/api.md#clearsvgcacheurl--hascachedsvgurl) for both, and [docs/advanced.md](docs/advanced.md#cache-isolation) for exactly which calls share the cache.

</details>

## Choosing an entry point

| Entry point | Use for |
| --- | --- |
| `svgin-react` | Auto-resolves to the server or client component depending on where it is imported. |
| `svgin-react/client` | `<SvgIn />` and `<SvgInProvider>`, forced client. |
| `svgin-react/server` | `<SvgIn />`, forced server. |
| `svgin-react/core` | `preloadSvg`, `clearSvgCache`, `hasCachedSvg`, no React component. |
| `svgin-react/suspense` | `<SvgInSuspense />`. |
| `svgin-react/shadow` | `<SvgInShadow />`. |
| `svgin-react/all` | Every client + core export behind one import. |

`<SvgInSuspense />` and `<SvgInShadow />` each have their own entry point so they cost nothing to consumers who do not use them. Full reasoning in [docs/api.md](docs/api.md#choosing-an-entry-point).

## Security

SVGs are sanitized with DOMPurify by default. Use your own `sanitizeFn`, or set `disableSanitization`, only for SVGs you fully trust. Published bundles carry [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations. See [SECURITY.md](SECURITY.md) to report a vulnerability, and [docs/advanced.md](docs/advanced.md#security-details) for the full threat model.

## Documentation

- [docs/api.md](docs/api.md): complete props and exports for every component and entry point.
- [docs/advanced.md](docs/advanced.md): identity/caching semantics, reference-counted cancellation, Suspense retry behavior, the inline `<style>` scoping limitation, and a detailed comparison against `react-svg`, `react-inlinesvg`, and SVGR.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for the local setup, required checks, and pull request conventions, and [docs/maintainers.md](docs/maintainers.md) for the release process.

## Contributing

Bug reports, feature requests, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for how we expect people to treat each other in this project.

Using an AI coding tool (Claude Code, Cursor, Copilot, Gemini, etc.) in this repo? See [AGENTS.md](AGENTS.md) for shared agent instructions. See [llms.txt](llms.txt) for a machine-readable summary of this package.

## License

MIT, see [LICENSE](LICENSE).
