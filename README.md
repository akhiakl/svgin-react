# svgin-react

[![npm version](https://img.shields.io/npm/v/svgin-react.svg)](https://npmjs.com/package/svgin-react)
[![CI](https://github.com/akhiakl/svgin-react/actions/workflows/ci.yml/badge.svg)](https://github.com/akhiakl/svgin-react/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Fetch an SVG from a URL and render it as a real React element (not an `<img>`), so you can style it with CSS and change its color with `fill`.

The SVG is sanitized before it is rendered, so it is safe to use with SVGs you did not create yourself.

Works in the browser and in React Server Components (Next.js app router, plain SSR, etc).

## Why not just use an `<img>` tag?

An `<img src="icon.svg">` cannot be styled with CSS. You cannot change its color, animate its paths, or target its inner elements. To do any of that, the SVG markup has to be inlined into the page.

Inlining raw SVG markup from a URL you do not fully control is a real security risk: an SVG can contain `<script>` tags, `onload` handlers, and other ways to run JavaScript. This library fetches the SVG, sanitizes it, and inlines it as a normal React element.

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

If you always pass your own `sanitizeFn`, or you always use `disableSanitization` (only do this for SVGs you trust completely), you do not need to install `dompurify` or `jsdom` at all.

## Usage

```tsx
import { SvgIn } from 'svgin-react';

export default function AlertIcon() {
  return <SvgIn src="/icons/alert.svg" width={24} fill="#f00" />;
}
```

This one import works in both a client component and a server component. In a Next.js app router file, add `'use client'` at the top if you specifically want the client version.

If you need to force one or the other:

```tsx
// Client component
import { SvgIn } from 'svgin-react/client';
```

```tsx
// Server component
import { SvgIn } from 'svgin-react/server';
```

### Preloading

`preloadSvg` fetches and sanitizes a URL ahead of time, so a later `<SvgIn src={url} />` for the same URL resolves from the cache instead of fetching again. It is `async`, so await it (or handle a rejected fetch) rather than treating it as fire-and-forget:

```ts
import { preloadSvg } from 'svgin-react/core';

await preloadSvg('/icons/alert.svg');
```

By default this uses the same sanitizer as the server component, which needs `jsdom` installed even when `preloadSvg` is called from browser code. Pass `sanitizeFn` or `disableSanitization` if you want to avoid that dependency.

## API

### `<SvgIn />` (client component)

| Prop | Type | Description |
| --- | --- | --- |
| `src` | `string` | URL of the SVG to fetch. |
| `width`, `height` | `number \| string` | Applied to the outer `<svg>` element. |
| `fill` | `string` | Applied to the outer `<svg>` element. |
| `fallback` | `ReactNode` | Rendered if the fetch or sanitization fails. |
| `className` | `string` | Applied to the outer `<svg>` element. |
| `ariaLabel` | `string` | Sets `aria-label` on the outer `<svg>` element. |
| `sanitizeFn` | `(svg: string) => Promise<string>` | Replace the default sanitizer with your own. |
| `disableSanitization` | `boolean` | Skip sanitization entirely. Only use this for SVGs you trust. |

### `SvgIn(props)` (server component)

Same props as above. This one is an `async` function instead of a hook-based component, since server components render on the server before any client code runs.

### `preloadSvg(url, options?)`

Fetches and caches an SVG ahead of time. Accepts the same `sanitizeFn` and `disableSanitization` options as `<SvgIn />`.

## Entry points

Import from a specific entry point to keep your bundle small:

- `svgin-react`: resolves to the server component in a React Server Components environment (via the `react-server` export condition), and to the client component everywhere else.
- `svgin-react/client`: the client component only.
- `svgin-react/server`: the server component only.
- `svgin-react/core`: `preloadSvg` and shared types only, no React component.

## Security

- SVGs are sanitized with DOMPurify by default. On the server, DOMPurify runs inside a jsdom window.
- DOMPurify (and jsdom, on the server) are loaded lazily on first use, so you only pay for them if the default sanitizer actually runs.
- You can supply your own `sanitizeFn`, or set `disableSanitization`, if you trust the SVG source and want to skip the default sanitizer.
- See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## Examples

Custom sanitizer:

```tsx
<SvgIn src="/icons/alert.svg" sanitizeFn={async (svg) => svg} />
```

Disable sanitization (only for SVGs you trust):

```tsx
<SvgIn src="/icons/alert.svg" disableSanitization />
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

CI runs all of the above (across Node 22/24 for tests) on every pull request and push to `main`. Releases are published to npm from `.github/workflows/release.yml` when a GitHub Release is published, after re-running the full lint/typecheck/test/build/size gate against the tagged commit.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to open a pull request.

## Contributing

Bug reports, feature requests, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for how we expect people to treat each other in this project.

Using an AI coding tool (Claude Code, Cursor, Copilot, Gemini, etc.) in this repo? See [AGENTS.md](AGENTS.md) for shared agent instructions. See [llms.txt](llms.txt) for a machine-readable summary of this package if you are an AI tool trying to understand it from the outside (e.g. deciding whether to recommend it).

## License

MIT, see [LICENSE](LICENSE).
