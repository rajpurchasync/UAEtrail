# Explore supplement (defers to Tier 1)

Shipped on **`main`**. **Product truth:** [`../DOCS_INDEX.md`](../DOCS_INDEX.md) Tier 1 — especially [`../CREATE_FLOW.md`](../CREATE_FLOW.md), [`../NAVIGATION.md`](../NAVIGATION.md), [`../MEMBER_MODEL.md`](../MEMBER_MODEL.md). When these notes disagree with Tier 1, **update this folder or delete it**.

| Doc | Purpose |
|-----|---------|
| [**activity-detail-tabs-implementation-plan.md**](./activity-detail-tabs-implementation-plan.md) | **Activity peek + detail program** — **§6 dynamic CTAs** (peek/detail/profile), phases, trace tests (`activityDetailAcceptance.test.ts`, `activity-detail-cta-matrix.test.ts`) |
| [**system-refactor-plan.md**](./system-refactor-plan.md) | **Execution plan** — phases R0–R8 after deep audit (discovery VM, explore shell, seeking, map vNext) |
| [**explore-map-vnext-spec.md**](./explore-map-vnext-spec.md) | **R5.1** — bbox/cursor map read model, base/enrich cache, slim card DTO (design only) |
| [**programme-aggregate-spec.md**](./programme-aggregate-spec.md) | **R7** — programme/series aggregate (spec only; no code until PM gate) |
| [**system-structure-deep-audit.md**](./system-structure-deep-audit.md) | **Repo-level** FE/BE/read-model critique (explore blob, domain taxes, scale) — not doc alignment |
| [**member-surfaces-implementation-plan.md**](./member-surfaces-implementation-plan.md) | Plan hub / seeking / §11 guards; §21 **points** at activity-detail program for exit criteria |
| [explore-ux-spec.md](./explore-ux-spec.md) | Map card copy, emojis, CTAs |
| [explore-browse-ia.md](./explore-browse-ia.md) · [explore-browse-taxonomy.md](./explore-browse-taxonomy.md) | Browse pills, search scopes, pin kinds (`src/explore/exploreBrowseTaxonomy.ts`) |
| [consumer-mobile-ia.md](./consumer-mobile-ia.md) | Profile / Plan / Messages tabs (**superseded in part by member-surfaces-implementation-plan**) |
| [WHOS_GOING_UX.md](./WHOS_GOING_UX.md) | **Plan:** Who's going = friends + discover + Join me (5 free / Pro) |

**Code catalog:** `src/explore/composeFlowCatalog.ts` mirrors FAB Organize · Find · Add paths documented in `CREATE_FLOW.md`.

**QA:** `npm run test:explore-alignment` · map seed/smoke: [`../operations/EXPLORE_MAP_RUNBOOK.md`](../operations/EXPLORE_MAP_RUNBOOK.md).

Removed phase trackers and per-flow markdown — see [`../archive/README.md`](../archive/README.md).
