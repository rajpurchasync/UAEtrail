# Documentation governance

Goal: **one coherent story** across product, routes, and API — especially **member vs host publishing tier vs activity join queue**. Ungoverned docs are how “become host” and `/host/requests` keep creeping back into Organize and buddy flows.

**Index:** [`DOCS_INDEX.md`](./DOCS_INDEX.md) · **System architecture:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md)

---

## Tiers (summary)

1. **Tier 1** — Canonical product/platform. Any contradiction here is a **bug**. Update Tier 1 when behavior ships.
2. **Tier 2** — Rollout, ops, release. May lag briefly but must not contradict Tier 1 on semantics.
3. **Tier 3** — Experiment & per-flow confirmations. Must **defer** to Tier 1 when they conflict.
4. **Tier 4** — Historical. Add a superseded banner at the top; do not treat as current product truth.

---

## When you change code, update docs in this order

1. **Behavior or API** → `MEMBER_MODEL.md` / `API_ROUTING.md` / `CREATE_FLOW.md` (whichever applies)
2. **Routes or redirects** → `NAVIGATION.md` + `src/config/memberRoutes.ts` (or `platform.ts`)
3. **User-facing strings** → `src/content/productNorthStar.ts`, `exploreCopy.ts`, or `homeMarketing.ts` (guest `/`) per `.cursor/rules`
4. **Flow-level QA** → matching `docs/experiment/flows/FLOW-*.md` preconditions table
5. **Rollout tracker** → `MEMBER_MODEL_PHASES.md` or `HOST_CLEANUP_ROADMAP.md` if the work was planned there

Do **not** update only `IMPLEMENTATION_GUIDE.md` or `ENGINEERING_PLAN.md` for new product semantics.

---

## Automated checks

| Command | What it guards |
|---------|----------------|
| `npm run verify:docs` | Tier 1 files exist; banned obsolete phrases in Tier 1 (except explicit legacy tables in `NAVIGATION.md` / `DOMAIN.md`) |
| `npm run verify:domain` | `DOMAIN_CANONICALS.md`, `routingCatalog.ts`, routing + API legacy guards |
| `npm run verify:host-member` | API typecheck, host-member contract tests, frontend guard tests |
| `npm run test:explore-alignment` | Explore module boundaries and compose catalog |
| `src/content/copyGuard.test.ts` | Marketing CTAs not duplicated outside canonical copy files |

**CI:** `npm run ci` runs `verify:host-member` and frontend tests; `verify:docs` should pass locally before merging doc-heavy PRs (wired in `package.json`).

---

## Phrases to avoid in Tier 1 (use replacements)

| Avoid | Use instead |
|-------|-------------|
| “Request to become host” for buddy Organize | Profile complete → `canPublish`; gate `/welcome` |
| `/become-host?intent=…` as product entry | `/profile/pro-membership` (`PRO_MEMBERSHIP_PATH`) |
| `UserRole` / `isHostRole` for publish UI | `GET /me/host-status` (`HostStatusDTO`) |
| `/host/requests` as onboarding | Activity **join** approvals for published outings |
| “Hiking & camping platform only” in consumer lead | North star: find people · get outside · go together |

Legacy **redirect** mentions of `/become-host` belong in `NAVIGATION.md` redirect tables only, with buddy Organize called out separately.

---

## Agent checklist (short)

- Read `DOCS_INDEX.md` tier for the task.
- Grep docs for the old phrase you are replacing (`become-host`, `host profile complete` without `canPublish`, etc.).
- Run `npm run verify:docs` and `npm run verify:host-member` when touching member/host or Tier 1 docs.
