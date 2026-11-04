---
name: commit-to-main
description: >-
  Repeatable ship checklist — theme, docs, seed integrity, performance, CI,
  one commit, push to origin/main. Use when the user says "Commit to Main Repo"
  or "/commit-to-main".
disable-model-invocation: true
---

# Commit to Main Repo

Gate uncommitted work on `main`, then one summarized commit and `git push origin main`.

**Only commit and push when the user explicitly confirms after local CI is green.**

## References

- CI parity: [`npm run ci`](../../package.json) · [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- Docs policy: [`docs/DOCS_GOVERNANCE.md`](../../docs/DOCS_GOVERNANCE.md)
- Explore UI: [`.cursor/rules/explore-design.mdc`](../../.cursor/rules/explore-design.mdc) · [`src/config/exploreTheme.ts`](../../src/config/exploreTheme.ts)
- System gate: `npm run verify:system` (full) after `npm run verify:system:quick` in CI

## Step 1 — UI matches theme

- Consumer/explore: tokens from `exploreTheme.ts`, `listChromeTheme.ts`, `ExploreResponsiveSheet`, `AppSelect` (no native `<select>`).
- Desktop shell: `desktopNav.ts`, `ProductShell`, `index.css` vars vs [`docs/NAVIGATION.md`](../../docs/NAVIGATION.md).
- Admin: dashboard gray/emerald OK; keep `AdminTablePager` / `AdminIconButton` consistent across touched admin pages.

## Step 2 — Documents (Tier-1 / Tier-2 only)

Edit existing canon in place — no new Tier-1 files. Typical: `NAVIGATION.md`, `CREATE_FLOW.md`, `DEPLOYMENT.md`, `API_ROUTING.md`, `DOMAIN_CANONICALS.md` when wire/API changed. Run `npm run verify:docs`.

## Step 3 — Missing data: seed/DB, not read shims

- OK: form drafts (`?? []`), React Query cache defaults.
- Not OK: silent skip of DB rows with broken FKs; fix [`apps/api/scripts/seed.ts`](../../apps/api/scripts/seed.ts) and related seeds instead.
- Prefer strict assembly (throw) in admin/read paths when referential data is wrong in dev/test.

## Step 4 — Performance

Review changed hot paths: inbox slices (`useMessagesInbox.ts`), admin pagination (`adminConsoleApi.ts`, `AdminTablePager`), plan hub cache, explore map invalidations. Defer only with user acknowledgment; note in commit body.

## Step 5 — Single commit

Stage all intended files; exclude secrets. Subject + bullet body (desktop, admin, compose, deploy, inbox, seed, perf). No `--no-verify` unless hook bug → new commit.

## Step 6 — CI (local = GitHub)

```bash
npm run ci
npm run verify:system
npm run verify:docs
docker compose build api
docker compose build frontend
```

Fix until green.

## Step 7 — Push

```bash
git push origin main
```

Confirm GitHub Actions **CI** (`verify` + `docker-build`) on `https://github.com/uaetrail/main`.
