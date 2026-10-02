# Archived / superseded documentation

Historical specs and phase plans were **removed from the tree** (Oct 2026) after content landed in Tier-1 docs and automated guards. Use the canonical files below for new work. Old filenames may still appear in git history and closed PRs.

| Removed snapshot | Use instead |
|------------------|-------------|
| `DOMAIN_ADOPTION_PLAN.md` | [`DOMAIN.md`](../DOMAIN.md), [`DOMAIN_CANONICALS.md`](../DOMAIN_CANONICALS.md) |
| `ENGINEERING_PLAN.md` | [`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md) §7–8 (debt register) |
| `IMPLEMENTATION_GUIDE.md` | [`ARCHITECTURE.md`](../ARCHITECTURE.md), [`CREATE_FLOW.md`](../CREATE_FLOW.md), [`MEMBER_MODEL.md`](../MEMBER_MODEL.md) |
| `schema-audit.md` | [`DOMAIN.md`](../DOMAIN.md), [`API_ROUTING.md`](../API_ROUTING.md) |
| `NAMING_COHERENCE.md`, `SYSTEM_ALIGNMENT_MATRIX.md`, `NAMING_HOST_MEMBER.md` | [`DOMAIN_CANONICALS.md`](../DOMAIN_CANONICALS.md), [`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md) §3.1, [`MEMBER_MODEL.md`](../MEMBER_MODEL.md) § Naming vocabulary |
| `experiment/explore-map-implementation-plan.md`, `explore-alignment-phases.md`, `E2_*` / `E10_*` / `E11_*` / `PHASE9_*` smoke docs | [`operations/EXPLORE_MAP_RUNBOOK.md`](../operations/EXPLORE_MAP_RUNBOOK.md), `npm run test:explore-alignment` |
| `experiment/profile-and-trips-phases.md` | [`NAVIGATION.md`](../NAVIGATION.md), [`experiment/consumer-mobile-ia.md`](../experiment/consumer-mobile-ia.md) |
| Root `REMEDIATION.md` (CTO checklist) | [`HOST_CLEANUP_ROADMAP.md`](../HOST_CLEANUP_ROADMAP.md) |
| `MEMBER_MODEL_PHASES.md` | [`MEMBER_MODEL.md`](../MEMBER_MODEL.md), [`HOST_CLEANUP_ROADMAP.md`](../HOST_CLEANUP_ROADMAP.md) |
| `RELEASE_READINESS.md`, `MOBILE_DEPLOYMENT_PLAN.md` | [`PRE_DEPLOY_CHECKLIST.md`](../PRE_DEPLOY_CHECKLIST.md), `npm run verify:system` |
| `MIGRATION.md`, `PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`, `monitoringPlan.md` | [`DEPLOYMENT.md`](../DEPLOYMENT.md), [`DEV_RUN.md`](../DEV_RUN.md), repo `monitoring/` (optional) |
| `experiment/flows/*`, `explore-flow-registry.md`, `explore-backend-alignment.md` | [`CREATE_FLOW.md`](../CREATE_FLOW.md), `src/explore/composeFlowCatalog.ts` |
| `experiment/WISHLIST_MAP_ALERTS.md`, `WHOS_GOING_UX.md`, `trips-personal-map-spec.md` | [`CREATE_FLOW.md`](../CREATE_FLOW.md), [`NAVIGATION.md`](../NAVIGATION.md), [`COMMUNICATION.md`](../COMMUNICATION.md) |

**Member / host model (2026):** [`MEMBER_MODEL.md`](../MEMBER_MODEL.md) · audit [`HOST_CLEANUP_ROADMAP.md`](../HOST_CLEANUP_ROADMAP.md).

Pre–`main` experiment branch notes: `legacy/*` tags on `origin` (see `.cursor/rules/main-workflow.mdc`).
