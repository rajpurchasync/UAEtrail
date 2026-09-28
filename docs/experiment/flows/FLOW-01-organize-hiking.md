# FLOW-01 — Organize · Hiking (`organize.hiking`)

**Status:** Confirmed (2026-09-27) — 13-step wizard  
**Catalog:** `src/explore/composeFlowCatalog.ts` → `organize.hiking`  
**Code:** `compose.ts` → `CreateActivityFlow` + `organizeFlow.ts` + `organizeHikingWizardSteps.tsx` (+ shared audience/participants kits with camping)

---

## Summary

Signed-in **host** (complete host profile / `canPublish`) publishes a **hiking** outing on the explore map. Join style is **host’s choice** (`participationMode`: approval or RSVP). Separate wizard from Find and Add.

| Field | Value |
|-------|--------|
| Compose intent | Organize |
| Outing category | Hiking |
| Storage | `activities` (+ ephemeral map-pin `locations` row on publish) |
| Explore map | `source: activity`, `kind: hiking`; dual pins when `meetingDifferent` |
| Host required | Yes (`canPublish`) |

---

## Preconditions

| Check | If fail |
|-------|---------|
| Signed in | Redirect to sign-in; return URL includes `compose=organize:hiking` |
| Host profile complete | Redirect to `/become-host` when selecting Hiking |
| Host tenant loaded | Error on publish: host profile message |

---

## Journey (click → publish)

Tap **+** on explore → **Organize** → **🥾 Hiking**  
**URL:** `/explore?compose=organize:hiking`  
**UI:** Intent sheet closes; **`CreateActivityFlow`** opens with `kind: hiking` (no type picker).

---

## Wizard steps (13 — fixed order)

Each step: back chevron, title from `createFlowStepTitle`, **Next** (or map confirm). Validation via `validateDraftStep`.

| # | Step ID | Screen title | What user does |
|---|---------|--------------|----------------|
| 1 | `title` | **Give it a title** | Hike title |
| 2 | `when` | **When are you going?** | Date; flexible or start + approximate end time |
| 3 | `meeting` | **Going from** | Drop **going-from** pin; optional directions (`goingFromNotes`) |
| 4 | `audience` | **Who can join?** | **Public vs private event** first · if **public**, **approval to join** (Yes — I need to approve / No — they can just come) · private → approval only (link-only) |
| 5 | `spots` | **Participants** | Capacity · Anyone vs Limited (women only, min age) · pets |
| 6 | `price` | **Price** | Free / shared / paid |
| 7 | `destination` | **Where are you going?** | Trail or area from registry or custom name (no difficulty here) |
| 8 | `difficulty` | **How difficult is the hike?** | Easy / Medium / Hard for **this outing** (prefilled from registry trail when picked) |
| 9 | `about_trail` | **About the trail** | Description (activity body) |
| 10 | `meeting_point` | **Meeting point** | Second pin if different from going-from · label · directions |
| 11 | `join_kit` | **What joiners should bring or know** | Required gear/rules text |
| 12 | `transportation` | **Transportation** | Sedan vs **4x4 required** (trailhead access) |
| 13 | `publish` | **Preview and publish** | Summary · optional **Offer carpool** · **Publish** |

**Map pins on explore:** Primary pin = going-from (`startLat`/`startLng`); second pin = meeting point when coords differ (`meetingDifferent`).

**Participation:** Step 4 sets `participationMode`. Default **approval**; host may switch to RSVP before publish.

**Map visibility:** Public / Private sets `joinMode`. Private outings are excluded from public explore map payload.

---

## Publish (step 13)

| | |
|--|--|
| **Validate** | `validateDraftStep('publish', draft)` — both pins, title, trail, about, join kit, price, transportation |
| **API sequence** | `submitPlace` → `createOrganisationActivity` → `publishOrganisationActivity` |
| **Payload** | `startLat/Lng` = going-from; `meetingLat/Lng` = meeting point; `meetingDifferent`; `aboutTrail` → description; `joinKit` → requirements; vehicle access in requirements |
| **Carpool flag** | Optional on publish: spawns / links a **FLOW-04 rideshare** activity (target). Interim: `carPoolEnabled` + host peek link — see FLOW-04 § Linked rides |
| **Success** | `onPublished(activity)` · compose cleared · map refreshes |

---

## Peek & detail (alignment)

- Headline: `{host} is going hiking on {date}` (see `explore-presentation.ts`)
- Card: title, directions, price, restrictions, spots, join CTA from `participationMode`
- Host peek: Message · Check in attendees

---

## Out of scope

- Find (Demand) hiking — separate flow
- Add trail catalog — `add.trail`
- Full rideshare compose — `organize.rideshare` (future FAB)
