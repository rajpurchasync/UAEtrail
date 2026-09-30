# FLOW-04 — Organize · Rideshare (`organize.rideshare`)

**Status:** Implemented — FAB `compose=organize:carpool` · catalog `organize.rideshare` (2026-09-30)  
**Catalog:** `src/explore/composeFlowCatalog.ts` → `organize.rideshare`  
**Code:** `createOrganize/CreateOrganizeFlowHost.tsx` · `organizeFlows/rideshare.ts` · `organizeWizard/steps/*` · bodies `organizeRideshareWizardSteps.tsx` · shell `CreateActivityFlow.tsx`

---

## Summary

Signed-in **host** (`canPublish`) publishes a **standalone rideshare** (`activityType: carpool`) on the explore map: **going from** → **destination**, seats, vehicle type, price. Always **host approval to join** — no RSVP, no public/private toggle.

| Field | Value |
|-------|--------|
| Compose intent | Organize |
| Outing category | `rideshare` |
| Storage | `activities` |
| API type | `carpool` |
| Explore map | Two pins (from + to) |
| Join | **`participationMode: approval` only** · listed on map (`joinMode: open`) |
| Host required | Yes |

---

## Linked rides & “offer carpool” (architecture)

All rides use **this same organize flow**. Hike/camp/event plans do **not** embed a different carpool wizard.

| Pattern | Behaviour |
|---------|-----------|
| **Standalone ride** | Host publishes FLOW-04 only |
| **Linked to a hosted plan** | Separate `carpool` activity + **`linkedActivityId`** (or equivalent) pointing at the hike/camp/event — optional, both stay independent records |
| **Offer carpool on a plan** | Host (or flow) creates a **rideshare activity** and links it — replaces long-term reliance on `carPoolEnabled` on the outing row |
| **Multiple vehicles** | Several hosts publish rides + link to the **same** parent activity; UI collates linked rides (future host tools) |

Interim: host peek **“Link carpool”** may still set `carPoolEnabled` until link model ships — target is **standalone ride + link**.

**No** “Offer carpool” checkbox on rideshare **publish**. **No** carpool toggle after publish on the ride itself.

---

## Preconditions

Same as FLOW-01: signed in, host profile complete, tenant on publish.

---

## Journey

Tap **+** → **Organize** → **🚗 Rideshare**  
**URL:** `/explore?compose=organize:carpool`

---

## Wizard steps (10)

| # | Step ID | Screen title | What user does |
|---|---------|--------------|----------------|
| 1 | `title` | **Give it a title** | Ride label |
| 2 | `when` | **When are you going?** | Date · **Flexible** or **Set time** (same pattern as hiking/camping) |
| 3 | `meeting` | **Going from** | From pin on map · optional pickup notes |
| 4 | `to` | **Destination** | To pin |
| 5 | `audience` | **Who can join?** | **Always public on the map** · no private/RSVP · **Anyone vs Limited** (women only, min age) · **Children allowed** · **Pets allowed** |
| 6 | `spots` | **Seats** | 1–10 passengers |
| 7 | `price` | **Price** | Free · shared · paid per seat |
| 8 | `instructions` | **What riders should know** | Pickup / luggage / payment |
| 9 | `transportation` | **Transportation** | Sedan · SUV · 4x4 · Van · Pick up truck |
| 10 | `publish` | **Preview and publish** | **Publish** |

**Not in this flow:** Public vs private toggle · RSVP · approval on/off (always **request to join**).

---

## Map & peek

- Headline: `{host} is offering Rideshare…` · route · time (flexible suffix when applicable)
- CTA: **Request to join** (approval only)
- Badges: vehicle type · shared price · optional restriction lines if we add them later (v1: no women-only step)

---

## Publish

`publishOrganizeActivity` · `activityType: carpool` · dual coordinates · requirements include `Vehicle: …` and instructions.

---

## Related

- **Find a ride:** `find.carpool` (demand) — separate doc  
- **Activities / workshops:** [FLOW-05](./FLOW-05-organize-activities.md)
