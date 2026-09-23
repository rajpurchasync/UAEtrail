# Create flow â€” FAB, organize, find, add

**Canonical product spec** for the explore map **+ FAB** compose experience. Read this before changing intent sheets, create wizards, join CTAs, or participation behavior.

Companion docs: [`NORTHSTAR.md`](./NORTHSTAR.md) (why), [`DOMAIN.md`](./DOMAIN.md) (entities), [`NAVIGATION.md`](./NAVIGATION.md) (routes), [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) (map card copy & CTAs).

Code: `src/explore/compose.ts`, `src/explore/routing.ts`, `CreateIntentSheet.tsx`, `organizeFlow.ts`, `demandFlow.ts`, `contributeFlow.ts`.

**Status:** Product spec **approved** Â· Implementation **in progress** (see [Implementation status](#implementation-status))

**Last updated:** 2026-09-23

---

## Voice

**Nomadtable-style:** warm, plain, crew-first â€” not host-console or architecture language.

| Prefer | Avoid |
|--------|--------|
| I would like toâ€¦ | Create |
| Organize Â· Find Â· Add | Host Â· Find a group Â· Add a place |
| Going from | Meeting point Â· Leaving from (in activity flows) |
| Iâ€™m going | Request to join (when RSVP mode) |
| Request to join | Host approval workflow (in consumer copy) |
| Do people need my OK to join? | Participation mode Â· joinMode architecture |

---

## FAB entry (level 1)

**Header:** `I would like toâ€¦`

Three compact choices (drill-down in the same sheet â€” not three tall architectural cards):

| Choice | User meaning | Opens |
|--------|--------------|--------|
| **Organize** | Iâ€™m putting a plan on the map | Organize sub-menu â†’ host publish wizard |
| **Find** | Iâ€™m looking for people / a ride / a crew | Find sub-menu â†’ demand wizard |
| **Add** | Iâ€™m adding a place to the map catalog | Add sub-menu â†’ contribute wizard |

**Layout:** Sheet height fits content; warm tone; 2-col chips or tight rows on level 2. See [`NAVIGATION.md`](./NAVIGATION.md) Â§ Explore FAB.

---

## Level 2 â€” sub-options

### Organize â†’ (host publish)

| UI label | Maps to | Default participation |
|----------|---------|------------------------|
| **Hiking** | `activityType: hiking` | Host approval |
| **Camping** | `activityType: camping` | Host approval |
| **Event** | `activityType: event` | Open RSVP (**Iâ€™m going**) |
| **Activity** | Generic buddy plan (see below) | Host approval |

**Organize requires** an approved host profile (`canPublish`) â€” unchanged unless product says otherwise. Gate failure â†’ `/become-host`.

### Find â†’ (demand / â€œlooking forâ€)

| UI label | Maps to (`ParticipantIntentKind`) |
|----------|-----------------------------------|
| **Rideshare** | `carpool` |
| **Hiking** | `hiking` |
| **Camping** | `camping` |
| **Activities** | `event` (runs, jogs, general outdoors) |

Any signed-in member â€” no host approval to post demand.

### Add â†’ (place catalog)

| UI label | Maps to (`ContributeVenueKind`) |
|----------|----------------------------------|
| **Camping Spots** | `camping` |
| **Hiking Trails** | `hiking` |
| **Shops** | `shop` |
| **Others** | `event` (parks, beaches, outdoor places) |

**Add uses â€œpin on the mapâ€ / location** â€” not **Going from** (places are not trips).

---

## Organize â†’ Activity (generic buddy)

**Intent:** â€œI want company for something outdoors â€” user names it.â€

**No type sub-picker.** After tapping **Organize â†’ Activity**, go straight to a **generic buddy wizard**:

1. **What do you want to do?** â€” free text (e.g. *Morning jog*, *Sunset run*, *Beach walk*). Placeholder: *Run, jog, trail run â€” whatever gets you outside.*
2. **When** â€” date + time (or flexible)
3. **Going from** â€” map pin + label (**required**)
4. **Do people need my OK to join?** â€” default **Yes** (approval). Optional **No** â†’ open RSVP
5. **Price** â€” Free Â· Cost shared Â· Paid (same as today)
6. **Publish** â€” friendly review

**Storage (v1):**

- `activityType`: `event` (general scheduled outing bucket)
- `title`: userâ€™s free text
- `participationMode`: default `approval` (see below)

Hiking / Camping / **Event** (marathon, trail run as *event*) remain **separate** organize branches with their own defaults.

---

## Event vs Activity (organize)

| | **Event** | **Activity** (generic buddy) |
|---|-----------|-------------------------------|
| **Examples** | Trail run, marathon, group race, outdoor festival | â€œI want to runâ€, â€œneed a jog buddyâ€, casual crew |
| **Organize entry** | Organize â†’ **Event** | Organize â†’ **Activity** |
| **Type picker** | Event wizard (title, when, â€¦) | **None** â€” free-text â€œwhatâ€ first |
| **Default join** | **Iâ€™m going** (RSVP, no host queue) | **Request to join** (host approves) |
| **Creator toggle** | Can require approval | Can allow open RSVP |

Both use the same creator question:

> **Do people need my OK to join?**  
> - **No** â†’ **Iâ€™m going** (engagement; adds to profile Up next)  
> - **Yes** â†’ **Request to join** â†’ host approves â†’ Up next  

Toggle applies to **all organize kinds** (Hiking, Camping, Event, Activity) â€” defaults differ.

---

## Participation model

**Separate from map visibility.** Today `joinMode: open | private` only controls **map vs link-only**. Do not overload it for RSVP vs approval.

### New field (planned)

```ts
participationMode: 'rsvp' | 'approval'
```

| Mode | Member CTA | Host work | Profile |
|------|------------|-----------|---------|
| **`rsvp`** | **Iâ€™m going** | See whoâ€™s going; no approve queue | Adds to **Up next** immediately |
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
| `rsvp` | **Iâ€™m going** | View details |
| `approval` | **Request to join** | View details |

Update [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) when shipped.

---

## Going from (activities only)

**Required** for all **Organize** and **Find** activity flows (hiking, camping, event, activity, rideshare demand).

| Flow | Label | Notes |
|------|-------|-------|
| Organize (all kinds) | **Going from** | Map pin + optional note; replaces â€œMeeting pointâ€ in UI copy |
| Find (all kinds) | **Going from** | Unify rideshare â€œLeaving fromâ€ â†’ **Going from** |
| Add (places) | **Pin on the map** / location | Not â€œGoing fromâ€ |

Validation: cannot continue without a placed pin (and label where applicable).

---

## Implementation status

Track what is **spec** vs **shipped**. Update this table in the same PR that lands code.

| Area | Spec | Code |
|------|------|------|
| FAB header â€œI would like toâ€¦â€ | âœ… | âœ… |
| Organize / Find / Add labels | âœ… | âœ… |
| Level-2 drill-down in one sheet | âœ… | âœ… |
| Skip duplicate type pickers | âœ… | âœ… |
| Organize â†’ Activity generic wizard | âœ… | âœ… |
| `participationMode` + RSVP API | âœ… | âœ… |
| **Iâ€™m going** CTA on detail | âœ… | âœ… |
| Going from label (organize + find) | âœ… | âœ… |
| Profile Up next unified feed | âœ… | âœ… |
| Warm copy pass in wizards | âœ… | âœ… |

**Current code:** One compose route on `/explore?compose=â€¦` (menu, `organize:hiking`, `find:carpool`, `add:shop`). Legacy `request`, `contribute`, and `addLocation` params are parsed into the same contract. Desktop and mobile share the same URL + wizard components.

### Naming (no `Mobile` prefix)

Explore compose uses **one responsive stack** â€” not separate mobile/desktop implementations. File names match product intent:

| Intent | UI component | Flow logic |
|--------|--------------|------------|
| Shell | `ExploreExperience.tsx` | `compose.ts`, `routing.ts` |
| Organize | `CreateActivityFlow.tsx` | `organizeFlow.ts` |
| Find | `CreateDemandFlow.tsx` | `demandFlow.ts` |
| Add | `CreateContributeFlow.tsx` | `contributeFlow.ts` |
| FAB menu | `CreateIntentSheet.tsx` | â€” |
| Map pin | `CreatePlacePicker.tsx` | â€” |

Host console editing (`CreateActivityModal`, `/host/*`) is a **separate surface** â€” do not merge with explore compose.

---

## Phased delivery

| Phase | Scope |
|-------|--------|
| **A** | This doc + cross-links (authority) |
| **B** | FAB entry: copy, layout, drill-down, route `{ intent, kind }` |
| **C** | `participationMode` API + **Iâ€™m going** + profile Up next |
| **D** | Organize wizards: Going from, approval toggle, Activity generic path |
| **E** | Explore/detail CTAs + card copy per mode |
| **F** | Tests + `explore-ux-spec.md` CTA table |

Do **not** ship Event organize with RSVP marketing until Phase C exists.

---

## Code map (target)

| Concern | File(s) |
|---------|---------|
| Copy + route contract | `src/explore/compose.ts` |
| Explore URL helpers | `src/explore/routing.ts` (`explorePath`, `compose=â€¦`) |
| FAB entry | `CreateIntentSheet.tsx` |
| Shell | `ExploreExperience.tsx` â€” reads `parseExploreCompose(searchParams)` |
| Organize wizard | `CreateActivityFlow.tsx`, `organizeFlow.ts` |
| Find wizard | `CreateDemandFlow.tsx`, `demandFlow.ts` |
| Add wizard | `CreateIntentSheet.tsx` (submenu), `CreateContributeFlow.tsx`, `contributeFlow.ts` |
| Map pin UI | `CreatePlacePicker.tsx` |
| Join / RSVP UI | `JoinRequestModal.tsx`, `ActivityDetail.tsx`, `joinRequestUi.ts` |
| API | `apps/api/src/lib/activity-engagement-store.ts` (extend for RSVP) |
| Shared types | `packages/shared-types` â€” `participationMode` on `ActivityDTO` |

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
| 2026-09-23 | FAB: **I would like toâ€¦** â†’ Organize Â· Find Â· Add |
| 2026-09-23 | Organize sub-options: Hiking, Camping, Event, Activity |
| 2026-09-23 | Find sub-options: Rideshare, Hiking, Camping, Activities |
| 2026-09-23 | Add sub-options: Camping Spots, Hiking Trails, Shops, Others |
| 2026-09-23 | **Event** = outdoor events (runs, marathons); default **RSVP** |
| 2026-09-23 | **Activity** = generic buddy (â€œrun, jogâ€¦â€); **no type picker**; default **approval** |
| 2026-09-23 | Creator toggle: **Do people need my OK to join?** on all organize kinds |
| 2026-09-23 | **Going from** + map pin required on Organize + Find activity flows |
| 2026-09-23 | Nomadtable-style warm copy; avoid architectural language in consumer UI |
