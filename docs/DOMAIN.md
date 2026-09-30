# UAE Trail — Domain model

This glossary maps **product concepts** to **code and routes**. Use it when naming pages, DTOs, and PRs. Routes and API paths stay stable during renames; component and file names may use `Organisation*` as a **code umbrella** for tenants.

**Product north star:** [`NORTHSTAR.md`](./NORTHSTAR.md) — people finding company outdoors; code entities below are *how* the product delivers that.

See also [`NAVIGATION.md`](./NAVIGATION.md) for browse vs personal-hub routing rules and [`CREATE_FLOW.md`](./CREATE_FLOW.md) for FAB / organize / find / add.

## Core objects

| Domain | What it is | Code / storage | Public URL | Explore map |
|--------|------------|----------------|------------|-------------|
| **Place** | One map/catalog POI — typed, not a separate “venue” or “location” product | `locations`, `PlaceDTO` / `LocationDTO` | See [Place kinds](#place-one-entity-placekind) | Yes (venue / shop pins) |
| **Activity** | A scheduled outing hosted at a place | `activities`, `ActivityDTO` | `/activity/:id` | Yes |
| **Event (organize)** | Public outdoor happening (run, marathon, group race) — default **I’m going** RSVP | Same as Activity row | `/activity/:id` | Yes |
| **Activity (organize — buddy)** | Generic “I want to run / jog / …” plan; free-text title; default **request to join** | Same row; `activityType: event` + user title in v1 | `/activity/:id` | Yes |
| **Host** (publishing) | Anyone who publishes trips and may have a public profile — **guide**, **agency**, or **shop** | `tenants`, `TenantProfile`, `merchant_profiles` (shops) | Guide/agency: `/operator/:slug` · Shop: `/shop/:id` | Physical shops only |
| **Person** | A member's public identity on the platform | `users` (profile fields), `/member/:id` | `/profile`, `/member/:id` | Via demand cards |
| **User** | Auth account (login, roles, suspension) | `users`, `UserDTO`, `AuthContext` | `/signin`, `/signup` | — |

**Participation** links **Person ↔ Activity ↔ Place**. **Publishing** links **Host (tenant) ↔ Activity**. Shops also link **featured outbound picks**.

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

One **user** account. Capabilities stack — they are not separate products.

### Join as a member (everyone)

Anyone can explore and join outings after **basic signup**:

| Requirement | Product | Code / route |
|-------------|---------|----------------|
| Account + verify | Email/password or Google + **OTP** | `/signup`, `/verify` |
| Member details | **Age** (DOB), **gender**, **based in** (country/city) at signup | `/welcome` → `PATCH /me/profile/signup-details` |
| Languages | Added on **profile** (optional for browse; needed for hosting story) | `PATCH /me/profile` · Profile / Settings member details |
| Default role | **Participant** — browse map, RSVP, request to join, demand posts, buddies, follow | `UserRole.PARTICIPANT` |

This is **not** hosting. No tenant is created.

### Become a host (publish trips)

**Hosts are either individuals or businesses** (same `tenants` row; different type and pricing rules).

| Host kind | Product | Paid trips? | Code |
|-----------|---------|-------------|------|
| **Individual host** (guide) | Person-led community trips | **No** — **free** or **shared cost** only | `hostProfileType: individual` → guide tenant; `assertActivityPricingAllowed` blocks `paid` unless `TenantType.COMPANY` |
| **Business host** (agency) | Licensed operator | **Yes** — paid pricing modes | `hostProfileType: agency` → `TenantType.COMPANY` / `businessMode: AGENCY` |
| **Shop** (optional third line) | Gear partner, not trip inventory | N/A (featured picks) | `hostProfileType: shop` → shop public `/shop/:id` |

**Shop provisioning (today):** platform **admin** or an authenticated user can create a shop tenant via become-host / admin flows. **Shop claim** — an existing brick-and-mortar business verifies ownership and takes over a listing — is **planned**, not built yet.

**Minimum to start hosting (product):** credible **bio** + **languages** on the person/brand story (individuals also need a display identity).  
**Today in code:** `/become-host` wizard still collects phone, photo, location, etc., and most paths require **admin approval** before a tenant is provisioned (`host_applications` → `approveHostApplicationAndProvisionTenant`). Tightening to “bio + languages only” is a product change on that wizard and/or approval policy.

### Business account from profile

Any member may add a **business hosting identity** without replacing their personal account:

| Concept | Product | Code |
|---------|---------|------|
| Business creator | Becomes **tenant owner / admin** | `MembershipRole.TENANT_OWNER` on new tenant |
| Team | Owner invites **admins** and **guides** | `/host/team`, `POST` org team APIs; roles `TENANT_ADMIN`, `TENANT_GUIDE` |
| Publish on behalf of business | Activity is under **tenant** (`x-tenant-id`); host picker in console | `/host/activities` |
| Publish as self | Separate **individual** tenant (`add-guide` / own guide profile) | Second tenant + membership; same user, two publishing contexts |

Entry UI: Profile / map presence → **`/become-host`** or **`/organisation/manage?kind=agency`** (and shop variant). There is not yet a single “create business” toggle that skips the host-application flow.

### Public surfaces (do not merge)

| Surface | Who it represents | Route |
|---------|-------------------|-------|
| **Member profile** | The **person** (participant or host human) | `/member/:userId` |
| **Host public profile** | The **business or guide brand** (tenant) | `/operator/:slug` (guide/agency) |
| **Self hub** | Signed-in account settings | `/profile` |

**Follow** and **map publish notifications** attach to the **user id** of whoever published (owner or guide user on the activity), not to the tenant slug. See experiment notes in [`experiment/WHOS_GOING_UX.md`](./experiment/WHOS_GOING_UX.md).

### Participation modes (planned — see [`CREATE_FLOW.md`](./CREATE_FLOW.md))

| Mode | Member action | Host |
|------|---------------|------|
| **`rsvp`** | **I’m going** — instant; adds to Up next | See who’s going |
| **`approval`** | **Request to join** — host approves | Approve / reject queue |

**Not** the same as `joinMode` (`open` \| `private`), which controls map visibility only.

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
| **Guide** | Individual host; public intro at `/operator/:slug` | No | `/host/*` console, `/become-host` |
| **Agency** | Business host; paid trips | No | `/host/*`, `/organisation/manage?kind=agency` |
| **Shop** | Physical or online gear partner | Physical only | `/shop/:id`, `/organisation/manage?kind=shop` |

Shop identity: **tenant** (become-host) + **merchant profile** (ShopManage), linked via `merchant_profiles.tenantId`.

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
| `OrganisationConsoleOverview` | `/host/overview` | **Host console** in UI |
| `BecomeHost` | `/become-host`, `/become-organizer` | User copy: **become a host** (guide, agency, shop) |
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

**Publish pipeline (frontend):** `src/services/organizeActivityPublish.ts` → `POST /host/activities` via `buildOrganisationActivityPublishPayload`. Host console modals use the same payload builder with `form.locationId`.

## Explore browse — `OutingCategory` and `OutingTopic`

Scheduled outings and **demand** posts on the **Activities** map layer carry plan metadata (not used on the Places catalog layer):

| Field | Values (examples) | Set by |
|-------|-------------------|--------|
| **`outingCategory`** | `hiking`, `camping`, `events`, `rideshare`, `activities` | Organize flow catalog on publish; demand kind on create; derived on read when missing |
| **`outingTopic`** | `climbing`, `trail_run`, `workshop`, `community`, … | Organize **Activity** type chip → Mongo; legacy rows may derive from `requirements` (“Activity type: …”) |

**Browse filters:** map pills (`filter=hiking`, …) use category; under **Others**, `subtype=events|activities` then optional `outingTopic` for general activities. See [`NAVIGATION.md`](./NAVIGATION.md) § Browse defaults.

**Compose intents (separate lifecycles):** **Organize** → `activities` collection; **Demand** → `participant_intents`; **Add** → place catalog. Architecture detail: [`experiment/explore-backend-alignment.md`](./experiment/explore-backend-alignment.md).

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

**Adoption roadmap:** [`DOMAIN_ADOPTION_PLAN.md`](./DOMAIN_ADOPTION_PLAN.md) — frontend migration complete. Deferred: Phase 6b tenant/merchant collapse.
