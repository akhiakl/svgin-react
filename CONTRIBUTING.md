# Contributing

Thanks for taking the time to contribute.

## Before you start

For a small fix (typo, docs, a clear bug), just open a pull request.

For anything bigger (a new feature, a change to the public API, a different approach to sanitization or caching), open an issue first and describe what you want to do. This avoids spending time on a pull request that does not fit the project.

## Setup

```sh
git clone https://github.com/akhiakl/svgin-react.git
cd svgin-react
pnpm install
```

This project uses [pnpm](https://pnpm.io). If you do not have it, install it with `npm install -g pnpm`.

## Making a change

1. Create a branch off `main`.
2. Make your change.
3. Add or update tests in `test/` for what you changed.
4. Run the full check locally before opening a pull request:

```sh
pnpm run lint
pnpm run typecheck
pnpm run typecheck:test
pnpm run test
pnpm run build
pnpm run size
```

All of these also run in CI on every pull request, so it is faster to catch problems locally first.

## Pull request title

Pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/): a type, then a colon, then a short description. For example:

```
fix: correct width handling when height is not set
feat: add a maxSize option to preloadSvg
docs: fix a broken link in the README
```

Allowed types: `fix`, `feat`, `perf`, `refactor`, `chore`, `test`, `docs`, `ci`, `build`. This is enforced automatically on every pull request.

## Security-sensitive changes

This library exists to safely inline SVGs that may come from an untrusted source. If your change touches sanitization (`src/utils/sanitizeClient.ts`, `src/utils/sanitizeServer.ts`) or the SVG cache (`src/utils/svgCache.ts`, `src/utils/fetchAndSanitizeSvgBase.ts`, `src/preload.ts`), please:

- Explain in the pull request description what the change affects from a security point of view.
- Add a test that would fail without your fix, especially for anything cache-related (a cached result must never leak between different sanitization modes for the same URL).

If you find a security vulnerability, do not open a public issue. See [SECURITY.md](SECURITY.md) instead.

## Code review

- A pull request needs at least one approval and a passing CI run before it can be merged.
- Automated review comments (from bots or from Claude) are treated as normal review feedback: reply if you disagree, or push a fix.
- Please keep pull requests focused. A large pull request that mixes unrelated changes is harder to review and more likely to need rework.

## Reporting a bug

Open an issue using the bug report template. Include:

- What you expected to happen.
- What actually happened.
- A minimal way to reproduce it (a small code sample is best).
- Your version of `svgin-react`, `react`, and, if relevant, `dompurify`/`jsdom`.
