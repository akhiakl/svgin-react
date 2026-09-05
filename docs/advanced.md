# Advanced usage and behavior

Identity/caching semantics, retry behavior, known limitations, and package comparisons. For props and exports, see [docs/api.md](api.md). For a quick overview, see [README.md](../README.md).

## `sanitizeFn` identity

Switching from *no* custom sanitizer to *any* custom sanitizer (or back) triggers a re-fetch. Replacing one custom sanitizer with a *different* one while `sanitizeFn` is already defined does **not** trigger a re-fetch, because the component tracks presence rather than identity to avoid unnecessary re-fetches from inline arrow functions. If you need to force a re-fetch when the sanitizer logic changes, change the `src` prop or remount the component.

## `fetchOptions` identity and caching

A request using `fetchOptions` never reads from or writes to the shared cache keyed on `src`. Different options can legitimately return different content for the same URL (a per-user personalized response, a request that would otherwise 401 without auth), so sharing that result across every caller of the URL would be unsafe.

The same presence-not-identity tracking as `sanitizeFn` applies here too: switching between no `fetchOptions` and some triggers a re-fetch, but changing the *contents* of an already-present `fetchOptions` on a re-render does not. Change `src` or remount to force a refresh with new header values. Pass `headers` as a plain object rather than a `Headers` instance so repeated identical calls are still deduplicated correctly.

## Cache isolation

Only default-sanitized results, fetched with no `fetchOptions`, are shared in the module-level cache. Raw (`disableSanitization`), custom-sanitizer, and `fetchOptions` results are never written to or read from the shared cache, preventing a raw or per-caller result from leaking as the shared result for another caller of the same URL. `clearSvgCache`/`hasCachedSvg` see the same, restricted scope: a call using `sanitizeFn`, `disableSanitization`, or `fetchOptions` was never stored in the shared cache to begin with.

The in-memory cache for pending/resolved fetches automatically evicts rejected promises, so a transient error is retried on the next render rather than cached as a permanent failure.

The fetch also rejects early on an unexpected `Content-Type` response (for example, an HTML error page returned for a typo'd URL), to avoid wasting sanitizer CPU on non-SVG content.

## Reference-counted cancellation

The client `<SvgIn />` cancels its underlying `fetch` when it unmounts, or when the fetch key changes (`src`/`disableSanitization`, or `sanitizeFn`/`fetchOptions` toggling between absent and present) before the previous fetch resolves, so navigating away from an icon-heavy view, or swapping `src` quickly, does not leave abandoned requests running in the background. As with the `sanitizeFn` identity note above, replacing `sanitizeFn` or `fetchOptions` with a *different* value while one stays present the whole time does not by itself trigger a new fetch/cancellation, presence, not identity or content, is what is tracked.

Cancellation is reference-counted: if two mounted `<SvgIn />` instances are fetching the same `src` (with the same `sanitizeFn`/`disableSanitization`/`fetchOptions`) at once, unmounting one of them does not cancel the other's still-needed fetch. The underlying request is only actually aborted once every instance that started it has unmounted or moved on. This is transparent; there is nothing to configure.

`<SvgInSuspense />`, the server component, and `preloadSvg` do not participate in cancellation (nothing to cancel from: `<SvgInSuspense />`'s pending promise is meant to be reused by a later render of the same key, an async server component runs to completion once invoked, and `preloadSvg` is deliberately fire-and-forget), but still share the same in-flight-request deduplication described above.

If you also pass your own `signal` inside `fetchOptions` (your own timeout logic, say), firing it has the same effect as that specific caller unmounting: it releases only that caller's share, so it can never abort a fetch another concurrent caller with an identical `src`/`sanitizeFn`/`disableSanitization`/`fetchOptions` still needs. The underlying request is only ever actually aborted once every such caller, including ones using their own `signal`, has released.

## Suspense retry semantics

Once a given `src` (or `svg`) plus `sanitizeFn` plus `disableSanitization` plus `fetchOptions` combination rejects, `<SvgInSuspense />` keeps throwing that same rejection to the error boundary on every subsequent render with those exact props. It does not silently retry, even if the underlying resource becomes available later.

This is deliberate: `use()` requires a stable promise per render, and a component that re-fetched on every render would suspend forever against a URL that fails consistently. This used to be a real bug: a persistently failing fetch caused an unbounded retry loop, never reaching the error boundary. To retry, change one of those props, for example append a cache-busting query string to `src`, or point your "Retry" UI at that.

## Why separate entry points

A boolean prop decided at render time can never be tree-shaken out of a bundler's output, even for an app that never sets it, the branch is still reachable code inside the one component everyone imports. A wholly separate export *can* be dropped by any bundler that tree-shakes ESM (which is most of them) if a given app never imports it.

`<SvgInSuspense />` and `<SvgInShadow />` are also kept out of `svgin-react/client` specifically, rather than re-exported there alongside `<SvgIn />`: this package's own build bundles a whole entry file into one physical output regardless of which of its exports you actually use, so re-exporting either from `client.ts` would cost every `svgin-react/client` consumer something whether or not they use that feature. For `<SvgInSuspense />`, that cost was measured at roughly 9% of `client.js`'s own size. For `<SvgInShadow />`, roughly 0.6 KB gzip. Importing them from their own entry points instead guarantees they cost you nothing unless you use them.

`<SvgInProvider>` is the exception: it stays in `svgin-react/client` rather than getting its own entry, because it exists specifically to configure `<SvgIn />`'s defaults, so anyone using it already imports `<SvgIn />` too. Splitting it out would add an import with no real bundle-size benefit.

## `uniquifyIds` and inline `<style>` scoping

Internal ids (on `<linearGradient>`, `<clipPath>`, `<mask>`, `<filter>`, etc.) are automatically made unique per rendered instance via `uniquifyIds`, so two `<SvgIn>` copies of the same icon on one page never collide over a shared gradient or clip path. `uniquifyIds` rewrites `id="..."` attributes inside the SVG's inner markup (its child elements, it is never applied to the outer `<svg>` element itself, which React renders and only forwards source attributes onto) and references to those ids via `url(#id)`, `href="#id"`, or `xlink:href="#id"`.

### Inline `<style>` scoping limitation

An inline `<style>` block inside a source SVG is not scoped to that SVG. svgin-react renders the sanitized SVG as real DOM content (via `dangerouslySetInnerHTML`), not inside a shadow root or an `<iframe>`. If the SVG contains a `<style>` element, the rules it defines behave like any other `<style>` tag inserted into the page: they apply globally, not just to that one `<svg>`. Two consequences:

- A class or id selector in that `<style>` block (for example `.icon-fill { fill: red; }`) can match same-named elements anywhere else on the page, not only inside the SVG it came from.
- `uniquifyIds` does not rewrite CSS selectors inside a `<style>` block, only `id` attributes and the reference forms listed above. For example, a `<style>#gradient-a { stop-color: red; }</style>` rule targeting an inner `<stop id="gradient-a">` by id: `uniquifyIds` suffixes the `id` attribute on that inner `<stop>` element (turning it into, for example, `gradient-a-svgin3`), but the `#gradient-a` selector inside `<style>` is left as-is, so it keeps targeting the original, now-nonexistent id, and the rule silently stops matching anything. The outer `<svg>` element's own `id`, if the source SVG had one, is never touched by `uniquifyIds` either way, so a selector targeting that one specifically is not affected by this.

If a source SVG uses `<style>` with id/class selectors and you control that source, prefer moving those rules to `fill`/`stroke`/etc. presentation attributes instead (which `uniquifyIds` and normal React styling both handle correctly), or scope the selectors defensively (a class name unlikely to collide) if you cannot avoid `<style>` entirely. There is no prop on `<SvgIn />`/`<SvgInSuspense />` to auto-scope or strip `<style>` blocks. Sanitization removes genuinely unsafe content (`<script>`, event handler attributes, etc.) but intentionally leaves well-formed `<style>` rules in place, since removing them outright would silently break SVGs that rely on them for legitimate styling.

If this limitation actually matters for your SVGs, reach for [`<SvgInShadow />`](api.md#svginshadow--client-component) instead: it renders inside a shadow root, so a `<style>` block (the SVG's own, or one you pass via its `styles` prop) is fully scoped to that one instance in both directions, no selector-rewriting trick needed.

## Security details

- SVGs are sanitized with DOMPurify using the `svg` + `svgFilters` profile by default.
- On the server, DOMPurify runs inside a jsdom window.
- DOMPurify (and jsdom, on the server) are loaded lazily on first use, so you only pay for them if the default sanitizer actually runs.
- Fetch responses are checked against their `Content-Type` header, so an unexpected non-SVG response (for example an HTML error page from a misbehaving server) is rejected instead of being sanitized and rendered anyway.
- Published bundles carry [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations, so you can verify a release was built from this exact repository by GitHub Actions, not published from someone's laptop.

See [SECURITY.md](../SECURITY.md) for the full threat model, scope, and how to report a vulnerability.

## Detailed comparison to similar packages

|  | **svgin-react** | react-svg | react-inlinesvg |
| --- | :---: | :---: | :---: |
| Sanitized by default | yes | opt-in only | no |
| Minzipped size (single equivalent import, tree-shaken) | ~2.7 KB | ~3.8 KB | ~7.7 KB |
| React Server Components support | yes | no | no |
| Real React element (not DOM injection) | yes | no | yes |
| Forced runtime dependency | none (optional peers) | `@tanem/svg-injector` | `react-from-dom` |
| Multi-instance id collision handling | yes | yes | yes |
| `title` / `desc` accessibility props | yes | yes | yes |
| npm provenance (verified build) | yes | no | no |

Sizes measured by bundling `{ SvgIn }` (or each alternative's equivalent single import) from source with esbuild, minified, gzipped, `react`/`react-dom`/`react/jsx-runtime` externalized, the way a consuming app's own bundler would tree-shake it, not the whole un-tree-shaken entry file. Re-measure with `esbuild --bundle --minify` against each package's own single-component export to verify, these numbers drift as each package's code changes.

`react-svg` injects into the DOM imperatively via a ref (outside React's reconciliation), rather than rendering a real React element tree. Both alternatives require a mandatory runtime dependency; svgin-react's `dompurify`/`jsdom` are optional peer dependencies, loaded lazily only when the default sanitizer runs. react-inlinesvg in particular ships with no sanitization option at all, opt-in or otherwise.

### SVGR (`@svgr/core`)

[SVGR](https://www.npmjs.com/package/@svgr/core) is not really a competitor to svgin-react, it solves a different problem, and the two are often used together rather than instead of each other:

|  | **svgin-react** | SVGR (`@svgr/core`) |
| --- | :---: | :---: |
| When it runs | Runtime (in the browser / on request) | Build time (webpack/rollup/Vite loader, CLI, or Node API) |
| What it takes | A URL, or a raw SVG string you already have | An SVG file in your repo |
| Output | A rendered `<svg>` element | Generated React component source code |
| Fits SVGs whose content isn't known until runtime (CMS fields, user uploads, an API response) | yes | no, the file has to exist in your project at build time |
| Sanitizes untrusted markup | yes (DOMPurify by default) | not its job, it optimizes/transforms SVGs you already trust as part of your own codebase, it is not built to run against untrusted input |
| Runtime bundle cost of the tool itself | ~2.7 KB (tree-shaken single import, see above) | none, it is a build-time devDependency, not shipped to the browser |

If your icons are static files that ship with your app (a logo, a fixed icon set), SVGR is the better fit, it does its work once at build time and adds nothing to your runtime bundle. Reach for svgin-react when the SVG's content is not known until runtime: fetched from a URL, returned by an API, stored in a database, or otherwise not a file sitting in your repo when you build.
