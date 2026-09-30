# FLOW-03 — Organize · Events (`organize.events`)

**Status:** Implemented in code (2026-09-27) — structured wizard aligned with hiking/camping  
**Catalog:** `src/explore/composeFlowCatalog.ts` → `organize.events`  
**Code:** `CreateActivityFlow` + `organizeFlow.ts` + `organizeEventWizardSteps.tsx` (+ shared step kits)

---

## Summary

Signed-in **host** (`canPublish`) publishes an **outdoor event / group activity** (`activityType: event`) on the explore map. Structured track like hiking/camping, with **no going-from step** and **no offer-carpool on publish**.

| Field | Value |
|-------|--------|
| Compose intent | Organize |
| Outing category | `events` |
| Storage | `activities` |
| Explore map | `source: activity`, `kind: event`; **single meet pin** (no dual going-from / meet pins) |
| Default join style | **RSVP** — host may switch to **approval** in step 3 |
| Host required | Yes (`canPublish`) |

---

## Preconditions

Same as FLOW-01 / FLOW-02: signed in, host profile complete, tenant loaded on publish.

---

## Journey (click → publish)

Tap **+** → **Organize** → **🏃 Event**  
**URL:** `/explore?compose=organize:event`  
**UI:** **`CreateActivityFlow`** with `kind: event`.

---

## Wizard steps (11 — fixed order)

| # | Step ID | Screen title | What user does |
|---|---------|--------------|----------------|
| 1 | `title` | **Give it a title** | Event name |
| 2 | `when` | **When are you going?** | Date · flexible or start time |
| 3 | `audience` | **Who can join?** | Public vs private · approval vs RSVP when public · **private → RSVP only** ([PRIVATE-ORGANIZE-PLANS](./PRIVATE-ORGANIZE-PLANS.md)) |
| 4 | `spots` | **Participants** | Capacity · Anyone vs Limited · **Children allowed** · pets |
| 5 | `price` | **Price** | Free / shared / paid |
| 6 | `destination` | **Where is it happening?** | Registry `activityType=event` or custom venue name |
| 7 | `about_trail` | **About this event** | Description |
| 8 | `meeting_point` | **Meeting point** | **Map pin where people meet** (explore map pin) · label · directions |
| 9 | `join_kit` | **What joiners should bring or know** | Gear / rules |
| 10 | `transportation` | **Transportation** | Sedan vs **4x4 required** |
| 11 | `publish` | **Preview and publish** | Summary · **Publish** (no carpool offer) |

**Not in events wizard:** `meeting` / **Going from** (hiking & camping only). **Publish success (public):** **View on map** + optional **Link carpool** (FLOW-04). **Host peek:** Message · Delete · Check in · Link carpool.

**Map pin:** Meeting point coordinates only — venue registry coords used as `startPoint` / location ref when applicable.

**Visibility:** Private outings hidden from public explore map · link-only peek ([PRIVATE-ORGANIZE-PLANS](./PRIVATE-ORGANIZE-PLANS.md)).

---

## Publish

Same API chain as FLOW-01: `publishOrganizeActivity` · `activityType: event` · default **rsvp** participation · requirements include vehicle access and audience lines.

---

## Peek & detail

Same chip + CTA pattern as hiking/camping (`ExploreActivityPeekMeta`). No **Carpool available** badge from publish (events do not set `carPoolEnabled`).

---

## Related

- `organize.activities.*` — [FLOW-05](./FLOW-05-organize-activities.md) (topic variants on event wizard).
- Find demand: `find.event` · Add spot: `add.spot`
