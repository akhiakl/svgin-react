# Agent instructions

This file is the shared source of instructions for AI coding tools working in this repository (Claude Code, Cursor, GitHub Copilot, Gemini, Antigravity, and similar). Other tool-specific files in this repo (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/`) point back here rather than duplicating it, so keep this file up to date and treat the others as pointers only.

## What this project is

`svgin-react` fetches an SVG from a URL and renders it as a real inline React element instead of an `<img>`, sanitizing it by default so it is safe to use with SVGs from a source you do not fully control. It works both in the browser (a client component) and in React Server Components. See [README.md](README.md) for the full user-facing description.

## Source layout

- `src/SvgIn.client.tsx`, `src/SvgIn.server.tsx` — the client and server versions of the `<SvgIn />` component.
- `src/SvgInComponent.tsx` — shared rendering logic once sanitized SVG markup is available.
- `src/preload.ts` — `preloadSvg`, for fetching and caching ahead of render.
- `src/client.ts`, `src/server.ts`, `src/core.ts` — the package's entry points (see `exports` in `package.json`).
- `src/utils/sanitizeClient.ts`, `src/utils/sanitizeServer.ts` — the default DOMPurify-based sanitizers.
- `src/utils/fetchAndSanitizeSvgBase.ts`, `fetchAndSanitizeSvgClient.ts`, `fetchAndSanitizeSvgServer.ts` — fetch + sanitize + cache orchestration.
- `src/utils/svgCache.ts`, `src/utils/universalCache.ts` — caching (React `cache()` in RSC, an in-memory fallback elsewhere).
- `test/` — Vitest tests, one file per source module being tested.
- `e2e/` — Playwright end-to-end tests against a real browser (chromium, firefox, webkit): rendering, DOMPurify sanitization, per-instance id uniqueness, and stress tests with many concurrent `<SvgIn>` instances. `e2e/playground/` is a minimal Vite harness that imports the client component straight from `src/`; `e2e/tests/` holds the specs.

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

For a change that touches rendering, sanitization, or id uniquification, also run the Playwright e2e suite (`pnpm run typecheck:e2e`, then `pnpm exec playwright install` once per machine, then `pnpm run test:e2e`). It runs in CI on every pull request across chromium, firefox, and webkit; it is not part of `pnpm run test` because it needs real browsers, not jsdom.

## Commit and pull request conventions

- Commit messages and pull request titles both follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `perf:`, `refactor:`, `chore:`, `test:`, `docs:`, `ci:`, `build:`). This is enforced by commitlint and CI, not just a style preference.
- Keep pull requests focused on one change. Do not mix unrelated fixes.
- Never commit build output (`dist/`) or `node_modules/`.

## Security

Do not weaken or remove SVG sanitization to "simplify" code, and do not suggest removing the DOMPurify dependency as a size optimization. Inlining unsanitized SVG markup from an untrusted source is a real XSS vector; see [SECURITY.md](SECURITY.md) for the project's threat model and how to report a vulnerability.
