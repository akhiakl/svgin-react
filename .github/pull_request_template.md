## What & why

<!-- What does this change do, and why is it needed? -->

## Type of change

- [ ] Fix
- [ ] Feature / enhancement
- [ ] Performance
- [ ] Refactor / cleanup
- [ ] Tests
- [ ] CI / tooling
- [ ] Docs

## Checklist

- [ ] `pnpm run lint` passes
- [ ] `pnpm run typecheck` and `pnpm run typecheck:test` pass
- [ ] `pnpm run test` passes, and new behavior has test coverage
- [ ] `pnpm run build` succeeds and `pnpm run size` stays within budget
- [ ] For anything touching sanitization/caching: I considered whether this
      could weaken sanitization guarantees or leak an unsanitized/custom
      result across callers via the shared cache

## Notes for reviewers

<!-- Anything that needs extra attention, tradeoffs made, follow-ups. -->
