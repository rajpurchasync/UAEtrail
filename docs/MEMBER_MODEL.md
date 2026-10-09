# Member model — users, roles, tiers, routes

**Canonical map** for how one **person account** connects to capabilities, storage, and HTTP. Doc index: [`DOCS_INDEX.md`](./DOCS_INDEX.md). Product voice: [`NORTHSTAR.md`](./NORTHSTAR.md). Domain entities: [`DOMAIN.md`](./DOMAIN.md). HTTP prefixes: [`API_ROUTING.md`](./API_ROUTING.md). Host audit P0–P3: [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md).

Do **not** re-implement tier logic in React hooks — consume **`GET /me/host-status`** (`HostStatusDTO` in `@uaetrail/shared-types`).

**Capabilities ≠ viewer access:** `canPublish` / `canAccessHostConsole` answer whether this member may **act** as a host. They do **not** gate whether someone may **read** full activity detail or a member profile. That is **`resolveActivityViewerAccess`** / **`resolveProfileViewerAccess`** ([`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15). Guest sign-in sheets (`guestBrowseGateCopy`) are presentation when `gateReason === sign_in` only.

**Host = always a user:** Every publish action has a `userId` actor. A **business** is a **tenant** the user may represent; use **publish as self / {business}** when the member has multiple activity-capable tenants (`GET /me/host-status` → `ownedProfiles[].publishingProfileKind`; Organize publish step `OrganizePublishAsField`). Host console publish-as: TBD.

**Storefront kinds (`PublishingProfileKind`):** See [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.3 — `community`, `pro_guide`, `agency`, `shop`, `ecommerce`, `hospitality`, `partner`. Wire `EntityKind.organisation` is the host storefront slug URL, not product copy.

### One stack (person · community · Pro · tenant)

| Concept | What it is | Product entry |
|---------|------------|---------------|
| **Member (user)** | One human account | Sign up · `/profile` |
| **Community host** | Same user, profile complete — free **Organize** on the map | No Pro; auto **community** tenant |
| **Pro membership** | Upgrade path for **individual** (pro guide) or **business** (shop, tour agency, e-commerce, hospitality, …) | `/profile/pro-membership` |
| **Tenant** | Single persistence row for every storefront (`tenants`); wire name **organisation** in headers/API | `x-organisation-id`, `GET /host/*` when managing |
| **Business subtype** | Which Pro business flavor (location-bound shop vs remote agency vs online e-commerce, etc.) | Chosen in Pro application — maps to `PublishingProfileKind` |

There is **not** a second “organisation entity” beside tenants: shops, agencies, and e-commerce brands are **tenants** with different `PublishingProfileKind` / purpose. **Host** always means the **user** acting; **organisation** in code means **tenant scope** (storefront + console), not a parallel user type.

**Naming (host vs join vs buddy):** § [Naming vocabulary](#naming-vocabulary) below · Cursor: `.cursor/rules/host-member-model.mdc` · verify: `npm run verify:host-member`.

---

## Spider map

```mermaid
flowchart TB
  subgraph account [Account]
    U[users — AuthUser]
    UR[UserRole — platform job]
    UP[profile — person fields]
  end

  subgraph tiers [Host publishing tiers]
    C[community — buddy Organize]
    P[professional — Pro guide]
    B[business — agency / shop / team]
  end

  subgraph storage [Persistence]
    T[tenants — publishingPurpose]
    TM[tenant_memberships — team link]
    A[activities — Organize]
    PI[participant_intents — Demand]
  end

  subgraph api [API surfaces]
    ME["/me/* — member scope"]
    HOST["/host/* — tenant scope"]
    PUB["/users/:id — public person"]
  end

  U --> UP
  U --> UR
  U --> TM
  U --> T
  T -->|community| C
  T -->|professional| P
  T -->|business| B
  TM --> B
  C --> A
  C --> PI
  P --> A
  B --> A
  ME --> HOST
  U --> ME
  U --> PUB
```

---

## Follow · Wishlist · Goal (not “favorites”)

| Product | Meaning | API |
|---------|---------|-----|
| **Follow (people)** | Host/crew updates in Social | `POST /me/following/:userId` — **buddies auto-follow** on accept |
| **Follow (venue / brand)** | Alerts when something is published at a place or storefront | `POST /me/entity-follows` |
| **Wishlist** | Private save — **venues + activities** to join later | `GET/POST /me/wishlist` (Mongo `user_favorites`) |
| **Goal** | Time-bounded count (e.g. N hikes by date) | `GET/POST /me/goals` — progress from outings + visited map pins |

Detail: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.6.

---

## Layers (do not confuse)

| Layer | What it is | Examples |
|-------|------------|----------|
| **Person / member** | Human using the app | `users`, `/profile`, `/member/:id` |
| **UserRole** | Legacy platform job on the user row | `PARTICIPANT`, `TENANT_GUIDE`, `PLATFORM_ADMIN` |
| **Host publishing tier** | How they publish on the map | `community`, `professional`, `business` |
| **Tenant** | Publishing organisation row | `tenants.publishingPurpose`, `x-organisation-id` |
| **MembershipRole** | Person ↔ tenant (team) | `TENANT_OWNER`, `TENANT_GUIDE` |
| **Public brand profile** | Guide / agency / partner storefront | `/guide/:slug`, `/agency/:slug`, `/partner/:slug`, `/shop/:id` |

**UserRole ≠ host tier.** A `PARTICIPANT` can be a **community** host (`canPublish` + community tenant). A **business** guide is often `TENANT_GUIDE` with no owned tenant.

**Platform admin staff:** `PLATFORM_ADMIN` may use `/admin/*`. Admin console nav includes **Users** (`/admin/users`) for search, suspend/activate, and (master only) grant/revoke platform staff. New platform admins are **not** self-registered — only a **master admin** (`profile.platformMasterAdmin` or `PLATFORM_MASTER_ADMIN_EMAILS`) may call `POST /admin/platform-admins` (grant) or `DELETE /admin/platform-admins/:userId` (revoke). Demo seed sets master on `admin@uaetrails.app`.

---

## Host publishing tiers

| Tier | Who | Tenant `publishingPurpose` | Paid Organize? | Entry |
|------|-----|------------------------------|----------------|-------|
| **Community** | Individual member | `community` | No (free / shared) | Profile complete → auto tenant (`ensureBuddyHostTenant`) |
| **Professional** | Pro guide | `professional` | Future Pro rules | `/profile/pro-membership` → host application (`individual`) |
| **Business** | Agency / shop owner or **employee** | `business` | Agency yes | Pro membership application or team invite → `tenant_memberships` |

**Profile badge (`profileRoleLabel`):**

| Key | When |
|-----|------|
| `community_member` | Default |
| `host` | `isCommunityHost` — first activity **or** demand on map |
| `professional_guide` | Professional tier tenant |
| `agency` | Agency tenant or business tier operator |
| `shop_owner` | Shop tenant |

Wire: `HostStatusDTO.hostTiers`, `HostStatusDTO.profileRoleLabel`, `HostStatusDTO.isCommunityHost`.

---

## Pro membership ladder (product)

All paths require a **signed-in user**. Upgrade entry: **`/profile/pro-membership`** (`PRO_MEMBERSHIP_PATH`).

| Pro path | Who | Required choice | Storefront / capabilities (high level) |
|----------|-----|-----------------|----------------------------------------|
| **Individual** | Solo pro guide | — | `/guide/:slug` storefront; Organize as self + pro tenant |
| **Business** | Company / brand | **Subtype required:** Shop · Tour agency · E-commerce · Hospitality · (extensible) | Tenant + console; paid trips / campaigns per subtype (detail later) |
| **Partner** | Hotel / campaign partner | Detail later | Partner storefront + “What’s happening” campaigns (future) |

**Business subtype** is **not** interchangeable: a **shop** is map/directions retail; a **tour agency** is trip operator without requiring a visit pin; **Partner** is a separate Pro path from generic business (see product split in `DOMAIN.md`).

Billing / `PaidMembershipSku` enforcement: layer **7** in `member-entitlements.ts` (stub until billing ships).

---

## Profile visibility (person — not host tier)

| `profileVisibility` | Guests | Other signed-in members (no relationship) |
|---------------------|--------|-------------------------------------------|
| `public` | Sign-in only — **no** member card (target policy P3) | **Public member card** on `/member/:id` |
| `group_members` | Sign-in only | Denied unless group / allowed relationship |
| `private` | Sign-in only | Denied unless buddy, co-participant, host-of-activity, etc. |

Trusted fields (year goal, upcoming list, etc.) appear only on **trusted** exposure, not on the public card.

**Browse — member people (not chat):** Map People panel (`view=people`; legacy `view=social`) and list **Buddies** share `ExploreMemberDiscoveryList`. **Network roster:** `GET /social/people` — friends + followed with trip hints; pill via `GET /social/people/preview`. **Discovery roster:** `GET /me/member-discovery/roster` — going / looking / directory; **quota:** `GET /me/member-discovery-quota`, `GET /users/browse`; profile opens `GET /users/:id/public-profile?from=discover` (**5 unique profiles / 30d**; Pro unlimited). **Chat** is [`COMMUNICATION.md`](./COMMUNICATION.md) (`/messages`, `/chat/*`). **Join me (participation):** `GET/POST /activities/:id/invites` — in-app nudge only; invitee still RSVPs or requests to join; host approval when required. See [`NAVIGATION.md`](./NAVIGATION.md) § Browse — people & crew and [`API_ROUTING.md`](./API_ROUTING.md).

**Profile view analytics (shipped):** views recorded on `GET /users/:id/public-profile`; owners with host Pro/business see `GET /me/profile-view-stats`.

---

## Capabilities (flags on `HostStatusDTO`)

| Flag | Meaning |
|------|---------|
| `signupProfileComplete` | `/welcome` member details done |
| `canPublish` | May run Organize wizard (has activity-capable tenant) |
| `canAccessHostConsole` | May use `/host/*` (publish queue, team) |
| `canHostPaidActivities` | Agency commercial pricing |
| `isCommunityHost` | Has map footprint as host (activity or demand) |

**Demand (Find)** requires signed-in member only — **not** `canPublish`.

---

## Member audience ladder

Product-facing **who is viewing** for **capabilities** (Organize, console, future paid SKUs). Orthogonal to **social** activity/profile detail ([`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15).

| Audience (`MemberAudience`) | Who | Typical gates |
|-----------------------------|-----|----------------|
| `guest` | Not signed in | `gateReason: sign_in` — copy from `guestBrowseGateCopy` |
| `member_incomplete` | Signed in; `signupProfileComplete === false` | `profile_required` → `/welcome` |
| `member_basic` | Profile complete; community / buddy path | Organize when `canPublish`; map **Host** badge is separate (`isCommunityHost`) |
| `member_professional` | Pro guide tenant (`hostTiers.professional`) | Console + Pro flows |
| `member_business` | Agency / shop / team (`hostTiers.business`) | Console + `x-organisation-id` |

**Vocabulary (do not conflate):**

| User says | Code |
|-----------|------|
| Guest | `guest` |
| Signed-in, incomplete profile | `member_incomplete` — not “basic” |
| “Host” = can buddy Organize | `member_basic` + `canPublish` (profile complete + tenant) |
| “Host” badge on profile | `isCommunityHost` — first activity or demand on map |
| Paid membership (future) | `PaidMembershipSku` + layer **7** entitlements — **not** inferred from `hostTiers` alone |

**Resolver:** `resolveMemberAudience({ viewerUserId, hostStatus })` in `packages/shared-types/src/member-access.ts`. **Organize FAB denial:** `organizeEntitlementDenial` (sign-in → welcome → publish capability). Client redirects: `organizePublishGateHref` + `organizePublishGateInputFromHostGate` in `src/utils/organizePublishGate.ts` (maps denial → routes).

**Paid tiers:** stub `resolvePaidMembershipSku` → `'none'` until billing ships; enforce in `apps/api/src/services/member-entitlements.ts` **after** `resolveActivityViewerAccess` / social exposure.

---

## HTTP routing (member vs host)

| Intent | Auth | Route family |
|--------|------|----------------|
| Browse map | Guest optional | `GET /explore/map`, `GET /activities/:id` |
| Profile, demand, inbox | Member | `GET/PATCH /me/*` |
| Publish / manage outing | Member + tenant | `POST /host/activities`, `x-organisation-id` |
| Public person | Optional | `GET /users/:id` (or member public profile) |
| Pro application | Member | `POST /me/host-application` |

---

## Code map

| Concern | Location |
|---------|----------|
| Tier enum (wire) | `packages/shared-types/src/host-publishing-tier.ts` |
| Tenant purpose (DB) | `apps/api/src/domain/tenant-publishing.ts`, `tenants.publishingPurpose` |
| **Single resolver** | `apps/api/src/services/member-host-status.ts` → `GET /me/host-status` |
| Member audience ladder | `packages/shared-types/src/member-access.ts` |
| Paid / Pro detail (layer 7) | `apps/api/src/services/member-entitlements.ts` |
| Community footprint | `apps/api/src/lib/community-host.ts` |
| Buddy tenant | `apps/api/src/lib/buddy-host-tenant.ts` |
| Client display strings | `src/member/memberProfileRoleLabel.ts` |
| Client hook (thin) | `src/hooks/useHostStatus.ts` (`canPublish`, `canAccessHostConsole`) |
| Host console hub data | `src/console/useHubData.ts` → `useConsoleHubData` (`/host/*` activities + join queue) |

---

## Member availability (calendar — not seeking)

| Concern | Rule |
|---------|------|
| **Storage** | `member_availability` — one row per user with `slots[]`, `kinds[]`, optional `areaId` / `region` |
| **Edit** | Plan → **Available** lens (`lens=availability`) |
| **Discover** | `GET /explore/people/availability` · Explore People filters (date range, area, kind) |
| **Visibility** | `public` · `buddies` · `hidden` — enforced on index and public profile `availability` slice |
| **vs seeking** | Seeking = time-bound **Activity** on the map (`activityMode: seeking`). Availability = person slots only. |
| **Guide kind** | Casual “can guide” on availability; paid/commercial guiding = **hosted** activity or agency profile |

---

## Naming vocabulary

Host/member/join terms (do not duplicate in other docs — **update this section** when semantics change).

| Term | Means | Storage / route |
|------|--------|-----------------|
| **Community host (buddy)** | Profile complete → can Organize; optional **Host** label after first map post | `GET /me/host-status`, `publishingPurpose: community` |
| **Pro / business host** | Agency, shop, professional guide | `/profile/pro-membership`, `host_applications` |
| **Host console** | Tenant-scoped publish/manage (host **user** + active tenant) | `/host/*`, `x-organisation-id`, `src/console/*` |
| **Activity join request** | Join a **published activity** (approval) | `activity_requests`, `/host/requests` |
| **Demand join request** | Join a **Find** post | `participant_intent_requests`, `/me/participant-intents/.../requests` |
| **Host application** | Pro/agency/shop onboarding | `host_applications` |
| **Buddy connection (friends)** | Mutual link between **member accounts**; accept also creates **mutual follow** (`user_follows`, no separate follow notification) | `BuddySummaryDTO.userId` = other person’s user id (no “buddy id”) |
| **`actorUserId` (notifications)** | Who triggered the action | Always a **user** id — see `DOMAIN_CANONICALS.md` §11 |

| Do not | Use instead |
|--------|-------------|
| `registerHostJoinRequestRoutes` | `registerHostActivityRequestRoutes` |
| “Join request” without **activity** or **demand** | Qualified phrase |
| `isHostRole` for Organize / publish gates | `canPublish`, `canAccessHostConsole` from host-status |
| `/become-host` in new UI | `PRO_MEMBERSHIP_PATH` or `/welcome` |
| `OrganisationHubSections` / `useHostGate` | `ConsoleHubSections` (`src/console`), `useHostStatus` |
| `api.listActivities` / `listOrganisationActivities` | `listHostActivities` (console), `getPublicActivities` or `getMeActivities` (browse/trips) |
| `createOrganisationActivity` / `*OrganisationActivity*` (client) | `createHostActivity`, `publishHostActivity`, `updateHostActivity`, … (`activities.ts`) |
| `OrganisationActivityCheckInPanel`, `OrganisationActivities` page | `ActivityParticipantsPanel`, `ActivityManageSheet`, `src/pages/host/Activities.tsx` |
| `buddyUserId` in meta/API | `actorUserId` or `otherMemberUserId` |

Host route files: `registerHostActivityRequestRoutes`, `registerHostTeamRoutes`, `registerHostDemandFulfillLegacy`, `registerMemberHostStatusRoutes` (under `routes/user/`).

### Organisation in filenames (keep vs retire)

| Keep `Organisation*` | Why |
|----------------------|-----|
| `src/api/domains/organisation.ts`, `orgHeaders.ts`, `getOrganisation*` | Wire: tenant scope, `x-organisation-id` |
| `pages/OrganisationProfile.tsx` | Public storefront `/guide` · `/agency` · `/partner` |
| `components/organisation/*`, `ShopOrganisation*` | Agency / shop tenant UI |
| `organisation-console/` (Pro flow, `OrganisationPublicProfile`) | Tenant onboarding + public profile editor — **not** `/host/*` shell |
| Deprecated shims in `organisation-console/` (`OrganisationConsoleShell` → `src/console`) | Import compatibility only |

| Retired (guard: `organisationNamingGuard.test.ts`) | Use instead |
|----------------------------------------------------|-------------|
| `pages/OrganisationActivities`, `OrganisationConsoleOverview`, … | `src/pages/host/*` |
| `OrganisationActivityCheckInPanel`, `HostedSection` | `ActivityParticipantsPanel` in `src/components/host/` |
| Activity form modals + `ActivityFormSessionContext` | Explore **Organize** (`CreateActivityFlow`) |
| `useOrganisationGate` / `useOrganisationHubData` | `useHostStatus` / `useConsoleHubData` |
| `api.*OrganisationActivity*` / `legacyApi.ts` | `api.createHostActivity`, `listHostActivities`, … |
| `FavoriteDTO`, `getMeFavorites`, `/me/favorites`, `favorites-store` (guard: `wishlistNamingGuard.test.ts`) | `WishlistItemDTO`, `getMeWishlist`, `/me/wishlist`, `wishlist-store` |

**Host console** UI roots: `src/pages/host/*`, `src/console/*`, `src/components/host/*`. Do not add new `pages/Organisation*` routes for host tools.

---

## Related docs

- [`DOMAIN.md`](./DOMAIN.md) — Place, Activity, Demand glossary  
- [`CREATE_FLOW.md`](./CREATE_FLOW.md) — Organize vs Find gates  
- [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) — URLs, API client, notification meta  
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — monorepo layout  
