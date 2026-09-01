# Agent instructions

This file is the shared source of instructions for AI coding tools working in this repository (Claude Code, Cursor, GitHub Copilot, Gemini, Antigravity, and similar). Other tool-specific files in this repo (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/`) point back here rather than duplicating it, so keep this file up to date and treat the others as pointers only.

## What this project is

`svgin-react` fetches an SVG from a URL and renders it as a real inline React element instead of an `<img>`, sanitizing it by default so it is safe to use with SVGs from a source you do not fully control. It works both in the browser (a client component) and in React Server Components. See [README.md](README.md) for the full user-facing description.

## Source layout

- `src/SvgIn.client.tsx` — the client `<SvgIn />` component (stateful: `useEffect` + state).
- `src/SvgIn.suspense.client.tsx` — `<SvgInSuspense />`, a separate `use()`-based Suspense component. Deliberately not merged into `SvgIn.client.tsx` (not a `suspense` prop on `<SvgIn />`): a runtime-prop branch inside a component every consumer imports can never be tree-shaken, but a wholly separate export can be, for consumers who never import it. Do not fold this back into `SvgIn.client.tsx` or give it access to `SvgInContext` - both would undo the point of the split.
- `src/SvgIn.server.tsx` — the async server `<SvgIn />` component.
- `src/SvgInComponent.tsx` — shared rendering logic once sanitized SVG markup is available.
- `src/SvgInContext.ts`, `src/SvgInProvider.tsx` — `<SvgInProvider>` (client only) for shared defaults on `<SvgIn />`. Not consulted by `<SvgInSuspense />`, for the same tree-shaking reason.
- `src/preload.ts` — `preloadSvg`, for fetching and caching ahead of render.
- `src/client.ts`, `src/server.ts`, `src/core.ts` — the package's entry points (see `exports` in `package.json`).
- `src/utils/sanitizeClient.ts`, `src/utils/sanitizeServer.ts` — the default DOMPurify-based sanitizers.
- `src/utils/fetchAndSanitizeSvgBase.ts`, `fetchAndSanitizeSvgClient.ts`, `fetchAndSanitizeSvgServer.ts` — fetch + sanitize + cache orchestration for the `src` prop.
- `src/utils/sanitizeSvgStringBase.ts` (+ `sanitizeSvgStringClient.ts`/`sanitizeSvgStringServer.ts`) — sanitize + cache orchestration for the `svg` (raw markup) prop, mirrors the above minus the fetch step.
- `src/utils/svgCache.ts`, `src/utils/universalCache.ts` — caching (React `cache()` in RSC, an in-memory fallback elsewhere).
- `test/` — Vitest tests, one file per source module being tested.
- `site/` — the standalone "Inspector" static site (paste an SVG, see what the default sanitizer strips, all client-side), deployed to GitHub Pages. Separate Vite build from the package (`pnpm run site:dev`/`site:build`), imports the library straight from `src/` so the demo always reflects current code. Not part of the published npm package - `pnpm run size`'s budgets do not apply to it.
  - `site/test/` — Vitest unit/component tests for the site (`diff.ts`'s pure logic, `App.tsx` via Testing Library), run together with the package's own tests via the same `pnpm run test`/`test:coverage` (included in `vitest.config.mts`, but deliberately excluded from the coverage threshold gate, which stays scoped to the package's `src/`).
  - `site/e2e/` — Playwright end-to-end tests against a real browser (chromium, firefox, webkit): loading presets, the sanitization diff, the id-uniquify demo, the URL loader. Separate from the unit tests because they need a real browser, not jsdom - real DOMPurify-in-the-DOM behavior, not a simulation of it.

## Before making a change

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution workflow (branching, pull request titles, security-sensitive change handling, bug reports). The essentials:

- This is a small, dependency-light library. Favor the smallest correct change over a larger refactor, and check `pnpm run size` for anything that touches `src/` — bundle size is a hard constraint here, not an afterthought.
- Sanitization and caching are security-sensitive (see [SECURITY.md](SECURITY.md)). A change to `src/utils/sanitizeClient.ts`, `src/utils/sanitizeServer.ts`, `src/utils/svgCache.ts`, `src/utils/fetchAndSanitizeSvgBase.ts`, or `src/preload.ts` needs a test proving the specific behavior, especially anything cache-key related (a cached result must never leak between different sanitization modes or `sanitizeFn` identities for the same URL).
- Match the existing code style: no unnecessary abstraction, comments explain *why* a non-obvious choice was made (see the comments in `src/utils/universalCache.ts` for the expected density), and no dependency is added without a real reason.

## Required checks before treating a change as done

Run these locally; all of them also run in CI on every pull request:

```sh
pnpm run lint
pnpm run typecheck
pnpm run typecheck:test
pnpm run test
pnpm run build
pnpm run size
```

Add or update a test in `test/` for any behavior change. A change is not finished until these all pass.

A change that touches `site/` (or `src/`, which it imports directly) should also pass:

```sh
pnpm run typecheck:site
pnpm run site:build
```

(`site/test/**` runs as part of the regular `pnpm run test`/`test:coverage` above, so no separate step is needed for it.) A change that touches `site/e2e/` (or `site/` more broadly) should also pass:

```sh
pnpm run typecheck:e2e
pnpm exec playwright install   # once per machine
pnpm run test:e2e
```

## Commit and pull request conventions

- Commit messages and pull request titles both follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `perf:`, `refactor:`, `chore:`, `test:`, `docs:`, `ci:`, `build:`). This is enforced by commitlint and CI, not just a style preference.
- Keep pull requests focused on one change. Do not mix unrelated fixes.
- Never commit build output (`dist/`) or `node_modules/`.

### Release scope

release-please (see `release-please-config.json`) decides the npm package's version bump - and therefore whether a merge to `main` triggers a real `npm publish` - purely by scanning commit **types** (`feat:`/`fix:`/a `!` breaking marker) across the whole repository. It has no path filtering: a `feat:`/`fix:` commit that only touches `site/`, `test/`, e2e config, docs, or workflow files still triggers a version bump and a real publish, with nothing actually changed in the published package. This happened once already (a `site/`-only commit was typed `feat:` and had to be reworded before merge).

So: **`feat:`/`fix:` are reserved for changes to `src/` (or `package.json`'s `dependencies`/`peerDependencies`/`exports`/`main`/`module`/`types`/`files`/`sideEffects`, or `tsup.config.ts`)** - i.e. anything that actually changes what gets published. A change confined to `site/`, `test/`, `site/e2e/`, docs, or CI/deploy workflow files must use `chore:`/`docs:`/`test:`/`ci:`/`build:`, even if it adds a real feature to the site or test suite. `scripts/check-release-scope.mjs` enforces this in CI (the "Commit messages" job) - it fails the PR if any `feat:`/`fix:` commit in range does not touch something package-relevant, naming the commit and its changed files.

## Security

Do not weaken or remove SVG sanitization to "simplify" code, and do not suggest removing the DOMPurify dependency as a size optimization. Inlining unsanitized SVG markup from an untrusted source is a real XSS vector; see [SECURITY.md](SECURITY.md) for the project's threat model and how to report a vulnerability.
