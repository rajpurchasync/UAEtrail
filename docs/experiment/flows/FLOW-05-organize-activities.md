# FLOW-05 — Organize · Activity (`organize.activities`)

**Status:** Implemented — `organize:activity` → catalog `organize.activities`  
**Catalog:** `src/explore/composeFlowCatalog.ts` → `organize.activities`  
**Target code:** `CreateOrganizeActivitiesFlow` · `organizeFlows/activities.ts` · step shells `organizeWizard/steps/*` · bodies `organizeActivitiesWizardSteps.tsx`

---

## Summary

Signed-in **host** (`canPublish`) publishes a **general outdoor activity** on the explore map — runs, climbs, workshops, group outings, etc. Host picks an **activity type** first, then a **shorter wizard** than hiking: one **where people meet** pin early, **capacity**, **public/private + who can join**, **going from** later, and optional **carpool after publish** on the success screen (see FLOW-04 link API).

| Field | Value |
|-------|--------|
| Compose intent | Organize |
| Outing category | `activities` |
| Storage | `activities` |
| Explore map | `source: activity`, `outingCategory: activities`, `outingTopic` from activity-type chip |
| Default join style | **Host approval** — host may switch to **RSVP** in audience step |
| Host required | Yes (`canPublish`) |
| **Not** | Rideshare compose (FLOW-04) · full hiking trail wizard (FLOW-01) · event wizard without going-from (FLOW-03) |

---

## Preconditions

Same as FLOW-01: signed in, host profile complete, tenant loaded on publish.

---

## Journey (click → publish)

Tap **+** → **Organize** → **✨ Activity**  
**URL:** `/explore?compose=organize:activity` (alias → `organize.activities` in catalog)  
**UI:** **`CreateOrganizeActivitiesFlow`** (`composeFlowCatalog` → `organize.activities`) with **`organizeActivitiesFlow.defaultSteps`** (below).

---

## Wizard steps (12 — fixed order)

Each step: back, title from `createFlowStepTitle`, **Next** (or map confirm). Validation via `validateDraftStep`.

| # | Step ID | Screen title | What user does |
|---|---------|--------------|----------------|
| 0 | *(compose)* | **Activity type** | Pick type chip — e.g. run, climb, yoga, social (maps to `outingTopic` on publish + requirements line for legacy rows) |
| 1 | `title` | **Give it a title** | Plan title |
| 2 | `when` | **When are you going?** | Date · flexible or start time |
| 3 | `meeting_point` | **Where (meeting)** | **Map pin where people meet** · extra directions — primary explore pin for the outing |
| 4 | `spots` | **Participants** | Capacity presets · **Anyone vs Limited** (women only, min age) · **Children allowed** · **Pets allowed** |
| 5 | `audience` | **Who can join?** | **Public vs private** (map vs link-only) · **Approval vs RSVP** when public (same cards as hiking) · private → **RSVP only** (I’m going — no approval queue) |
| 6 | `price` | **Price** | Free · shared · paid |
| 7 | `instructions` | **Instructions** | What joiners should know before they come (single text — gear, rules, meet-up notes) |
| 8 | `meeting` | **Going from** | Optional **going-from** pin when departure ≠ meeting place · directions (`goingFromNotes`) |
| 9 | `transportation` | **Transportation** | **Reachable by sedan** vs **4x4 required** (venue access) |
| 10 | `publish` | **Preview and publish** | Summary · **Publish** |
| *(success)* | — | **Published** | Optional **Offer carpool** · **View on map** |

**Step 0** may live on the Organize sub-row (type chip) or as the first wizard screen — product choice; both count as “activity type” in this flow.

**Map pins:** Meet pin from step 3 (`meetingLat`/`meetingLng` or primary `start` when no separate going-from). Step 8 sets **going-from** (`startLat`/`startLng`); when coords differ, show **dual pins** on explore (same rules as FLOW-01).

**Visibility:** Step 5 `joinMode` — private outings hidden from public explore map · [PRIVATE-ORGANIZE-PLANS](./PRIVATE-ORGANIZE-PLANS.md).

**Participation:** Step 5 sets `participationMode`. Default **approval** for `organize.activities`.

**Carpool:** On **publish success** (not the publish step) when `postPublishCarpool` — optional **Offer carpool** links a **FLOW-04** rideshare (`linkedActivityId` target).

---

## Compared to nearby flows

| | FLOW-03 Event | FLOW-05 Activity |
|--|---------------|------------------|
| Activity type | Fixed (event) | **User picks topic** |
| Going from | **No step** | **Yes** (step 8) |
| Meet pin | After destination/about | **Early** (step 3) |
| Audience vs spots | Audience before spots | **Spots then audience** |
| Instruction fields | About + meeting + join kit | **One instructions step** |
| Carpool on publish | **No** | **Yes** (optional) |

---

## Publish (step 10)

| | |
|--|--|
| **Validate** | Title, when, meet pin, capacity, audience, price, instructions, transportation; going-from when `meetingDifferent` |
| **API** | Same chain as FLOW-01: `publishOrganizeActivity` · `activityType: event` (+ topic metadata when schema exists) |
| **Requirements** | Participation lines · women only / min age / children / pets · vehicle access · instructions text |
| **Carpool** | Same as FLOW-01 § linked rideshare |
| **Success** | `onPublished` · compose cleared · map refresh |

---

## Peek & detail

- Headline: host + activity type + date (presentation TBD in `explore-presentation.ts`)
- Chips: restrictions, transportation, **Carpool available** when publish flag / linked ride
- Join CTA from `participationMode` (Request to join vs I'm going)

---

## Implementation checklist (engineering)

- [x] Step list in `organizeFlows/activities.ts` (`defaultSteps` / `getSteps`) matching table above
- [x] `isActivityOrganizeFlow()` + step titles in `createFlowStepTitle`
- [x] `organizeActivitiesWizardSteps.tsx` step bodies
- [x] Wire `composeFlowCatalog` `organize.activities.organizeSteps` + `confirmationDoc`
- [x] FAB route `organize:activity` → activity wizard (not generic buddy)
- [x] Topic field on draft (`activityTopic` → requirements line until API field)

---

## Related

- [FLOW-01](./FLOW-01-organize-hiking.md) — full trail wizard · carpool on publish pattern  
- [FLOW-03](./FLOW-03-organize-events.md) — events without going-from  
- [FLOW-04](./FLOW-04-organize-rideshare.md) — linked ride from carpool checkbox  
- Find demand for activities: `find.event` in catalog (member “looking for” — separate flow)
