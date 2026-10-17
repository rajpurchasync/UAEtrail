# Documentation governance

**One coherent story** across product, routes, and API. **Do not grow the doc corpus** — update the canonical file for each topic.

**Index:** [`DOCS_INDEX.md`](./DOCS_INDEX.md) · **System map:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md)

---

## Closed Tier-1 set (do not add files)

Tier-1 is a **fixed list** (see `scripts/verify-docs-tier1.mjs`). When behavior changes:

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
| Trips manage · crew entry | `TRIPS_HOST_MANAGE.md` |
| What to read when | `DOCS_INDEX.md` |
| This policy | `DOCS_GOVERNANCE.md` |

Tier-2: ops (`DEV_RUN.md`, `DEPLOYMENT.md`, `PRE_DEPLOY_CHECKLIST.md`, …). Tier-3: `experiment/*` supplement only (must defer to Tier-1). Tier-4: removed — see `archive/README.md`.

**Migration jargon (M0–M2d):** allowed in `experiment/*` history tables only; ops canon is [`SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md) (`seeking:storage-status`). Strip phase letters from Tier-1 API/product docs.

---

## When code ships, update docs in this order

1. **Behavior / API** → `API_ROUTING.md` and/or `CREATE_FLOW.md` and/or `MEMBER_MODEL.md`
2. **Routes** → `NAVIGATION.md` + `routingCatalog` / `surfacePaths`
3. **Cross-context placement** → `SYSTEM_COHERENCE.md` §3 if a new write path
4. **Names & call sites** → `DOMAIN_CANONICALS.md` §6–12 · **viewer access / detail exposure** → §15
5. **Copy** → `src/content/*` per Cursor rules
6. **FAB / compose QA** → `CREATE_FLOW.md` + `npm run test:explore-alignment`

Do **not** put new product semantics only in `experiment/*` phase trackers or deleted Tier-4 snapshots (see [`archive/README.md`](./archive/README.md)).

**Tier-1 dedupe (platform program P0):** Implementation schedules live in **`SYSTEM_COHERENCE.md` §8** only (S-phases, CPC, **§8.6 P0–P6**). `experiment/*` may hold UX supplements and **stub** pointers — do not copy §8 phase tables into experiment plans; link to §8.6 instead. Historical bodies belong in `docs/archive/`.

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
| “Request to become host” for buddy Organize | Profile complete → `canPublish`; `/welcome` |
| `/become-host?intent=…` as product entry | `/profile/pro-membership` |
| `UserRole` / `isHostRole` for publish UI | `GET /me/status` (`useMemberStatus`) |
| `/host/requests` as onboarding | Activity join queue |
| Consumer lead = “trail inventory / host console” only | North star: find people · get outside · go together |

---

## Agent checklist

1. [`DOCS_INDEX.md`](./DOCS_INDEX.md) → pick **one** Tier-1 file from the table above.
2. Grep Tier-1 for the old phrase you are replacing.
3. `npm run verify:system:quick` before merge.
