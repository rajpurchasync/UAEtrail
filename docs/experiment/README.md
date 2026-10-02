# Explore supplement (defers to Tier 1)

Shipped on **`main`**. **Product truth:** [`../DOCS_INDEX.md`](../DOCS_INDEX.md) Tier 1 — especially [`../CREATE_FLOW.md`](../CREATE_FLOW.md), [`../NAVIGATION.md`](../NAVIGATION.md), [`../MEMBER_MODEL.md`](../MEMBER_MODEL.md). When these notes disagree with Tier 1, **update this folder or delete it**.

| Doc | Purpose |
|-----|---------|
| [explore-ux-spec.md](./explore-ux-spec.md) | Map card copy, emojis, CTAs |
| [explore-browse-ia.md](./explore-browse-ia.md) · [explore-browse-taxonomy.md](./explore-browse-taxonomy.md) | Browse pills, search scopes, pin kinds (`src/explore/exploreBrowseTaxonomy.ts`) |
| [consumer-mobile-ia.md](./consumer-mobile-ia.md) | Profile / Trips / Messages tabs |

**Code catalog:** `src/explore/composeFlowCatalog.ts` mirrors FAB Organize · Find · Add paths documented in `CREATE_FLOW.md`.

**QA:** `npm run test:explore-alignment` · map seed/smoke: [`../operations/EXPLORE_MAP_RUNBOOK.md`](../operations/EXPLORE_MAP_RUNBOOK.md).

Removed phase trackers and per-flow markdown — see [`../archive/README.md`](../archive/README.md).
