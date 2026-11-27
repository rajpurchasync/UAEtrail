# UAE Trail — Domain model

This glossary maps **product concepts** to **code and routes**. Use it when naming pages, DTOs, and PRs. Routes and API paths stay stable during renames; component and file names may use `Organisation*` as a **code umbrella** for tenants.

**Canonical naming & routes (single table):** [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) · **Code:** `src/config/routingCatalog.ts` · **Check:** `npm run verify:domain`

**Product north star:** [`NORTHSTAR.md`](./NORTHSTAR.md) — people finding company outdoors; code entities below are *how* the product delivers that.

See also [`NAVIGATION.md`](./NAVIGATION.md) for browse vs personal-hub routing rules and [`CREATE_FLOW.md`](./CREATE_FLOW.md) for tab FABs **Create Trip · Add a venue · Find a Crew**.

## What · Where · Who · How (simple map)

Use this lens in docs and APIs — **not** extra product nouns like “destination place.”

| Lens | Question | Primary entities | Examples |
|------|----------|------------------|----------|
| **What** | What is happening? | **Activity** (+ **activity kind**) | Saturday hike, camping weekend, rideshare, “looking for crew” |
| **Where** | Where on the ground? | **AdminGeo** + **Destination** → **Place** → **Facility** | Hatta hub · Wadi Shawka trail · picnic spot on trail · toilet at trailhead |
| **Who** | Who is involved? | **Person**, **Host**, **Operator** (tenant workspace) | Member, buddy, guide/agency/shop brand — one **user** account |
| **How** | How do I take part? *(context only)* | **Participation** (join, RSVP, crew) | Request to join, I’m going, host approves, operator console |

- **Place** = the spot (trail, camp, venue) — where an **Activity** is anchored (`locationId`). Hiking and camping **are** places, not a special “destination” subtype.
- **Facility** = amenity **at or near** a place (or in an area) — rest stop, parking, water; not a substitute for Place.
- **Activity** = the plan in time; **not** stored as Place.
- **How** is context for gates (sign-in, profile, host approval, Pro depth) — implement via `viewerAccess` + `GET /me/status`, not new entity types.

Program CPC ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4) splits **Place** rows and **Facility** rows in storage; product language stays **Place** and **Facility** only.

## Core objects

| Domain | What it is | Code / storage | Public URL | Explore map |
|--------|------------|----------------|------------|-------------|
| **Place** | One map/catalog POI — typed, not a separate “venue” or “location” product | `locations`, `PlaceDTO` / `LocationDTO` | See [Place kinds](#place-one-entity-placekind) | Yes (venue / shop pins) |
| **Activity** | A scheduled outing hosted at a place | `activities`, `ActivityDTO` | `/activity/:id` | Yes |
| **Event (Host chip)** | **Host** FAB label — public happening; default **I’m going** RSVP | Same **Activity** row (`activityType: event`) | `/activity/:id` | Yes |
| **Activity (Host chip)** | **Host** FAB label — generic buddy plan (run, jog, …); default **request to join** | Same **Activity** row (see CREATE_FLOW for `activityType`) | `/activity/:id` | Yes |
| **Host** (publishing) | Always a **signed-in user** who publishes; may act **as self** or **on behalf of a business** they’re linked to | `createdById`, `hostId`, `tenantId` on activities; `tenants`, storefronts | See [Host storefronts](#host-storefronts-where-vs-who) | Via activities / seeking |
| **Person** | A member's identity (member card at `/member/:id`) | `users` (profile fields) | `/profile`, `/member/:id` | Via seeking cards |
| **User** | Auth account (login, roles, suspension) | `users`, `UserDTO`, `AuthContext` | `/signin`, `/signup` | — |

**Participation** links **Person ↔ Activity ↔ Place**. **Publishing** always has a **user** actor; activities may also reference a **business tenant** when published on behalf of a brand.

### Account funnel (product)

Everything starts with **sign-in** as a **user**. Guests may browse parts of the map; member profiles, buddies, and Pro flows require authentication.

```text
Guest → Sign in → Auth user (participate; hosting disabled until profile complete)
  → Profile complete → hosting enabled (community Host / publish)
  → Optional Pro (/profile/pro-membership)
        ├─ Individual Pro   → Guide / Pro host — public face on /member/:userId
        ├─ Business Pro     → Shop | Tour agency | … → User + operator (tenant); operator profile + map pin (shops only)
        └─ Partner Pro      → campaigns (detail later)
```

Business capabilities attach to **operator tenants** (shop/agency), each with **≥ one linked user**. Those users’ **member profiles** show the **operator name** (clickable) → agency or shop profile. Canonical vocabulary: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.1–1.5 · [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Naming vocabulary.

### Host storefronts (Where vs Who)

| Lens | Examples | Not the same as |
|------|----------|-----------------|
| **Where** | Trail, camp, **shop pin**, future partner/hotel pin | Tour **agency** (join trips without visiting a pin) |
| **Who** | Activity, seeking, **`/member/:userId`**, **agency / shop operator profiles** (not person map pins) | Calling a gear **shop** a “partner” |

**Publish as:** when a user is linked to a business (`tenant_memberships`), Host / operator desk should offer **self** vs **{business}** (dropdown). The **host on the activity is still the user**; `x-organisation-id` scopes the brand. See [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

### Member profile visibility

| Setting | Signed-in strangers | Guests |
|---------|---------------------|--------|
| **public** | **Public member card** (target; P3 API) | Sign in to view — **no** public card |
| **group_members** / **private** | Denied or trusted per relationship rules | Sign in to view |

“Public” in settings means **visible to other signed-in members**, not the open internet. Profile preview in settings should show that card, not the owner’s full self view.

### Scheduled outings — one entity, many labels (avoid “Trip” in code)

There is **no** `Trip` table, `TripDTO`, or trips API. Everything on the map that members join or hosts publish is an **Activity** (`activities`, `ActivityDTO`, `/activity/:id`).

| Word | Layer | Meaning | Use in new code |
|------|--------|---------|-----------------|
| **Activity** | Domain | Scheduled outing (hike, camp, rideshare, run, …) | `ActivityDTO`, `activityId`, org/host activity APIs |
| **Outing / plan** | Product copy | Same as activity — emotional, member-facing | UI strings, north star |
| **Host** | Action (FAB) | Host flow that **creates or edits** an activity | `compose=activity:*` (legacy `compose=host` inbound only), hosting wizards — not an entity |
| **Event** | Overloaded — read context | (1) **Place kind** → venue page `/venue/:id` (2) **Host chip** → scheduled outing `activityType: event` → `/activity/:id` (3) Legacy JSON `event` on some payloads → use **`activity`** | Never a fourth entity; prefer **place** vs **activity** in code |
| **Trip / Trips** | **Legacy UI label** | Redirects to **`/plan`** (My Plans) and **`/profile/history`** — not a domain type | `planRouting.ts`, `components/plan/*`, `components/profile-history/*` — **not** API module names |
| **Hosted** | Relationship | You publish/manage an activity as a host tenant | `HostedActivitiesSection`, org hub — not a type of outing |
| **Joined** | Relationship | You RSVP’d or have a pending join request | `getMeActivities`, `getMeRequests` |
| **Self / My plans** | Relationship | Demand or self-started compose (not host publish) | Trips tab slice; still activities or demand when persisted |

**Host menu labels** (Hiking, Camping, Event, Activity, Rideshare) are **kinds of activity** (`activityType` / compose intent), not separate products. **“Hosted activities”** in conversation means activities created via **Host** — still one `Activity` row.

### Hosted outing vs Find crew vs join (do not conflate)

| Member move | Domain | Map / compose | Join mechanism |
|-------------|--------|---------------|----------------|
| **Host a scheduled outing** | **`Activity`** (`activityMode: hosted` or omit) | `source: activity`, compose `activity:*` | Others **join this activity** — RSVP / `activity_requests` on **`/activity/:id`** |
| **Open to company / time window** | **`member_availability`** (not Activity) | `source: availability`, pin `availability:{userId}:{slotId}`, compose **`intent:*`** → `PUT /me/availability` | Peek → **profile + message**; optional rideshare offer — **not** activity join on the pin |
| **Join someone else’s published trip** | Participation on **Activity** | Opens hosted activity detail | Same join spine as row 1 — tied to one `activityId` |

**Retired (ops cleanup only):** modeling Find crew as **`activityMode: seeking`** on `activities`, `/me/seeking-posts`, `participant_intents` map pins, and `demand:` ids. See [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md) · dev purge: `npm run purge:seeking-legacy`.

### Geography (AdminGeo · Destination · Place catalog)

**Program:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.5 **MIG-DESTINATION-GEO-2026** — wire: `packages/shared-types/src/destination.ts`.

**Target hierarchy:** **AdminGeo** (country / state / locality from coordinates → **`geoRef`**) → **Destination** (curated outdoor region, e.g. Hatta — **not a map pin**) → **Place (site)** (trail, camp, outdoor spot) + **Facility** (amenity with coords) → **Activity** (geography only through a place).

| Layer | Who maintains | Assignment rule |
|-------|----------------|-----------------|
| **AdminGeo** | Geo resolver on write | **`geoRef`** from lat/lng — not hand-picked emirate as SoT (P4+) |
| **Destination** | Platform admin **`/admin/destinations`** (Mongo **`destinations`**) | Curated **name** + slug; bounds for hub camera. **`destinationId`** on places/facilities. **No** explore map pin — editorial grouping under the same country/state/city labels as pins (`geoRef`), not a replacement for the geo tree |
| **Place (site)** | Admin places + member **Add** | Hostable trail/camp/spot; **`destinationId`** required for listed catalog. Flat **`/place/:id`**; optional **`parentPlaceId`** for sub-sites only |
| **Facility** | Admin + member **Add** | **`destinationId`** + optional **`onSiteId`** (parent place row for on-trail amenities) |
| **Activity** | Host | **`activity.locationId` → place site**; destination derived from place — **no `activity.destinationId` on write** |

**Consumer wire:** **`GET /api/destinations`**, hub **`/destination/:slug`**, explore **`?destination=`**, **`resolveDestinationId`** (reads **`destinationId` only**). Retired **`/area/*`** hub bookmarks are not rewritten — **`/destination/:slug`** is canonical. **Geo tree** (`geoRef`, `/geo/n/:id`) = country → state → **area (city)** → venue; **Destination** is the separate curated outdoor hub catalog.

**Explore map lenses:** Activities · Spots (place) · Facilities · **Shops**; **Destination** is filter + hub only. Detail: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §12.1.

**Curated destination catalog (seed + tests):** 12 regions in `CURATED_DESTINATION_CATALOG` (ids `area-seed-*` preserved as **`destinationId`**).

**My Plans** (`/plan`, UI tab **Plan**) groups **your** forward layer — upcoming schedule (list or **calendar**), wishlist, goals — plus relationships to activities. Past outings and journey map live on **profile history**, not `/plan`.

| My Plans UI | Domain data |
|-------------|-------------|
| Upcoming list (joined / hosting filters) | `GET /me/activities`, `GET /me/requests`; host: `listHostActivities`, join queue. Rows open `/activity/:id`; back restores this list |
| Upcoming **calendar** (`layout=calendar`) | **Projection** of the same joined/hosting data — going / pending open `/activity/:id`; organizing / looking for company open Plan manage URLs; **available** = indicator strip only (`planCalendarOpen`) |
| Wishlist tab (`tab=wishlist`; legacy `lens=saved`) | Private venue + activity saves (`/me/wishlist`, place rows keyed by `locationId`) — not demand, not Follow. A published outing at a saved place notifies those members |
| Goals (on Wishlist tab) | `GET/POST /me/goals` |
| Share availability (intent open compose) | `PUT /me/availability` — Find crew **Free** tab; inbound `?lens=availability` → explore `compose=intent:open` |
| Journey map (`/profile/history/map`) | `memberJourneyMapApi` → `GET /me/journey-map`; pin CRUD → `/me/map-pins` |

Do **not** add `trips*` API clients or `Trip*` domain types for hosted/joined lists — reuse **activity** and **member engagement** APIs.

**Trips → chat:** Opening **crew chat** from hosted/joined manage is a **navigation** to Messages (`/messages?group=`), not a Trips API. See [`COMMUNICATION.md`](./COMMUNICATION.md).

## Communication (not separate domain entities)

| Concept | Storage | UI |
|---------|---------|-----|
| **Direct message** | Chat messages collection | `/messages?to=` |
| **Family / friends group** | `social_groups` + `social_group_wall` | `/groups` manage · `/messages?group=` chat |
| **Activity crew chat** | Same wall; `social_groups.type === 'activity'`, `activityId` set | `/messages?group=`; roster from `activity-group-chat` service |
| **Find crew (fixed slot)** | **`member_availability`** | No activity crew chat until someone hosts a separate **Activity** |

Wall post policy (`all_members` | `admins_only`) applies to group/crew threads. Unread for group threads uses membership `wallLastReadAt` + `chatPreview` on `GET /me/groups`.

## Place — catalog (`PlaceKind`)

**Place** = a real spot on the map (trail, camp, venue, outdoor_other). **Do not** use “venue” or “location” as product nouns — legacy wire only (`LocationDTO`, `?panel=venues`). **Do not** say “destination place” — a trail **is** a Place.

| Say | Meaning |
|-----|---------|
| **Place** | Where outings happen — organize picker, trail/camp detail, `activity.locationId` |
| **Place kind** | `hiking` \| `camping` \| `event` \| `outdoor_other` (`PLACE_CATALOG_KINDS` in code) |
| **Place catalog / registry** | Approved **place** rows — `GET /places/catalog` (organize picker) |
| **Activity anchor** | Minimal place row for `activity.locationId` only (`publication: anchor_only`) |

**Activities** are not places — they reference a place via `locationId`.

| Place kind | Product | Public URL (today → CPC target) |
|------------|---------|----------------------------------|
| `hiking` | **Trail** (not “hiking spot”) | `/trail/:id` → **`/place/:id`** |
| `camping` | Camping spot | `/camp/:id` → **`/place/:id`** |
| `event` | Event / meetup venue | `/venue/:id` → **`/place/:id`** |
| `outdoor_other` | Parks, beaches | `/venue/:id` → **`/place/:id`** |

**Storage (today):** Mongo `locations` (place rows). **Program CPC:** amenity rows move to **`facilities`** — trails/camps stay **places** ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4).

---

## Facility — amenity catalog (`FacilityKind`)

**Facilities** are **not** places. They are amenities (toilet, rest area, parking, water, viewpoint, …) and **member outdoor shop pins** — separate from **operator shop** storefronts.

| Field | Meaning |
|-------|---------|
| `destinationId` | Required — published Destination (Hatta, …) |
| `onSiteId` | Optional — amenity **on** a trail/camp (rest stop along route); `null` = destination-scoped only |
| `facilityKind` | `toilet`, `rest_area`, `parking`, `outdoor_shop`, … |
| `registeredByUserId` | Member or admin provenance (no “contribute API”) |

**Place detail** lists facilities with **`onSiteId = this place`** first — not “every facility in the same `destinationId`” when scoped by parent site (`apps/api/src/lib/place-nearby-facilities.ts`).

**Public URL (target):** `/facility/:id`. **FAB:** **Add → Facility** ([`CREATE_FLOW.md`](./CREATE_FLOW.md)).

---

## Shop — three layers (operator vs map pin)

| Layer | Who | Product | Surface |
|-------|-----|---------|---------|
| **A — Community pin** | Member **Add → Shops** (`add.place.shop`) | Gear shop **on the map** (informational) | `POST /me/places` (`PlaceKind.shop`) — keywords, delivery, contact; public `/shop/:id` when approved; **no** product catalog |
| **B — Catalog place** | Admin / import | Listed shop place; claim toward Pro | Admin places; optional pin |
| **C — Operator shop** | Pro **tenant** (shop owner) | Full storefront + workspace depth later | `/shop/:id`, **`/publishing/*`**, `EntityKind.shop` |

**Operator** umbrella: same person may run **guide**, **agency**, or **shop** tenant — all publish via **`/publishing/*`** ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)). **Do not** create a shop tenant from FAB Add.

**Shop listing lifecycle (layer B → C):** catalog → claimed (Pro) → managed — see [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.4.

**Wire today:** community pins may still use `locations` + `community-shop` tag until **CPC-2** backfill.

## Accounts, members, and hosts (canonical)

**Full tier / role / route map:** [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (community · professional · business).

One **user** account. Capabilities stack — they are not separate products.

### Join as a member (everyone)

Anyone can explore and join outings after **basic signup**:

| Requirement | Product | Code / route |
|-------------|---------|----------------|
| Account + verify | Email/password or Google + **OTP** | `/signup`, `/verify` |
| Member details | **Age** (DOB), **gender**, **based in** (country/city) at signup | `/welcome` → `PATCH /me/profile/signup-details` |
| Languages | Optional on profile (member details) | `PATCH /me/profile` · Profile / Settings |
| Default role | **Participant** — browse map, RSVP, request to join, demand posts, buddies, follow | `UserRole.PARTICIPANT` |

**Profile completion** = member details above (DOB, gender, based-in) — `signupProfileComplete` on `GET /me/profile`; **`profileComplete`** on **`GET /me/status`**. Required before **Host** (buddy host). Seeking and Add do not require it beyond signed-in member.

This is **not** hosting. No tenant is created until profile is complete and the member opens Host (API provisions a personal guide tenant).

### Publish trips (organizer / operator)

The **publishing actor is always a user** (human on the activity). They publish **as themselves** (buddy / individual pro) or **on behalf of a business** they own or belong to (`x-organisation-id`). Businesses are **tenants** with a **storefront** — not a substitute for the user account.

| Path | Product | Paid trips? | Code (today) |
|------|---------|-------------|--------------|
| **Community (friend)** | Free / shared-cost outings after profile complete | **No** | `publishingPurpose: community`, `canPublish` |
| **Pro — Individual** | Licensed-style **guide** brand | **No** (free + shared only) | `hostProfileType: individual`, `publishingPurpose: professional` |
| **Pro — Business** | Must pick **subtype** (Shop, Tour agency, E-commerce, Hospitality, …) | Agency / business rules | `hostProfileType` + `TenantBusinessMode` |
| **Pro — Partner** | Campaign / hospitality partner (detail later) | Campaign-linked | Planned |

**Do not conflate:** **Shop** = outdoor retail + directions (often a map pin). **Tour agency** = operator you join remotely. **Partner** = campaign/hotel-style host — not a gear shop.

**Shop listing lifecycle:** **catalog** (admin-added place/shop) → **claimed** (Pro verification) → **managed** (owner console). See `DOMAIN_CANONICALS` §1.4.

**Buddy host (Host on map):** **`profileComplete`** on `/me/status` → `publish.canPublish`; API auto-provisions a community tenant. **Host** badge → `publish.isCommunityHost` after first activity **or** seeking.  
**Pro:** `/profile/pro-membership` — Individual, Business (subtype required), or Partner applications via `host_applications` where required.

### Business account from profile

Any member may add a **business hosting identity** without replacing their personal account:

| Concept | Product | Code |
|---------|---------|------|
| Business creator | Becomes **tenant owner / admin** | `MembershipRole.TENANT_OWNER` on new tenant |
| Team | Owner invites **admins** and **guides** | `/host/team`, `POST` org team APIs; roles `TENANT_ADMIN`, `TENANT_GUIDE` |
| Publish on behalf of business | Same **user** publishes with **tenant** scope (`x-organisation-id`); picker in console / Host when linked | `/host/activities` |
| Publish as self | Individual or community tenant | Same user; no business header |

Entry UI: Profile → **Pro Membership** (`/profile/pro-membership`; legacy `/become-host` redirects) or **`/organisation/manage?kind=agency`** (and shop variant). There is not yet a single “create business” toggle that skips the host-application flow.

### Public surfaces (do not merge)

| Surface | Who it represents | Route |
|---------|-------------------|-------|
| **Member profile** | The **person** (participant or host human) | `/member/:userId` |
| **Host public profile** | The **business** brand (tenant) | `/agency/:slug`, `/partner/:slug`, `/shop/:id` |
| **Self hub** | Signed-in account settings | `/profile` |

**Follow** and **map publish notifications** attach to the **user id** of whoever published (owner or guide user on the activity), not to the tenant slug. See [`COMMUNICATION.md`](./COMMUNICATION.md) and `profile-viewer-access` for peek visibility rules.

### Participation modes (planned — see [`CREATE_FLOW.md`](./CREATE_FLOW.md))

| Mode | Member action | Host |
|------|---------------|------|
| **`rsvp`** | **I’m going** — instant; adds to Up next | See who’s going |
| **`approval`** | **Request to join** — host approves | Approve / reject queue |

**Not** the same as `joinMode` (`open` \| `private`), which controls map visibility only.

**Who may see full activity detail vs map peek** is **detail exposure** (viewer access), not `participationMode` or `joinMode`. Resolvers, policy matrix, and implementation phases: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.

**Host defaults:** Event → `rsvp`; Hiking, Camping, generic Activity → `approval`. Creator can toggle on all Host paths.

## Host vs Operator vs organisation in copy

| Context | Say | Avoid |
|---------|-----|--------|
| Umbrella (any publisher) | **Operator** (desk identity), **operator desk** (`/operator/*`) | **Organisation** in UI |
| Individual on this outing | **Host**, **Hosted by** | Organizer; organisation |
| Individual guide | **Guide**, **guide profile**, **guide desk** | — |
| Licensed business | **Agency**, **agency profile**, **agency desk** | — |
| Gear seller | **Shop**, **shop profile**, **shop desk** | — |
| Code / filenames / API aliases | `Organisation*`, `tenant`, `/publishing/*`, `x-organisation-id` | Product copy — organisation is wire only |

Helpers: `src/content/workspaceVocabulary.ts` — `workspaceConsoleLabel()`, `workspaceProfileLabel()`, `normalizeWorkspaceBrandKind()`.

### Internal code identifiers (Phase 14)

| Prefer in new code | Deprecated alias | Notes |
|--------------------|------------------|-------|
| `hostTenants`, `canPickHostTenant`, `eventHostName` | `hostOrganizations`, `canPickHostOrganization`, `eventHostOrganization` | Activity publish forms |
| `BecomeHostFormState` | `BecomeOrganisationFormState` (deprecated) | Become-host wizard |
| `HOST_CONSOLE_LINKS` | `ORGANISATION_CONSOLE_LINKS` | Console nav constant |
| `resolveProfileHostKind()` | `resolveProfileOrganisationKind()` | Profile hub |
| `hostName` (signup) | `organizationName` | Wire field on `/auth/register` |
| `hostDetails`, `shopId` (tenant profile JSON) | — | GET tenant profile sends `hostDetails` and `shopId` |
| `GET /admin/places` (admin CRUD) | `GET /admin/locations` | SPA redirect only |
| `shopId`, `/shop/merchant/*` (shop manage) | `/shop/organisation/*` inbound | Mongo collection stays `merchant_profiles` |
| `GET /shop/shops/:id` (public shop) | — | One public storefront route |

### Capabilities by host kind

| Kind | Paid trips | Typical trips |
|------|------------|---------------|
| **Guide** (individual) | No | Free / shared-cost community trips |
| **Agency** | Yes | Licensed guided adventures |
| **Shop** | N/A (no in-app checkout) | Outbound website + map/contact profile |

## Person vs User

| Term | Meaning | Use in new code |
|------|---------|-----------------|
| **Person** | Who someone is on the trail — profile, bio, explore card | Product copy, `PersonPublicProfileDTO`, `personProfilePath()` |
| **User** | Auth account — email, roles, suspension | `UserDTO`, `AuthContext`, admin auth actions |

The route `/member/:userId` uses a user id in the URL (storage key). In UI, prefer **member** or **person** over **user** unless discussing login or admin.

## Host subtypes (same tenant row)

| Subtype | Role | Map pin? | Manage |
|---------|------|----------|--------|
| **Individual Pro** | Member with Pro membership; public intro at `/member/:userId` | No | `/operator` desk; buddy Host / publish via `canPublish` |
| **Agency** | Business host; paid trips | No | `/operator/*` (agency modules) |
| **Shop** | Outdoor retail (pin + `/shop/:id`) | Physical pin typical | `/operator/*` (shop modules) + `/shop/:id` |
| **E-commerce** (Business Pro) | Online-first retail | Optional pin | TBD |
| **Hospitality** (Business Pro) | Hotels / venues | Often pin + campaigns | TBD |
| **Partner** (Partner Pro) | Campaign host | Pin + feeds (future) | TBD |

Shop identity: **tenant** (Pro Membership onboarding) + **merchant profile** (`/operator/profile`, inbound `/organisation/manage?kind=shop`), linked via `merchant_profiles.tenantId`.

## Legacy → domain naming

| Legacy term | Prefer in new code | Keep unchanged |
|-------------|-------------------|--------------|
| Location | **Place** (entity) | HTTP **`/places`** (legacy `/locations` alias); collection `locations`; `LocationDTO` — storage name only |
| Venue | **Place** (word) | Explore panel `?panel=venues` — not a second entity; map `source: venue` normalizes to `place` |
| `/host/*`, `/publishing/*` SPA | Inbound redirects | Canonical SPA `/operator/*`; HTTP `/publishing/*`; `/operator/:slug` is not a storefront |
| Merchant | Shop | `merchant_profiles`, `/merchant/:id` redirect |
| Organizer | Host (outing) or operator (desk) | — |
| Tenant | Operator (copy) / organisation (wire) | `tenants`, `x-organisation-id` |

## Page renames (routes unchanged)

| File / export | Route | Notes |
|---------------|-------|-------|
| `OrganisationProfile` | `/agency/:id`, `/partner/:id` | Public business brand profile |
| `src/operator/desk/Overview` (`Overview`) | `/operator/overview` | **Operator desk** hub (HTTP `/publishing/*`) |
| `src/operator/desk/Activities` (`Activities`) | `/operator/activities` | Tenant activity list + manage sheet |
| `src/operator/desk/JoinRequests` (`JoinRequests`) | `/operator/requests` | Activity join queue |
| `src/operator/desk/Manage` (`Manage`) | inbound `/organisation/manage` → `/operator/profile` | Redirect only — shop/agency panels on profile |
| `ProfileProMembership` (`BecomeHost` leftover inbound export) | `/profile/pro-membership` · redirects from `/become-host`, `/become-organizer` | Pro / agency / shop applications — **not** buddy Host / publish (`canPublish` via profile complete) |
| `ShopPublic` | `/shop/:id` | Public shop host |
| `pages/admin/Operators` (`Organisations`) | `/admin/hosts` | Admin copy: **Hosts** — folder is the namespace, not `AdminOrganisations.tsx` |

**Code folder:** `src/operator/{desk,public,apply}/`. **UI:** Host / Guide / Agency / Shop desk per `workspaceVocabulary.ts`.

## Place catalog vs activity anchors

| Concept | Meaning | API | On explore map? | In organize picker? |
|---------|---------|-----|---------------|---------------------|
| **Catalog place** | Admin-published or member-submitted place (approved) | `GET /places/catalog` (alias `/places/registry`), `GET /places/:id` | Yes (`source: place`; legacy `venue` / `catalog_place` read-compat) | Yes |
| **Pending contribution** | Member/host submitted, awaiting admin | `status: draft` | No | Yes (caller’s drafts in registry) |
| **Activity anchor** | `locationId` for custom outing label only | Created with `activityAnchor: true` | **No** (`registryListed: false`) | No |

**Host hiking/camping** picks a **catalog place** (`registryPlaceId` wire field) or uses a **custom label** + **activity anchor** row. **Shops** use `PlaceKind.shop` on the map; host identity remains a **tenant** at `/shop/:id` until shop rows fully live in `locations`.

**Publish pipeline (frontend):** `src/services/hostingActivityPublish.ts` → `POST /host/activities` via `buildHostActivityPublishPayload`.

## Explore browse — `OutingCategory` and `OutingTopic`

Scheduled outings and **seeking** posts on the **Activities** map layer carry plan metadata (not used on the Places catalog layer):

| Field | Values (examples) | Set by |
|-------|-------------------|--------|
| **`outingCategory`** | `hiking`, `camping`, `events`, `rideshare`, `activities` | Host flow catalog on publish; seeking kind on create; derived on read when missing |
| **`outingTopic`** | `climbing`, `trail_run`, `workshop`, `community`, … | Host **Activity** type chip → Mongo; leftover rows may derive from `requirements` (“Activity type: …”) |

**Browse filters:** map pills (`filter=hiking`, …) use category; under **Others**, `subtype=events|activities` then optional `outingTopic` for general activities. See [`NAVIGATION.md`](./NAVIGATION.md) § Browse defaults.

**Compose intents (separate lifecycles):** **Host** (`host:*` / legacy `plan:*:hosting`) → hosted `activities`; **Find crew** fixed (`seek:fixed:*` / legacy `plan:*:seeking`) → seeking `activities`; **Add on map** (`add:*` / legacy `contribute:*`) → place + **facility** catalog submits. Product detail: [`CREATE_FLOW.md`](./CREATE_FLOW.md) · Program CPC §8.4.

## Identity, routing, and audit

Every durable entity has a **stable UUID** in Mongo and a **canonical public route** (see `packages/shared-types/src/entity-path.ts`).

| Entity | Collection / store | Primary id | Public route |
|--------|-------------------|------------|--------------|
| **User** (auth + profile) | `users` | `user.id` | `/member/:userId`, `/profile` (self) |
| **Host** (publishing tenant) | `tenants` | `tenant.id` | `/agency/:slug`, `/partner/:slug`, `/shop/:id`; individuals `/member/:userId` |
| **Place** (catalog) | `locations` | `location.id` | `/trail/:id`, `/camp/:id`, `/venue/:id` — map `source: place` |
| **Facility** (amenity) | `facilities` | `facility.id` | `/facility/:id` — map `source: facility` |
| **Destination** (curated hub) | `areas` | `destinationId` (= legacy ids) | `/destination/:slug` — **no map pin** |
| **Activity** (hosted outing) | `activities` | `activity.id` | `/activity/:id` — map `source: activity` (`activity:{id}`) |
| **Member availability** (Find crew) | `member_availability` | `userId` + slot id | Map `availability:{userId}:{slotId}` — not `/activity/:id` |
| **Retired seeking storage** | `participant_intents` (ops backfill/purge only) | — | Not a product path; see runbook |

**Registration:** members via `/signup` + OTP; Pro / agency / shop via `POST /me/pro-application` (collection `host_applications`) → tenant provision; catalog places/facilities via **member submit** (`POST /me/places`, `POST /me/facilities`) + admin approval — FAB label **Add on map**, not an API noun.

**Audit:** `audit_logs` records actor, action, `entityType`, `entityId`, optional `tenantId`, and `metadata`. Host activity lifecycle actions include `activity.create`, `activity.publish`, `activity.duplicate` (server draft copy, new id), `activity.cancel`, etc. Admin UI: `/admin/audit-log`.

**Reorganize vs duplicate:**

| Flow | What happens | New activity id? |
|------|----------------|------------------|
| **Publishing workspace · Duplicate** | `POST /publishing/activities/:id/duplicate` → draft in workspace | Yes — audit `activity.duplicate` + `metadata.sourceActivityId` |
| **Explore · Reorganize on map** | `?compose=activity:…&hostFrom=:activityId` → FAB wizard prefill → publish | Yes — `activity.create` with optional `metadata.sourceActivityId` (`clonedFromActivityId` on create body) |

Reorganize never updates the source row; venue registry ids are **reused** when the draft still points at the same registry place.

## Product rules (stable)

1. Typed place URLs — `/trail`, `/camp`, `/event`.
2. Activities stay at `/activity/:id`.
3. No agency/guide map pins; **Shops** (operator storefront) may use **map pins** (Shops lens) + `/shop/:id`.
4. Shop public path `/shop/:id` — profile, contact, outbound website only; no product catalog or in-app checkout.
5. API paths may say `locations` / `merchant`; product copy says place / shop.
6. FAB compose taxonomy and participation — [`CREATE_FLOW.md`](./CREATE_FLOW.md).

**Naming adoption:** complete for frontend symbols — see [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md). Deferred: tenant/merchant collapse (shop dual-write) in [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §7 **C6**.
