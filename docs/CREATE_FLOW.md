# Create flow — FAB, organize, find, add

**Canonical product spec** for the explore map **+ FAB** compose experience. Read this before changing intent sheets, create wizards, join CTAs, or participation behavior.

Companion docs: [`NORTHSTAR.md`](./NORTHSTAR.md) (why), [`DOMAIN.md`](./DOMAIN.md) (entities), [`NAVIGATION.md`](./NAVIGATION.md) (routes), [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) (map card copy & CTAs).

Code: `src/explore/compose.ts`, `src/explore/routing.ts`, `CreateIntentSheet.tsx`, `organizeFlow.ts`, `demandFlow.ts`, `contributeFlow.ts`.

**Status:** Product spec **approved** · Implementation **in progress** (see [Implementation status](#implementation-status))

**Last updated:** 2026-09-23

---

## Voice

**Nomadtable-style:** warm, plain, crew-first — not host-console or architecture language.

| Prefer | Avoid |
|--------|--------|
| I would like to… | Create |
| Organize · Find · Add | Host · Find a group · Add a place |
| Going from | Meeting point · Leaving from (in activity flows) |
| I’m going | Request to join (when RSVP mode) |
| Request to join | Host approval workflow (in consumer copy) |
| Do people need my OK to join? | Participation mode · joinMode architecture |

---

## FAB entry (level 1)

**Header:** `I would like to…`

Three compact choices (drill-down in the same sheet — not three tall architectural cards):

| Choice | User meaning | Opens |
|--------|--------------|--------|
| **Organize** | I’m putting a plan on the map | Organize sub-menu → host publish wizard |
| **Find** | I’m looking for people / a ride / a crew | Find sub-menu → demand wizard |
| **Add** | I’m adding a place to the map catalog | Add sub-menu → contribute wizard |

**Layout:** Sheet height fits content; warm tone; 2-col chips or tight rows on level 2. See [`NAVIGATION.md`](./NAVIGATION.md) § Explore FAB.

---

## Level 2 — sub-options

### Organize → (host publish)

| UI label | Maps to | Default participation |
|----------|---------|------------------------|
| **Hiking** | `activityType: hiking` | Host approval |
| **Camping** | `activityType: camping` | Host approval |
| **Event** | `activityType: event` | Open RSVP (**I’m going**) |
| **Activity** | Generic buddy plan (see below) | Host approval |

**Organize requires** an approved host profile (`canPublish`) — unchanged unless product says otherwise. Gate failure → `/become-host`.

### Find → (demand / “looking for”)

| UI label | Maps to (`ParticipantIntentKind`) |
|----------|-----------------------------------|
| **Rideshare** | `carpool` |
| **Hiking** | `hiking` |
| **Camping** | `camping` |
| **Activities** | `event` (runs, jogs, general outdoors) |

Any signed-in member — no host approval to post demand.

### Add → (place catalog)

| UI label | Maps to (`ContributeVenueKind`) |
|----------|----------------------------------|
| **Camping Spots** | `camping` |
| **Hiking Trails** | `hiking` |
| **Shops** | `shop` |
| **Others** | `event` (parks, beaches, outdoor places) |

**Add uses “pin on the map” / location** — not **Going from** (places are not trips).

---

## Organize → Activity (generic buddy)

**Intent:** “I want company for something outdoors — user names it.”

**No type sub-picker.** After tapping **Organize → Activity**, go straight to a **generic buddy wizard**:

1. **What do you want to do?** — free text (e.g. *Morning jog*, *Sunset run*, *Beach walk*). Placeholder: *Run, jog, trail run — whatever gets you outside.*
2. **When** — date + time (or flexible)
3. **Going from** — map pin + label (**required**)
4. **Do people need my OK to join?** — default **Yes** (approval). Optional **No** → open RSVP
5. **Price** — Free · Cost shared · Paid (same as today)
6. **Publish** — friendly review

**Storage (v1):**

- `activityType`: `event` (general scheduled outing bucket)
- `title`: user’s free text
- `participationMode`: default `approval` (see below)

Hiking / Camping / **Event** (marathon, trail run as *event*) remain **separate** organize branches with their own defaults.

---

## Event vs Activity (organize)

| | **Event** | **Activity** (generic buddy) |
|---|-----------|-------------------------------|
| **Examples** | Trail run, marathon, group race, outdoor festival | “I want to run”, “need a jog buddy”, casual crew |
| **Organize entry** | Organize → **Event** | Organize → **Activity** |
| **Type picker** | Event wizard (title, when, …) | **None** — free-text “what” first |
| **Default join** | **I’m going** (RSVP, no host queue) | **Request to join** (host approves) |
| **Creator toggle** | Can require approval | Can allow open RSVP |

Both use the same creator question:

> **Do people need my OK to join?**  
> - **No** → **I’m going** (engagement; adds to profile Up next)  
> - **Yes** → **Request to join** → host approves → Up next  

Toggle applies to **all organize kinds** (Hiking, Camping, Event, Activity) — defaults differ.

---

## Participation model

**Separate from map visibility.** Today `joinMode: open | private` only controls **map vs link-only**. Do not overload it for RSVP vs approval.

### New field (planned)

```ts
participationMode: 'rsvp' | 'approval'
```

| Mode | Member CTA | Host work | Profile |
|------|------------|-----------|---------|
| **`rsvp`** | **I’m going** | See who’s going; no approve queue | Adds to **Up next** immediately |
| **`approval`** | **Request to join** | Approve / reject requests | Up next after approval |

### Defaults by organize choice

| Organize choice | Default `participationMode` |
|-----------------|----------------------------|
| Hiking | `approval` |
| Camping | `approval` |
| Event | `rsvp` |
| Activity (generic) | `approval` |

### Detail / explore CTAs (when implemented)

| `participationMode` | Primary CTA | Secondary |
|---------------------|-------------|-----------|
| `rsvp` | **I’m going** | View details |
| `approval` | **Request to join** | View details |

Update [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) when shipped.

---

## Going from (activities only)

**Required** for all **Organize** and **Find** activity flows (hiking, camping, event, activity, rideshare demand).

| Flow | Label | Notes |
|------|-------|-------|
| Organize (all kinds) | **Going from** | Map pin + optional note; replaces “Meeting point” in UI copy |
| Find (all kinds) | **Going from** | Unify rideshare “Leaving from” → **Going from** |
| Add (places) | **Pin on the map** / location | Not “Going from” |

Validation: cannot continue without a placed pin (and label where applicable).

---

## Implementation status

Track what is **spec** vs **shipped**. Update this table in the same PR that lands code.

| Area | Spec | Code |
|------|------|------|
| FAB header “I would like to…” | ✅ | ✅ |
| Organize / Find / Add labels | ✅ | ✅ |
| Level-2 drill-down in one sheet | ✅ | ✅ |
| Skip duplicate type pickers | ✅ | ✅ |
| Organize → Activity generic wizard | ✅ | ✅ |
| `participationMode` + RSVP API | ✅ | ⬜ (stored in requirements until Phase C) |
| **I’m going** CTA on detail | ✅ | ⬜ |
| Going from label (organize + find) | ✅ | ✅ |
| Warm copy pass in wizards | ✅ | 🟡 (FAB + key steps; full pass ongoing) |

**Current code:** One compose route on `/explore?compose=…` (menu, `organize:hiking`, `find:carpool`, `add:shop`). Legacy `request`, `contribute`, and `addLocation` params are parsed into the same contract. Desktop and mobile share the same URL + wizard components.

### Naming (no `Mobile` prefix)

Explore compose uses **one responsive stack** — not separate mobile/desktop implementations. File names match product intent:

| Intent | UI component | Flow logic |
|--------|--------------|------------|
| Shell | `ExploreExperience.tsx` | `compose.ts`, `routing.ts` |
| Organize | `CreateActivityFlow.tsx` | `organizeFlow.ts` |
| Find | `CreateDemandFlow.tsx` | `demandFlow.ts` |
| Add | `CreateContributeFlow.tsx` | `contributeFlow.ts` |
| FAB menu | `CreateIntentSheet.tsx` | — |
| Map pin | `CreatePlacePicker.tsx` | — |

Host console editing (`CreateActivityModal`, `/host/*`) is a **separate surface** — do not merge with explore compose.

---

## Phased delivery

| Phase | Scope |
|-------|--------|
| **A** | This doc + cross-links (authority) |
| **B** | FAB entry: copy, layout, drill-down, route `{ intent, kind }` |
| **C** | `participationMode` API + **I’m going** + profile Up next |
| **D** | Organize wizards: Going from, approval toggle, Activity generic path |
| **E** | Explore/detail CTAs + card copy per mode |
| **F** | Tests + `explore-ux-spec.md` CTA table |

Do **not** ship Event organize with RSVP marketing until Phase C exists.

---

## Code map (target)

| Concern | File(s) |
|---------|---------|
| Copy + route contract | `src/explore/compose.ts` |
| Explore URL helpers | `src/explore/routing.ts` (`explorePath`, `compose=…`) |
| FAB entry | `CreateIntentSheet.tsx` |
| Shell | `ExploreExperience.tsx` — reads `parseExploreCompose(searchParams)` |
| Organize wizard | `CreateActivityFlow.tsx`, `organizeFlow.ts` |
| Find wizard | `CreateDemandFlow.tsx`, `demandFlow.ts` |
| Add wizard | `CreateIntentSheet.tsx` (submenu), `CreateContributeFlow.tsx`, `contributeFlow.ts` |
| Map pin UI | `CreatePlacePicker.tsx` |
| Join / RSVP UI | `JoinRequestModal.tsx`, `ActivityDetail.tsx`, `joinRequestUi.ts` |
| API | `apps/api/src/lib/activity-engagement-store.ts` (extend for RSVP) |
| Shared types | `packages/shared-types` — `participationMode` on `ActivityDTO` |

---

## Anti-patterns

- Using **Host** as the FAB primary label for consumers  
- **Activity** organize path that forces Hiking/Camping/Event sub-picker first  
- **Meeting point** / **Leaving from** mixed labels in the same product  
- Overloading `joinMode` (public/private) for RSVP vs approval  
- **Going from** on **Add** place flows  
- Shipping Event RSVP UX without backend RSVP path  

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-09-23 | FAB: **I would like to…** → Organize · Find · Add |
| 2026-09-23 | Organize sub-options: Hiking, Camping, Event, Activity |
| 2026-09-23 | Find sub-options: Rideshare, Hiking, Camping, Activities |
| 2026-09-23 | Add sub-options: Camping Spots, Hiking Trails, Shops, Others |
| 2026-09-23 | **Event** = outdoor events (runs, marathons); default **RSVP** |
| 2026-09-23 | **Activity** = generic buddy (“run, jog…”); **no type picker**; default **approval** |
| 2026-09-23 | Creator toggle: **Do people need my OK to join?** on all organize kinds |
| 2026-09-23 | **Going from** + map pin required on Organize + Find activity flows |
| 2026-09-23 | Nomadtable-style warm copy; avoid architectural language in consumer UI |
