# FLOW-06 — Find · Hiking (`find.hiking`)

**Status:** Implemented (2026-09-28)  
**Code:** `CreateDemandFlow` + `demandFlow.ts` + `demandWizardSteps.tsx`

## Steps

| # | Step | Screen |
|---|------|--------|
| 1 | `title` | Title |
| 2 | `when` | Preferred date (**no time**) |
| 3 | `destination` | Preferred destination (**UAE emirate / region**) |
| 4 | `persons` | No of people |
| 5 | `audience` | Women-only · children · pets · **fitness level** (no public/private — always on map when pinned) |
| 6 | `from` | **Going from** map pin |
| 7 | `info` | Additional info |
| 8 | `transport` | Self transport (**vehicle type**) or carpool needed (**seat count**) |
| 9 | `review` | Review → **Submit** |

Stored: `preferredArea` = destination emirate · `latitude/longitude` = going-from pin · restrictions + transport in `comment`.

**End-to-end** (submit → peek → host propose → publish → carpool/check-in): [FLOW-DEMAND-E2E](./FLOW-DEMAND-E2E.md).
