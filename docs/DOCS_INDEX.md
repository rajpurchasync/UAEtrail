# Documentation index

**Start here.** Tier-1 is a **closed set** — see [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) (do not add new canonical docs; update the file for your topic).

**Checks:** `npm run verify:system` · **Manifest:** `scripts/governance/bounded-context-manifest.json` · **Generated map:** `npm run context:map` → `scripts/dev/context-map.md` · **Program / ops:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) **§8.6** (eng migrations closed; staging gates in [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md)). UPL: `src/content/upl-glossary.ts` · BWL: `packages/shared-types/src/wire-lexicon.ts`. Do not implement from `docs/archive/**` or experiment plan bodies.

### Agent / developer — read this, not the whole corpus

| Step | Source | Skip |
|------|--------|------|
| Product voice & outcomes | `NORTHSTAR.md`, `src/content/productNorthStar.ts` | Marketing essays in archive |
| Where code lives | `bounded-context-manifest.json`, `SYSTEM_COHERENCE.md` **§3 only** | §8 migration history unless you own a MIG |
| Routes & URLs | `NAVIGATION.md`, `routingCatalog.ts`, `wire-lexicon.ts` | Old redirect tables unless editing redirects |
| HTTP handlers | `API_ROUTING.md` + `apps/api/src/routes/*` | Duplicating paths in new markdown |
| Names & DTOs | `DOMAIN_CANONICALS.md` §6–12, §15 | Full entity glossary in `DOMAIN.md` unless entity work |
| Drift check | `npm run verify:system:quick` | Reading every guard test by hand |

**Truth order:** wire-lexicon → manifest → guards/tests → running code → Tier-1 factual deltas (see `DOCS_GOVERNANCE.md`).

---

## Tier 1 — canonical (product & platform)

| Doc | Use when you change… |
|-----|----------------------|
| [`NORTHSTAR.md`](./NORTHSTAR.md) | Product why, voice, outcomes |
| [`NAVIGATION.md`](./NAVIGATION.md) | Routes, redirects, surfaces |
| [`LANDING.md`](./LANDING.md) | Guest-only `/` |
| [`CREATE_FLOW.md`](./CREATE_FLOW.md) | Compose kinds **activity · place · intent**, FAB entry, operator `/operator/*`, join modes |
| [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) | Person account, host tiers, capabilities, host/join/buddy **naming** |
| [`DOMAIN.md`](./DOMAIN.md) | Entity glossary (Place, Activity, Demand, …) |
| [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) | TS symbols, URLs, API client, notifications, routing hygiene, **§15 viewer access** |
| [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) | Bounded contexts, debt register, **platform north star §8.9**, **Program CPC** §8.4, **platform program** §8.6 |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Monorepo, deploy, layers |
| [`API_ROUTING.md`](./API_ROUTING.md) | `/me/*`, `/publishing/*`, explore, deprecations |
| [`COMMUNICATION.md`](./COMMUNICATION.md) | Chat inbox (`/messages`), `/chat/*` wire, crew wall |
**Vocabulary:** [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) § Terminology spine — UPL/BWL in code; Tier-1 for routes and entities.

---

## Tier 2 — ops & rollout

| Doc | Use when you change… |
|-----|----------------------|
| [`DEV_RUN.md`](./DEV_RUN.md) | VS Code hot reload, seed, auth/session dev checks |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Docker VPS, env, HTTPS |
| [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md) | Go-live + release gates (**S10e** bbox promote, **S10f** manual QA) |
| Coherence program (PCOH) | [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.8 |
| [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md) | Map seed, venue import, browse smoke |
| [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md) | Seeking backfill, `PARTICIPANT_INTENT_STUB_WRITE`, G-manage staging smoke |
| [`ANDROID_RELEASE.md`](./ANDROID_RELEASE.md) · [`IOS_RELEASE.md`](./IOS_RELEASE.md) · [`PLAY_STORE_LISTING.md`](./PLAY_STORE_LISTING.md) | Native store ship |
| [`MODERATION.md`](./MODERATION.md) | UGC reports |

---

## Tier 3 — stubs only (no schedules)

[`experiment/README.md`](./experiment/README.md) — retired folder (pointer only). Schedule: **§8** + `platform-governance.json`. **QA:** `npm run release:ops:checklist` · staging `npm run s10f:ops:print-routes` · **FAB:** `CREATE_FLOW.md`.

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
Platform defaults / rejected stack? → SYSTEM_COHERENCE §8.9 + platform-migration-archive MIG-ARCH-*
```
