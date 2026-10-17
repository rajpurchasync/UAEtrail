# Member model — users, roles, tiers, routes

**Canonical map** for how one **person account** connects to capabilities, storage, and HTTP. Doc index: [`DOCS_INDEX.md`](./DOCS_INDEX.md). Product voice: [`NORTHSTAR.md`](./NORTHSTAR.md). Domain entities: [`DOMAIN.md`](./DOMAIN.md). HTTP prefixes: [`API_ROUTING.md`](./API_ROUTING.md). Host audit P0–P3: [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md).

Do **not** re-implement tier logic in React hooks — consume **`GET /me/status`** (`MemberStatusDTO`; publish under **`publish`**; flat fields dual-read legacy `HostStatusDTO`).

**Capabilities ≠ viewer access:** `status.publish.canPublish` / `canAccessPublishingWorkspace` answer whether this member may **organize or publish** outings and open the **publishing workspace**. They do **not** gate whether someone may **read** full activity detail or a member profile. That is **`buildActivityViewerAccess`** / **`resolveProfileViewerAccess`** ([`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15; `resolveActivityViewerAccess` remains a compatibility alias). Guest sign-in sheets (`guestBrowseGateCopy`) are presentation when `gateReason === sign_in` only.

**Participate ≠ publish:** Joining an outing (RSVP, request to join, demand) requires a **signed-in member** only — **not** `profileComplete`. **Organize / publish** requires **`profileComplete`** (member details on `/welcome`) plus **`canPublish`** (activity-capable tenant).

**My Plans surface vs `/me/*`:** Consumer **My Plans** lives at **`/plan`** (`PLAN_PATH`, `src/plan/planRouting.ts`) — **forward-looking only**: upcoming joined/hosting (list or calendar), coordination strip, availability lens, wishlist/saved, goals teaser — **not** outing history or journey map. **`/profile`** is identity and settings; **`/profile/history`** (+ map at `/profile/history/map`) is **past** inventory (joined / hosted / self-logged). HTTP **`GET/PUT /me/goals`**, **`/me/availability`**, **`/me/coordination-attention`** back the Plan page; they are **not** browser routes like `/me/plans`. Explore FAB **Host · Find crew · Add** is separate from the Plan tab ([`NAVIGATION.md`](./NAVIGATION.md) § Plan disambiguation).

**Plan is a UI hub, not a domain entity:** There is no `Plan` collection, `PlanDTO`, or `GET /plans/:id`. The middle tab is a **read-model shell** over real objects — primarily **`activities`** (joined upcoming, **hosted** / organizing filter, seeking via `participant_intents`), plus **`member_goals`**, **`member_availability`**, wishlist saves, and **`coordination-attention`** (join queues, invites). **Organizing an outing** = create/publish an **`Activity`** (tenant-scoped publish, map discovery) — not “creating a Plan.” In code, prefer **activity / hosted / joined / goals / availability** in API and store names; FE hub helpers: `memberCommitmentHubApi` (`goals` + `availability` only). Reserve **Plan** for routes (`/plan`), tab chrome, and inbox grouping copy where noted in [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) (activity detail tab label **Plan** = outing facts on L3 — still not a Plan entity).

**FE file naming:** Two patterns — pick by **surface**, not by parsing every word in a component name.

| Where | Folder | Names | Meaning |
|--------|--------|--------|---------|
| **`/plan` tab** | `src/plan/PlanPage.tsx` + `src/components/plan/*` | `PlanPage` (route shell), `PlanUpcomingView`, `PlanJoinedUpcoming`, … | **Feature module** for the My Plans hub. `Plan*` is a **namespace** for the surface, not a domain entity. Data: activities/join hooks + `memberGoalsApi` / `memberAvailabilityApi` / `memberCoordinationApi` — aggregate catalog `memberCommitmentHubApi` (`goals` + `availability` only). |
| **Profile history / activity domain** | `components/activity/*`, `participant-intent/*`, `profile-history/*` | `JoinedSection`, `HostedActivitiesSection`, `SeekingIntentsSection` | **Relationship or entity** (joined, hosted, seeking) without `Plan` prefix. |

`src/plan/planRouting.ts` + `planTab.ts` = URL/helpers for `/plan`. SN-6 allows `Plan*` under `src/plan/`, `src/components/plan/`, `src/member-plan/` only. **Do not** split the same upcoming list across `plan/` and `activity/` — that duplicates ownership.

**Activity detail — Pro vs organizer vs crew:** **Community organizer** = profile-complete member who may Organize (`canPublish`). **Pro membership** = paid tier for **social depth** on outings (e.g. view organizer profile before join, full **Buddies** roster after join, offer/add transport when enforced) — applied in **`applyActivityViewEntitlements`** after social `viewerAccess`. **`canAccessCrewSurfaces`** on activity detail is **not** Pro and **not** publishing tier: it means confirmed **participant** or **organizer** on **this** outing (meeting precision, roster, group chat). Pending joiners stay on **Plan** + join CTAs only. Do not use `UserRole` or `canPublish` for consumer Buddies/Place gates.

**Publishing actor = always a user:** Every publish action has a `userId` actor. A **business** is a **tenant** the user may represent; use **publish as self / {business}** when the member has multiple activity-capable tenants (`GET /me/status` → `publish.ownedProfiles[].publishingProfileKind`; Organize publish step `OrganizePublishAsField`). Workspace publish-as: TBD.

**Storefront kinds (`PublishingProfileKind`):** See [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.3 — `community`, `pro_guide`, `agency`, `shop`, `ecommerce`, `hospitality`, `partner`. Wire `EntityKind.organisation` is the storefront slug URL, not product copy.

**Product vocabulary (UI):** **`src/content/workspaceVocabulary.ts`** — **Host** = individual leading **this outing**; **Guide / Pro host** = profile-complete member with **individual Pro** — public face is **`/member/:userId`** (no separate guide storefront); **Operator** = **shop or agency business** (tenant) with a **company / shop profile**; **Organize** / **publish** = capabilities under **`GET /me/status`** → **`publish`**. **Architecture/API:** tenant publishing HTTP **`/operator/*`** (wire name — UI uses *Organizer* / *Guide* / *Operator* workspace labels, not “operator” for every community host). **Member capabilities:** **`GET /me/status`** · **`useMemberStatus`**.

### One stack (person · community · Pro · tenant)

| Concept | What it is | Product entry |
|---------|------------|---------------|
| **Member (user)** | One human account | Sign up · `/profile` |
| **Community organizer** | Same user, profile complete — free **Organize** on the map | No Pro; auto **community** tenant |
| **Pro membership** | Upgrade path for **individual** (pro guide) or **business** (shop, tour agency, e-commerce, hospitality, …) | `/profile/pro-membership` |
| **Tenant** | Single persistence row for every storefront (`tenants`); wire name **organisation** in headers/API | `x-organisation-id`, `GET /operator/*` when managing (legacy `/host/*` rewritten) |
| **Business subtype** | Which Pro business flavor (location-bound shop vs remote agency vs online e-commerce, etc.) | Chosen in Pro application — maps to `PublishingProfileKind` |

There is **not** a second “organisation entity” beside tenants: shops, agencies, and e-commerce brands are **tenants** with different `PublishingProfileKind` / purpose. **Organisation** in code means **tenant scope** (storefront + workspace), not a parallel user type.

**Naming (organizer vs operator vs join vs buddy):** § [Naming vocabulary](#naming-vocabulary) below · Cursor: `.cursor/rules/host-member-model.mdc` · verify: `npm run verify:host-member`.

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
| **HTTP surface** | Which API prefix and registrar owns the call — **not** inferred from profile alone | Public `GET /places/:id` · member `POST /me/places` · admin `PATCH /admin/places` · operator `POST /operator/activities` ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §5.1) |
| **Person / member** | Human using the app | `users`, `/profile`, `/member/:id` |
| **UserRole** | Legacy platform job on the user row | `PARTICIPANT`, `TENANT_GUIDE`, `PLATFORM_ADMIN` |
| **Host publishing tier** | How they publish on the map | `community`, `professional`, `business` |
| **Tenant** | Publishing organisation row | `tenants.publishingPurpose`, `x-organisation-id` |
| **MembershipRole** | Person ↔ tenant (team) | `TENANT_OWNER`, `TENANT_GUIDE` |
| **Public person profile** | Every member (incl. Pro guide) | `/member/:userId` |
| **Public operator profile** | Agency or shop **business** | `/agency/:slug`, `/shop/:id` (+ shop map pin) |

**UserRole ≠ host tier.** A `PARTICIPANT` can be a **community** host (`canPublish` + community tenant). A **business** guide is often `TENANT_GUIDE` with no owned tenant.

**Platform admin staff:** `PLATFORM_ADMIN` may use `/admin/*`. Admin console nav includes **Users** (`/admin/users`) for search, suspend/activate, and (master only) grant/revoke platform staff. New platform admins are **not** self-registered — only a **master admin** (`profile.platformMasterAdmin` or `PLATFORM_MASTER_ADMIN_EMAILS`) may call `POST /admin/platform-admins` (grant) or `DELETE /admin/platform-admins/:userId` (revoke). Demo seed sets master on `admin@uaetrails.app`.

---

## Host publishing tiers

| Tier | Who | Tenant `publishingPurpose` | Paid Organize? | Entry |
|------|-----|------------------------------|----------------|-------|
| **Community** | Individual member | `community` | No (free / shared) | Profile complete → auto tenant (`ensureBuddyHostTenant`) |
| **Professional** | Pro guide | `professional` | No — free + shared only | `/profile/pro-membership` → host application (`individual`) |
| **Business** | Agency / shop owner or **employee** | `business` | Yes (agency; shop per product) | Pro membership application or team invite → `tenant_memberships` |

**Profile badge (`profileRoleLabel`):**

| Key | When |
|-----|------|
| `community_member` | Default |
| `host` (wire) | UI **Organizer** — `isCommunityHost` after first activity **or** demand on map |
| `professional_guide` | Professional tier tenant |
| `agency` | Agency tenant or business tier operator |
| `shop_owner` | Shop tenant |

Wire: `HostStatusDTO.hostTiers`, `HostStatusDTO.profileRoleLabel`, `HostStatusDTO.isCommunityHost`.

---

## Pro membership ladder (product)

All paths require a **signed-in user**. Upgrade entry: **`/profile/pro-membership`** (`PRO_MEMBERSHIP_PATH`).

| Pro path | Who | Required choice | Storefront / capabilities (high level) |
|----------|-----|-----------------|----------------------------------------|
| **Individual** | Solo pro guide | — | `/guide/:slug` — manage **guide profile**; Organize **free + shared-cost** outings (not paid) |
| **Business** | Company / brand | **Subtype required:** Shop · Tour agency · … | **Shop** → `/shop/:id` + shop details in console; **Agency** → `/agency/:slug` + agency profile; paid commercial trips where product allows |
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

**One profile page:** Every link to another member uses **`/member/:userId`** (`MemberProfile`) — friends list (`/buddies`), people browse panel, activity roster, chat. Browse entry may add `source=` / `discover=1` for quota and analytics; **layout is the same**. Lens × who may open: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §3.2.2.

**Naming (code vs UI — pick one term per layer, do not synonym-swap in types):**

| Layer | Use in code / API | UI copy may say |
|-------|-------------------|-----------------|
| Account | **member**, `userId`, `/users/:id` | Member, host name on card |
| Public card page | **profile**, `MemberProfile`, `memberProfilePath`, `GET …/public-profile` | Profile, “View profile” |
| Map/list people panel | **people browse**, `PeopleBrowsePanel`, `peopleTab` | “Find your crew”, tab labels |
| List category handoff | `listCat=people`, URL `buddies=` (legacy param name) | **Buddies** (category circle only) |
| Relationship | **buddy** / `social_graph`, `accepted_buddy` | Friends |
| Directory quota | **member discovery**, `discover=1`, `memberDiscoverProfilePath` | Connect / discover |

**Browse — member people (not chat):** Map People panel (`view=people`; legacy `view=social`) and list **Buddies** share `PeopleBrowseTabContent` (`PeopleBrowsePanel` on map). **Network roster:** `GET /me/member-discovery/network` — friends + followed; pill via `GET /me/member-discovery/network/preview`. **Discovery roster:** `GET /me/member-discovery/roster`; **directory:** `GET /me/member-discovery/browse`; **quota:** `GET /me/member-discovery/quota`; **search:** `GET /me/member-discovery/search`. Profile opens `GET /member/:userId/profile?from=discover` (**3 unique profiles / 30d**; Pro unlimited). **Chat** is [`COMMUNICATION.md`](./COMMUNICATION.md) (`/messages`, `/chat/*`). **Join me (participation):** `GET/POST /activities/:id/invites` — in-app nudge only; invitee still RSVPs or requests to join; host approval when required. See [`NAVIGATION.md`](./NAVIGATION.md) § Browse — people & crew and [`API_ROUTING.md`](./API_ROUTING.md).

**Profile view analytics (shipped):** views recorded on `GET /member/:userId/profile`; owners with host Pro/business see `GET /me/profile-view-stats`.

---

## Capabilities (`GET /me/status` — prefer `publish` + `profileComplete`)

| Field | Meaning |
|------|---------|
| `profileComplete` | Member details on `/welcome` done — **organize/publish** gate (wire also `signupProfileComplete` on legacy paths) |
| `publish.canPublish` | May run Organize / publish (activity-capable tenant) |
| `publish.canAccessPublishingWorkspace` | May use publishing workspace (`/operator/*`; legacy `/host/*`) |
| `publish.canHostPaidActivities` | Linked **business** tenant; paid pricing when publishing as agency / shop / partner |
| `publish.isCommunityHost` | Map footprint badge — first activity or demand (not the same as `profileComplete`) |

**Participate (join, RSVP, demand):** signed-in member only — **not** `profileComplete` or `canPublish`.

---

## Member audience ladder

Product-facing **who is viewing** for **capabilities** (Organize, console, future paid SKUs). Orthogonal to **social** activity/profile detail ([`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15).

| Audience (`MemberAudience`) | Who | Typical gates |
|-----------------------------|-----|----------------|
| `guest` | Not signed in | `gateReason: sign_in` — copy from `guestBrowseGateCopy` |
| `member_incomplete` | Signed in; `profileComplete === false` | `profile_required` → `/welcome` (organize/publish only) |
| `member_basic` | Profile complete; community / buddy path | Organize when `canPublish`; map **Organizer** badge is separate (`isCommunityHost`) |
| `member_professional` | Pro guide tenant (`hostTiers.professional`) | Console + Pro flows |
| `member_business` | Agency / shop / team (`hostTiers.business`) | Console + `x-organisation-id` |

**Vocabulary (do not conflate):**

| User says | Code |
|-----------|------|
| Guest | `guest` |
| Signed-in, incomplete profile | `member_incomplete` — not “basic” |
| “Organizer” = can buddy Organize | `member_basic` + `canPublish` (profile complete + tenant) |
| “Organizer” badge on profile | `isCommunityHost` — first activity or demand on map |
| Paid membership (future) | `PaidMembershipSku` + layer **7** entitlements — **not** inferred from `hostTiers` alone |

**Resolver:** `resolveMemberAudience({ viewerUserId, hostStatus })` in `packages/shared-types/src/member-access.ts`. **Organize FAB denial:** `organizeEntitlementDenial` (sign-in → welcome → publish capability). Client redirects: `organizePublishGateHref` + `organizePublishGateInputFromMemberStatus` in `src/utils/organizePublishGate.ts` (maps denial → routes).

**Paid tiers:** stub `resolvePaidMembershipSku` → `'none'` until billing ships; enforce in `apps/api/src/services/member-entitlements.ts` **after** `resolveActivityViewerAccess` / social exposure.

---

## HTTP routing (member vs host)

| Intent | Auth | Route family |
|--------|------|----------------|
| Browse map | Guest optional | `GET /explore/map`, `GET /activities/:id` |
| Profile, demand, inbox | Member | `GET/PATCH /me/*` |
| Publish / manage outing | Member + tenant | `POST /host/activities`, `x-organisation-id` |
| Public person | Optional | `GET /users/:id` (or member public profile) |
| Pro application | Member | `POST /me/pro-application` (alias `/me/host-application`) |

---

## Code map

| Concern | Location |
|---------|----------|
| Tier enum (wire) | `packages/shared-types/src/host-publishing-tier.ts` |
| Tenant purpose (DB) | `apps/api/src/domain/tenant-publishing.ts`, `tenants.publishingPurpose` |
| **Single resolver** | `apps/api/src/services/member-status.ts` (`resolveMemberStatus`) → **`GET /me/status`** (legacy `/me/host-status`, `/me/operator-status`) |
| Member audience ladder | `packages/shared-types/src/member-access.ts` |
| Paid / Pro detail (layer 7) | `apps/api/src/services/member-entitlements.ts` |
| Community footprint | `apps/api/src/lib/community-host.ts` |
| Buddy tenant | `apps/api/src/lib/buddy-host-tenant.ts` |
| Client display strings | `src/member/memberProfileRoleLabel.ts` |
| Client hook (thin) | **`useMemberStatus`** (`status.publish.*`, `canPublish`, `canAccessPublishingWorkspace`) |
| Operator console hub data | `src/console/useHubData.ts` → `useConsoleHubData` (`/operator/*` activities + join queue) |

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

UI labels vs capabilities vs wire (do not duplicate in other docs — **update this section** when semantics change). UI strings: **`src/content/workspaceVocabulary.ts`**.

### Account ladder

| Stage | Product | Gates / signals |
|-------|---------|-------------------|
| **Guest** | Browse within guest rules | No session |
| **Auth user** | Signed in; buddies, join, settings | Session; **`profileComplete: false`** → **hosting not enabled** |
| **Profile-complete member** | **Hosting enabled** — community Organize / publish | `profileComplete` + `publish.canPublish` (community tenant) |
| **Pro host / Guide** | Individual Pro — richer **member profile** | Pro membership + `pro_guide` tenant; still **`/member/:userId`** |
| **User + operator** | Person linked to **shop or agency** business | `tenant_memberships` / ownership; ≥1 user per operator tenant |

### Map vs discovery

| | On explore map as its own pin? | Found via |
|--|-------------------------------|-----------|
| **Member / Pro guide** | **No** | People search, buddies, **`/member/:userId`** |
| **Agency (operator)** | **No** | Search, activity peek/detail host row, **link from member profile** |
| **Shop (operator)** | **Yes** (shop pin) | Shops lens, search, member profile link, activities |
| **Activities** | **Yes** | Map — host row links to member and/or operator profile as published |

### Terms

| Term | Means | Storage / route |
|------|--------|-----------------|
| **Host (UI)** | **Individual** leading **this outing** on the map | Copy; wire `hostUserId`; not a `/me/*` resource |
| **Guide / Pro host (UI)** | Pro **individual** — same person card, not a second storefront product | `/member/:userId`; Pro fields on profile |
| **Operator (UI)** | **Shop or agency business** (tenant), always tied to ≥1 **user** | Public **agency / shop profile**; publishing workspace (wire `/operator/*`) |
| **Operator on member profile** | When a user is linked to a shop/agency, their **`/member/:userId`** shows the **operator display name** as a link → operator profile | API: `linkedOperatorName` + `hostProfilePath` on `GET /member/:userId/profile` |
| **Organize / publish (capability)** | Member may create/publish outings | `GET /me/status` → `profileComplete` + `publish.canPublish` |
| **Profile complete** | DOB, gender, based-in on `/welcome` | `profileComplete` on `/me/status` (legacy `signupProfileComplete`) |
| **Participate** | Join outings as attendee | Auth only; `activity_requests`, `/activities/:id/requests` |
| **Community tenant (buddy)** | Free individual publish path | `publishingPurpose: community`, auto tenant after profile complete |
| **Publishing workspace** | Tenant-scoped publish/manage UI | Wire `/operator/*`, `x-organisation-id`, `src/console/*` — shell title from `workspaceConsoleLabel(kind)` |
| **Pro / business publishing** | Agency, shop, professional guide onboarding | `/profile/pro-membership`, HTTP `/me/pro-application` (collection `host_applications` until rename) |
| **Activity join request** | Join a **published activity** (approval) | `activity_requests`, `/operator/requests` |
| **Demand join request** | Join a **Find** post (seeking **activity**) | **`activity_requests`** (canonical); `/me/seeking-posts/.../requests` for manage UI |
| **Pro membership (apply)** | Pro/agency/shop onboarding | HTTP `/me/pro-application`; collection `host_applications` (target `pro_applications`) |
| **Buddy connection (friends)** | Mutual link between **member accounts**; accept also creates **mutual follow** (`user_follows`, no separate follow notification) | `BuddySummaryDTO.userId` = other person’s user id (no “buddy id”) |
| **`actorUserId` (notifications)** | Who triggered the action | Always a **user** id — see `DOMAIN_CANONICALS.md` §11 |

| Do not | Use instead |
|--------|-------------|
| `registerHostJoinRequestRoutes` | `registerHostActivityRequestRoutes` |
| “Join request” without **activity** or **demand** | Qualified phrase |
| `isHostRole` for Organize / publish gates | `publish.canPublish`, `canAccessPublishingWorkspace` from **`useMemberStatus`** |
| `/become-host` in new UI | `PRO_MEMBERSHIP_PATH` or `/welcome` |
| `OrganisationHubSections` / `useHostGate` | `ConsoleHubSections` (`src/console`), **`useMemberStatus`** |
| New `/me/host-status` or “host status” product APIs | **`GET /me/status`** only |
| “Host” as architecture (routes, hooks, `/me/*`) | **`/operator/*`**, **`useMemberStatus`**, UI label **Host** for individuals only |
| `api.listActivities` / `listOrganisationActivities` | Tenant-scoped **`listActivities(tenantId)`** (SN-3); consumer browse: `getPublicActivities` / `getMeActivities` |
| `createOrganisationActivity` / `*OrganisationActivity*` / `*HostActivity*` / `*OperatorActivity*` (client) | Tenant-scoped **`createActivity`**, `publishActivity`, … — see §13.2.1 in `DOMAIN_CANONICALS.md` |
| `OrganisationActivityCheckInPanel`, `OrganisationActivities` page | `ActivityParticipantsPanel`, `ActivityManageSheet`, `src/pages/operator/Activities.tsx` |
| `buddyUserId` in meta/API | `actorUserId` or `otherMemberUserId` |

Operator route registrars (legacy `registerHost*` filenames): under `routes/operator/`. Member status: `registerMemberStatusRoutes` (`routes/user/`).

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
| `pages/OrganisationActivities`, `OrganisationConsoleOverview`, … | `src/pages/operator/*` |
| `OrganisationActivityCheckInPanel`, `HostedSection` | `ActivityParticipantsPanel` in `src/components/activity/` |
| Activity form modals + `ActivityFormSessionContext` | Explore **Organize** (`CreateActivityFlow`) |
| `useOrganisationGate` / `useOrganisationHubData` | **`useMemberStatus`** / `useConsoleHubData` |
| `api.*OrganisationActivity*` / `legacyApi.ts` | Tenant-scoped activity methods on `activitiesApi` + tenant activity client (SN-3) |
| `FavoriteDTO`, `getMeFavorites`, `/me/favorites`, `favorites-store` (guard: `wishlistNamingGuard.test.ts`) | `WishlistItemDTO`, `getMeWishlist`, `/me/wishlist`, `wishlist-store` |

**Publishing console** UI roots: `src/pages/operator/*`, `src/console/*`, `src/components/activity/*`, `src/activity/*`. Do not add new `pages/Organisation*` routes for console tools.

---

## Related docs

- [`DOMAIN.md`](./DOMAIN.md) — Place, Activity, Demand glossary  
- [`CREATE_FLOW.md`](./CREATE_FLOW.md) — Organize vs Find gates  
- [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) — URLs, API client, notification meta  
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — monorepo layout  
