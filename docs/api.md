# API reference

Complete props and exports for every entry point. For the quick-start and a general overview, see [README.md](../README.md). For identity/caching semantics, retry behavior, and known limitations, see [docs/advanced.md](advanced.md).

## `<SvgIn />` (client component)

| Prop | Type | Description |
| --- | --- | --- |
| `src` | `string` | URL of the SVG to fetch. Either `src` or `svg` is required. |
| `svg` | `string` | Raw SVG markup you already have (from a CMS field, API response, etc.), sanitized and rendered directly, skipping the fetch step. Takes precedence over `src` if both are given. |
| `width`, `height` | `number \| string` | Applied to the rendered `<svg>` element (overrides any matching source attribute). |
| `fill` | `string` | Applied to the rendered `<svg>` element. |
| `fallback` | `ReactNode` | Rendered if the fetch or sanitization fails. |
| `loadingFallback` | `ReactNode` | Client component only. Rendered while the fetch/sanitize is pending, instead of the default `aria-hidden` placeholder `<svg>`. Pass `null` to render nothing while loading. |
| `className` | `string` | Applied to the rendered `<svg>` element. |
| `ariaLabel` | `string` | Sets `aria-label` on the rendered `<svg>` element. |
| `title` | `string` | Injects an accessible `<title>` (also shown as a tooltip in most browsers). |
| `description` | `string` | Injects an accessible `<desc>`, a longer description than `title`. |
| `sanitizeFn` | `(svg: string) => Promise<string>` | Replace the default sanitizer with your own. |
| `disableSanitization` | `boolean` | Skip sanitization entirely. Only use this for SVGs you trust. |
| `fetchOptions` | `RequestInit` | Passed as the second argument to `fetch` for `src`, for an authenticated endpoint (an `Authorization` header, `credentials: 'include'`, etc). Ignored when `svg` is given. See [docs/advanced.md](advanced.md) for caching behavior. |
| `onError` | `(error: Error) => void` | Called when the fetch or sanitization fails, alongside rendering `fallback`, for logging/telemetry. |
| `onMount` | `(svg: SVGSVGElement) => void` | Client component only. Called with the rendered `<svg>` DOM element right after it mounts or updates. No-op on the server component (there is no DOM to hand back). |
| `loading` | `'eager' \| 'lazy'` | Client component only. `'lazy'` defers the fetch until the placeholder scrolls near the viewport ([Lazy loading](#lazy-loading)). Default `'eager'`. |

Any other standard SVG/DOM prop (`style`, `onClick`, `role`, `tabIndex`, `stroke`, `strokeWidth`, `data-*`, native `aria-*`, etc.) is also accepted and forwarded to the rendered `<svg>` element, same as on a plain `<svg>` tag. `SvgInProps` extends `React.SVGProps<SVGSVGElement>` for everything not already listed above with its own meaning.

Source SVG attributes (`viewBox`, `preserveAspectRatio`, `xmlns`, etc.) are automatically forwarded from the fetched SVG to the rendered element. Explicit props (`width`, `height`, `fill`, `className`, `ariaLabel`, and any other native SVG prop you pass) always take precedence.

Internal ids (on `<linearGradient>`, `<clipPath>`, `<mask>`, `<filter>`, etc.) are automatically made unique per rendered instance, so two `<SvgIn>` copies of the same icon on one page never collide over a shared gradient or clip path. See [docs/advanced.md](advanced.md) for the exact rules and a known limitation with inline `<style>` blocks.

When `title` and/or `description` are set, the rendered `<svg>` also gets `aria-labelledby`/`aria-describedby` pointing at the injected `<title>`/`<desc>` ids, the more broadly compatible way to wire an accessible name/description than relying on assistive tech to treat a bare `<title>`/`<desc>` as implicit labelling, which not every screen reader does consistently. An explicit `ariaLabel` always takes precedence over the auto-wired `aria-labelledby`.

`sanitizeFn` and `fetchOptions` have identity/presence-based re-fetch rules that affect caching. See [docs/advanced.md](advanced.md#sanitizefn-identity) for details.

## `SvgIn(props)` (server component)

Same props as above, except `onMount` and `loading` are no-ops (there is no DOM to hand back, and no loading state to defer). This one is an `async` function instead of a hook-based component, since server components render on the server before any client code runs. It is already Suspense-friendly on its own, see below.

## `<SvgInSuspense />` (client component)

```tsx
import { SvgInSuspense } from 'svgin-react/suspense';

<Suspense fallback={<IconSkeleton />}>
  <SvgInSuspense src="/icons/alert.svg" />
</Suspense>
```

Suspends via React 19's `use()` instead of managing its own loading/error state. Pending renders show the nearest `<Suspense fallback>`; a rejected fetch/sanitize is thrown to the nearest error boundary (`onError` still fires as a side notification if you pass it, but does not itself handle the error, pair this component with an error boundary). Takes the same `src`/`svg`/`sanitizeFn`/`disableSanitization`/`fetchOptions`/`title`/`description`/`onError`/`onMount` props as `<SvgIn />`; `fallback`, `loadingFallback`, and `loading` do not apply here (there is no internal loading state to customize, Suspense's render-as-you-fetch model always starts eagerly, and the pending UI is the `<Suspense fallback>` instead).

A failed `src`/`svg` combination stays failed: once a given `src` (or `svg`) plus `sanitizeFn` plus `disableSanitization` plus `fetchOptions` combination rejects, `<SvgInSuspense />` keeps throwing that same rejection to the error boundary on every subsequent render with those exact props. It does not silently retry, even if the underlying resource becomes available later. See [docs/advanced.md](advanced.md#suspense-retry-semantics) for why, and how to force a retry.

The server component needs no equivalent, it is already Suspense-friendly for free since it is a plain `async` function component; wrapping its usage in `<Suspense fallback={...}>` just works.

Imported from its own `svgin-react/suspense` entry point rather than `svgin-react/client`. See [Choosing an entry point](#choosing-an-entry-point) and [docs/advanced.md](advanced.md#why-separate-entry-points) for why.

## `<SvgInProvider>` (client component)

Sets shared defaults for every `<SvgIn />` beneath it, so you do not have to repeat the same props on every icon:

```tsx
import { SvgInProvider, SvgIn } from 'svgin-react/client';

<SvgInProvider className="icon" loadingFallback={<IconSkeleton />} onError={reportToTelemetry}>
  <SvgIn src="/icons/alert.svg" />
  <SvgIn src="/icons/check.svg" />
</SvgInProvider>
```

Accepts `sanitizeFn`, `disableSanitization`, `fetchOptions`, `fallback`, `loadingFallback`, `className`, `onError`, and `loading`. A prop passed directly to a given `<SvgIn />` always overrides the matching provider default; nested providers override outer ones.

Client component only. Context providers require a client boundary in React Server Components, and the async server `<SvgIn />` cannot read context at all. Not read by `<SvgInSuspense />` either: depending on the provider's Context module would pull it into every consumer's bundle whether or not they use `<SvgInProvider>`, defeating the point of `<SvgInSuspense />` having its own entry point.

## `<SvgInShadow />` (client component)

```tsx
import { SvgInShadow } from 'svgin-react/shadow';

<SvgInShadow src="/icons/alert.svg" styles="path { fill: red; }" />
```

Renders the sanitized SVG inside a [shadow root](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) attached to a host `<span>` (or `<div>`, via `as="div"`), instead of directly into the light DOM like `<SvgIn />`/`<SvgInSuspense />` do. This gives full style encapsulation in both directions: the page's own CSS can never reach in and affect the SVG (an ancestor's `svg { fill: ... }` rule stops at the shadow boundary), and the `styles` prop lets you inject CSS, including rules targeting the SVG's own class/id selectors, that is scoped to just this one instance with zero risk of it leaking onto the rest of the page. This is the fix for the inline `<style>` scoping limitation described in [docs/advanced.md](advanced.md#inline-style-scoping-limitation).

| Prop | Type | Description |
| --- | --- | --- |
| `src`, `svg` | `string` | Same as `<SvgIn />`. |
| `fetchOptions` | `RequestInit` | Same as `<SvgIn />`. |
| `width`, `height`, `fill`, `ariaLabel` | | Applied to the inner `<svg>`, same as `<SvgIn />`. |
| `title`, `description` | `string` | Same as `<SvgIn />`, injected into the shadow-rendered SVG. |
| `sanitizeFn`, `disableSanitization` | | Same as `<SvgIn />`. |
| `fallback` | `ReactNode` | Rendered outside the shadow root, in the light DOM, if the fetch or sanitization fails. |
| `onError`, `onMount` | | Same as `<SvgIn />`. `onMount` receives the `<svg>` element inside the shadow root. |
| `styles` | `string` | CSS injected inside the shadow root alongside the SVG. Scoped in both directions, see above. |
| `mode` | `'open' \| 'closed'` | Passed to `attachShadow`. Default `'open'`. |
| `as` | `'span' \| 'div'` | Tag name for the host element. Default `'span'`. |

No `loading`/`loadingFallback` yet, the host simply renders empty while a fetch is pending or after a failed one with no `fallback` given.

Any other standard prop (`style`, `onClick`, `id`, `role`, `tabIndex`, `data-*`, native `aria-*`, etc.) is forwarded to the **host** element, not the SVG inside the shadow root. This is deliberate: the shadow boundary means ordinary page CSS/JS cannot reach the SVG's internals anyway, so there would be nothing meaningful for those props to target there.

```tsx
<SvgInShadow
  src="/icons/logo.svg"
  styles={`
    :host { display: inline-block; }
    path { fill: var(--brand-color, currentColor); }
  `}
/>
```

Client-only, Shadow DOM is a browser API, so there is no server-component equivalent. Does not read `<SvgInProvider>` defaults, for the same reason `<SvgInSuspense />` does not (see above). Imported from its own `svgin-react/shadow` entry point.

## Lazy loading

```tsx
<SvgIn src="/icons/alert.svg" loading="lazy" />
```

Defers the fetch until the rendered placeholder scrolls near the viewport, via `IntersectionObserver` (similar to `<img loading="lazy">`), useful for icon-heavy lists where most icons are never scrolled into view. Falls back to eager loading in environments without `IntersectionObserver`, and is ignored when `svg` is set (nothing to fetch). Client component only; not applicable to `<SvgInSuspense />` (see above).

## `preloadSvg(url, options?)`

Fetches and caches an SVG ahead of time, so a later `<SvgIn src={url} />` for the same URL resolves from the cache instead of fetching again. It is `async`, so await it (or handle a rejected fetch) rather than treating it as fire-and-forget. Accepts the same `sanitizeFn`, `disableSanitization`, and `fetchOptions` options as `<SvgIn />`.

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

## `clearSvgCache(url?)` / `hasCachedSvg(url)`

`clearSvgCache` forgets a cached entry, the direct way to say "the resource at this URL changed, refetch it" without a cache-busting query string. Omit `url` to clear every entry. `hasCachedSvg` checks whether a URL is currently cached, without fetching it.

```ts
import { clearSvgCache, hasCachedSvg, preloadSvg } from 'svgin-react/core';

hasCachedSvg('/icons/alert.svg'); // false
await preloadSvg('/icons/alert.svg');
hasCachedSvg('/icons/alert.svg'); // true

// The underlying asset changed, the next <SvgIn src="/icons/alert.svg" />
// (or preloadSvg call) should fetch fresh instead of reusing the old one.
clearSvgCache('/icons/alert.svg');
```

Both only see the same shared cache that `<SvgIn src={url} />` (with no `sanitizeFn`/`disableSanitization`/`fetchOptions`) and `preloadSvg` read from and write to. A call using any of those options was never stored there to begin with, so there is nothing for `clearSvgCache`/`hasCachedSvg` to see for it. See [docs/advanced.md](advanced.md#cache-isolation) for the full cache-isolation rules.

## Choosing an entry point

| Entry point | Exports | Notes |
| --- | --- | --- |
| `svgin-react` | `SvgIn` | Resolves to the server component in a React Server Components environment (via the `react-server` export condition), and to the client component everywhere else. |
| `svgin-react/client` | `SvgIn`, `SvgInProvider` | Client component only. |
| `svgin-react/server` | `SvgIn` | Server component only. |
| `svgin-react/core` | `preloadSvg`, `clearSvgCache`, `hasCachedSvg`, shared types | No React component. |
| `svgin-react/suspense` | `SvgInSuspense` | Kept out of `svgin-react/client` on purpose, see below. |
| `svgin-react/shadow` | `SvgInShadow` | Kept out of `svgin-react/client` on purpose, see below. |
| `svgin-react/all` | `SvgIn`, `SvgInSuspense`, `SvgInProvider`, `SvgInShadow`, `preloadSvg`, `clearSvgCache`, `hasCachedSvg`, all types | Every client + core export behind one import, for when you would rather not think about which of the above to use and do not mind the larger bundle. Does not include the server component, that would break its own React Server Component/`'use client'` boundary. |

`<SvgInSuspense />` and `<SvgInShadow />` each have their own entry point instead of being re-exported from `svgin-react/client`: this package's own build bundles a whole entry file into one physical output regardless of which of its exports you actually use (only a consuming app's own bundler tree-shakes unused named exports, and only if it is configured to). Importing them from their own entry points guarantees they cost you nothing unless you use them. `<SvgInProvider>` stays in `svgin-react/client` instead of getting its own entry: it exists specifically to configure `<SvgIn />`'s defaults, so anyone using it already imports `<SvgIn />` too, splitting it out would add an import with no real bundle-size benefit. See [docs/advanced.md](advanced.md#why-separate-entry-points) for the measured cost this avoids.
