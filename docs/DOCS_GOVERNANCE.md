# Documentation governance

**One coherent story** across product, routes, and API. **Do not grow the doc corpus** — update the canonical file for each topic.

**Index:** [`DOCS_INDEX.md`](./DOCS_INDEX.md) · **System map:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md)

---

## Closed Tier-1 set (do not add files)

Tier-1 is a **fixed list** (see `scripts/verify/verify-docs-tier1.mjs`). When behavior changes:

1. **Edit the existing Tier-1 file** for that topic (table below).
2. **Do not** create `NAMING_*`, `ALIGNMENT_*`, `AUDIT_*`, or parallel “coherence” docs.
3. If content was exploratory, merge into Tier-1 then **stub** the old file (`> Superseded by …`) or move to [`archive/README.md`](./archive/README.md).

| Topic | Single canonical file |
|-------|------------------------|
| Product why & voice | `NORTHSTAR.md` |
| Routes & redirects | `NAVIGATION.md` |
| Guest `/` | `LANDING.md` |
| FAB · Organize · Find · Add | `CREATE_FLOW.md` |
| Person · host tier · capabilities · host/join vocabulary | `MEMBER_MODEL.md` |
| Entity glossary (depth) | `DOMAIN.md` |
| Code names · URLs · API client · notification meta · routing hygiene | `DOMAIN_CANONICALS.md` |
| Capabilities · bounded contexts · alignment matrix · debt register | `SYSTEM_COHERENCE.md` |
| HTTP prefixes & deprecations | `API_ROUTING.md` |
| Deploy & layers | `ARCHITECTURE.md` |
| DMs · inbox · crew chat | `COMMUNICATION.md` |
| Plan hosted manage · crew chat | `NAVIGATION.md` § `/plan` · `COMMUNICATION.md` |
| What to read when | `DOCS_INDEX.md` |
| This policy | `DOCS_GOVERNANCE.md` |

Tier-2: ops (`DEV_RUN.md`, `DEPLOYMENT.md`, `PRE_DEPLOY_CHECKLIST.md`, …). Tier-3: `experiment/README.md` only (no per-plan markdown). Tier-4: removed — see `archive/README.md`.

**Migration jargon (M0–M2d):** allowed in `experiment/*` history tables only; ops canon is [`SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md) (`seeking:storage-status`). Strip phase letters from Tier-1 API/product docs.

---

## Source of truth (code-first)

Product behavior and placement are defined by **implementation + automated guards**, not by markdown.

| Priority | Source | Role |
|----------|--------|------|
| 1 | `packages/shared-types/src/wire-lexicon.ts`, `src/content/upl-glossary.ts` | Wire names and member-visible vocabulary |
| 2 | `scripts/governance/bounded-context-manifest.json`, `scripts/governance/platform-governance.json` | Where modules belong; migration IDs |
| 3 | Guards and contract tests (`verify:system`, `crossContextFoundationsGuard`, API domain tests) | Enforce invariants; fail CI on drift |
| 4 | `apps/api/src/routes/*`, `src/api/domains/*`, services, UI | What actually runs |
| 5 | Tier-1 docs (this table’s links) | **Supporting facts** for humans — update **after** (3–4) change, not instead of them |

`docCoherence.test.ts` and `verify:docs` catch **stale or contradictory prose**; they are not a substitute for fixing code.

---

## Terminology spine (one vocabulary — do not duplicate)

Use **one row** per concern. Do not copy these tables into `experiment/*` or new markdown.

| Layer | Canonical source | Use for |
|-------|------------------|---------|
| **Member-visible copy** | `src/content/upl-glossary.ts`, `productNorthStar.ts`, `workspaceVocabulary.ts` | UI strings, FAB labels |
| **Wire / HTTP / Mongo** | `packages/shared-types/src/wire-lexicon.ts` | API paths, headers, DTO field names |
| **Product objects & confused words** | [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1–1.3 | Entity kinds, Host vs Organisation vs shop |
| **Host tier · join · buddy naming** | [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Naming vocabulary | Publish gates, join queue vocabulary |
| **HTTP routes** | [`API_ROUTING.md`](./API_ROUTING.md) + [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §4–5 | `/me/status`, `/publishing/*`, `/me/seeking-posts` |
| **SPA paths & redirects** | [`NAVIGATION.md`](./NAVIGATION.md) + `src/config/routingCatalog.ts` | `/explore`, `/publishing/*`, legacy `/host/*` |
| **Bounded context placement** | [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §3 + §3.0 | Where code and clients live |
| **Implementation schedule** | [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.6–8.8 + `scripts/governance/platform-governance.json` | Migrations only — not parallel plan docs |

**Retired product paths (docs + code):** `/operator/*` and `/host/*` as **consumer or API** trees → **`/publishing/*`**; `/me/host-status` → **`GET /me/status`**; Find storage → **`/me/seeking-posts`** + `activityMode: seeking`; shop **product catalog** (`/product/:id`, `/shop/products`, `/shop/checkout`, `/admin/shop`) → explore shops browse or `/admin/hosts`. Legacy names may appear only in **redirect tables** (`NAVIGATION.md`, `DOMAIN.md`) or **Prefer \| Deprecated** columns (`DOMAIN_CANONICALS.md` §6).

---

## When code ships, update docs in this order

1. **Behavior / API** → `API_ROUTING.md` and/or `CREATE_FLOW.md` and/or `MEMBER_MODEL.md`
2. **Routes** → `NAVIGATION.md` + `routingCatalog` / `surfacePaths`
3. **Cross-context placement** → `SYSTEM_COHERENCE.md` §3 if a new write path
4. **Names & call sites** → `DOMAIN_CANONICALS.md` §6–12 · **viewer access / detail exposure** → §15
5. **Copy** → `src/content/*` per Cursor rules
6. **FAB / compose QA** → `CREATE_FLOW.md` + `npm run test:explore-alignment`

Do **not** put new product semantics only in `experiment/*` phase trackers or deleted Tier-4 snapshots (see [`archive/README.md`](./archive/README.md)).

**Tier-1 dedupe (platform program P0):** Implementation schedules live in **`SYSTEM_COHERENCE.md` §8** only. Do not recreate `docs/experiment/*` plan files — use [`experiment/README.md`](./experiment/README.md). Superseded narratives: one-line stubs at doc root or `docs/archive/`.

---

## Automated checks

| Command | Guards |
|---------|--------|
| `npm run verify:system` | Full alignment (docs, domain, bounded-context manifest, explore) |
| `npm run verify:system:quick` | CI subset |
| `npm run verify:docs` | Tier-1 exists; banned phrases; merged-doc stubs; `experiment/*` plan file cap (§8.6.4) |
| `npm run verify:domain` | Routing + bounded-context tests |
| `npm run verify:host-member` | Host/member slice only |

---

## Banned phrases in Tier-1 (except legacy tables in `NAVIGATION.md` / `DOMAIN.md`)

| Avoid | Use instead |
|-------|-------------|
| “Request to become host” for buddy Host / publish | Profile complete → `canPublish`; `/welcome` |
| `/become-host?intent=…` as product entry | `/profile/pro-membership` |
| `UserRole` / `isHostRole` for publish UI | `GET /me/status` (`useMemberStatus`) |
| `/host/requests` as onboarding | Activity join queue |
| Consumer lead = “trail inventory / host console” only | North star: find people · get outside · go together |
| Platform rewrite to Next.js / Nest / microservices | Keep Vite SPA + Express — §8.9 |
| WebSockets for chat | SSE on API origin — §8.9 |
| SSR/SSG for `/explore` map | Optional prerender for entity detail + guest `/` only — §8.9 |

---

## Agent checklist

1. [`DOCS_INDEX.md`](./DOCS_INDEX.md) → pick **one** Tier-1 file from the table above.
2. Grep Tier-1 for the old phrase you are replacing.
3. `npm run verify:system:quick` before merge.

## Corpus diet (avoid the “library” trap)

| Problem | Fix |
|---------|-----|
| Tier-1 files grew long (especially `SYSTEM_COHERENCE`, `DOMAIN_CANONICALS`) | **Implement from code + manifest**; edit Tier-1 only for **factual deltas** after guards pass |
| Duplicate placement stories | **One row per concern:** manifest `contexts[]` + `SYSTEM_COHERENCE` §3 — not new audit markdown |
| Overlapping FE folders (`src/explore`, `src/list`, `src/discovery`, `src/crew-discovery`) | Same **discovery** context in manifest; **browse UI** = `src/list` + `src/crew-discovery`; **map shell** = `src/explore` — do not add a third people-browse stack |
| Friends vs crews vs discover | **Friends graph** → `/me/friends`, `MyCrews` (`/crews`); **Find crew discover** → `member_availability` + explore/list people lanes — not `/buddies` or seeking compose |
| Legacy product URLs | **No runtime shims** for retired paths (e.g. `/buddies`); one-time **Mongo migrations** + `NAVIGATION.md` canonical route only |
| Superseded docs | One-line stub pointing to canonical file, or `archive/` — `verify:docs` enforces |

**Align docs ↔ code:** When guards fail, fix **code first**, then the **single** Tier-1 row for that topic (table at top of this file). Never “fix” drift by adding a new markdown plan.
