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

## Commit and pull request conventions

- Commit messages and pull request titles both follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `perf:`, `refactor:`, `chore:`, `test:`, `docs:`, `ci:`, `build:`). This is enforced by commitlint and CI, not just a style preference.
- Keep pull requests focused on one change. Do not mix unrelated fixes.
- Never commit build output (`dist/`) or `node_modules/`.

## Security

Do not weaken or remove SVG sanitization to "simplify" code, and do not suggest removing the DOMPurify dependency as a size optimization. Inlining unsanitized SVG markup from an untrusted source is a real XSS vector; see [SECURITY.md](SECURITY.md) for the project's threat model and how to report a vulnerability.
