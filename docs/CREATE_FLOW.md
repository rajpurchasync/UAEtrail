# Create flow — FAB: Organize, Find, Add

**Canonical product spec** for the explore map **+ FAB** (Organize · Find · Add). Read this before changing intent sheets, create wizards, join CTAs, or participation behavior.

**Vocabulary:** In **UI and copy**, say **Organize**, **Find**, **Add** — not **Compose** (reserved for **message / email compose** later). On the wire, explore still uses the query param `?compose=organize:*` \| `find:*` \| `add:*` ([`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.1, §4).

**Publishing:** The **host is always a signed-in user**. When the member has multiple activity host tenants (buddy + agency/guide), the Organize **publish** step shows **Publish as** (`OrganizePublishAsField`); wire uses `x-organisation-id` for the chosen `tenantId` ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)).

Companion docs: [`DOCS_INDEX.md`](./DOCS_INDEX.md), [`NORTHSTAR.md`](./NORTHSTAR.md) (why), [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (publish gates), [`DOMAIN.md`](./DOMAIN.md) (entities), [`NAVIGATION.md`](./NAVIGATION.md) (routes), [`COMMUNICATION.md`](./COMMUNICATION.md) (DMs & crew chat), [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md) (Trips manage & invites), [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) (map card copy & CTAs).

Code (wire names): `src/explore/compose.ts`, `src/explore/routing.ts`, `CreateIntentSheet.tsx`, `organizeFlow.ts`, `demandFlow.ts`, `contributeFlow.ts`.

**Status:** Product spec **approved** Â· Implementation **in progress** (see [Implementation status](#implementation-status))

**Last updated:** 2026-09-23

---

## Voice

**Nomadtable-style:** warm, plain, crew-first â€” not host-console or architecture language.

| Prefer | Avoid |
|--------|--------|
| I would like toâ€¦ | Create (OK in casual copy; FAB uses Organize) |
| Organize Â· Find Â· Add | **Compose** (FAB), Host Â· Find a group Â· Add a place |
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

**Organize (buddy host)** requires **profile completion** (`signupProfileComplete` — same member details as `/welcome`). `GET /me/host-status` → `canPublish` provisions a personal guide-owned tenant on first check. Gate failure → `/welcome?redirect=…` (not Pro Membership). **Agency / shop / professional** → `/profile/pro-membership` and `canHostPaidActivities` / business tenants.

### Find â†’ (demand / â€œlooking forâ€)

| UI label | Maps to (`ParticipantIntentKind`) |
|----------|-----------------------------------|
| **Rideshare** | `rideshare` |
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

**Organize venue pick:** Hiking/camping use **`GET /places/registry`** (see `DOMAIN.md` § Place registry). Publish: `src/services/organizeActivityPublish.ts` → **`POST /host/activities`** + **`POST /host/activities/:id/publish`** with active tenant header (`buildHostActivityPublishPayload` in `activityPublishPayload.ts`; client: `createHostActivity` / `publishHostActivity` — not `*OrganisationActivity*`). **Admin place/venue catalog** (trails, camps, event venues): `/admin/places` (`AdminPlaces.tsx`) — not the explore compose wizard.

---

## Organize â†’ Activity (general outdoors)

**Intent:** runs, climbs, workshops, social outings â€” fifth **outing category** (`activities`), not hiking/camp/event/rideshare.

**Wizard:** `organize:activity` â†’ **FLOW-05** (step order in `organizeFlows/activities.ts`, UI in `organizeWizard/steps/`):

1. **Activity type** â€” chip (run, climb, yoga, social, â€¦) â†’ `outingTopic` on publish
2. **Title** â†’ **When** â†’ **Where (meeting)** pin early
3. **Participants** (capacity + limits) â†’ **Who can join?** (public/private + approval vs RSVP)
4. **Price** â†’ instructions â†’ **Going from** â†’ transportation â†’ **Publish**

**Storage (v1):** `activityType: event`, `outingCategory: activities`, `outingTopic` from type chip, `participationMode` default `approval`.

Hiking / Camping / **Event** / **Rideshare** remain **separate** organize branches (Activity = `organize.activities` in `composeFlowCatalog.ts`).

---

## Event vs Activity (organize)

| | **Event** | **Activity** (generic buddy) |
|---|-----------|-------------------------------|
| **Examples** | Trail run, marathon, group race, outdoor festival | â€œI want to runâ€, â€œneed a jog buddyâ€, casual crew |
| **Organize entry** | Organize â†’ **Event** | Organize â†’ **Activity** |
| **Type picker** | Event wizard (title, when, â€¦) | **Activity type** chips (run, climb, â€¦) |
| **Default join** | **Iâ€™m going** (RSVP, no host queue) | **Request to join** (host approves) |
| **Creator toggle** | Can require approval | Can allow open RSVP |

Both use the same creator question:

> **Do people need my OK to join?**  
> - **No** â†’ **Iâ€™m going** (engagement; adds to profile Up next)  
> - **Yes** â†’ **Request to join** â†’ host approves â†’ Up next  

Toggle applies to **all organize kinds** (Hiking, Camping, Event, Activity) on the **audience** step â€” **Rideshare** is always approval. Defaults differ.

### Women-only audience

When organizers set **Women only** (stored as a `requirements` line), the API enforces join eligibility on **request to join**, **Iâ€™m going (RSVP)**, and **host approval**:

- Profile gender **`female`** â€” can join.
- **`male`** â€” blocked.
- **Missing gender** or **`prefer_not_to_say`** â€” blocked until the member sets **female** on their profile (signup/settings).

Code: `assertParticipantMeetsWomenOnlyRequirement` in `apps/api/src/domain/activity-audience-requirements.ts`.

---

## Participation model

**Separate from map visibility.** `joinMode: open | private` controls **map vs link-only**; do not overload it for RSVP vs approval.

### Field (shipped)

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

### Detail / explore CTAs

| `participationMode` | Primary CTA | Secondary |
|---------------------|-------------|-----------|
| `rsvp` | **I'm going** | View details |
| `approval` | **Request to join** | View details |

**Full detail page vs map peek** is **not** `participationMode` or `joinMode` alone — it is **viewer access / detail exposure** (who may open `/activity/:id` with a full payload). Canonical model: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15. UI maps API `viewerAccess` via `src/access/resolvePeekDetailAccess.ts` — do not add client-side policy.

**Consumer activity detail** (`/activity/:id`): mobile tabs **Plan · Place · Buddies · Transport** (UI labels only). **Participation → crew:** `participationMode: rsvp` creates **participant** immediately → `canAccessCrewSurfaces: true` + welcome sheet; **approval** flow grants crew only after host approve (same welcome + `?joined=1` deep link). **Pending / waitlisted** may open detail but **not** crew surfaces (`canAccessCrewSurfaces: false`) — no meeting precision or group chat in UI. **Transport tab** always on (reach-by from published organize fields; linked child rideshare when set). **Pro** (paid) vs **host** (profile + publish): Pro unlocks social depth on activity (full buddy roster, pre-join host profile, offer/add transport when product rules ship) — **not** `canPublish`; see [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) · Layer 7 `applyActivityViewEntitlements` after social access.

**Single FE engagement resolver:** `src/activity/activityDetailPresentation.ts` (detail flags) + `src/activity/activityPeekEngagement.ts` (map peek / list feed); legacy import path `resolveActivityPresentation.ts` re-exports both. **Peek wire actions:** API `viewerAccess.mapPeekActions` from `computeActivityMapPeekActions`; client resolves via `resolveActivityMapPeekActions` (fallback when wire empty, strips pre-join `message_host` until Pro entitlements). Peek body: **Going** + **Rides & spots** strips (`ExploreActivityPeekStrips`). Do not add a second role matrix in components. Navigation: [`NAVIGATION.md`](./NAVIGATION.md) § Activity detail · checklist §21 in [`experiment/member-surfaces-implementation-plan.md`](./experiment/member-surfaces-implementation-plan.md).

---

## Demand (Find) — who is the host?

The member who posts a **demand** pin is the **host** for that plan (they are looking for crew, not asking a stranger to take over).

### Demand join model (locked)

| Rule | Demand | Organize (activity) |
|------|--------|---------------------|
| **Map visibility** | Always **public** when pinned — no `joinMode`, no private demand | `joinMode` open or private |
| **How others join** | **Request to join** only — poster approves on the intent | **I'm going** (`rsvp`) or **Request to join** (`approval`) |
| **RSVP / instant join** | **Never** — no `participationMode` on intents | Host chooses `participationMode` |
| **Storage** | Intent stub + **`activity_requests`** (M2c canonical) | RSVPs + `activity_requests` |

Demand is **not** a lightweight RSVP activity. Do not add **I'm going**, private pins, or `participationMode` to `participant_intents`.

**Explore map wire:** seeking pins use `source: 'activity'`, `activityMode: 'seeking'`, id **`activity:{activityId}`** (legacy `demand:{intentId}` pre-M1 backfill only). Join: **`POST /activities/:id/requests`**. Card presentation may still use `source: 'demand'` for copy only.

| Who | Peek actions |
|-----|----------------|
| **Poster** | Manage plan · remove from map · optional linked rideshare offer (approved publish gate) |
| **Everyone else** | **Request to join** (same language as approval-mode activities) · **Message** |
| **Guest** | Sign-in gate on join / message |

When the poster is ready to run a dated outing on the map, they **Organize → publish** an activity — they remain the host. That published row has its **own** `participationMode` / `joinMode` for **new** discoverers. Approved demand joiners are **enrolled on the linked activity** when the poster calls `POST /me/participant-intents/:id/link-activity` (host-approved `activity_requests` + participants — even if the activity is RSVP for strangers). Join requests on the intent: `POST /me/participant-intents/:id/requests`.

**Not used:** third-party “fulfill / convert” (another member publishing on behalf of the poster). Legacy `?fulfillIntent=` links only reopen the pin.

**Catalog:** `src/explore/composeFlowCatalog.ts` (one entry per FAB path). **Tests:** `npm run test:explore-alignment`, `demandFlow.test.ts`.

---

## Reorganize a past outing (host)

From **Activities** hub or host console: **Reorganize on map** opens explore with the matching organize wizard prefilled from the prior row (`organizeFromActivity.ts`). **Publish always creates a new activity id** (audit lineage via optional `clonedFromActivityId` on create).

**Duplicate** in the host console still creates a **server draft** for the legacy activity form — same source outing, different UX.

Deep link: `exploreReorganizeActivityPath(activityId, kind)` in `src/explore/routing.ts`.

---

## Going from (activities only)

**Required** for all **Organize** and **Find** activity flows (hiking, camping, event, activity, rideshare demand).

| Flow | Label | Notes |
|------|-------|-------|
| Organize (all kinds) | **Going from** | Map pin + optional note; replaces â€œMeeting pointâ€ in UI copy |
| Find (all kinds) | **Going from** | Unify rideshare â€œLeaving fromâ€ â†’ **Going from** |
| Add (places) | **Pin on the map** / location | Not â€œGoing fromâ€ |

Validation: cannot continue without a placed pin (and label where applicable).

### Area (registry — not the meeting pin)

Organize **does not** infer area from meeting or going-from pins. **Area** is an admin-registered row (`areaId`). **Place** rows carry **`place.areaId`**. Activities inherit geography only through **`locationId` → place**.

| Organize | Rule |
|----------|------|
| **Public map** | Pick a **catalog place** from the registry; that place must have **`place.areaId`** (admin links in `/admin/places`). No separate area field on publish. |
| **Custom trail name** (no registry row) | Not valid for public map — use **Add** to create a place (select **area** first), then Organize from catalog. |
| **Private** link-only | Not on public explore map; place area optional |

Publish gate (API): `place_area_required` / `activity_area_required` when linked place has no **`areaId`**.

**Add (place):** **Area** step first (`curatedArea`), then emirate + map pin; API **`POST /me/locations`** requires **`areaId`** (published area validated server-side).

### Find (looking for)

Dedicated step **Area & map pin**: choose registered **Area**, drop a pin → `POST /me/participant-intents` **`areaId`** + coordinates. Seeking activity dual-write sets **`place.areaId`** on the synthetic location (not `activity.areaId`).

**`preferredArea`** (emirate chip on hiking/camp) is region copy only — not the **Area** registry id. Area + pin enables matching hosted outings in the same area (notifications phased).

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
| `outingCategory` / `outingTopic` on organize publish | âœ… | âœ… (host create; map projection + Others browse filters) |
| Organize **area via place** (registry `place.areaId` only) | âœ… | âœ… (`validateOrganizePlaceArea`, publish gate) |
| Find **area + pin** step | âœ… | âœ… (`curatedArea`, `participant_intents.areaId`) |
| Add place **area-first** | âœ… | âœ… (`curatedArea`, `areaId` on submit) |
| Organize **no custom trail anchor** (catalog or Add) | âœ… | âœ… (structured); rideshare anchor uses bounds match + `areaId` on place |
| Explore **Locations** lens = area pins (not every place pin) | ✅ | ✅ (`pinKind=locations`) |
| Area match notifications (seeking ↔ hosted in area) | âœ… | ðŸ”¶ phased |

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

Host console **lists** outings on `/host/activities`; **create / edit on map** uses the same explore **Organize** wizard (`CreateActivityFlow.tsx`, `navigateToReorganizeActivity`). Admin **location/venue detail** stays on `/admin/places`.

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
| Compose auth gates | `src/explore/exploreComposeRouteGuard.ts` |
| Explore URL helpers | `src/explore/routing.ts` (`explorePath`, `compose=â€¦`) |
| FAB entry | `CreateIntentSheet.tsx` |
| Shell | `ExploreExperience.tsx` â€” orchestration; hooks `useExploreComposeRoute`, `useExploreMapViewport`, `useExploreSelectionActions` |
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
