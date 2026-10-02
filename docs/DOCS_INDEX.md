# Documentation index

**Start here.** Tier-1 is a **closed set** — see [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) (do not add new canonical docs; update the file for your topic).

**Checks:** `npm run verify:system` · **Machine manifest:** `scripts/bounded-context-manifest.json`

---

## Tier 1 — canonical (product & platform)

| Doc | Use when you change… |
|-----|----------------------|
| [`NORTHSTAR.md`](./NORTHSTAR.md) | Product why, voice, outcomes |
| [`NAVIGATION.md`](./NAVIGATION.md) | Routes, redirects, surfaces |
| [`LANDING.md`](./LANDING.md) | Guest-only `/` |
| [`CREATE_FLOW.md`](./CREATE_FLOW.md) | FAB, Organize, Find, Add, join modes |
| [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) | Person account, host tiers, capabilities, host/join/buddy **naming** |
| [`DOMAIN.md`](./DOMAIN.md) | Entity glossary (Place, Activity, Demand, …) |
| [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) | TS symbols, URLs, API client, notifications, routing hygiene |
| [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) | All domains, bounded contexts, **alignment matrix**, debt register |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Monorepo, deploy, layers |
| [`API_ROUTING.md`](./API_ROUTING.md) | `/me/*`, `/host/*`, explore, deprecations |
| [`COMMUNICATION.md`](./COMMUNICATION.md) | Chat, inbox, crew wall |
| [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md) | Trips manage, message crew |

---

## Tier 2 — rollout & ops

[`MEMBER_MODEL_PHASES.md`](./MEMBER_MODEL_PHASES.md) · [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) · [`RELEASE_READINESS.md`](./RELEASE_READINESS.md) · [`DEV_RUN.md`](./DEV_RUN.md) · deploy/mobile docs · [`operations/`](./operations/)

---

## Tier 3 — experiment (defers to Tier 1)

[`experiment/README.md`](./experiment/README.md) · [`experiment/flows/`](./experiment/flows/) · explore UX/backend specs

---

## Tier 4 — historical

[`archive/README.md`](./archive/README.md) · `IMPLEMENTATION_GUIDE.md` · `ENGINEERING_PLAN.md` · `DOMAIN_ADOPTION_PLAN.md` · `schema-audit.md`

---

## Decision tree

```text
Which bounded context?     → SYSTEM_COHERENCE §3 + manifest
Routes / deep links?       → NAVIGATION + DOMAIN_CANONICALS §3 + routingCatalog
HTTP / handlers?           → API_ROUTING
Who can Organize / host?   → MEMBER_MODEL
Map / FAB / publish?       → CREATE_FLOW + NORTHSTAR
Names / api.* / meta?      → DOMAIN_CANONICALS §6–12
Copy on map or home?       → exploreCopy / homeLanding + NORTHSTAR
```
