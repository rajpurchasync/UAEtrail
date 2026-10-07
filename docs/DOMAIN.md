# UAE Trail — Domain model

This glossary maps **product concepts** to **code and routes**. Use it when naming pages, DTOs, and PRs. Routes and API paths stay stable during renames; component and file names may use `Organisation*` as a **code umbrella** for tenants.

**Canonical naming & routes (single table):** [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) · **Code:** `src/config/routingCatalog.ts` · **Check:** `npm run verify:domain`

**Product north star:** [`NORTHSTAR.md`](./NORTHSTAR.md) — people finding company outdoors; code entities below are *how* the product delivers that.

See also [`NAVIGATION.md`](./NAVIGATION.md) for browse vs personal-hub routing rules and [`CREATE_FLOW.md`](./CREATE_FLOW.md) for FAB / organize / find / add.

## Core objects

| Domain | What it is | Code / storage | Public URL | Explore map |
|--------|------------|----------------|------------|-------------|
| **Place** | One map/catalog POI — typed, not a separate “venue” or “location” product | `locations`, `PlaceDTO` / `LocationDTO` | See [Place kinds](#place-one-entity-placekind) | Yes (venue / shop pins) |
| **Activity** | A scheduled outing hosted at a place | `activities`, `ActivityDTO` | `/activity/:id` | Yes |
| **Event (organize chip)** | **Organize** FAB label — public happening; default **I’m going** RSVP | Same **Activity** row (`activityType: event`) | `/activity/:id` | Yes |
| **Activity (organize chip)** | **Organize** FAB label — generic buddy plan (run, jog, …); default **request to join** | Same **Activity** row (see CREATE_FLOW for `activityType`) | `/activity/:id` | Yes |
| **Host** (publishing) | Always a **signed-in user** who publishes; may act **as self** or **on behalf of a business** they’re linked to | `createdById`, `hostId`, `tenantId` on activities; `tenants`, storefronts | See [Host storefronts](#host-storefronts-where-vs-who) | Via activities / demand |
| **Person** | A member's identity (member card at `/member/:id`) | `users` (profile fields) | `/profile`, `/member/:id` | Via demand cards |
| **User** | Auth account (login, roles, suspension) | `users`, `UserDTO`, `AuthContext` | `/signin`, `/signup` | — |

**Participation** links **Person ↔ Activity ↔ Place**. **Publishing** always has a **user** actor; activities may also reference a **business tenant** when published on behalf of a brand.

### Account funnel (product)

Everything starts with **sign-in** as a **user**. Guests may browse parts of the map; member profiles, buddies, and Pro flows require authentication.

```text
Sign in → User (member profile, Organize as self)
  → Optional Pro membership (/profile/pro-membership)
        ├─ Individual Pro   → pro guide storefront
        ├─ Business Pro     → required subtype: Shop | Tour agency | E-commerce | Hospitality | …
        └─ Partner Pro      → campaigns / partner storefront (detail later)
```

Business capabilities (campaigns, paid trips, team) attach to **business tenants**, not to the person card alone. Canonical vocabulary: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.1–1.5.

### Host storefronts (Where vs Who)

| Lens | Examples | Not the same as |
|------|----------|-----------------|
| **Where** | Trail, camp, **shop pin**, future partner/hotel pin | Tour **agency** (join trips without visiting a pin) |
| **Who** | Activity, demand, member card, guide/agency **storefront** | Calling a gear **shop** a “partner” |

**Publish as:** when a user is linked to a business (`tenant_memberships`), Organize / host console should offer **self** vs **{business}** (dropdown). The **host on the activity is still the user**; `x-organisation-id` scopes the brand. See [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

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
| **Organize** | Action (FAB) | Host flow that **creates or edits** an activity | `compose=organize`, organize wizards — not an entity |
| **Event** | Overloaded — read context | (1) **Place kind** → venue page `/event/:id` (2) **Organize chip** → `activityType: event` (3) Legacy JSON `event` on some payloads → use **`activity`** | Never a fourth entity; prefer **place** vs **activity** in code |
| **Trip / Trips** | **UI only** | Bottom nav + `/trips` = **your** calendar (joined, hosting, wishlist) | `tripsRouting.ts`, `components/trips/*`, tab title “Trips” — **not** API module names |
| **Hosted** | Relationship | You publish/manage an activity as a host tenant | `HostedActivitiesSection`, org hub — not a type of outing |
| **Joined** | Relationship | You RSVP’d or have a pending join request | `getMeActivities`, `getMeRequests` |
| **Self / My plans** | Relationship | Demand or self-started compose (not host publish) | Trips tab slice; still activities or demand when persisted |

**Organize menu labels** (Hiking, Camping, Event, Activity, Rideshare) are **kinds of activity** (`activityType` / compose intent), not separate products. **“Organized activities”** in conversation means activities created via **Organize** — still one `Activity` row.

**Trips tab** (`/trips`) groups **your** relationships to activities and saved places:

| Trips UI | Domain data |
|----------|-------------|
| Upcoming rail / Joined list | `GET /me/activities`, `GET /me/requests` |
| Hosted list + manage sheet | Host user: `listHostActivities`, `getHostActivityJoinRequests` |
| Wishlist / Places / Shops layers | Favorites / place registry — not activities |
| `/trips/map` (outdoor map) | `memberJourneyMapApi` → `/me/trips/map` (legacy path name on server) |

Do **not** add `trips*` API clients or `Trip*` domain types for hosted/joined lists — reuse **activity** and **member engagement** APIs.

**Trips → chat:** Opening **crew chat** from hosted/joined manage is a **navigation** to Messages (`/messages?group=`), not a Trips API. See [`COMMUNICATION.md`](./COMMUNICATION.md).

## Communication (not separate domain entities)

| Concept | Storage | UI |
|---------|---------|-----|
| **Direct message** | Chat messages collection | `/messages?to=` |
| **Family / friends group** | `social_groups` + `social_group_wall` | `/groups` manage · `/messages?group=` chat |
| **Activity crew chat** | Same wall; `social_groups.type === 'activity'`, `activityId` set | `/messages?group=`; roster from `activity-group-chat` service |
| **Demand intent** | `participant_intents` | No crew chat until organized to **Activity** |

Wall post policy (`all_members` | `admins_only`) applies to group/crew threads. Unread for group threads uses membership `wallLastReadAt` + `chatPreview` on `GET /me/groups`.

## Place — one entity, `PlaceKind`

Use **Place** in product copy and new code. **Do not** introduce parallel “venue” or “location” entities — those words are legacy wire names or explore UI labels (`?panel=venues` = place list).

| Say | Meaning |
|-----|---------|
| **Place** | Any durable map/catalog POI with a stable id |
| **Place kind** | What type of POI it is (`PlaceKind`) |
| **Place registry** | Approved places hosts can pick when organizing |
| **Activity anchor** | Minimal `locations` row used only as `activity.locationId` (often not on map) |

**All kinds** live in one enum: `PlaceKind` / `PLACE_KINDS` (`packages/shared-types/src/place-kind.ts`). Add new map POIs by extending that list — never a second “planned” type.

| `PlaceKind` | Product | Wire today (typical) | Public URL |
|-------------|---------|----------------------|------------|
| `hiking` | Hiking trail | `activityType: hiking` | `/trail/:id` |
| `camping` | Camping spot | `activityType: camping` | `/camp/:id` |
| `event` | Event / meetup venue | `activityType: event` | `/event/:id` |
| `outdoor_other` | Parks, beaches (FAB Add “Others”) | `activityType: event` + `outdoor-other` tag | `/event/:id` |
| `shop` | Gear shop | `place-kind:shop` tag (+ tenant link); migrating from `merchant_profiles` | `/shop/:id` |
| `toilet`, `gas_station`, `water_refill`, `parking`, `viewpoint`, `picnic`, … | Trail amenities | `activityType: event` + `place-kind:<kind>` tag | `/event/:id` until dedicated routes |

**Activities** are not places — a scheduled outing references a place via `locationId` (registry place or activity anchor).

**Migration note:** Mongo collection stays `locations`; API paths stay `/places` (alias `/locations`). Field `activityType` on place rows remains for outdoor kinds until a optional `placeKind` column is added — use helpers `placeKindFromLocationRow` / `locationActivityTypeForPlaceKind` when branching.

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

**Profile completion** = member details above (DOB, gender, based-in) — `signupProfileComplete` on `GET /me/profile` and `/me/host-status`. Required before **Organize** (buddy host). Demand and Add do not require it beyond signed-in member.

This is **not** hosting. No tenant is created until profile is complete and the member opens Organize (API provisions a personal guide tenant).

### Become a host (publish trips)

A **host is always a user** (human actor on the activity). They publish **as themselves** (buddy / individual pro) or **on behalf of a business** they own or belong to (`x-organisation-id`). Businesses are **tenants** with a **storefront** — not a substitute for the user account.

| Path | Product | Paid trips? | Code (today) |
|------|---------|-------------|--------------|
| **Community (buddy)** | Free / shared-cost outings after profile complete | **No** | `publishingPurpose: community`, `canPublish` |
| **Pro — Individual** | Licensed-style **guide** brand | Future Pro rules | `hostProfileType: individual`, professional tenant |
| **Pro — Business** | Must pick **subtype** (Shop, Tour agency, E-commerce, Hospitality, …) | Agency / business rules | `hostProfileType` + `TenantBusinessMode` |
| **Pro — Partner** | Campaign / hospitality partner (detail later) | Campaign-linked | Planned |

**Do not conflate:** **Shop** = outdoor retail + directions (often a map pin). **Tour agency** = operator you join remotely. **Partner** = campaign/hotel-style host — not a gear shop.

**Shop listing lifecycle:** **catalog** (admin-added place/shop) → **claimed** (Pro verification) → **managed** (owner console). See `DOMAIN_CANONICALS` §1.4.

**Buddy host (Organize on map):** **profile completion** (`signupProfileComplete`) → `canPublish`; API auto-provisions a community tenant. **Host** badge → `isCommunityHost` after first activity **or** demand.  
**Pro:** `/profile/pro-membership` — Individual, Business (subtype required), or Partner applications via `host_applications` where required.

### Business account from profile

Any member may add a **business hosting identity** without replacing their personal account:

| Concept | Product | Code |
|---------|---------|------|
| Business creator | Becomes **tenant owner / admin** | `MembershipRole.TENANT_OWNER` on new tenant |
| Team | Owner invites **admins** and **guides** | `/host/team`, `POST` org team APIs; roles `TENANT_ADMIN`, `TENANT_GUIDE` |
| Publish on behalf of business | Same **user** publishes with **tenant** scope (`x-organisation-id`); picker in console / Organize when linked | `/host/activities` |
| Publish as self | Individual or community tenant | Same user; no business header |

Entry UI: Profile → **Pro Membership** (`/profile/pro-membership`; legacy `/become-host` redirects) or **`/organisation/manage?kind=agency`** (and shop variant). There is not yet a single “create business” toggle that skips the host-application flow.

### Public surfaces (do not merge)

| Surface | Who it represents | Route |
|---------|-------------------|-------|
| **Member profile** | The **person** (participant or host human) | `/member/:userId` |
| **Host public profile** | The **business or guide brand** (tenant) | `/operator/:slug` (guide/agency) |
| **Self hub** | Signed-in account settings | `/profile` |

**Follow** and **map publish notifications** attach to the **user id** of whoever published (owner or guide user on the activity), not to the tenant slug. See [`COMMUNICATION.md`](./COMMUNICATION.md) and `profile-viewer-access` for peek visibility rules.

### Participation modes (planned — see [`CREATE_FLOW.md`](./CREATE_FLOW.md))

| Mode | Member action | Host |
|------|---------------|------|
| **`rsvp`** | **I’m going** — instant; adds to Up next | See who’s going |
| **`approval`** | **Request to join** — host approves | Approve / reject queue |

**Not** the same as `joinMode` (`open` \| `private`), which controls map visibility only.

**Who may see full activity detail vs map peek** is **detail exposure** (viewer access), not `participationMode` or `joinMode`. Resolvers, policy matrix, and implementation phases: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.

**Organize defaults:** Event → `rsvp`; Hiking, Camping, generic Activity → `approval`. Creator can toggle on all organize paths.

## Host vs Organisation in copy

| Context | Say | Avoid |
|---------|-----|--------|
| Umbrella (any publisher) | **Host**, **host profile**, **host console**, **host application** | “Organisation” for solo guides |
| Individual guide | **Guide**, **guide profile**, **guide console** | “Organisation profile” |
| Licensed business | **Agency**, **agency profile** | — |
| Gear seller | **Shop**, **shop profile** | “Merchant” in UI |
| On-day trip leader | **Host** (“Hosted by …”, `HostSelect`) | Confusing with publishing host — OK when scoped to the activity |
| Code / filenames / API aliases | `Organisation*`, `tenant`, `/host/*` routes | Renaming wire layer without a migration |

Helpers: `src/utils/hostCopy.ts` — `hostConsoleLabel()`, `hostProfileLabel()`, `normalizeHostKind()`.

### Internal code identifiers (Phase 14)

| Prefer in new code | Deprecated alias | Notes |
|--------------------|------------------|-------|
| `hostTenants`, `canPickHostTenant`, `eventHostName` | `hostOrganizations`, `canPickHostOrganization`, `eventHostOrganization` | Activity publish forms |
| `BecomeHostFormState` | `BecomeOrganisationFormState` (deprecated) | Become-host wizard |
| `HOST_CONSOLE_LINKS` | `ORGANISATION_CONSOLE_LINKS` | Console nav constant |
| `resolveProfileHostKind()` | `resolveProfileOrganisationKind()` | Profile hub |
| `hostName` (signup) | `organizationName` | Wire field on `/auth/register` |
| `hostDetails`, `shopId` (tenant profile JSON) | `organizerDetails`, `merchantId` | Dual keys on GET tenant profile + PATCH `/me/host-details` |
| `GET /admin/places` (admin CRUD) | `GET /admin/locations` | Same handlers; legacy path kept |
| `shopId`, `/shop/organisation/*` (shop manage) | `merchantId`, `/shop/merchant/*` | Dual JSON keys + parallel routes; Mongo still `merchant_profiles` |
| `GET /shop/shops/:id` (public shop) | `GET /shop/merchants/:id` | Same handler; legacy path kept |

### Capabilities by host kind

| Kind | Paid trips | Typical trips |
|------|------------|---------------|
| **Guide** (individual) | No | Free / shared-cost community trips |
| **Agency** | Yes | Licensed guided adventures |
| **Shop** | N/A (featured picks) | Gear / affiliate links |

## Person vs User

| Term | Meaning | Use in new code |
|------|---------|-----------------|
| **Person** | Who someone is on the trail — profile, bio, explore card | Product copy, `PersonPublicProfileDTO`, `personProfilePath()` |
| **User** | Auth account — email, roles, suspension | `UserDTO`, `AuthContext`, admin auth actions |

The route `/member/:userId` uses a user id in the URL (storage key). In UI, prefer **member** or **person** over **user** unless discussing login or admin.

## Host subtypes (same tenant row)

| Subtype | Role | Map pin? | Manage |
|---------|------|----------|--------|
| **Guide** | Individual host; public intro at `/operator/:slug` | No | `/host/*` console; buddy Organize via `canPublish` |
| **Agency** | Business host; paid trips | No | `/host/*`, `/organisation/manage?kind=agency` |
| **Shop** | Outdoor retail (pin + `/shop/:id`) | Physical pin typical | `/shop/:id` |
| **E-commerce** (Business Pro) | Online-first retail | Optional pin | TBD |
| **Hospitality** (Business Pro) | Hotels / venues | Often pin + campaigns | TBD |
| **Partner** (Partner Pro) | Campaign host | Pin + feeds (future) | TBD |

Shop identity: **tenant** (Pro Membership onboarding) + **merchant profile** (ShopManage), linked via `merchant_profiles.tenantId`.

## Legacy → domain naming

| Legacy term | Prefer in new code | Keep unchanged |
|-------------|-------------------|--------------|
| Location | **Place** (entity) | API `/locations`, `LocationDTO` — storage name only |
| Venue | **Place** (word) | Explore panel `?panel=venues` — not a second entity |
| Operator | Host public profile | Route `/operator/:id` |
| Merchant | Shop | `merchant_profiles`, `/merchant/:id` redirect |
| Organizer | Host or agency | — |
| Tenant | Host (copy) / Organisation (code) | `tenants`, `x-tenant-id` |

## Page renames (routes unchanged)

| File / export | Route | Notes |
|---------------|-------|-------|
| `OrganisationProfile` | `/operator/:id` | Public guide/agency host profile |
| `pages/host/Overview` (`Overview`) | `/host/overview` | **Host console** hub |
| `pages/host/Activities` (`Activities`) | `/host/activities` | Tenant activity list + manage sheet |
| `pages/host/JoinRequests` (`JoinRequests`) | `/host/requests` | Activity join queue |
| `pages/host/Manage` (`Manage`) | `/organisation/manage` | Agency / shop tenant panels |
| `ProfileProMembership` (`BecomeHost` legacy export) | `/profile/pro-membership` · redirects from `/become-host`, `/become-organizer` | Pro / agency / shop applications — **not** buddy Organize (`canPublish` via profile complete) |
| `ShopPublic` | `/shop/:id` | Public shop host |
| `AdminOrganisations` | `/admin/hosts` | Admin copy: **Hosts** |

**Code folder:** `src/components/organisation-console/` (implementation name). **UI:** host / guide / agency / shop per `hostCopy.ts`.

## Place registry vs activity anchors

| Concept | Meaning | API | On venue map? | In organize picker? |
|---------|---------|-----|---------------|---------------------|
| **Registry place** | Admin-published or member-contributed venue (approved) | `GET /places`, `GET /places/registry` | Yes (`source: venue`) | Yes |
| **Pending contribution** | Member/host submitted, awaiting admin | `status: draft` | No | Yes (caller’s drafts in registry) |
| **Activity anchor** | `locationId` for custom outing label only | Created with `activityAnchor: true` | **No** (`registryListed: false`) | No |

**Organize hiking/camping** picks a **registry place** (`registryPlaceId`) or uses a **custom label** + **activity anchor** row. **Shops** use `PlaceKind.shop` on the map; host identity remains a **tenant** at `/shop/:id` until shop rows fully live in `locations`.

**Publish pipeline (frontend):** `src/services/organizeActivityPublish.ts` → `POST /host/activities` via `buildHostActivityPublishPayload`.

## Explore browse — `OutingCategory` and `OutingTopic`

Scheduled outings and **demand** posts on the **Activities** map layer carry plan metadata (not used on the Places catalog layer):

| Field | Values (examples) | Set by |
|-------|-------------------|--------|
| **`outingCategory`** | `hiking`, `camping`, `events`, `rideshare`, `activities` | Organize flow catalog on publish; demand kind on create; derived on read when missing |
| **`outingTopic`** | `climbing`, `trail_run`, `workshop`, `community`, … | Organize **Activity** type chip → Mongo; legacy rows may derive from `requirements` (“Activity type: …”) |

**Browse filters:** map pills (`filter=hiking`, …) use category; under **Others**, `subtype=events|activities` then optional `outingTopic` for general activities. See [`NAVIGATION.md`](./NAVIGATION.md) § Browse defaults.

**Compose intents (separate lifecycles):** **Organize** → `activities` collection; **Demand** → `participant_intents`; **Add** → place catalog. Product detail: [`CREATE_FLOW.md`](./CREATE_FLOW.md) · `src/explore/composeFlowCatalog.ts`.

## Identity, routing, and audit

Every durable entity has a **stable UUID** in Mongo and a **canonical public route** (see `packages/shared-types/src/entity-path.ts`).

| Entity | Collection / store | Primary id | Public route |
|--------|-------------------|------------|--------------|
| **User** (auth + profile) | `users` | `user.id` | `/member/:userId`, `/profile` (self) |
| **Host** (publishing tenant) | `tenants` | `tenant.id` | `/operator/:slug` |
| **Place** (venue / registry) | `locations` | `location.id` | `/trail/:id`, `/camp/:id`, `/event/:id` |
| **Activity** (scheduled outing) | `activities` | `activity.id` | `/activity/:id` |
| **Demand** (find a crew) | `participant_intents` | intent id | Map item `demand:…` |

**Registration:** members via `/signup` + OTP; hosts via `host_applications` → tenant provision; places via contribute flow + admin approval.

**Audit:** `audit_logs` records actor, action, `entityType`, `entityId`, optional `tenantId`, and `metadata`. Host activity lifecycle actions include `activity.create`, `activity.publish`, `activity.duplicate` (server draft copy, new id), `activity.cancel`, etc. Admin UI: `/admin/audit-log`.

**Reorganize vs duplicate:**

| Flow | What happens | New activity id? |
|------|----------------|------------------|
| **Host console · Duplicate** | `POST /host/activities/:id/duplicate` → draft in console | Yes — audit `activity.duplicate` + `metadata.sourceActivityId` |
| **Explore · Reorganize on map** | `?compose=organize:…&organizeFrom=:activityId` → FAB wizard prefill → publish | Yes — `activity.create` with optional `metadata.sourceActivityId` (`clonedFromActivityId` on create body) |

Reorganize never updates the source row; venue registry ids are **reused** when the draft still points at the same registry place.

## Product rules (stable)

1. Typed place URLs — `/trail`, `/camp`, `/event`.
2. Activities stay at `/activity/:id`.
3. No agency/guide map pins.
4. Shop public path `/shop/:id`; affiliate featured picks, not in-app checkout.
5. API paths may say `locations` / `merchant`; product copy says place / shop.
6. FAB compose taxonomy and participation — [`CREATE_FLOW.md`](./CREATE_FLOW.md).

**Naming adoption:** complete for frontend symbols — see [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md). Deferred: tenant/merchant collapse (shop dual-write) in [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §7 **C6**.
