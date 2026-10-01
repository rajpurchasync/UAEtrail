# E11 — Organize flows manual smoke (`experiment-ui`)

Quick pass on `/explore` after wizard split, registry venue skips, meeting-point UX, Post-publish rideshare, and reorganize.

**Preconditions:** `npm run dev:local` (or `dev:all`), signed-in host with `canPublish`, seeded map if pins look empty.

## FAB → catalog flows

| Entry | Query / id | Spot-check |
|-------|------------|------------|
| Hike | `organize:hiking` | Registry place skips difficulty + about trail; custom pin keeps those steps |
| Camp | `organize:camping` | Same registry skip pattern as hiking |
| Event | `organize:event` | Registry skip; going-from / when steps present |
| Activity | `organize:activity` | Shorter path; activity type chip; meeting point early |
| Rideshare | `organize:rideshare` | FLOW-04 steps; not mixed with activity wizard |

Each flow should use consistent sheet chrome (back / close, step title) via `OrganizeWizardChrome`.

## Meeting point (activity-style steps)

- No optional **Label** field — directions + map pin only.
- Pin persists when advancing steps.

## Publish & carpool

- Rideshare link is **not** on the publish step.
- When catalog sets `postPublishRideshare`, success sheet offers optional rideshare link (rideshare / applicable flows).

## Reorganize (new activity id)

From **hosted** section, **host console** activities, or **admin** activity menu:

- **Reorganize** opens explore compose with prefilled draft (`?organizeFrom=<activityId>`).
- Publish creates a **new** activity; source id is audit metadata only.

## Automated helpers

```bash
npm run test:frontend -- src/explore/ui/organizeFlows/organizeFlows.registry.test.ts src/explore/ui/organizeFlow.test.ts src/explore/composeFlowCatalog.test.ts
```

Regen wizard modules (rare): see **Wizard regen** in [`explore-flow-registry.md`](./explore-flow-registry.md).
