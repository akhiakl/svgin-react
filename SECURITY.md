# Security Policy

svgin-react exists to safely render untrusted SVGs, so security issues here are taken seriously.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for a security vulnerability.

Instead, use GitHub's private reporting:

1. Go to the [Security tab](https://github.com/akhiakl/svgin-react/security) of this repository.
2. Click "Report a vulnerability".
3. Describe the issue, including a minimal reproduction if possible (an example SVG payload and the code that renders it).

If you cannot use GitHub's private reporting for some reason, open an issue asking for another way to reach the maintainer, without any vulnerability details in it.

You should get a response within a few days. Once the issue is confirmed, we will work on a fix and coordinate a release before any public disclosure.

## Supported versions

Only the latest published version on npm receives security fixes. Please make sure you are on the latest version before reporting an issue.

## Scope

In scope:

- A crafted SVG that bypasses the default sanitizer and executes script, loads external resources it should not, or otherwise escapes the sanitized markup.
- The SVG cache returning an unsanitized or wrongly-sanitized result for a URL (for example, a result from `disableSanitization` or a custom `sanitizeFn` leaking into the default sanitizer's cache entry for the same URL).
- A dependency (`dompurify`, `jsdom`) pinned at a version with a known vulnerability.

Out of scope:

- Issues in `dompurify` or `jsdom` themselves that are not specific to how this library uses them. Please report those upstream.
- Behavior when `disableSanitization` is used intentionally. That option exists for SVGs you already trust, and turning it on removes this library's security guarantees by design.

## Automated scanner alerts on jsdom's dependency tree

Supply-chain scanners (Socket and similar) that walk this project's full dependency tree flag several findings inside `jsdom` and its own transitive dependencies (`undici`, `lru-cache`, `require-from-string`, `is-potential-custom-element-name`, `css-tree`, `source-map-js`, `whatwg-url`, `data-urls`, at various versions): "Network access", "AI-detected potential security risk", "Uses eval", "Obfuscated code", and "Trivial Package". These are investigated, understood, and not something this library needs to act on:

- **Network access** (`jsdom`, `undici`, `lru-cache`) - jsdom uses `undici` internally as its HTTP client for browser-emulation features (loading `<img>`/`<link>`/iframe resources during page navigation). This library never triggers that: the server sanitizer creates `new JSDOM('')` - an empty document, never navigated, no resources ever requested.
- **"AI-detected potential security risk"** (`jsdom`, `require-from-string`) - an accurate description of jsdom's *general* capability to execute `<script>` elements, gated behind jsdom's own `runScripts: "dangerously"` option. This library never sets that option; the jsdom window is created with defaults, where scripts never execute. DOMPurify sanitizes the untrusted string before anything is ever rendered.
- **"Uses eval"** (`css-tree`, `jsdom`, `source-map-js`, `whatwg-url`) - `new Function(...)` used internally by these specific libraries for parser/source-map performance, a common and well-audited pattern unrelated to this library's own code.
- **"Obfuscated code"** (`data-urls`, `jsdom`) - minified variable names in a `data:` URL parsing utility. Socket's own AI-generated summary for this finding states it directly: "harmless data transformation utilities with safe error handling, no malicious behavior or data exfiltration detected."
- **"Trivial Package"** (`is-potential-custom-element-name`) - a real, widely-used ~7-line WHATWG-spec helper; Socket's generic "under 10 lines" heuristic, not a finding specific to this dependency.

`jsdom` is DOMPurify's own recommended way to run sanitization server-side in Node, and is what most of the Node testing ecosystem (Jest, Vitest, Testing Library) already depends on. It is an *optional* peer dependency here, only pulled in by consumers of the default server sanitizer (`src/utils/sanitizeServer.ts`), which always uses it in the narrow, safe configuration described above - an empty document, default options, sanitize-then-never-execute. We do not suppress or override these scanner findings project-wide: a blanket override would also silence a genuinely new issue in a future `jsdom` (or one of its transitive dependencies) release. If you believe one of these specifically applies to how *this* library uses `jsdom` in a way not covered above, please report it per "Reporting a vulnerability" above rather than assuming it's already covered by this note.
