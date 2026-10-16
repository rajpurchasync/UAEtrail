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
| [`CREATE_FLOW.md`](./CREATE_FLOW.md) | FAB **Host · Find crew · Add on map**, compose wire, join modes |
| [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) | Person account, host tiers, capabilities, host/join/buddy **naming** |
| [`DOMAIN.md`](./DOMAIN.md) | Entity glossary (Place, Activity, Demand, …) |
| [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) | TS symbols, URLs, API client, notifications, routing hygiene, **§15 viewer access** |
| [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) | Bounded contexts, debt register, **Program CPC** §8.4 checklists |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Monorepo, deploy, layers |
| [`API_ROUTING.md`](./API_ROUTING.md) | `/me/*`, `/host/*`, explore, deprecations |
| [`COMMUNICATION.md`](./COMMUNICATION.md) | Chat, inbox, crew wall |
| [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md) | Trips manage, message crew |

---

## Tier 2 — ops & rollout

| Doc | Use when you change… |
|-----|----------------------|
| [`DEV_RUN.md`](./DEV_RUN.md) | VS Code hot reload, seed, auth/session dev checks |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Docker VPS, env, HTTPS |
| [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md) | Go-live + release gates (**S10e** vNext promote, **S10f** manual QA) |
| [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) | Host/tenant technical debt |
| [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md) | Map seed, venue import, browse smoke |
| [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md) | Seeking backfill, `PARTICIPANT_INTENT_STUB_WRITE`, G-manage staging smoke |
| [`ANDROID_RELEASE.md`](./ANDROID_RELEASE.md) · [`IOS_RELEASE.md`](./IOS_RELEASE.md) · [`PLAY_STORE_LISTING.md`](./PLAY_STORE_LISTING.md) | Native store ship |
| [`MODERATION.md`](./MODERATION.md) | UGC reports |

---

## Tier 3 — explore supplement (defers to Tier 1)

[`experiment/README.md`](./experiment/README.md) — UX/browse/mobile IA; **activity peek/detail program:** [`experiment/activity-detail-tabs-implementation-plan.md`](./experiment/activity-detail-tabs-implementation-plan.md); **consumer detail shells (S9 eng complete, §8 manual QA pending):** [`experiment/consumer-detail-surfaces-plan.md`](./experiment/consumer-detail-surfaces-plan.md) §14 handoff · `npm run consumer-detail:qa-routes`; FAB truth stays in `CREATE_FLOW.md`.

---

## Tier 4 — historical

Removed filenames → canonical map: [`archive/README.md`](./archive/README.md).

---

## Decision tree

```text
Which bounded context?     → SYSTEM_COHERENCE §3 + manifest
Routes / deep links?       → NAVIGATION + DOMAIN_CANONICALS §3 + routingCatalog
HTTP / handlers?           → API_ROUTING
Who can Organize / host?   → MEMBER_MODEL
Who sees full detail/peek? → DOMAIN_CANONICALS §15 (+ SYSTEM_COHERENCE C16 / S7)
Frontend surface families?  → SYSTEM_COHERENCE §6.2
UI implementation schedule? → SYSTEM_COHERENCE §8.3 (S13 waves W0–W10)
Map / FAB / publish?       → CREATE_FLOW + NORTHSTAR
Names / api.* / meta?      → DOMAIN_CANONICALS §6–12
Copy on map or home?       → exploreCopy / homeLanding + NORTHSTAR
Go live?                   → PRE_DEPLOY_CHECKLIST + DEPLOYMENT
```
