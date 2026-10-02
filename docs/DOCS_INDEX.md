# Documentation index

**Start here** when changing product behavior, routes, copy, or API contracts.

- **Whole system map (capabilities → modules → API):** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) — read this for architecture-wide changes, not only host/member wording.

This index separates **canonical** docs from **experiment** checklists and **historical** archives so agents and humans do not reintroduce contradictions (e.g. “become host” for buddy Organize, or `/host/requests` as onboarding).

**Governance:** [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) · **Automated checks:** `npm run verify:docs` · **Host/member contracts:** `npm run verify:host-member`

---

## Tier 1 — product & platform (canonical)

Read these before shipping user-facing or API changes. They must agree with each other.

| Doc | Job |
|-----|-----|
| [`NORTHSTAR.md`](./NORTHSTAR.md) | Why we exist, voice, surface jobs (emotion before architecture) |
| [`NAVIGATION.md`](./NAVIGATION.md) | Routes, redirects, marketing vs `/explore`, legacy path table |
| [`LANDING.md`](./LANDING.md) | Guest-only `/` scope and section jobs |
| [`CREATE_FLOW.md`](./CREATE_FLOW.md) | FAB · Organize · Find · Add · join modes · publish gates |
| [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) | Person account · `HostStatusDTO` · buddy `canPublish` vs Pro/business |
| [`NAMING_HOST_MEMBER.md`](./NAMING_HOST_MEMBER.md) | Glossary: activity join queue ≠ host onboarding |
| [`DOMAIN.md`](./DOMAIN.md) | Place · Activity · Organisation entities and URLs |
| [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) | **Objects, types, URL/API canon, routing hygiene** |
| [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) | **Whole product** — capabilities, bounded contexts, debt register |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Monorepo layers, key flows, deployment notes |
| [`API_ROUTING.md`](./API_ROUTING.md) | `/me/*` vs `/host/*`, explore map, deprecations |
| [`COMMUNICATION.md`](./COMMUNICATION.md) | DMs, crew chat, inbox |
| [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md) | Trips manage, invites vs Messages |

**Cursor rules (enforced in IDE):** `.cursor/rules/product-northstar.mdc`, `platform-architecture.mdc`, `landing-marketing.mdc`, `host-member-model.mdc`

---

## Tier 2 — rollout, ops, release

| Doc | Job |
|-----|-----|
| [`MEMBER_MODEL_PHASES.md`](./MEMBER_MODEL_PHASES.md) | Member/host rollout checklist |
| [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) | P0–P3 host route / fulfill / privacy cleanup |
| [`RELEASE_READINESS.md`](./RELEASE_READINESS.md) | QA gates, go/no-go |
| [`DEV_RUN.md`](./DEV_RUN.md) | Local hot-reload convention |
| [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md) · [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Production deploy |
| [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md) | Map cache, venue import, smoke |
| [`MODERATION.md`](./MODERATION.md) | Reports workflow |
| Mobile store guides | `MOBILE_DEPLOYMENT_PLAN.md`, `ANDROID_RELEASE.md`, `IOS_RELEASE.md`, `PLAY_STORE_LISTING.md` |

---

## Tier 3 — experiment & flow confirmations

Under [`experiment/`](./experiment/). **Supplements** Tier 1; does not override it. When a flow doc disagrees with `CREATE_FLOW.md` or `MEMBER_MODEL.md`, **fix the flow doc**.

| Entry | Job |
|-------|-----|
| [`experiment/README.md`](./experiment/README.md) | Map of experiment-era specs |
| [`experiment/flows/README.md`](./experiment/flows/README.md) | FAB → publish confirmations (FLOW-01…) |
| [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) | Map card copy & CTAs |
| [`experiment/explore-backend-alignment.md`](./experiment/explore-backend-alignment.md) | API/DB gate notes |
| [`experiment/explore-map-implementation-plan.md`](./experiment/explore-map-implementation-plan.md) | Phased build plan (some file names are historical) |

**Organize preconditions (all FLOW-01–05):** signed in · signup profile complete → `canPublish` on `GET /me/host-status` · incomplete → `/welcome` · Pro/business → `/profile/pro-membership` (not `/become-host`).

---

## Tier 4 — historical / do not extend without a deliberate migration

| Doc | Note |
|-----|------|
| [`IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md) | Feb 2026 onboarding snapshot; roles/tiers outdated |
| [`DOMAIN_ADOPTION_PLAN.md`](./DOMAIN_ADOPTION_PLAN.md) | Rename execution log (mostly complete) |
| [`ENGINEERING_PLAN.md`](./ENGINEERING_PLAN.md) | Engineering backlog; verify dates against Tier 1 |
| [`schema-audit.md`](./schema-audit.md) | Mongo schema phases; not publish-gate truth |
| [`archive/README.md`](./archive/README.md) | Archived pointers |

---

## Quick decision tree

```text
New feature or large refactor?   → SYSTEM_COHERENCE (context + write path) first
Changing copy on map or FAB?     → NORTHSTAR + CREATE_FLOW + explore-ux-spec
Changing route or redirect?      → NAVIGATION + memberRoutes / App.tsx
Changing who can Organize?       → MEMBER_MODEL + API member-publish-gate + /me/host-status
Changing /host/* API?            → API_ROUTING + NAMING_HOST_MEMBER
Renaming types/files?            → DOMAIN_CANONICALS + DOMAIN (+ DOMAIN_ADOPTION_PLAN historical only)
New public URL or deep link?     → routingCatalog / entity-path + NAVIGATION legacy table
```
