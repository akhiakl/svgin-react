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
