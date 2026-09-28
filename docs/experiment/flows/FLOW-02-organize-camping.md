# FLOW-02 — Organize · Camping (`organize.camping`)

**Status:** Confirmed (2026-09-26) — 12-step wizard  
**Catalog:** `src/explore/composeFlowCatalog.ts` → `organize.camping`  
**Code:** `compose.ts` → `CreateActivityFlow` + `organizeFlow.ts` + `organizeCampingWizardSteps.tsx`

---

## Summary

Signed-in **host** (`canPublish`) publishes a **camping** outing on the explore map. Join style is the host’s choice (`participationMode`: approval or RSVP). Step pattern matches **FLOW-01** (structured organize track), with a **Transportation** step instead of hiking difficulty / publish carpool.

| Field | Value |
|-------|--------|
| Compose intent | Organize |
| Outing category | Camping |
| Storage | `activities` (`activityType: camping`) |
| Explore map | `source: activity`, `kind: camping`; dual pins when meeting ≠ going-from |
| Host required | Yes (`canPublish`) |

---

## Preconditions

Same as FLOW-01: signed in, host profile complete, tenant on publish.

---

## Journey (click → publish)

Tap **+** → **Organize** → **⛺ Camping**  
**URL:** `/explore?compose=organize:camping`  
**UI:** Intent sheet closes; **`CreateActivityFlow`** opens with `kind: camping` (no type picker).

---

## Wizard steps (12 — fixed order)

Each step: back, title from `createFlowStepTitle`, **Next**. Validation via `validateDraftStep`.

| # | Step ID | Screen title | What user does |
|---|---------|--------------|----------------|
| 1 | `title` | **Give it a title** | Camp / trip title |
| 2 | `when` | **When are you going?** | Date · flexible or start time |
| 3 | `meeting` | **Where are you going from?** | Going-from pin · optional directions |
| 4 | `audience` | **Who can join?** | Public vs private · if public, approval vs RSVP (same kit as hiking) |
| 5 | `spots` | **Participants** | Capacity presets · Anyone vs Limited restrictions · pets |
| 6 | `price` | **Price** | Free / shared / paid |
| 7 | `destination` | **Where are you camping?** | Camp or area name |
| 8 | `about_trail` | **About this camp** | Listing description (`aboutTrail`) |
| 9 | `meeting_point` | **Meeting point** | Meet pin (required) · label · directions |
| 10 | `join_kit` | **What joiners should bring or know** | Gear / rules text |
| 11 | `transportation` | **Transportation** | Sedan vs **4x4 required** |
| 12 | `publish` | **Preview and publish** | Summary · **Publish** |

**Participation & visibility:** Same as FLOW-01 step 4.

---

## Publish (step 12)

Same API chain as FLOW-01: `submitPlace` → `createOrganisationActivity` → `publishOrganisationActivity`.

Payload uses structured outing fields: `aboutTrail`, `joinKit`, `trailName` (camp name), dual pins, `vehicleAccess`, `participationMode`, `joinMode`.

---

## Out of scope

- Find camping demand — separate flow  
- Add camp catalog — `add.camp`  
- Event organize — [FLOW-03](./FLOW-03-organize-events.md) (structured; no going-from, no publish carpool)
