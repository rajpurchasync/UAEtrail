# Create flow — FAB: Host · Find crew · Add on map

**Canonical product spec** for the explore map **+ FAB** (**Host** · **Find crew** · **Add on map**). Read this before changing intent sheets, create wizards, join CTAs, or participation behavior.

**Program:** Implementation follows **Program CPC** ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4, debt **C26**). **CPC-9+** ships v3 `?compose=` wire (`host` \| `seek` \| `add`); leftover plan/contribute/organize/find tokens are not accepted.

**Vocabulary (UI):** **Host** · **Find crew** · **Add on map** — not **Compose** (reserved for **message / email compose** later). Bottom nav **Plan** (`/plan`) = *your* schedule and availability — not the FAB ([`NAVIGATION.md`](./NAVIGATION.md)).

**Vocabulary (wire):** Explore query `?compose=…` — **v3** `host:<kind>` \| `seek:fixed:<kind>` \| `seek:flexible` \| `add:place:*` \| `add:facility:*`. Leftover plan/contribute/organize/find tokens are not accepted ([`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.7).

**Domain lens** ([`DOMAIN.md`](./DOMAIN.md) § What · Where · Who · How): **Host** / **Find crew (fixed)** → **What** (Activity). **Find crew (flexible)** → `member_availability` (people layer, no map pin). **Add on map** → **Where** (Place or Facility). **Who** (Person / Host / Operator) is chosen when publishing or on detail — not a FAB branch. **How** (join, RSVP, approvals) is **context only** on activity/place/facility surfaces — `viewerAccess`, not new nouns.

**Publishing:** The **host is always a signed-in user**. **Host** shows **Publish as** when the member has multiple activity-capable tenants (`HostingPublishAsField`); wire uses `x-organisation-id` ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)). **Publishing workspace** (agency / shop / guide console) is **`/publishing/*`** (HTTP **`/publishing/*`**) — not on the FAB.

Companion docs: [`DOCS_INDEX.md`](./DOCS_INDEX.md), [`NORTHSTAR.md`](./NORTHSTAR.md), [`MEMBER_MODEL.md`](./MEMBER_MODEL.md), [`DOMAIN.md`](./DOMAIN.md), [`NAVIGATION.md`](./NAVIGATION.md), [`COMMUNICATION.md`](./COMMUNICATION.md), `src/explore/exploreCopy.ts`.

Code (today): `src/explore/compose.ts`, `CreateIntentSheet.tsx`, `SeekFlexibleComposeSheet.tsx`, `hostingFlowEngine.ts` / `hostingFlows/*`, `seekingFlowEngine.ts`, `addFlow.ts`.

**Status:** Spec **approved (CPC)** · **Host · Find crew · Add on map** FAB + v3 compose wire **shipped** (`host` \| `seek` \| `add` only; see [Implementation status](#implementation-status))

**Last updated:** 2026-10-29

---

## Voice

**Nomadtable-style:** warm, plain, crew-first â€” not host-console or architecture language.

| Prefer | Avoid |
|--------|--------|
| I would like toâ€¦ | Create (OK in casual copy) |
| **Host** · **Find crew** · **Add on map** | **Compose** (FAB), legacy Plan/Contribute/Organize/Find/Add in new copy |
| I'm hosting / I'm looking for people | Separate top-level **Find** menu |
| Add a place or facility on the map | **Contribute** as API name; backend = place/facility **submit** |
| Going from | Meeting point Â· Leaving from (in activity flows) |
| Iâ€™m going | Request to join (when RSVP mode) |
| Request to join | Host approval workflow (in consumer copy) |
| Do people need my OK to join? | Participation mode Â· joinMode architecture |

---

## FAB entry (level 1)

**Header:** `I would like to…` (or equivalent warm prompt)

**Three** compact choices (drill-down in the same sheet):

| Choice | User meaning | Opens |
|--------|--------------|--------|
| **Host** | Publish an outing you lead | Kind grid → `hostingFlowEngine` / `hostingFlows/*` |
| **Find crew** | Looking for people to go with | **Post on map** (kind → `seekingFlowEngine`) or **Share availability** (`member_availability` sheet) |
| **Add on map** | Trail, camp, outdoor spot, or **facility** | Place vs facility → catalog submit |

**Disambiguation:** Bottom nav **My Plans** (`/plan`) = upcoming commitments + availability — not this FAB.

**Layout:** Mobile stays a peek sheet you pull up to full screen. Tablet and desktop (`md+`) use **one scrollable form page** for all text/choice fields, then separate full screens for map pins, photos (when needed), and publish/review. Warm tone; section headings on wide forms. See [`NAVIGATION.md`](./NAVIGATION.md) § Explore FAB.

### Legacy FAB labels

| Legacy UI | Maps to |
|-----------|---------|
| Plan → hosting / Organize | **Host** |
| Plan → seeking / Find | **Find crew** → post on map |
| Contribute / Add | **Add on map** |

---

## Level 2 — Host (activity kinds)

Kind grid (hiking, camping, rideshare, event, other activity) → hosting wizard. Wire: `host:<kind>`.

## Level 2 — Find crew

| Mode | User meaning | Wizard | Gates |
|------|--------------|--------|-------|
| **Post on map** (fixed) | One seeking plan with a place | `seekingFlowEngine` → seeking activity | Sign-in only |
| **Share availability** (flexible) | Days + activities; location **open**, region, or area (all optional) — no pin | `PlanAvailabilitySection` / `member_availability` | Sign-in only |

**Find crew browse (Available tab):** directory of everyone who saved availability with slots in the selected date range (`GET /explore/people/availability`) — optional map area / activity filter only; **not** personalized match to the viewer. Day + activity-type **notifications** and optional post-save **hosted outing** preview are separate.

**Map read path (seeking):** `activity:{id}` on explore map; manage via **`/me/seeking-posts`**; join **`POST /activities/:id/requests`**. Leftover `pin=demand:` is not a product path.

### Hosting (was Organize)

| UI label | Maps to | Default participation |
|----------|---------|------------------------|
| **Hiking** | `activityType: hiking` | Host approval |
| **Camping** | `activityType: camping` | Host approval |
| **Event** | `activityType: event` | Open RSVP (**I'm going**) |
| **Activity** | Generic buddy plan (see below) | Host approval |

**Hiking and camping** take the meeting point from the chosen spot or venue. Edit opens search, a map pin, or coordinate edit. **Hiking host wizard** starts with the title, when, an approved catalog venue, and the meeting point. **Hiking and event** **What to bring** is a packing checklist (must-have vs nice-to-have, with typical hiking kit defaults). **Strict** join requires ticking every must-have and a full-name digital signature; **Lenient** only shows the list. The last step before publish is where you live or start the drive. **Use my location** or an optional pin names the community and city (for example Al Barsha, Dubai). The consented coordinates are stored as `originLat` / `originLng` with `originLabel` so later matching can find people leaving from the same place. The label is what the host sees.

**Host / publish** requires **profile completion** (`profileComplete` on `GET /me/status` — same member details as `/welcome`). `publish.canPublish` provisions a community tenant on first check. Gate failure → `/welcome?redirect=…` (not Pro Membership). **Join / participate** requires **sign-in** and a complete **safety profile** (`medicalSafetyProfileComplete` — `/settings/safety`), not profile completion. **Rideshare host** selects a saved car (`/profile/vehicles`, `GET /me/vehicles`); riders see make, model, color, and year. **Community rideshare destination** (wizard **To** step) searches outing meeting points and approved catalog places (`GET /geo/rideshare-destinations`). A new place needs a hike/camp/spot kind, **a photo**, and a pin inside a published area (region and country come from that area) via `POST /me/places`; the ride stays in review until the place is approved. **Pro** hosts pin any destination on the map. Back from **My cars** or **Safety** during the wizard returns to the host step at the same scroll position with that control focused. **Pro membership** (`/profile/pro-membership`) adds a **guide**, **agency**, or **shop** public profile — not community Host / publish. **Paid** pricing (`canHostPaidActivities` = linked business tenant) requires publish-as **agency, shop, or partner**. Individual professionals (no business license on platform) stay **free + shared** only.

**Activity pricing (host / publish):** one mode per outing — `free` · `shared` · `paid` — with a single indicative AED amount when not free. **No tiered packages** and **no in-app payments** (amounts are informational; members settle with the host offline). **Who may set which mode** (`allowedActivityPricingModes`): everyone who can host → **free + shared**. **Paid** only when the member is **linked to a verified business** (`hostTiers.business`) **and** publishes as **agency, shop, or partner** — not as an individual guide (community / pro guide). External registration URLs are **parked** (not in product UI/API).

### Seeking (was Find)

| UI label | Maps to (`ParticipantIntentKind`) |
|----------|-----------------------------------|
| **Rideshare** | `rideshare` |
| **Hiking** | `hiking` |
| **Camping** | `camping` |
| **Activities** | `event` (runs, jogs, general outdoors) |

Any signed-in member — no host approval to post seeking.

### Add on map (was Contribute)

| Branch | Examples | API (target) |
|--------|----------|--------------|
| **Place** | Trail, camp, outdoor other | `POST /me/places` |
| **Place (gear shop)** | FAB **Shops** (`add.place.shop`) — name, pin, about, keywords, delivery, phone, email | `POST /me/places` with shop metadata (`catalogPlaceSubmit.ts`); wizard steps in `addFlows/shop.ts` — **no** product-catalog step |
| **Facility** | Toilet, rest area, parking, water, viewpoint, amenity-only pins (incl. legacy `outdoor_shop`) | `POST /me/facilities` with `facilityKind`, `areaId`, optional `parentPlaceId` |

**Not Add on map:** **Operator shop storefront** (Pro tenant, `/publishing/*` console, `EntityKind.shop` tenant) — separate **Pro membership** onboarding ([`DOMAIN.md`](./DOMAIN.md) § Shop layers C).

**Add on map uses place/facility pin** — not **Going from** (catalog rows are not trips).

**Submissions inventory:** `/profile/submissions` (redirect from `/contributions`) — pending moderation; no full public detail until approved ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4.1).

**Host venue pick:** Hiking/camping use **`GET /places/catalog`** (legacy alias `/places/registry`; see `DOMAIN.md` § Place catalog). Publish: `src/services/hostingActivityPublish.ts` → **`POST /host/activities`** + **`POST /host/activities/:id/publish`** with active tenant header (`buildHostActivityPublishPayload` in `activityPublishPayload.ts`; client: `createHostActivity` / `publishHostActivity` — not `*OrganisationActivity*`). **Admin place/venue catalog** (trails, camps, event venues): `/admin/places` (`AdminPlaces.tsx`) — not the explore compose wizard.

---

## Organize â†’ Activity (general outdoors)

**Intent:** runs, climbs, workshops, social outings â€” fifth **outing category** (`activities`), not hiking/camp/event/rideshare.

**Wizard:** `host:activity` → **FLOW-05** (step order in `hostingFlows/activities.ts`, UI in `hostingWizard/steps/`):

1. **Activity type** â€” chip (run, climb, yoga, social, â€¦) â†’ `outingTopic` on publish
2. **Title** â†’ **When** â†’ **Where (meeting)** pin early
3. **Participants** (capacity + limits) â†’ **Who can join?** (public/private + approval vs RSVP)
4. **Price** â†’ instructions â†’ **Going from** â†’ transportation â†’ **Publish**

**Storage (v1):** `activityType: event`, `outingCategory: activities`, `outingTopic` from type chip, `participationMode` default `approval`.

Hiking / Camping / **Event** / **Rideshare** remain **separate** host branches (generic buddy activity = `host.activity` in `composeFlowCatalog.ts`).

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

**Consumer activity detail** (`/activity/:id`): **scroll layout** — published facts from the same L1 card as map peek (`buildActivityDetailPageShellCard`) + **Transport strip** (reachable by / vehicle lines from Host capture; **rideshare available** when linked; host **Offer rideshare** when entitled). No Plan/Place/Buddies/Transport tabs on the public route (`consumerDetailLayout`; embed/manage sheet keeps tabbed `ActivityDetailView`). **Participation → crew:** RSVP → `canAccessCrewSurfaces: true` + welcome sheet; approval grants crew after host approve (`?joined=1`). Pending viewers see published facts + join CTAs only — no meeting precision or crew chat until entitled. **Pro** vs **host:** Pro unlocks roster / pre-join host profile / transport offer per Layer 7 — not `canPublish`; see [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

**Engagement policy (L1 shipped):** `resolveActivityEngagementPolicy` drives **explore** `mapPeekActions` / `mapPeekStrips` and **detail** `presentation` on `GET /activities/:id`. **Peek + detail CTAs:** wire ids only (`executeActivityMapPeekAction`). **FE:** consumer page `ActivityConsumerDetailPage` (alias `ActivityConsumerDetailBody`) — Getting there uses `ActivityPeekLinkedTransport`; peek `ActivityDiscoveryPublishedBody` in `MapPeekShell`. Navigation: [`NAVIGATION.md`](./NAVIGATION.md) § Activity detail.

---

## Seeking (Find crew) — who is the host?

The member who posts a **seeking** pin is the **host** for that plan (they are looking for crew, not asking a stranger to take over).

### Seeking join model (locked)

| Rule | Seeking | Host (activity) |
|------|---------|-----------------|
| **Map visibility** | Always **public** when pinned — no `joinMode`, no private seeking | `joinMode` open or private |
| **How others join** | **Request to join** only — poster approves on the seeking activity | **I'm going** (`rsvp`) or **Request to join** (`approval`) |
| **RSVP / instant join** | **Never** — no `participationMode` on seeking rows | Host chooses `participationMode` |
| **Storage** | Seeking **`activities`** + **`activity_requests`** | RSVPs + `activity_requests` |

Seeking is **not** a lightweight RSVP activity. Do not add **I'm going**, private pins, or `participationMode` to seeking rows.

**Explore map wire:** seeking pins use `source: 'activity'`, `activityMode: 'seeking'`, id **`activity:{activityId}`**. Leftover `demand:` ids and `source: 'demand'` are not accepted. Join: **`POST /activities/:id/requests`**.

| Who | Peek actions |
|-----|----------------|
| **Poster** | Manage plan · remove from map · optional linked rideshare offer (approved publish gate) |
| **Everyone else** | **Request to join** (same language as approval-mode activities) · **Message** |
| **Guest** | Sign-in gate on join / message |

When the poster is ready to run a dated outing on the map, they **Host → publish** an activity — they remain the host. That published row has its **own** `participationMode` / `joinMode` for **new** discoverers. Approved seeking joiners are **enrolled on the linked activity** when the poster calls `POST /me/seeking-posts/:id/link-activity` (host-approved `activity_requests` + participants — even if the activity is RSVP for strangers). Join requests on the seeking post: `POST /me/seeking-posts/:id/requests`.

**Not used:** third-party “fulfill / convert” (another member publishing on behalf of the poster). Legacy `?fulfillIntent=` links only reopen the pin.

**Catalog:** `src/explore/composeFlowCatalog.ts` (one entry per FAB path). **Tests:** `npm run test:explore-alignment`, `seekingFlowEngine.test.ts`.

### One activity model (Find crew + Host on the map)

| Concept | Wire | Join (others) | Host (publisher) |
|---------|------|---------------|------------------|
| **Find crew** (looking for company) | `activities` + `activityMode: seeking`, map id `activity:{activityId}` | Request to join only (`POST /activities/:id/requests`) | Activity **host** — manages plan, join queue, optional **linked transport** |
| **Host** (dated outing) | `activities` + `activityMode: hosted` | RSVP or request per `participationMode` | Host — share, manage, optional **linked transport** |

`participant_intents` is leftover ops/backfill storage only; the **map pin and join target** are always the **activity row**. UI must not treat Find as a non-activity “demand-only” product surface.

### Linked transport (child rideshare activity)

Optional **published rideshare** linked to a **parent** plan (hiking, camping, or Activities/event). **Not** available when the parent plan itself is a **rideshare** Find post.

| Mechanism | Use |
|-----------|-----|
| **Publish child rideshare** with `linkedActivityId` → parent + `linkedRideshareActivityId` on parent | Add seats / transport while the parent stays open (Find crew or Host) |
| **`POST /me/seeking-posts/:id/link-activity`** | **Graduate** find crew onto a **new hosted** outing (`convertedActivityId`, intent fulfilled) — **not** for publishing a transport child |

**Find → Link transport** prefill must set `linkToParentActivityId` to the **seeking activity id** (`resolveSeekingParentActivityId` in `linkActivityRideshareOffer.ts`). **Never** call `link-activity` when publishing `activityType: rideshare` (`hostingActivityPublish.ts`).

**Gates:** profile `canPublish` to create transport; Pro `canOfferTransport` / `canAddLinkedRide` for peek/manage CTAs (see `activity-viewer-entitlements.ts`).

**Distinction:** Find wizard **Transport** step (“Rideshare needed”) = joiner metadata on the post. **Link rideshare** on peek = host publishes a **child** rideshare activity on the map.

### Coherence program (hosted + seeking)

Tracked in [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) **§8.2 S12**. Phases:

| Phase | Outcome | Status |
|-------|---------|--------|
| **S12a** | Correct transport publish (parent `linkToParentActivityId`; no `link-activity` on rideshare publish) | **Done** |
| **S12b** | Unified **host** map peek for any activity you own (`activityMode` only changes join/copy) | **Done** |
| **S12c** | Find post-publish + manage parity with Organize (`LinkRidesharePanel`, `ActivityManageSheet`) | **Done** |
| **S12d** | Intent-only map peek removed; seeking pins use activity wire + unified peek stack; guards in `seekingPinHygieneGuard` / `seekingPeekUnificationGuard` | **Done** |

---

## Host from an existing outing

From **Plan hosted** or publishing workspace: **Edit on map** opens explore with the matching Host wizard prefilled from the prior row (`hostingFromActivity.ts`). **Publish always creates a new activity id** (audit lineage via optional `clonedFromActivityId` on create).

**Duplicate** in the publishing workspace still creates a **server draft** for the leftover activity form — same source outing, different UX.

Deep link: `exploreHostFromActivityPath(activityId, kind)` in `src/explore/routing.ts`.

---

## Going from (activities only)

**Required** for all **Host** and **Find crew** activity flows (hiking, camping, event, activity, rideshare seeking).

| Flow | Label | Notes |
|------|-------|-------|
| Host (all kinds) | **Going from** | Map pin + optional note; replaces leftover “Meeting point” in UI copy |
| Find crew (all kinds) | **Going from** | Unify rideshare leftover “Leaving from” → **Going from** |
| Add (places) | **Pin on the map** / location | Not â€œGoing fromâ€ |

Validation: cannot continue without a placed pin (and label where applicable).

### Area (registry — not the meeting pin)

Host **does not** infer area from meeting or going-from pins. **Area** is an admin-registered row (`areaId`). **Place** rows carry **`place.areaId`**. Activities inherit geography only through **`locationId` → place**.

| Host | Rule |
|------|------|
| **Public map** | Pick a **catalog place** from the registry; that place must have **`place.areaId`** (admin links in `/admin/places`). No separate area field on publish. |
| **Custom trail name** (no registry row) | Host submits a **DRAFT** place (`POST /me/places`) with **pin**, **a photo**, and description. Area is inferred from the pin; if none matches, host picks an existing area or names a new one (`proposedAreaName` → draft area). City is stamped from the pin. Outing stays draft until admin approves the spot (and publishes a linked new area); then the place is `registryListed`, the outing publishes, and host/company/guides are notified (`activity_venue_live`). |
| **Private** link-only | Not on public explore map; place area optional |

Publish gate (API): `activity_area_required` when the linked place and the activity row both lack a persisted **`areaId`**. Catalog gaps are filled by seed / `scripts/backfill-location-area-ids.ts`, not by guessing an area on each read. Rideshare anchors still **write** `areaId` onto the place from the pin when the host publishes.

**Add (place/facility):** **Area** step first (`curatedArea`), then country + region (emirate, province, governorate, or municipality) and map pin; API **`POST /me/places`** / **`POST /me/facilities`** with **`countryCode`** (required — no default) and **`areaId`** (published area validated server-side). **Lifecycle:** one member **submit** → pending on `/profile/submissions` — **not** draft + publish like hosted activities ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4.10).

### Find (looking for)

Dedicated step **Area & map pin**: choose registered **Area**, drop a pin → `POST /me/seeking-posts` **`areaId`** + coordinates. Seeking activity dual-write sets **`place.areaId`** on the synthetic location (not `activity.areaId`).

**`preferredArea`** (emirate chip on hiking/camp) is region copy only — not the **Area** registry id. Area + pin enables matching hosted outings in the same area (notifications phased).

---

## Implementation status

Track what is **spec** vs **shipped**. Update this table in the same PR that lands code. **Program CPC** checklist: [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4.6.

| Area | Spec (CPC) | Code (today) |
|------|------------|--------------|
| FAB **Host · Find crew · Add on map** | ✅ | ✅ (`CreateIntentSheet`, `compose.ts`) |
| FAB header “I would like to…” | ✅ | ✅ |
| `?compose=` (`host` / `seek` / `add`) only | ✅ | ✅ (`compose-route.ts`) |
| Level-2 drill-down in one sheet | ✅ | ✅ |
| Skip duplicate type pickers | ✅ | ✅ |
| Host → Activity generic wizard | ✅ | ✅ |
| `participationMode` + RSVP API | ✅ | ✅ |
| **I'm going** CTA on detail | ✅ | ✅ |
| Going from label (host + seek) | ✅ | ✅ |
| Profile Up next unified feed | ✅ | ✅ |
| Warm copy pass in wizards | ✅ | ✅ |
| `outingCategory` / `outingTopic` on host publish | ✅ | ✅ (host create; map projection + Others browse filters) |
| Host **area via place** (registry `place.areaId` only) | ✅ | ✅ (`validateHostingPlaceArea`, publish gate) |
| Find crew (fixed) **area + pin** step | ✅ | ✅ (`curatedArea`, seeking `activities.areaId`) |
| Add on map place **area-first** | ✅ | ✅ (`curatedArea`, `areaId` on submit) |
| Host **custom spot → admin review** (pin + photo; city from coords) | ✅ | ✅ (`PENDING_VENUE_PLACE_PREFIX`; auto-publish on place approve) |
| Find crew (flexible) **Share availability** FAB sheet | ✅ | ✅ (`SeekFlexibleComposeSheet`, `PlanAvailabilitySection` variant `fab`) |
| Plan **Available** lens — hosted outing hint after save | ✅ | ✅ (`PlanAvailabilitySection` + `match-preview` when outings align) |
| Host publish — Find crew availability count notice (explore map banner; operator activities list) | ✅ | ✅ (`hostPublishAvailabilityNoticeMessage` + `GET /explore/people/availability`) |
| Compose shell `hostWizardOpen` prop | ✅ | ✅ (`ComposeHost`; `planHostingWizardOpen` removed) |
| Explore **Locations** lens (legacy URL) | Alias of **Spots** — Area is **not** a pin | ✅ (`pinKind=locations` → places) |
| Area match notifications (seeking ↔ hosted in area) | ✅ | ✅ (`seeking-area-match-notifications.ts`) |
| Availability ↔ hosted (date + activity type; notify + FAB hosted preview) | ✅ | ✅ (`availability-hosted-match-notifications.ts`, `GET /me/availability/match-preview` → `hostedOutings` only) |
| **Find crew → Available** tab (all members with future slots in range) | ✅ | ✅ (`GET /explore/people/availability` — not match-preview) |

**Current code:** `/explore?compose=…` is **host / seek / add** (`host:hiking`, `seek:fixed:hiking`, `seek:flexible`, `add:place:hiking`, `add:facility:*`). Leftover plan/contribute/organize/find/request/addLocation query keys are not compose. One Host tree: `create/hosting` + `hostingFlowEngine` + `hostingFlows`. Seeking: `seekingFlowEngine` (no `demandFlow.ts` shim).

### Module naming (CPC-9a)

**Do not add** a separate create-flow doc — rules live here and in [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4.9.

| Rule | Meaning |
|------|---------|
| **`Explore*` on hooks/components** | Map/browse shell only (`useExploreMapViewport`, pin peek). **Not** FAB compose — compose mounts on `/explore` **and** `/list`. |
| **`src/explore/create/`** | Cross-surface compose: URL state, guards, `ComposeHost`, hosting prefill/reorganize. |
| **Product verbs in shell props** | `hostWizardOpen` on `ComposeHost` (+ `seekFixedWizardOpen`, `addWizardOpen`); hook/model may still expose `planHostingWizardOpen` alias. Product = Host / Find crew / Add on map. |
| **Wizard modules (catalog `wizard` field)** | `hostingFlow` → `hostingFlowEngine.ts` + `hostingFlows/*`; `seekingFlow` → `seekingFlowEngine.ts`. Removed: `hostingFlow.ts` facade, `seekingFlow.ts`, `organizeFlow.ts`, `organizeFlows/`, `createOrganize/`, `hostingCatalog/`, `CreateActivityFlow.tsx`. |
| **“Catalog” in code** | **Place/facility inventory only** (`GET */catalog`, Add-on-map submit). Per-kind **hosting** wizards = `hostingFlows` (`HostingKindFlow`) — not catalog. |
| **“Plan” in code** | Bottom nav `/plan` (schedule + availability) — **not** the FAB. FAB wire: `host:*` \| `seek:*` \| `add:*`. |
| **Compose flow ids** | `host.*` / `seek.fixed.*` / `add.*` via `composeFlowIds.ts`. |
| **`Explore` in URLs** | `explorePath({ compose })` stays — that is the **route**, not the module name. |

### Naming (no `Mobile` prefix)

One responsive stack — not separate mobile/desktop implementations.

| Product (FAB) | UI host / wizard | Flow logic (legacy module names) |
|----------------------------|------------------|----------------------------------|
| Compose shell | `create/ComposeHost.tsx`, `CreateIntentSheet.tsx` | `compose.ts`, `create/composeRouteGuard.ts`, `create/hooks/useComposeRoute.ts` |
| **Host** | `create/hosting/HostingFlowHost` → `CreateHostingActivityFlow.tsx` | `hostingFlowEngine.ts`, `hostingFlows/*` |
| **Find crew** (fixed) | `CreateSeekingFlow.tsx` | `seekingFlowEngine.ts` |
| **Find crew** (flexible) | `SeekFlexibleComposeSheet.tsx` | `PlanAvailabilitySection` (`variant=fab`) |
| **Add on map** | `CreateAddFlow.tsx`, `CreateAddFacilityFlow.tsx` | `addFlow.ts`, `addFacilityFlow.ts` |
| Map browse shell | `ExploreExperience.tsx` | `useExploreExperienceModel`, map hooks |
| Place picker | `CreatePlacePicker.tsx` | — |

Hosting prefill (linked rideshare, reorganize from activity) → `create/hooks/useHostingWizardPrefill.ts` + `useHostingFromActivity.ts` — not `useExploreRideshareOrganizeLinks`.

Plan **hosted** tab lists outings; **create on map** uses the Host wizard (`CreateHostingActivityFlow.tsx`, `navigateToReorganizeActivity`). Admin catalog stays on `/admin/places`.

---

## Phased delivery

| Phase | Scope |
|-------|--------|
| **A** | This doc + cross-links (authority) |
| **B** | FAB entry: copy, layout, drill-down, route `{ intent, kind }` |
| **C** | `participationMode` API + **Iâ€™m going** + profile Up next |
| **D** | Host wizards: Going from, approval toggle, Activity generic path |
| **E** | Explore/detail CTAs + card copy per mode |
| **F** | Tests + `explore-ux-spec.md` CTA table |

Do **not** ship Event Host with RSVP marketing until Phase C exists.

---

## Code map (target)

| Concern | File(s) |
|---------|---------|
| Copy + route contract | `src/explore/compose.ts`, `packages/shared-types/compose-route.ts` |
| Compose URL + auth | `src/explore/create/hooks/useComposeRoute.ts`, `create/composeRouteGuard.ts` |
| Hosting prefill / open | `create/hooks/useHostingWizardPrefill.ts`, `useHostingFromActivity.ts` |
| Wizard host (FAB) | `create/ComposeHost.tsx` |
| Explore URL helpers | `src/explore/routing.ts` (`explorePath`, `compose=…`) |
| FAB entry | `CreateIntentSheet.tsx` |
| Map shell | `ExploreExperience.tsx`, `useExploreExperienceModel` (map/browse hooks only) |
| Hosting wizard | `CreateHostingActivityFlow.tsx`, `hostingFlowEngine.ts`, `hostingFlows/*` |
| Seeking wizard | `CreateSeekingFlow.tsx`, `seekingFlowEngine.ts` |
| Add on map wizard | `CreateAddFlow.tsx`, `CreateAddFacilityFlow.tsx`, `addFlow.ts`, `addFacilityFlow.ts`; `catalogPlaceSubmit.ts` / `catalogFacilitySubmit.ts` |
| Map pin UI | `CreatePlacePicker.tsx` |
| Join / RSVP UI | `JoinRequestModal.tsx`, `ActivityDetail.tsx`, `joinRequestUi.ts` |
| API | activities publish, `POST /me/seeking-posts`, `POST /me/places` / `POST /me/facilities` |
| Shared types | `packages/shared-types` — compose wire, `participationMode` on `ActivityDTO` |

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
