# System coherence — whole product architecture

**Purpose:** One map from **north-star outcomes** → **capabilities** → **surfaces** → **modules** → **API** → **storage**. Use this before large features or refactors so work strengthens a single system instead of adding a third parallel path.

**Not a duplicate of:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) (deployment & layer diagram), [`DOMAIN.md`](./DOMAIN.md) (entity glossary), [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) (naming & route builders), [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (person vs host tier). **This file ties them together.**

**Index:** [`DOCS_INDEX.md`](./DOCS_INDEX.md) · **Checks:** `npm run verify:system` · **Manifest:** `scripts/bounded-context-manifest.json`

---

## 1. North star → capabilities

From [`NORTHSTAR.md`](./NORTHSTAR.md), the product delivers five **capabilities** (not features):

| Capability | Member outcome | Primary surfaces |
|------------|----------------|------------------|
| **Discover** | See real outdoor plans near me | `/explore`, entity detail (`/activity`, `/trail`, …) |
| **Express demand** | Say what I want when nothing fits | Explore FAB → **Availability** → `member_availability` (`PUT /me/availability`; fixed pins on map `source: availability`) |
| **Connect** | Align with people before the day | **Browse — member people** (who’s going / looking / your crew on map & list) → **Chat** (`/messages`, group & outing threads) |
| **Participate** | Join or host a specific outing | Activity detail join/RSVP; host join queue |
| **Return** | Same crew, next time | `/profile`, **`/plan`**, notifications, goals |

Everything else (shops, rewards, place registry, admin, Pro agencies) **supports** these capabilities or serves a **secondary** audience (hosts, merchants, platform ops).

---

## 2. System map (logical)

```mermaid
flowchart TB
  subgraph surfaces [Consumer surfaces]
    M["/ guest marketing"]
    E["/explore browse + FAB"]
    P["/profile /plan hub"]
    D["/activity /trail detail"]
    MSG["/messages /buddies /groups"]
  end

  subgraph compose [Compose subsystem]
    FAB["compose= URL contract"]
    ORG["Host wizards"]
    FIND["Find crew wizards"]
    ADD["Add-on-map wizards"]
  end

  subgraph participation [Participation subsystem]
    JOIN["activity_requests + RSVP"]
    CREW["activity crew groups"]
  end

  subgraph identity [Member identity]
    WEL["/welcome signup gate"]
    HS["GET /me/status"]
    PUB["public member profile"]
  end

  subgraph publishing [Publishing organisations]
    TEN["tenants + memberships"]
    HOST["/publishing workspace"]
    PRO["/profile/pro-membership"]
  end

  subgraph platform [Platform]
    ADM["/admin"]
    MOD["reports / moderation"]
  end

  M --> E
  E --> FAB
  FAB --> ORG
  FAB --> FIND
  FAB --> ADD
  ORG --> TEN
  ORG --> JOIN
  FIND --> JOIN
  D --> JOIN
  JOIN --> CREW
  CREW --> MSG
  WEL --> HS
  HS --> ORG
  PRO --> TEN
  HOST --> TEN
  TEN --> JOIN
  P --> E
  P --> MSG
```

---

## 3. Bounded contexts (where code must live)

### 3.0 Cross-context foundations (one platform, not per-context forks)

Contexts **share** the same rules — they differ by **data and routes**, not by inventing parallel client or policy stacks.

| Foundation | Every context uses | Guards (representative) |
|------------|-------------------|------------------------|
| **HTTP surfaces** | Public read · signed-in `/me/*` · `/admin/*` · tenant `/publishing/*` + `x-organisation-id` — §5.1 | `catalog-http-surface-guard`, `publishing-http-canonical-guard` |
| **FE HTTP client** | UI → `src/hooks/*ClientApi` → `src/api/domains/*` → `apiRequest` | `domainImportGuard`, `hooksApiFacadeGuard`, `apiLegacyGuard` |
| **SPA paths** | `routingCatalog` / `surfacePaths` — no ad-hoc path strings in product UI | `routingCatalogAdoption`, `routingHygiene` |
| **Member capabilities** | **`GET /me/status`** only (`memberApi` / `useMemberStatus`) | `host-member-contract`, `hostMemberGuard` |
| **Activity engagement** | `resolveActivityEngagementPolicy` + wire `viewerAccess` (map peek, list, L3) | `mapDetailEngagementParity`, `activityDetailAcceptance` |
| **Discovery catalog** | `GET /explore/map` + `GET /me/discover/overlay` — projections, not N catalogs | `explore-map-*` contracts, `seekingPinHygieneGuard` |
| **People browse** | `GET /me/member-discovery/*` via `accountApi` only — roster/search separate from buddy **writes** | `crossContextFoundationsGuard` (CTX-FOUND-09) |
| **Chat façade** | Product inbox: `messagingApi` → `chatApi` (`/chat/*`) + `groupsApi` (crew wall) — no duplicate `/chat` clients | `crossContextFoundationsGuard` (CTX-FOUND-08, 10) |
| **API registrars** | Surface-first `register*` modules under `routes/user`, `routes/operator`, `routes/shop`, `routes/admin` (+ shared `*-route-schemas.ts`) | `bounded-context-alignment` (API) |
| **Places catalog (CPC)** | `GET /places/catalog` via `placeCatalogClient`; public `/places/:id` + `/facilities/:id` in `places` / `facilities` domains only | `crossContextFoundationsGuard` (CTX-FOUND-11–12), `places-http-canonical-guard` (API) |
| **Context map** | `scripts/bounded-context-manifest.json` ↔ §3.1 matrix | `boundedContextAlignment`, `crossContextFoundationsGuard` |

**Integration rule:** Cross-context features compose **entities** (`Activity`, `Place`, `Facility`) and **shared-types** DTOs — e.g. participation joins on `POST /activities/:id/requests` while publishing mutates the same row via `/publishing/*`; discovery reads those rows through `explore-map`, not a second activity list API.

Each context has **one write path** and **one public read model** where possible. Crossing boundaries happens through **services** and **shared-types**, not duplicate business rules in React.

| Context | Responsibility | Frontend home | API home | Storage (see `collections.ts`) |
|---------|----------------|---------------|----------|--------------------------------|
| **Discovery (Explore umbrella)** | **Explore** = discovery shell (URL, layout, chrome). **Projections:** map, list explorer (`/list`), search — not separate data stores. **Activity discovery** = hosted + seeking outings from `GET /explore/map`. **Places discovery** = place / facility / shop pins from the same read (filters in explore/list). **Area** is an admin-curated **name** (`?area=` / `/area/:slug`) — **not a pin**. **People discovery** = roster, availability, directory (`member_discovery` APIs); *Looking for* tab composes **activity-discovery** seeking rows. Signed-in peek is `GET /me/discover/overlay`, not a second catalog. | Shell: `src/explore/shell/*`. Activity: `src/activity-discovery/*`, activities list in `src/explore/ui`, `src/list/*`. Places: entity detail + list filters. People: `src/people-discovery/*` | `lib/explore-map.ts`, `GET /explore/map`, `GET /me/discover/overlay` | `activities`, `locations`, `facilities`, `areas`, `tenants` (shops) |
| **Compose** | FAB intents, wizards, draft → publish payload | `src/explore/create/` (`hosting/`), `compose.ts`, `hostingFlowEngine.ts`, `hostingFlows/`, `availabilityFlowEngine.ts` (Mark availability fixed) | `POST /publishing/activities`, `PUT /me/availability` | `activities` (hosted); `member_availability` (open + fixed crew) |
| **Participation** | Join, waitlist, RSVP, seeking joins, **Join me** invites | `useActivityJoin*`, detail + explore selection | `join-request.ts`, `activity-invite.ts`, intent join **aliases** (`participant-intent-requests-store`) | **`activity_requests`** (canonical); `participant_intent_requests` legacy-only; `activity_participants`, `activity_invites` |
| **Browse — member people** | Who can I go with? Network roster + availability + discover directory (quota). **Looking for** tab: `GET /explore/map?sources=availability` + `selectAvailabilityFromExploreCatalog` (`src/activity-discovery`). | `src/people-discovery/*` (`PeopleBrowsePanel`, tabs), `ListDiscoveryExperience` | `availability-fixed-map-items.ts`, `member-people-engagement.ts`, `member-discovery-roster.ts`, `registerMemberDiscoveryRoutes` | Composes `buddy_*`, `user_follows`, explore catalog (read), `member_profile_views` |
| **Member identity** | Profile, welcome gate, visibility, public card | `src/pages/Profile*`, `src/member/*` | `registerProfileRoutes`, `public-member-profile`, `profile-viewer-access` | `auth_users` profile fields |
| **Member publish capabilities** | Who may Host / publish & open publishing workspace (tier + `profileComplete`) | `useMemberStatus`, `memberPublishGate` | **`services/member-status.ts` only** | `tenants`, `tenant_memberships` |
| **Publishing console** | Tenant-scoped CRUD, check-in, activity join queue | `src/pages/publishing/*`, `src/console/*`, `components/activity/` | `/publishing/*` + `x-organisation-id` | same + `activities` |
| **Communication** | DMs, inbox, group & outing chat (product label **Chat**) | `Messages.tsx`, `src/messaging`, `@/chat` | `routes/chat.ts`, `activity-group-chat`, `member-inbox` | `chat_messages`, `social_groups`, wall collections |
| **Social graph** | Relationship **writes** & group metadata (not browse roster UI) | `Buddies.tsx`, `Groups.tsx`, `/buddies` | `registerBuddyRoutes`, `buddy-activity-presence.ts`, `registerGroupRoutes`, `registerFollowRoutes` | `buddy_*`, `user_follows`, `social_groups*` |
| **Places** | Place catalog read, place detail, **member place submit** | `src/places-discovery/*`, `PlaceDetail*`, FAB Add→place wizard (`compose` UI) | `place-catalog`, `place-submit`, `GET /places/catalog`, `POST /me/places` | `locations` (place rows) |
| **Facilities** | Facility catalog read, facility detail, **member facility submit** | FAB Add→facility wizard; `adminFacilityPlaceAdapter` | `place-catalog` (facility half), `GET /facilities/catalog`, `POST /me/facilities`, `GET/PATCH /admin/facilities` | **`facilities`** |
| **Areas** | Admin-curated **name** (`areas`, stable `areaId`) grouping Places/Facilities. **Not a map pin** — country / state / region come from map geography. Hub page `/area/:slug` + filter `?area=`. Children via **`place.areaId`** / **`facility.areaId`**. | `/area/:slug`, Find **Area then pin** (the pin is the seeking/place/facility, not the Area), admin **area** link | `areas-store`, `explore-map-area-lens.ts` (hub rollups, not map emit), `hostingPublishArea.ts` | `areas`; **`locations.areaId`**; **`facilities.areaId`**; seeking `areaId` on the activity/post; hosted geography = **`activity.locationId` → `place.areaId`** |
| **Shop profiles** | Operator shop public page + merchant manage (no product catalog) | `ShopPublic`, `/organisation/manage?kind=shop` | `registerShopPublicRoutes` · `registerShopMerchantManageRoutes` | `merchant_profiles`, `tenants` (SHOP) |
| **Engagement** | Goals, map pins, wishlist, follow | explore wishlist save, entity/member follow | `registerMeGoalsRoutes`, `registerMeWishlistRoutes`, `registerEntityFollowRoutes`, … | `user_goals`, `user_wishlist`, `entity_follows`, `user_follows` |
| **Platform ops** | Admin console, audit, applications, master-granted staff | `src/pages/admin/*` (`/admin/users` **Users** nav) | `routes/admin.ts` + `routes/admin/registerAdmin*` | `host_applications`, `audit_logs`, `auth_users` (staff role) |

**Rule:** If a change touches “who can do X,” find the row above first. Do not add a second resolver in a route file or a random hook.

**Viewer access (read vs act):** **Capabilities** = may organize/publish / open publishing workspace (`member_publish_capabilities`). **Detail exposure** = may see full entity payload (`activity-viewer-access`, `profile-viewer-access`). **Guest sheets** = sign-in copy only — not authorization. Canonical model: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.

### 3.1 Context alignment matrix (API · FE · storage)

Pick a **context id** when changing code; touch registrar + `src/api/domains/*` + UI roots together. Machine-readable paths: `scripts/bounded-context-manifest.json`.

| Context | Collections (wire) | Key HTTP | FE domain module | UI roots |
|---------|-------------------|----------|------------------|----------|
| discovery | `activities`, `locations`, shop tenants | `GET /explore/map` (`q`, `country`, `area`, `venue`) · `GET /me/discover/overlay` · browse also `/list` | `exploreApi` | `src/discovery` (card VM), `src/explore/shell`, `src/activity-discovery`, `src/places-discovery`, `src/explore/*`, `src/list/*` — pin UI §6.1 |
| compose | `member_availability`, `activities` (hosted) | `PUT /me/availability`, `POST /publishing/activities` | `exploreApi`, `availabilityApi`, `organisationApi` | `src/explore/ui/*` |
| participation | `activity_requests` (`note`, `hostNote`), `activity_participants`, `activity_invites` | **`POST /activities/:id/requests`** (hosted + rideshare); tenant **`GET /publishing/requests`** (console API, also Plan manage) | `activitiesApi` | Activity detail, Plan manage sheet, `JoinRequestDetail` |
| *(cross-cut)* | — | `GET /activities/:id` (`viewerAccess`, `myJoinInvite`) | — | **`activity-viewer-access.ts`**, **`activity-invite.ts`** |
| member_discovery | `member_profile_views` (+ read-only compose from map) | `/me/member-discovery/*` (roster, network, browse, quota, search); profile `?from=discover` | `accountApi` (`getMemberPeopleNetwork*`, discovery roster) | `src/people-discovery` — Explore **Find crew** panel, list **Buddies** (`listCat=people`), `MemberProfile` discover |
| member_identity | `auth_users` profile | `/me/profile`, `/users/:id` | `accountApi`, `memberApi` | `Profile*`, `src/member/*` |
| member_publish_capabilities | `tenants`, `tenant_memberships` | **`GET /me/status`** (`profileComplete` + nested `publish`) | `memberApi` | **`useMemberStatus`** |
| publishing_workspace | + `activities` | `/publishing/*` + `x-organisation-id` | `organisationApi`, `activitiesApi` | `src/pages/publishing/*`, `src/console/*`, `components/activity/*`, `activity/*` |
| communication | `chat_messages`, group wall | `/chat/*`, group wall | `messagingApi` (`chatApi` + wall via `groupsApi`) | `Messages.tsx`, `src/messaging` |
| social_graph | `buddy_*`, `user_follows`, `social_groups*` | `/me/buddies`, `/me/buddy-requests`, `/me/groups`, `/me/following`, … | `buddiesApi`, `groupsApi` | `Buddies`, `Groups` — relationship admin; **not** the explore people browse panel |
| places | `locations` (places), `submissions` | `GET /places/catalog`, `/places/:id`, `POST /me/places`, `POST /me/submissions` | `placeApi`, `placeCatalogClient`, `memberCatalogSubmitClientApi`, `geoHierarchyApi` | `PlaceDetail*`, `/profile/submissions` suggest form |
| facilities | `facilities` | `GET /facilities/catalog`, `/facilities/:id`, `POST /me/facilities`, `/admin/facilities` | `facilityApi`, `memberCatalogSubmitClientApi` | Facility submit wizard, `AdminPlaces` (`catalogSegment=facility`) |
| areas | `areas`, `geo_nodes`, `geo_stats`, `geo_outbox` | `GET /areas/:slug`, `GET /geo/tree`, `GET /geo/:id/summary`, `GET /geo/resolve` | `areasApi`, `geoHierarchyApi` | `/area/:slug`, `/geo` tree, `/geo/n/:id` summaries, IndexedDB + Redis/in-process geo cache, explore country/area/venue search |
| shop_profiles | `merchant_profiles` | `/shop/*` | `shopApi` | `ShopPublic`, shop UI |
| engagement | `user_badges`, `user_goals`, `user_wishlist`, `entity_follows`, `social_reviews`, … | `/me/badges`, `/me/goals`, `/me/wishlist`, `/me/entity-follows`, `/reviews` | `badgesApi`, `goalsApi`, `wishlistApi`, `entityFollowApi`, `reviewsApi` | `ProfileBadges`, goals, `entityFollowApi`, wishlist guards |
| platform_ops | `host_applications`, `audit_logs` | `/admin/*`, `POST/DELETE /admin/platform-admins` (master) | `adminApi` | `src/pages/admin/*`, `DashboardLayout`, `ADMIN_LINKS` — **ops tables**, not discovery L1/L2 |

**API mounts:** `/auth`, `/admin`, `/publishing`, `/chat`, `/shop`, `/media`, `/safety`, `/` (`user.ts`, including public `/reviews`) — see `apps/api/src/routes/index.ts`.

### 3.2 Browse — member people vs communication (do not conflate)

| User question | Bounded context | Surfaces | Not this |
|---------------|-----------------|----------|----------|
| Who can I go with? Who’s on an outing? Who’s looking for a crew? | **member_discovery** + **discovery** map | `/explore` People panel (`view=people`), `/list?listCat=people` (**Buddies**), shared `PeopleBrowseTabContent` | `/messages`, group walls |
| Who do I talk to? What did the crew say? | **communication** | `/chat` (**Chat** tab; legacy `/messages` → `/chat`), `/groups` → Message → thread | Explore people panel, roster APIs |

**One member model, two jobs:** browse reads show **relationship + outing status** (friend/following, trip hint, looking-for row, directory card). Chat surfaces use the **social graph** for eligibility but are a separate transport ([`COMMUNICATION.md`](./COMMUNICATION.md)).

**Naming for new code:** prefer `memberDiscovery`, `memberPeople`, `browsePeople` — reserve **social** for `social_graph` mutations and **reviews** (`/reviews` on root router). Guest gate intent `explore-social` means **browse people panel**, not inbox.

**Target consolidation (implementation):** one map-enriched **member people read** with views (`networkRoster`, `discoveryRoster`) behind stable routes; UI labels “Buddies” / map panel can diverge from code names.

---

## 4. Surfaces vs routes (contract)

Canonical navigation: [`NAVIGATION.md`](./NAVIGATION.md). Structural rules:

| Surface | Route anchor | Never confuse with |
|---------|--------------|-------------------|
| Marketing | `/` | Product home (`/explore`) |
| Browse + create | `/explore?compose=…` | `/publishing/activities/new` as consumer default |
| Personal hub | `/profile`, **`/plan`** | Legacy `/trips` redirects; not `/activities` browse |
| Entity | `/activity/:id`, place URLs | “Trip” entity (does not exist) |
| Publishing workspace | `/publishing/*` (SPA + HTTP) | Buddy **Host** (map FAB) + **Plan hosted** manage (same APIs, consumer surface) |
| Pro / business | `/profile/pro-membership` | `/become-host` as product entry (redirect only) |
| Messaging | `/chat` (+ `?group=` / `?to=`; legacy `/messages` redirects) | A second inbox route or host-only messages shell |
| List layout (browse) | `/list?…` (handoff) · mobile **List** pill on `/explore` | A second product home, `/map`, or **List bottom-nav tab** |
| **Publishing workspace** | `/publishing/*` (legacy `/host/*` → `/publishing/*`) | Consumer **Host** on `/explore` (same APIs, different shell) |
| **Platform admin** | `/admin/*` | Consumer peek/detail, Explore chrome, or `ConsumerShell` |
| **Public person** | `/member/:userId` | `/profile` (self hub). Individual Pro is the same page |
| **Tenant storefront** | `/agency/:slug`, `/shop/:id`, `/partner/:slug` | Business only. Activity **host row** uses `resolveActivityPublisherProfilePath` |

**Auth shells:** `ProtectedRoute` uses **`UserRole`** for coarse access (admin, publishing workspace shell). **Product gates** (Host / publish, paid host, profile chips) use **`MemberStatusDTO`** from **`GET /me/status`** (`useMemberStatus`). See [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) — mixing these layers is a top source of incoherence.

### 4.1 Browse routing strategy (scalable default)

Aligned with [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §4.1 and [`NORTHSTAR.md`](./NORTHSTAR.md):

- **Few browse surfaces, many filterable views** — `/explore` map-first; **list explorer** (`/list`) shares filter vocabulary (`src/list/routing.ts` ↔ `explorePath()`). **Mobile bottom nav — five tabs** — Trips · Venues · Plans · Crews · Chat; tab contract `src/config/mobileFiveTabNav.ts` ([`NAVIGATION.md`](./NAVIGATION.md) § Mobile five-tab).
- **One discovery catalog on the server** — `GET /explore/map` (+ query). Map stage, explore list sheet, and list discovery UI are **projections**; avoid separate “catalog” endpoints per category unless a new bounded context is approved in Tier-1. Signed-in peek/engagement is **`GET /me/discover/overlay`** (`viewerAccess` by item id) — not a second catalog. Product writes bust the Redis map via **`scheduleExploreMapCacheInvalidation`** (durable outbox in production — §8.9).
- **Many entity URLs where identity matters** — `/activity`, place paths, `/shop`, brand paths: sharing, notifications, per-id cache and `viewerAccess`. These are **not** browse department homepages.
- **Private engagement off the public map** — wishlist, entity follow, member follow, goals: `/me/*` and trips/profile UI ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Follow · Wishlist · Goal).

**Scale levers (prefer before new route trees):** bbox/region or cursor on explore map (**production default target** — §8.9); normalized query cache keys; **`GET /explore/map?projection=list`** for `/list` (same Redis catalog, stripped nested fields); admin tables use **server pages** (`page` / `pageSize`, no client concatenation); **optional** HTML prerender for **`/`** guest marketing and **entity detail** routes only — not a whole-SPA framework rewrite (§8.9 out of scope).

---

## 5. API shape (how the backend stays one system)

**Mount order:** `apps/api/src/routes/index.ts` — `auth`, `admin`, `host`, `shop`, `chat`, `media`, `reports`, `social`, **`user`** (broad public + `/me`).

**Thin routes:** `apps/api/src/routes/user/register*.ts`, `routes/host/register*.ts`, and `routes/admin/registerAdmin*.ts` — validate, call **service**, map DTO. Mount shells: `user.ts`, `host.ts`, `admin.ts`.

**Domain rules:** Prefer `apps/api/src/domain/*` (pure) + `apps/api/src/services/*` (orchestration). Avoid new business rules in `lib/*-store.ts` without a service façade.

**Contracts:** `packages/shared-types` — wire DTOs, explore projection, participation enums. API `domain/` may mirror rules but **shared-types** is what the SPA imports.

**Explore read model:** Single aggregator `GET /explore/map` (guest catalog) — clients should not reconstruct the map from three legacy catalog calls. Signed-in members merge `GET /me/discover/overlay`.

**Async side effects:** Notifications, explore map cache bust, and roster fan-out use the **side-effect outbox** in production (default on when `NODE_ENV=production`; drain in `side-effect-outbox-processor.ts`). Non-production may use fire-and-forget unless `SIDE_EFFECT_OUTBOX=1`. **`scheduleSideEffect`** remains for best-effort work in test/dev only — see `DEV_RUN.md`. **Chat inbox:** non-buddy partners use batched policy (`batchCanMessagePartnersFromViewer`); policy failure surfaces `directConversationsDegraded` (not silent empty inbox); regression `apps/api/tests/chat-policy.test.ts`. **Media:** private-bucket kinds deny anonymous presign (`media-access.test.ts`). **Search:** user substring search escapes via `regex-search` (`regex-search.test.ts`, `naming-coherence.test.ts`). **Read paths:** activity assembly, `/me/reviews`, `/me/entity-follows`, member browse + people rows (`countCheckedInParticipationsForUserIds`, `filterInboxMessageablePartnerIds`, read-only `batchResolveMemberProfileRoleLabelsForDirectory`), active tenant memberships (`tenant-access` + `findTenantsByIds`), host join-queue locations, wishlist profile hydration, group wall unread aggregation, publish fan-out actor labels (`resolveNotificationActorDisplayNamesForRecipients`); legacy demand map pins batch hide (`batchShouldHideFromMapMemberDiscovery`) — `naming-coherence.test.ts`. **Mount fetches / explore hygiene:** `useSafeAsyncEffect` (**S10a–b**), browse URL + pin-deep-link deps (**S10d**) — `systemCoherenceGuard.test.ts`. **Release (S10e/f):** bbox promote + manual QA — [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md), `npm run consumer-detail:qa-routes`; tracker **§8.1**.

Detail: [`API_ROUTING.md`](./API_ROUTING.md).

### 5.1 HTTP entrypoints — surface-first, not profile-first

**One domain entity does not imply one route registrar.** Catalog (and most cross-audience resources) use **parallel HTTP surfaces** that share **services + stores** underneath. **Do not** collapse member submit and platform admin CRUD into a single path (e.g. `POST /facilities`) and branch on `GET /me/status` or profile “user type.”

| Surface | Mount | Auth gate | Catalog examples | Capability source |
|---------|--------|-----------|------------------|-------------------|
| **Public read** | `userRouter` (before `requireAuth`) | Optional auth for `viewerAccess` | `GET /places/:id`, `GET /facilities/:id`, `GET */catalog` | `*-viewer-access` assemblers |
| **Member write** | `userRouter` (after `requireAuth`) | Signed-in member | `POST /me/places`, `POST /me/facilities` | Auth only — **not** `publish.canPublish` |
| **Platform ops** | `adminRouter` | `UserRole.PLATFORM_ADMIN` | `GET/PATCH/DELETE /admin/places`, `/admin/facilities` | Role on mount — **not** `/me/status` |
| **Publishing workspace** | `publishingRouter` | Tenant membership + publish gates | `POST /publishing/activities`, operator place submit | `GET /me/status` → `publish` |

**Registrar naming (API):** `registerPublic*`, `registerMe*`, `registerAdmin*` — Express **route mount** modules ([§8.4.9](#849-implementation-alignment-map-anti-drift)), not “who may sign up.” **`registerPublic*`** = **read-only** `GET` catalog/detail (guests + members); **no** public `POST` for place/facility submit — that is **`registerMe*`** only (`POST /me/places`, `POST /me/facilities`). **Guards:** `catalog-http-surface-guard.test.ts`, `cpc-terminology-guard.test.ts`.

**Anti-patterns:** `registerFacilityRoutes` / `registerPlaceRoutes` monoliths; `resolveMemberStatus` inside catalog submit handlers for admin CRUD; using `publish.canPublish` to gate **Add on map** place/facility submit or **join** flows.

---

## 6. Frontend shape (how the SPA stays one system)

| Layer | Role |
|-------|------|
| `src/pages/*` | Route shells — lazy in `App.tsx` |
| `src/explore/*` | **Discovery shell** — map stage, compose, browse chrome, join overlays |
| `src/discovery/*` | **Discovery read models** — card VM from `GET /explore/map` (pins, list, posters) |
| `src/pages/publishing/*`, `src/console/*` | **`/publishing/*` console** — shell, hub stats (`ConsoleHubSections`), join queue |
| `src/components/organisation-console/*` | Pro onboarding, public tenant profile editors (wire: organisation) |
| `src/api/domains/*` | HTTP clients per context — composed in `services.ts` as `api` |
| `src/config/*`, `src/content/*` | Routes helpers and canonical copy |
| `src/member/*` | Host-status display helpers and guards |

**API client:** Prefer `api.getMemberStatus()`, `exploreApi.*`, `organisationApi.*`. Domain modules only — `legacyApi.ts` removed; see `apiLegacyGuard.test.ts`.

**Publish payload:** Single builder `activityPublishPayload.ts` for explore Host and publishing workspace forms (shared across surfaces).

### 6.1 Discovery UI stack (methodology)

**Explore** names the **route and shell** (`/explore`, `ExploreMapStage`, filter pills). It is **not** a prefix for entity UI. Consumer discovery follows one vertical stack:

| Layer | Responsibility | Canonical modules |
|-------|----------------|-------------------|
| **L0 Wire** | Map/list DTO from API | `ExploreMapItemDTO` (`shared-types`), `GET /explore/map` + overlay `GET /me/discover/overlay` |
| **L1 Card VM** | Projection for peek + list + poster | `src/discovery/discoveryCardModel.ts`, `buildDiscoveryCardViewModel`. Headlines come from map `presentation`; the client reapplies clock strings. |
| **L2 Map peek** | Minimized card on map/list | `MapPeekShell` + `peek/{entity}/*` + `*PeekCard` |
| **L3 Entity detail** | Marketing depth, join, tabs | `src/activity/detail/*`, `*PlaceDetailPage`, `/area/:slug` |

**Naming (L2):** One shared shell — **`MapPeekShell`**. Per entity — **`{Entity}PeekCard`**, **`{Entity}PeekBody`**, **`{Entity}PeekActions`**. Activity membership buttons are **`ActivityPeekStandardFooter`**, the same resolver as the activity page (`resolveActivityDetailStandardFooter`). Do **not** stack extra prefixes (`PinSummary`, `Explore`) on entity parts.

**Routing rule:** `ExploreMapStage` mounts one host: geography (place and facility) → `PlaceMapPeekHost`; activity → `ActivityMapPeekHost`; shop and area → `CatalogMapPeekHost`. `mapPeekSlots` branches shop, area, and activity only inside the catalog card. Facility actions are directions plus the facility page (`FacilityPeekActions`). New logic goes under `peek/{activity|place|facility|area|shop}/`, not new `Explore*Peek*` files.

**Find crew (availability — MIG-DISCO-REG):** Registry = **`member_availability`** fixed slots; map wire `source: availability`, pin `availability:{userId}:{slotId}`. Summary surface = **`AvailabilityPeekActions`** (profile + message; optional **Offer rideshare** when `canOfferTransport` — dispatch in `discovery/discoveryOfferRideshareDispatch.ts`; people browse rows deep-link to the same pin). Assembler: `discovery-catalog-builder.ts` skips legacy `activityMode: seeking` rows. Ops: `migrate-seeking-to-availability` + `seeking:storage-status` for leftover `participant_intents`; leftover `pin=demand:` is not a product path (`seekingPinHygieneGuard`). Branch closure: [`SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md) § MIG-DISCO-REG.

**Parity rule:** Engagement affordances on L2 must match L3 for the same viewer state (`resolvePeekDetailAccess`, activity engagement policy) — see `consumer-detail-surfaces-plan.md`.

**Folder rule:** `src/explore/ui/Explore*.tsx` remaining files are **map chrome** (stage, pills, sheets) until a dedicated pass. **Do not add** new `Explore*` files for entity lists, follows, or people rows — those belong in `people-discovery` / `discovery`. Folder is the namespace.

**Geography vocabulary (do not mix):** **Place** = catalog entity (`locations`, HTTP `/places`, map `source: place`). **Facility** = amenity with coords (`facilities`, HTTP `/facilities`, map `source: facility`). **Area** = admin-curated **name** (`areas`, `areaId` on Place/Facility) — **not a map pin**. Country / state / region come from map geography. Legacy map aliases: `venue` / `catalog_place` → `place`; `source: area` retired. FE anchor: `src/place/geographyVocabulary.ts` · BWL: `BWL_EXPLORE_MAP_SOURCE` · guards: `geographyTerminologyGuard.test.ts`.

Canon table: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) (Discovery UI file names). Guards: `mapPeekNaming.test.ts`, `discoveryUiMethodologyGuard.test.ts`, `geographyTerminologyGuard.test.ts`.

#### 6.1.1 API vs UI vocabulary (keep the backend small)

**Problem:** When SPA layout names (`ListExplorer`, `ListingCard`, `embedMode`, five-tab ids) leak into `domain/`, stores, and non-catalog services, the API grows parallel concepts for every UI rename — without new product capability.

**Rule:** The server exposes **entities + catalog projections + viewerAccess**. Clients choose map vs list vs thumbnails.

| Layer | May say | Must not become |
|-------|---------|-----------------|
| **HTTP (stable)** | `GET /explore/map`, `GET /me/discover/overlay`, `GET /activities/:id`, `GET /me/member-discovery/*` | `/list/*` catalog routes, per-layout duplicate reads |
| **Discovery read-model** (`explore-map-*`, overlay, engagement wire) | `projection`, `presentation`, `mapPeekActions` / `mapPeekStrips` (L0 engagement on pins) | `listExplorer`, component filenames, tab chrome |
| **Core stores / domain** | `activities`, `locations`, `activity_requests`, `hostUserId` | Trip/listing/thumbnail as types or endpoints |
| **FE** | Explore · Trips · Venues · Crews (copy); browse cards in `src/list/browse/*` (`TripBrowseCard`, `VenueBrowseCard`, …); shell chrome may stay `ListExplorer*` until renamed | New `exploreApi.listExplorer*` clients; `*ListingCard` component names |

**Guards:** `apps/api/tests/api-ui-vocabulary-guard.test.ts`, `src/config/apiUiVocabularyGuard.test.ts`.

#### 6.1.2 Browse & peek card composition (do not merge into one mega-card)

**One card VM, composed surfaces.** L1 is always `DiscoveryCardModel` (wire → `buildDiscoveryCardViewModel`). UI is **not** one React component with every field; it is **shared primitives + bucket composers + action slots**.

| Piece | Role | Canonical |
|-------|------|-----------|
| **Copy / meta** | Pure projection from L1 (testable) | `src/list/browse/*Copy.ts`, `browseCardMeta`, `browseCatalogLabels`, `venueBrowseFacts` |
| **L2 frame** | Shared hero · meta · chip rows (list + peek) | `src/discovery/browse/*` — composers stay thin (`TripBrowseCard`, peek bodies) |
| **Media hero** | Cover + type icon; **no** when/where on photo (§6.1.3) | `DiscoveryBrowsePosterBanner` (map peek); list → `DiscoveryBrowseThumbnailPoster` via `DiscoveryBrowseCardHero` |
| **Browse bucket body** | Trips vs venues layout rules | `TripBrowseCard`, `VenueBrowseCard`, `BrowseCompactRow` |
| **Peek shell** | Dismiss, embed vs map summary, routes entity body | `MapPeekShell` + `peek/{activity,place,shop}/*` |
| **Engagement** | Join / wire / directions — policy-driven | `resolveListFeedFooterModel`; render → `DiscoveryCardWireEngagementFooter`, `DiscoveryBrowseListEngagementFooter`, `DiscoveryCardMapPeekEngagementFooter`, `ActivityPeekStandardFooter` |

**Why split CTAs, images, and catalogue lines:** Activity join state and venue wishlist/directions differ by entity and viewer; list thumbnails virtualize hundreds of rows; map peek needs dismiss chrome and bubble layout. Share **poster + meta**, not one `DiscoveryCard` that branches on every prop.

**Parity rule:** Same L1 + same footer resolver as L3 for activities (`listMapPeekEngagementParity`). Venue peek may use `PlacePeekHero` on catalog pins while list uses `DiscoveryBrowsePosterBanner` with venue overlay — entity-specific L2 is allowed; duplicate copy logic is not.

#### 6.1.3 Discovery card contract (map peek + list browse)

**Product job (L2):** One **decision card** per map pin or list row — answer *what is this, is it for me, who runs it, what do I do next* in a few seconds. **Map peek** and **list browse** are the **same contract**, **different presentation** (bubble vs thumbnail/row). **Entity detail (L3)** proves and deepens; it does not repeat the card’s job.

**Do not treat peek as a mini detail page.** Scroll-heavy peek = users lost before they tap Details.

| Presentation | Surface | Shell / composer | Density |
|--------------|---------|------------------|---------|
| **P-A Map peek** | `/explore` pin bubble | `ActivityPeekCard` / `PlacePeekCard` → `MapPeekShell` | Tight; footer always visible; max ~40% viewport |
| **P-B List thumb** | `/list` trips · venues buckets | `TripBrowseCard`, `VenueBrowseCard` | Same slots; body under hero; virtualized |
| **P-C List row** | `/explore` list column · compact bucket | `ExploreListRow`, `BrowseCompactRow` | Same slots; single row where possible |

**L1 input:** `DiscoveryCardModel` only (`buildDiscoveryCardViewModel`). **No second card VM** for list vs map. Presentation differences are layout/chrome only (§6.1.2).

##### Activity card — slots (order fixed)

| Slot | User question | Required | Cap | P-A peek | P-B list | L3 detail owns |
|------|---------------|----------|-----|----------|----------|----------------|
| **S1 Media** | What kind of outing? | Cover + type icon; optional corner pill (price / sold out) | **3:2** hero | Banner in bubble | Thumbnail poster (`aspect-[3/2]`) | Full gallery |
| **S2 Identity** | What is it? | Title (+ tappable → L3) | 1–2 lines | `MapPeekBrowseTitle` / headline | Card title | H1 + full description |
| **S3 Schedule / place** | When & where? | **One muted meta line under title:** when · place tail · price/spots (not on photo) | 1 line | `DiscoveryBrowseCardMetaLine` | Same meta resolver as list | Full schedule, meeting point map |
| **S4 Policy** | Am I allowed / is it a fit? | Audience & rules chips | **≤5 on L1** · **≤3 visible on L2** | Shared middle / published body | `DiscoveryBrowseCardChipRow` | Full requirements text |
| **S5 Hosted by** | Who do I trust? | Label **Hosted by** (or **Tour operator**) · avatar · name · **trust line** (verified host/business, guide count) — **not** “view profile” as the trust message | 1 block | Compact row in `ActivityPeekBody`; optional strip when not compact | `DiscoveryCardHostedByRow` (`layout="inline"` on list) | Host section, reviews, guides roster |
| **S6 Logistics hook** | How do I get there / ride? | **One** of: linked rideshare affordance · inherited place access line (parking · 4x4 · toilet) | 1 row | `ActivityPeekLinkedTransport` + optional place projection | **Carpool link row in body** (not on photo); place logistics ≤2 chips | Transport tab, parking map, facility pins |
| **S7 Join state** | Where am I in the flow? | Joined / Pending / spots (when changes CTA) | chips only | `ActivityPeekBody` status chips | `BrowseActivityStatusChips` | Participation, chat gates |
| **S8 Engagement** | What’s my next step? | Primary join/wire + Details | 1 footer | `ActivityPeekStandardFooter` | `DiscoveryBrowseListEngagementFooter` / wire footer | Sticky footer + full tab layout |

**S4 source of truth:** `enrichExploreActivityRequirementBadges(activity.requirements, …)` on L1 (`discoveryCardModel`). List browse must not invent a parallel policy vocabulary (align `listFeedPosterStandard` with the same extractor over time).

**S6 place inheritance:** When `activity.locationId` / `locationCard` exists, at most **two** logistics chips on the card (e.g. parking · toilet · sedan/4x4) from `venueBrowseFacts` — not a facility directory. **Nearby shops/facilities** = **map pins** + L3 **Nearby facilities** on place detail, not prose on the activity card.

##### Place / facility / shop cards — slots (abbreviated)

| Entity | Core job | Required slots | Card cap | L3 owns |
|--------|----------|----------------|----------|---------|
| **Place** (trail/camp) | Worth planning? | S1 hero · S2 name · S3 **breadcrumb tail** (`area · destination` from `geoRef` / catalog) · S4 kind + access facts · Plan trip + Details | **≤3 fact chips on L2** (full set on L3) | Maps, amenities, scheduled activities, nearby facilities list |
| **Facility** | Can I use this amenity? | S1 pin · S2 label · Directions + facility page | 2 CTAs | Condition reports, full amenity detail |
| **Shop** | Relevant gear? | S1 hero · S2 name · region · wishlist/follow · Details | minimal | Catalog, hours, contact |

##### Parity rules (enforce in code)

1. **Same L1** → map peek and list row show the **same** policy chips and **same** hosted-by trust line for a given `card.id` (modulo Pro entitlements hiding roster).
2. **Same engagement policy** as L3 for activities (`resolveActivityEngagementPolicy`, `mapPeekActions`, `ActivityPeekStandardFooter` ↔ detail footer).
3. **Copy resolvers live outside composers** — `*BrowseCardCopy`, `discoveryHostTrustPresentation`, `venueBrowseFacts`, `listFeedFooterActions`; composers only layout.
4. **Forbidden on L2:** participant walls, long descriptions, parking maps, “shops nearby” lists, GPS travel distance chips, duplicate mega-card components.

**Guards (orientation):** `mapPeekNaming.test.ts`, `listBrowseNamingGuard.test.ts`, `activityDetailAcceptance.test.ts`, `mapDetailEngagementParity` · **Nav summary:** [`NAVIGATION.md`](./NAVIGATION.md) § Explore map pin summaries → this section.

### 6.2 Frontend surface architecture (system methodology)

**Purpose:** One **object-centric** stack (wire → projection → shell → page composer) across **all** user-facing families — not only map peek and entity detail. Experiment plans (`consumer-detail-surfaces-plan`, `member-surfaces-implementation-plan`) are **workstreams under this section**; they do not replace it.

#### 6.2.1 Surface families (layout chrome)

| Family | Routes (anchor) | Shell / layout | Uses L1–L3 discovery stack? |
|--------|-----------------|----------------|----------------------------|
| **Marketing & auth** | `/`, sign-in, `/welcome` | Marketing layout · guest rules on `/` | No — CTAs hand off to `/explore` |
| **Discovery shell** | `/explore`, `/list` | `ExploreExperience` + map stage; `ListDiscoveryExperience` explorer | **L1–L2** on pins; list explorer → L3; not L3 on the map |
| **Personal hub** | `/profile`, `/settings/*` | `ConsumerShell` + app settings stack | Launcher only — not a second browse home |
| **Plan & commitments** | `/plan` | `ConsumerShell` | Embeds manage sheets; may deep-link L3 |
| **Communication** | `/chat`, `/messages`, `/groups` | Tab chrome / inbox | No peek; people **names** link to `/member` or storefront |
| **Entity detail (L3)** | `/activity`, place URLs, `/area`, `/shop`, org slugs | `MobileDetailShell` / `EntityPublicDetailShell` | L3 — parity with L2 via `resolvePeekDetailAccess` |
| **Member & people browse** | `/member/:id`, Explore `view=people`, `/list?listCat=people`, `/buddies` | `ConsumerShell` (profile) · `PeopleBrowsePanel` (discover) | **People rows** = own card VM (`memberPeople*`); seeking tab = **activity L1** |
| **Publishing workspace** | `/publishing/*` | `ConsoleShell` / `DashboardLayout` (tenant) | Preview may embed consumer L3 — **manage** is separate |
| **Platform admin** | `/admin/*` | `DashboardLayout` + `ADMIN_LINKS` | **Never** reuse `MapPeekShell` or consumer detail footers |

#### 6.2.2 Profile & publisher identity matrix

One **person account**; **one consumer profile page** (`/member/:userId` — `MemberProfile` / `MemberProfileView`). `/buddies`, people browse, host rows, and chat link here; browse **lens** is query only (`memberProfilePath(…, { lens })`). Full lens × audience table: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §3.2.2. Capabilities (`GET /me/status` → `publish`) gate **organize/workspace** — not profile read ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)).

| Viewer intent | Canonical route | Primary module | `viewerAccess` / policy |
|---------------|-----------------|----------------|-------------------------|
| **Self** | `/profile`, `/profile/edit` | `Profile*` | N/A (authenticated `/me/*`) |
| **Another member** | `/member/:userId` | `MemberProfile` | `resolveProfileViewerAccess` on `GET /member/:userId/profile` |
| **Discover directory** | Same + `discover=1` / `lens: discover` | `MemberProfile` | Public visibility + discovery quota (Pro unlimited) |
| **Friends / Going** | Same + `lens: friends` (optional) | `MemberProfile` | `accepted_buddy` → full exposure |
| **Available tab** | Same + `lens: available` (optional) | `MemberProfile` | Signed-in → public card at minimum |
| **Host / Looking for** | Same + `lens: host` (optional) | `MemberProfile` | Participant + host-of-activity levels |
| **Host on activity** | Activity Plan tab **host row** | `ActivityDetail*` publisher strip | Link **person** (`/member`) vs **business** (`/agency`, `/shop`) via `resolveActivityPublisherProfilePath` |
| **Individual Pro** | `/member/:userId` | `MemberProfile` | Same person card + Pro membership — no `/guide` storefront |
| **Agency / partner** | `/agency/:slug`, `/partner/:slug` | Same | Workspace team ≠ consumer buddy graph |
| **Shop brand** | `/shop/:id` | `ShopPublicPage` | `shop_profiles` context |
| **Available / roster** | Explore people tabs `available`, `going`, `connect` | `PeopleBrowseTabContent` | Roster APIs (`member_discovery`); **not** full L3 until tap through |
| **Owner preview** | Eye from profile / console | Consumer L3 with `preview` / manage affordances | Same wire as public; extra actions only in workspace |

**Target:** One **member browse row** projection (directory / availability / network roster) shared by `PeopleBrowsePanel` and list `listCat=people` — distinct from **`DiscoveryCardModel`** (map catalog entities). Keep **member** for person ids and profile routes; **people** for the browse surface name only.

#### 6.2.3 Discovery projections (one catalog, many lenses)

**Server:** `GET /explore/map` (+ query filters) is the default catalog; people directory and rosters compose from **`member_discovery`** + map read ([§3.2](./SYSTEM_COHERENCE.md#32-browse--member-people-vs-communication-do-not-conflate)).

**Client — same filter vocabulary everywhere:**

| Projection | Entry | Row/card builder | Deep link |
|------------|-------|------------------|-----------|
| Map pins | `/explore` | L1 `buildDiscoveryCardViewModel` → L2 peek | `pin=` / selection |
| List explorer | `/list` | Same L1 → thumbnails / list / calendar | Entity routes (back to `/list`) |
| Header search | Explore search modal | `exploreItemSearch` taxonomy | Entity or filtered explore |
| People — looking | `peopleTab=looking` | Activity L1 (seeking) | `/activity` |
| People — network | `going` / `connect` | Network roster VM | `/member`, message |
| People — available | `available` | Availability + directory VM | `memberProfilePath(id, { lens: 'available' })` — **not** discover quota |

**URL sync:** `explorePath()` ↔ `listDiscoveryPath()` ↔ `exploreBrowseUrlSync` / hydrate — do not add parallel query dialects per surface ([`NAVIGATION.md`](./NAVIGATION.md) § Explore URLs).

#### 6.2.4 L0–L3 by bounded context (extension of §6.1)

| Context | L1 (card VM) | L2 (peek / row) | L3 (detail composer) |
|---------|--------------|-----------------|----------------------|
| Activity (hosted + seeking) | `discoveryCardModel` | `peek/activity/*` | Kind **page composers** (`*ActivityDetailPage` → shell) — **not** one `ActivityDetailBody` with kind `if` chains |
| Place | L1 place slice | `peek/place/*` (`PlacePeekHero`, `PlacePeekBody`, …) | `buildPlaceDetailPageModel` → `PlaceDetailPage` → `PlaceDetailPageShell` → `PlaceDetailSections` |
| Area | **Not a pin** — `areaId` / `areaSlug` on Place/Facility (and activity via place) | Hub chrome / `peek/area/*` (hub page only — do not emit `source: area` on the map) | `AreaDetailPage` sections/tabs |
| Shop | L1 shop pin | `peek/shop/*` | `ShopPublicPage` |
| Member (browse) | `memberPeople*` row VM | Optional mini-card in people panel | `MemberProfile` |
| Tenant storefront | Org list cards (browse) | — | `OrganisationPublicProfile` |

#### 6.2.4.1 Shared L3 kind pattern (activity + place)

One methodology for catalog **detail templates** — not one URL for every entity:

| Step | Activity (`/activity/:id`) | Place (`/trail` · `/camp` · `/venue`) |
|------|----------------------------|----------------------------------------|
| Route loader | `ActivityDetail.tsx` (wire, modals, SEO) | `PlaceDetailPage.tsx` |
| Kind key | `ActivityDetailKind` from `activityType` | `PlaceDetailKind` from route wrapper |
| Kind route file | `*ActivityDetailPage` → `ActivityDetailPageShell` | `*PlaceDetailPage` → `PlaceDetailPageShell` |
| L1 | `buildActivityDetailPageModel` | `buildPlaceDetailPageModel` |
| Public body | `ActivityDetailSections` (peek L1 card) | `PlaceDetailSections` (peek-native hero parity) |
| **Presentation wire** | `GET /activities/:id` → `presentation.sections` (+ `engagement`, `mapPeekActions` via `viewerAccess`) | Place: catalog fields on `GET /places/:id` (no `sections` wire yet — page sections local) |
| Kind-specific facts / plan | `*ActivityDetailPlanSections` → `ActivityDetailBody` (hiking / camping / rideshare / other) | `PlaceDetailKindFacts` + shared scroll (`PlaceDetailSections`); contribute preview still uses `PlaceDetailTabs` |
| Shared core | `ActivityDetailView` + `MobileDetailShell` | `MobileDetailShell` via `PlaceDetailSections` |

Host preview (`previewMode`) and `ActivityManageSheet` (`isEmbedded: true`) use `ActivityDetailView` with the same `presentation.sections` and `footerByTab`. They skip `ActivityDetailByKind`.

#### 6.2.5 Cross-cutting kits (one implementation per concern)

| Concern | Canonical location | Surfaces |
|---------|-------------------|----------|
| Guest sign-in / browse gate | `guestBrowseGate*`, `ActivityDetailGuestGate`, `ExploreGuestJoinSheet` | Peek details, L3, people tabs (non-public) |
| Join / RSVP / request | `useActivityJoinFlow`, wire footers | L2 actions, L3 footers, Plan manage |
| `viewerAccess` → UI | `mapViewerAccessToUi`, `resolvePeekDetailAccess` | L2–L3 parity guards |
| Participation modals | Activity manage / invite sheets | Explore host on map, L3, `/publishing/requests` |
| **Location pick (write)** | `CreatePlacePicker` + `ComposePlacePickerOverlay` + `ComposeMapEntryRow` (`src/explore/create/interactions/`) | FAB Host / Seek / Add, participant intent, Pro application — **not** admin `MapPinPicker` |
| **Compose wizard frame** | `ComposeWizardShell` + `ComposeWizardStepChrome` · step modules in `hostingWizard/` `availabilityWizard/` `addWizard/` | FAB Host / Seek / Add / Facility — map session first, then sheet |

#### 6.2.6 Admin & operator (out of consumer methodology)

- **Admin (`/admin/*`):** CRUD tables, moderation queues, metrics — `adminApi` + `DashboardLayout`. Does **not** adopt discovery card VM or entity tab footers; may link **out** to consumer URLs for inspection only.
- **Publishing workspace (`/publishing/*`):** Tenant-scoped publishing — `ConsoleShell`, join request queue, activity forms. **Host** on the map remains consumer shell; shared **publish payload** (`activityPublishPayload.ts`) is the cross-surface write contract.

**Program:** **S13** (§8) — implementation waves; activity kind page split is **S13d**, not a standalone architecture.

---

## 7. Incoherence register (honest debt)

Track consolidation here; sub-roadmaps link out but **this table is the system-wide backlog**.

| ID | Symptom | Why it hurts | Target state | Tracker |
|----|---------|--------------|--------------|---------|
| **C1** | Three permission notions (`UserRole`, `HostStatusDTO`, tenant middleware) | Wrong gates in UI; workspace confused with Host | Roles = shell; **`GET /me/status`** / `MemberStatusDTO` = product; tenant header = **`x-organisation-id`** on **`/publishing/*`** | [`MEMBER_MODEL.md`](./MEMBER_MODEL.md), `host-member-model.mdc`, `hostMemberGuard.test.ts` (no `isHostRole` in product gates) |
| **C2** | Organisation/Host naming mix in UI | New code uses wrong copy or imports | `Host*` + `Activity*` for publish/roster; `Organisation*` only for tenant storefront wire; host user copy | §8.8 (this doc) P2 · [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Organisation in filenames |
| **C3** | ~~Large `host.ts` / `admin.ts` monoliths~~ | — | **Mitigated (Oct 2026):** host + admin mount shells with `register*` registrars | §8.8 (this doc) P2 |
| **C4** | Parallel place detail pages (`Trail` / `Camp` / `Event`) | Duplicate SEO/loading patterns | `PlaceDetailCore` + thin kind wrappers (`placeDetailCore.test.ts`) | **R3 done** — routes unchanged for SEO |
| **C5** | `components/activities/*` modals vs explore wizards | Two create UX paths | Explore compose only for consumer create | Mostly done — audit `components/activities` |
| **C6** | Shop = `tenant` + `merchant_profile` | Two writes for one brand | Documented split; sync on `/organisation/manage?kind=shop` save | [`DOMAIN.md`](./DOMAIN.md) |
| **C7** | Premium location unlock + old membership page | Legacy freemium copy vs north star | Product TBD | [`NORTHSTAR.md`](./NORTHSTAR.md) |
| **C8** | `/community`, `/membership` routes | Secondary surfaces vs explore-first IA | Both redirect to `/explore`; `COMMUNITY_PATH` kept for inbound links only | [`NAVIGATION.md`](./NAVIGATION.md) legacy table |
| **C9** | Notification + privacy matrix incomplete | Rare group/private actor QA | API `notification-actor-label`; FE `notificationConsumerGuard` + `notificationRouting.test`; API route side effects → `scheduleSideEffect` / `scheduleNotification` | **Eng done (Oct 2026)** — manual QA for edge notification kinds |
| **C10** | 100+ markdown files, multiple “plans” | Agents read wrong doc | **Tier 1** only for truth; experiment cap + stubs (**C27**, §8.6.4) | [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) |
| **C11** | Long flat `api.*` surface | Wrong facade | Domain modules in `src/api/domains/*` | [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §10–12 |
| **C12** | Notification meta dialects | Routing sprawl | `NotificationMeta` + `actorUserId` | §11 |
| **C13** | Many `*Routing.ts` helpers | Import confusion | `routingCatalog` + `inferNotificationPath` | §10 |
| **C14** | Doc corpus duplication | Contradictory terms | **Update Tier-1 only** — [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) | |
| **C15** | Buddy/friend vocabulary | Fake entity ids | User ids only | [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Naming vocabulary |
| **C16** | ~~Parallel detail policy~~ | — | **Mitigated (Oct 2026):** API `viewerAccess`, map enrich, `mapViewerAccessToUi`; FE shim is wire-only | [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15 |
| **C17** | Discovery card projection sprawl | Optional API `DiscoveryCardProjection` on map wire | `src/discovery` VM + `buildDiscoveryEnrichedCard`; detail wire footers (`activityDetailAcceptance` AD-PRES-02, R6) | **R1 + R6 done (FE)** — slim map DTO promotion is R5 ops |
| **C18** | `ExploreExperience` orchestration hub | Was ~900 LOC monolith | Shell hooks + `exploreBrowseUrlSync` / `exploreBrowseUrlHydrate` / apply-handlers + selection sub-hooks | **R2 done** — wiring & browse URL hook under guard budgets; public browse/selection contracts unchanged |
| **C19** | Global explore map blob | Full fetch default; bbox behind flags | `explore-map-base` + bbox fetch — [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md) § bbox | **R5 shipped (flagged)** — staging runbook |
| **C20** | Seeking **read** paths (M2d write fixed) | leftover demand: pin ids | Activity-primary map pins; seekingPinHygieneGuard | **R4 done** — leftover demand: dual-read dropped |
| **C21** | **Surface/role prefixes in shared components** (`Host*`, `Explore*`, `Plan*` outside owning folders; Host→Organizer synonym renames) | Same mistake as C2; blocks reuse and coherent refactors | Module names = bounded context; props = neutral ids; copy in labels/`workspaceVocabulary` | [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §13 · §8.8 (this doc) P5 · `moduleNamingGuard.test.ts` |
| **C22** | **Find vs Organize split in UI** (legacy host-manage peek, `participantIntentId` publish paths, transport vs `link-activity`) | Same map activity, different chrome and wrong transport link | **S12** in [`CREATE_FLOW.md`](./CREATE_FLOW.md) — one host peek; parent `linkToParentActivityId` for transport | **S12 done** |
| **C23** | ~~**Activity L3 monolith**~~ | — | **Done (S13-W7)** — thin `ActivityDetailBody` + `ActivityDetailPlanColumn` / `ActivityDetailSidebarColumn`; kind `planSections` on plan column | **S13-W7** |
| **C24** | **People surfaces split** (`PeopleBrowsePanel`, `ListDiscoveryExperience`, `Buddies`, activity host row) without shared people card VM | Inconsistent roster masks, duplicate buddy CTAs | `memberBrowseRowModel` + one `PeopleBrowseTabContent` — §6.2.2 | **S13-W3 done** |
| **C25** | ~~Admin / platform_ops FE roots under-documented~~ | — | **Done (S13-W9)** — `NAVIGATION.md` admin table, `adminSurfacesAcceptance`, manifest `feRoots` | **S13-W9** |
| **C26** | Catalog POI model flat (`locations` + `place-kind` amenities); area-wide “nearby facilities”; FAB **Host·Find crew·Add on map**; v3 `?compose=` (`host` \| `seek` \| `add` only); contribute/submit/registry jargon split | Wrong trail amenities; organize picker pollution; duplicate shop semantics (member pin vs operator storefront) | **Program CPC** (§8.4): **Place** + **Facility** entities; catalog queries; `viewerAccess` on places; compose wire host/seek/add only | **Mitigated (CPC-0–6)** — CPC-7 dual-read tail + `verify:system` before close |
| **C27** | ~~**Doc corpus sprawl**~~ | — | **Mitigated (Oct 2026)** — `experiment/README` only; retired narratives stubbed or deleted; schedules §8 only | [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) · `verify:docs` |
| **C28** | **Multi-quarter refactor without program spine** | Half-migrations, lost context mid-flight | **`scripts/refactor-program.json`** + §8.6 phase gates; manifest + migration IDs; strangler rules | §8.6 below |
| **C29** | ~~**Write-surface UI lag**~~ | — | **Done (S14-W5)** — location kit, compose shell, pillar steps, Host bodies, UAE destination modes | **S14** §8.3.6 |

**Not debt (intentional):** legacy `/host/*` → `/publishing/*` SPA rewrite; Mongo `locations` collection name (wire **Place**); `x-organisation-id` header; `getOrganisationProfile` for **storefront** — not activity roster. Leftover inbound URLs: `/trail`·`/camp`·`/venue` → `/place/:id`; `/contributions` → `/profile/submissions`.

---

## 8. Consolidation phases (system-wide)

Ordered for **coherence**, not feature count:

| Phase | Outcome | Primary docs / commands |
|-------|---------|-------------------------|
| **S0** | Single doc entry + automated phrase guards | `DOCS_INDEX`, `verify:docs` |
| **S1** | One member capability resolver (`GET /me/status`; legacy paths rewritten) enforced server-side | `MEMBER_MODEL`, `verify:host-member` |
| **S2** | Host route modularization + fulfill removal | **Done** — §8.8 PCOH |
| **S3** | API mount shells: **`user.ts`**, **`admin.ts`** → `register*` modules only | **Done** — admin registrars + platform master staff; user already modular |
| **S4** | Frontend `api.*` stays domain-only | **Done (guards)** — `apiLegacyGuard`, `domainImportGuard`, `consumerApiIndexGuard`, `hooksApiFacadeGuard`, ESLint R8; `api/index` only in `src/hooks` facades |
| **S5** | Privacy notification matrix + viewer access everywhere | §8.8 (this doc) P2 |
| **S6** | Place detail internal merge + SEO pass | **Done** — R3 `PlaceDetailCore`, thin trail/camp/event wrappers (`placeDetailCore.test.ts`) |
| **S7** | **Viewer access VA-1–VA-7** (activity detail + explore peek on API contract) | **Done** — §15.8; layer-7 hook `composeActivityViewerAccess` / `applyActivityViewEntitlements` |
| **S7b** | **Activity detail tabs** (Plan · Place · Buddies · Transport) + unified engagement policy | **Done** — program `complete`; wire footers + `activityDetailAcceptance` / AD-CTA matrix |
| **S7c** | **Viewer access naming** (wire-first, collapse resolver soup) | **Done (NA-1–NA-6)** — plan §22; API `buildActivityViewerAccess`; [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.11 |
| **S8** | **Discovery architecture** — card VM, explore shell, seeking read cleanup, map bbox spec | **Wave closed (R0–R6, R4 read, R8)** — R5 bbox **promote** via [`EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md); §3 metrics (seeking branches, slim map default) = optional follow-up |
| **S9** | **Consumer detail shell alignment** — place/area/shop/agency IA + shared chrome vs activity reference | **Eng complete** — shells Phases 1–7; lineage **§3.2** + API `detail-surface-lineage-contract`; §8.1 `consumerDetailQaMatrixGuard`; §15.3 `consumerDetailAntiDriftGuard`. **Pending:** S10f manual (`npm run consumer-detail:qa-routes`) |
| **S10** | **Production hygiene audit (Oct 2026)** — security, trust, perf, stability (not new audit markdown) | **Eng complete** — **§8.1** waves **core + S10a–d** shipped; **S10e/f** = ops/human gates ([`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md)); **S10g** deferred. **Out of scope:** **C18** rewrite; **C19** prod default = staging promote only |
| **S11** | **Structural module naming (P5 SN-1–SN-8)** — context folders, not synonym renames | **SN-1–SN-8 done** — `useMemberStatus`, `tenantActivityClientApi`, `/publishing` mount, `moduleNamingGuard` SN-6 | §8.8 (this doc) P5 |
| **S12** | **Hosted + seeking activity coherence** (one host, one map pin, linked transport) | **S12a–d done** | [`CREATE_FLOW.md`](./CREATE_FLOW.md) § Coherence program |
| **S13** | **Frontend surface methodology** — profiles, discovery projections, admin/operator boundaries, L3 composers (§6.2) | **Guards + W1–W9 shipped** — **product closure = P4b** (`MIG-SURFACE-*`); **W10** = S10f gate | §8.3 · **§8.6 P4b** |
| **S14** | **Write surfaces** — location pick kit, compose wizard chrome, pillar step modules, destination UX, stale-file hygiene | **Done** — W0–W5 shipped | §8.3.6 · [`CREATE_FLOW.md`](./CREATE_FLOW.md) |

### 8.3 S13 — unified frontend & UI program (final phase plan)

**Canonical architecture:** §6.1 (discovery L0–L3) + §6.2 (surface families). **S13** = read/detail surfaces. **S14** (§8.3.6) = write/compose surfaces. Retired `docs/experiment/*` plan files — see [`experiment/README.md`](./experiment/README.md).

#### 8.3.1 Synthesis — one vertical stack per object

**Surfaces** (§6.2.1) provide **route chrome only** — map stage, `ConsumerShell`, `DashboardLayout`, marketing layout. They do **not** own entity UI.

**Per object** (activity, place, area, shop, person), the same five layers apply everywhere the object appears:

| Layer | Responsibility | Policy |
|-------|----------------|--------|
| **L0 Wire** | API DTO + `viewerAccess` / entitlements | Server only — [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15 |
| **L1 Projection** | Card/row view model | `discoveryCardModel` (catalog pins) · `memberPeople*` (people browse) · future `activityDetailPageModel` (L3) |
| **L2 Peek / row / explorer card** | Minimized engagement | `MapPeekShell` + `peek/{entity}/*` · list explorer cards |
| **L3 Page composer** | Sections + tabs for one id | `*ActivityDetailPage`, `PlaceDetailSections`, `MemberProfile`, `ShopPublicPage`, … |
| **L3 Shell** | Shared chrome (hero, tabs, sticky footer) | `MobileDetailShell`, `EntityPublicDetailShell`, `ActivityDetailPageShell` |

```mermaid
flowchart LR
  subgraph discovery [Discovery shell only]
    MAP["/explore map"]
    LIST["/list explorer"]
    PEOPLE["view=people"]
  end
  subgraph L1L2 [L1 VM to L2]
    CARD[Card / row VM]
    PEEK[Peek or compact row]
  end
  subgraph L3 [Entity L3]
    ROUTE["/activity · place · /member · /shop …"]
    COMP[Page composer]
    SHL[Shared shell]
  end
  MAP --> CARD
  LIST --> CARD
  PEOPLE --> CARD
  CARD --> PEEK
  PEEK -->|"view detail"| ROUTE
  ROUTE --> COMP --> SHL
```

**Cross-cutting kits** (§6.2.5): guest gate, join flow, `mapViewerAccessToUi`, **location pick** — imported by L2/L3/write chrome; never forked per surface.

**Write chrome (FAB compose):** `ComposeHost` mounts three **domain** wizards (Host / Find crew / Add). Shared shell and map overlay live in `src/explore/create/` — not a fourth product, not L1 card VMs. Engines stay split (`hostingFlowEngine`, `availabilityFlowEngine`, `addFlow` / `addFacilityFlow`). Schedule: **S14** (§8.3.6).

#### 8.3.2 Baseline — already shipped (do not rebuild)

| Area | Status | Proof |
|------|--------|--------|
| Discovery L1 + unified activity peek (hosted + seeking) | Done | S8, §6.1, `discoveryUiMethodologyGuard` |
| `viewerAccess` on activity detail + peek parity | Done | S7, `mapDetailEngagementParity` |
| Place L3 (`PlaceDetailSections` + kind routes) | Done | S6, `placeDetailCore.test.ts`, `placeDetailUiHygieneGuard` |
| Consumer detail shells (shop/agency/area/activity chrome) | Eng done | S9, `consumerDetailAntiDriftGuard` |
| Single member route `/member/:userId` + API profile access | Done | `MemberProfile`, `profile-viewer-access` |
| `/buddies` list → `/member` links | Done | `Buddies.tsx` |
| Discover directory quota + `discover=1` on API | Done | `member-discovery-quota`, `MemberProfile` |
| Publishing workspace vs consumer Organize split | Done | S12, `CREATE_FLOW` |
| Module naming / domain API clients | Done | S11, S4 |

**Known gaps (S13 fixes):** human consumer-detail QA sign-off (**W10** — `npm run consumer-detail:qa-routes`). **Closed (W1–W9 eng):** profile lenses · people browse VM/shim · guest kit · profile section gates · activity L3 columns + kind composers (**C23**) · place L1 + **camp/event hero facts** · area tabbed hub (S9 Ph 4) · shop/agency `EntityPublicDetailShell` (`publicEntityShellAcceptance`) · admin catalog (C25).

#### 8.3.3 Implementation waves (order + PR boundaries)

Work **top to bottom**. Each wave ends with **`npm run verify:system:quick`** (wave touch explore → also `test:explore-alignment`). Update §6.2 / `DOMAIN_CANONICALS` §3.2 when behavior changes.

| Wave | ID | Outcome | Primary deliverables | Exit criteria |
|------|-----|---------|----------------------|---------------|
| **0** | **S13a** | Charter frozen in Tier-1 | §6.2 (this file), §3.2.2 member lenses, `DOCS_INDEX` | `verify:docs` |
| **1** | **S13-W1** | **Profile link lenses** | **`memberProfileLink(userId, lens)`** (`src/member/memberProfileLink.ts`) used by people browse, `/buddies`, roster chips, notifications, chat; owner preview **`memberPublicPreviewLink`** (`view=public`, not a lens); wire = `memberProfilePath` in shared-types | `memberProfileLink.test.ts`, `memberSurfacesAcceptance` S13; no duplicate `explore/ui/peopleBrowse` implementations |
| **2** | **S13-W2** | **People browse module unity** | One `PeopleBrowseTabContent` import path under `people-discovery`; `explore/ui/peopleBrowse` re-export **deleted** (EXPLORE-IA); list people browse uses `PeopleBrowsePanel` | `memberSurfacesAcceptance`, `listModuleHygiene` · DISC-METH-11 |
| **3** | **S13-W3** | **Member browse row VM** | `src/people-discovery/memberBrowseRowModel.ts` — L1 rows for directory, availability, going, seeking; **not** authorization | `memberBrowseRowModel.test.ts` + panel/list consume VM; C24 closed |
| **4** | **S13-W4** | **Profile L3 polish** | `MemberProfileView` sections keyed off `viewerAccess` only; activity publisher strip uses `resolveActivityPublisherProfilePath`; owner `?view=public` via `memberPublicPreviewLink` | `detailSurfaceWiringAcceptance`, §15 profile tests |
| **5** | **S13-W5** | **Discovery projection parity** | L1/L2 engagement parity per `listCat` / people tab; member browse L1 in methodology guards | `discoveryUiMethodologyGuard` DISC-METH-07–09 · `listModuleHygiene` peopleBrowse shim |
| **6** | **S13-W6** | **Guest + participation kit** | `guestBrowseGateCopy` + `ExploreGuestSignInCard` for people browse, member profile, activity L3, peek-details | `guestParticipationKitGuard.test.ts` + `detailSurfaceWiringAcceptance` DS-WIRE-02 |
| **7** | **S13-W7** | **Activity L3 kind composers** | `buildActivityDetailPageModel(wire)`; per-kind `*ActivityDetailPage` composes sections (place pattern); remove unwired `planFacts` / shrink `ActivityDetailBody` | `activityDetailAcceptance` per kind; C23 closed |
| **8** | **S13-W8** | **Entity L3 leftovers (S9)** | Optional: area tabbed hub; place Facts/Transport tab labels; shop/agency `EntityPublicDetailShell` parity audit | `consumerDetailQaMatrixGuard` rows green |
| **9** | **S13-W9** | **Ops surfaces catalog** | `NAVIGATION.md` § Platform admin table; `adminSurfacesAcceptance` lists `/admin/*` routes; manifest `feRoots` (C25) | No consumer peek imports in `src/pages/admin/*` |
| **10** | **S13-W10** | **Release gates** | Human QA `npm run consumer-detail:qa-routes`; ops S10e bbox promote if scheduled | `PRE_DEPLOY_CHECKLIST` |

**Parallelism:** W1–W2 can ship as one PR if small. **W7** (activity kinds) should not start until **W6** guest kit is stable (same join surfaces). **W8** can run parallel to **W7** by another owner. **W9** is doc/guard-only anytime after W0.

**Explicitly out of S13:** marketing/`/` rewrite · new Mongo entities · operator console feature expansion · C19 production map default (ops) · C1 admin MFA (S10g).

#### 8.3.4 Mapping legacy phase labels

| Old label | S13 wave |
|-----------|----------|
| consumer-detail Phase 2 (activity kind) | **W7** |
| consumer-detail Phase 3–4 (place/area tabs) | **W8** |
| consumer-detail Phase 6 (people clarity) | **W1–W4** |
| member-surfaces people panel | **baseline**; W2–W3 |
| S13b–g (prior table) | W2–W3 (b), W4 (c), W7 (d), W9 (e), W6 (f), W5 (g) |

#### 8.3.5 Per-PR checklist (all S13 waves)

1. Bounded context from §3.1 — touch `feRoots` in `bounded-context-manifest.json` when adding roots.
2. No new `Explore*Peek*` entity files; no new `/become-host` links; no product `isHostRole` gates.
3. Authorization stays on API `viewerAccess` — FE maps with `mapViewerAccessToUi` / `mapProfileViewerAccessToMemberLink`.
4. Tier-1 doc delta in same PR (at least `NAVIGATION` or `DOMAIN_CANONICALS` §3.2 if routes/links change).

#### 8.3.6 S14 — write surfaces (compose + location kit)

**Does not rebuild** discovery L1–L3, peek, or member profile. Extends §6.2.5 for **writes**.

| Wave | Outcome | Delete / stop using when done |
|------|---------|-------------------------------|
| **S14-W0** | Charter (this section + `CREATE_FLOW` code map) | No new compose architecture markdown |
| **S14-W1** | Location kit: `ComposePlacePickerOverlay`, `ComposeMapEntryRow`, `useComposeMapSession` | Direct `lazy(() => import('…CreatePlacePicker'))` in wizards |
| **S14-W2** | `ComposeWizardShell` (sheet + wide-page + back: map session first) | Per-flow `FlowSheetChrome` copy-paste where the shell covers it |
| **S14-W3** | Thin controllers + `availabilityWizard/steps`, `addWizard/steps` | Inline step blocks in `CreateAvailabilityFixedFlow` / `CreateAddFlow` after extract |
| **S14-W4** | Host bodies → `hostingWizard/bodies/` | Root `hosting*WizardSteps.tsx` barrels |
| **S14-W5** | Destination product UX (UAE chip, ladder, in-host add-new) | Host-only map apply forks; `showDifficulty` on destination step |
| **Hygiene** | Guard `composePlatformGuard`; no re-add of `organizeFlow` / `demandFlow` (already gone) | See stale inventory in [`CREATE_FLOW.md`](./CREATE_FLOW.md) § Code map |

**Out of S14:** merging Host/Seek/Add engines · admin `MapPinPicker` · `/publishing/*` console forms · marketing `/`.

### 8.2 S12 — hosted + seeking coherence (phase plan)

| Phase | Outcome | Primary code | Status |
|-------|---------|--------------|--------|
| **S12a** | Transport child links via `linkedActivityId` / `linkParentToRideshareActivity`; **no** `link-activity` on rideshare publish | `useExploreRideshareOrganizeLinks.ts`, `hostingActivityPublish.ts`, `linkActivityRideshareOffer.ts` | **Done** |
| **S12b** | Owner peek = `ExploreActivityMapPeekActions` for seeking + hosted (legacy demand-owner fork only without activity host wire) | `exploreSelectionSelectedCard.ts`, `enrichListFeedCard.ts` | **Done** |
| **S12c** | Find success + intent manage → same transport surfaces as Organize (`LinkRidesharePanel`, paste link) | `AvailabilityFixedSubmitSuccessSheet.tsx`, `ParticipantIntentManageSheet.tsx` | **Done** |
| **S12d** | Docs/guards: no new `demand`-only product gates; intent APIs read-through only | `seekingPinHygieneGuard` (S12d tests), `discoveryCardModel` leftover flags | **Done** |

### 8.1 S10 remediation waves (phase plan)

Work **in order**; extend `systemCoherenceGuard.test.ts` / `naming-coherence.test.ts` per wave; update §5 bullets when a wave closes.

| Wave | Goal | Scope (representative) | Guard / proof | Status |
|------|------|------------------------|---------------|--------|
| **S10-core** | P0–P1 audit items shipped | Demo login, regex search, demo passwords, metrics auth, side effects, inbox batch + degrade, media ACL, shop rails, batched reads (assembler, reviews, entity-follows) | `verify:domain` + §5 | **Done** |
| **S10a** | Consumer **mount-fetch races** (`useSafeAsyncEffect`) | Inbox, Profile hub/edit/badges, place detail, explore peek hooks, `MemberProfile`, `ActivityDetail`, `JourneyMapPage`, `ShopPublic`; **AreaDetail** uses React Query (OK); plan sections = deep-link sync only | `systemCoherenceGuard` S10a lists | **Done** (Oct 2026) |
| **S10b** | Publishing workspace (`/host/*`) mount-fetch races | `Activities`, `JoinRequests`, `Places`, `History`, `Team`, `PublicProfileEdit`, `ConsoleShell` reviews chip; hub via `useConsoleHubData` (React Query) | `systemCoherenceGuard` S10b | **Done** (Oct 2026) |
| **S10c** | API **read batching** (N+1) | Read/list paths batched (incl. member browse, wishlist, group unread, publish notify actor labels); private-profile notify fan-out may still resolve per recipient | `naming-coherence.test.ts` | **Done** (Oct 2026) |
| **S10d** | Explore **runtime hygiene** (not C18 rewrite) | Browse URL migrations, organize/pin-deep-link callback deps, rideshare gate deps | `systemCoherenceGuard` S10d | **Done** (Oct 2026) |
| **S10e** | **C19** map bbox **promote** | Staging flags `EXPLORE_MAP_BBOX` + `VITE_EXPLORE_MAP_BBOX`; p95 bbox vs full map per runbook | `npm run s10e:staging-checklist` (`--verify` optional); [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md) | **Deferred (eng)** — prod/staging promote pending ops; P2 eng may proceed behind flags |
| **S10f** | **Manual QA** | S9 §8 routes + C9 notification edge cases | `npm run consumer-detail:qa-routes` (prints both checklists); eng bridge `activityDetailS10fBridgeGuard` | **Pending (human)** |
| **S10g** | **C1** platform admin hardening | MFA, impersonation, cross-tenant — not a quick slice | `MEMBER_MODEL` / security review | Deferred |

Phases **S0–S4** (guards), **S6–S8** (core), and **S7/S7b/S7c** are in place; **S5** manual QA + knip optional. **S8** coded tracks are complete — remaining discovery scale work is **R5 promotion** (ops) and optional metrics (**C19**); discovery execution archive = [`archive/system-refactor-plan-2026-10.md`](./archive/system-refactor-plan-2026-10.md). **Platform program (P0–P6):** §8.6 + [`refactor-program.json`](../scripts/refactor-program.json). **S7** supersedes ad-hoc peek/detail gating in the SPA (**C16** mitigated). **S9** eng is complete; §8 manual QA overlaps **S10f**. **S10** engineering remediation closed Oct 2026 — run **`npm run verify:system`** before release; staging bbox (**S10e**) and printed QA routes (**S10f**) are the remaining human/ops gates.

### 8.4 Program CPC — Catalog & Publishing Coherence (**C26**)

**Status:** Approved architecture · **CPC-0–7** shipped (catalog wire; Oct 2026) · **CPC-8–9** done · **§8.4.9** = implementation map (no drift). Member-status nested `publish` only (Oct 2026).  
**Single release train:** one integration branch / flag window; internal phases **CPC-0 … CPC-9** — not ad-hoc rename patches.  
**Read between phases:** this §8.4 + [`CREATE_FLOW.md`](./CREATE_FLOW.md) + [`DOMAIN.md`](./DOMAIN.md) § **What · Where · Who · How** + Place · Facility · Shop layers + [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §1.7.

#### 8.4.1 Architecture snapshot (agreed)

**Lens:** **What** = Activity · **Where** = Area / Place / Facility · **Who** = Person / Host / Operator · **How** = participate (**context only** — gates, join/RSVP; not a fourth entity) — [`DOMAIN.md`](./DOMAIN.md). Never “destination place”; trails and camps **are** Places.

| Layer | Decision |
|-------|----------|
| **North star** | People + plans + outdoors together — catalog supports *where* and *comfort*; activities support *who + when* ([`NORTHSTAR.md`](./NORTHSTAR.md)). |
| **Auth actor** | One **person** (`users`); capabilities `GET /me/status`; **operator** = tenant-scoped **`/publishing/*`** workspace (guide, agency, shop owner) — not a separate login entity ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)). |
| **Place** | Trail, camp, venue, outdoor spot (**place kind**). Storage: `locations` (place rows after CPC). Host registry picks **places only**. |
| **Facility** | **Amenity** POI (toilet, rest_area, parking, …; member **outdoor_shop** pin ≠ operator shop). Storage: **`facilities` collection** (target). Optional **`parentPlaceId`** (rest stop on a trail); required **`areaId`**. |
| **Activity** | Scheduled outing; `activityMode: hosted` only (new writes). **Find crew** = **`member_availability`** fixed slots · **Host** on explore FAB (no separate legacy **Find** menu). |
| **Area** | Curated hub; places and facilities link via `areaId`; activity geography via `activity.locationId → place.areaId`. |
| **Shop profiles** | **Operator tenant** + `/shop/:id` + `/publishing/*` — **not** the same as FAB **Add → Shops** (`add.place.shop` community place submit). No product catalog or shop checkout HTTP. |
| **Add / submit** | **Not** an API or table — **provenance** `registeredByUserId` (alias `submittedById` during migration) on place/facility rows. |
| **Registry** | **Named catalog queries** — `GET /places/catalog` (places), `GET /facilities/catalog` — not separate Mongo “registry” collections. |
| **Lifecycle (catalog)** | **Moderation** (`pending` \| `approved` \| `rejected` \| `suspended`) + **publication** (`listed` \| `unlisted` \| `anchor_only`) — migrate from `LocationStatus` + `registryListed`. **No member-facing draft editor** — profile **submissions** + pending copy. |
| **Policy** | Parity with activities: `viewerAccess` + `allowedActions[]` + `presentation` on **place** and **facility** GET (and peek). |
| **FAB (UI)** | **Host** · **Find crew** · **Add on map**. Bottom nav **My Plans** = **`/plan`** (commitments hub — not FAB). |
| **Compose (wire)** | v3 `host:*` \| `seek:*` \| `add:*` only ([`CREATE_FLOW.md`](./CREATE_FLOW.md)). |
| **URLs (target)** | `/place/:id`, `/facility/:id`, `/profile/submissions`; 301 from `/trail`, `/camp`, `/venue`, `/event`, `/contributions`. |

#### 8.4.2 Geography (why Facility is separate)

```text
Region → Area (areaId)
  ├── Place: Trail X                    ← where; host anchor
  │     ├── Facility (parentPlaceId=X)  ← rest @ km 3, toilet @ trailhead
  │     └── …
  ├── Place: Camp Y
  └── Facility (parentPlaceId=null)     ← area-scoped gas, etc.
```

**Retire:** `listNearbyFacilitiesForPlace` **area-sibling-only** semantics as the primary rule — **CPC-3** queries `parentPlaceId` first.

#### 8.4.3 Shop — three layers (do not merge)

| Layer | Who | Surface |
|-------|-----|---------|
| **A** Community map pin | Member Add → facility `outdoor_shop` | Map peek (`CatalogProfileExposure: peek`) |
| **B** Catalog place | Admin / import | Claim path toward Pro |
| **C** Operator shop | Pro tenant | `/shop/:id`, `/publishing/*`, `EntityKind.shop` |

#### 8.4.4 Terminology — retire vs use

| Retire (new code & copy) | Use instead |
|--------------------------|-------------|
| FAB **Find** / **Organize** (legacy) | **Find crew** (fixed) / **Host** |
| FAB **Add** (legacy) | **Add on map** |
| Bottom nav **Plan** (word) | **My Plans** tab **`/plan`** only — not FAB |
| **contribute** modules / API noun | **place submit**, **facility submit**, `registeredByUserId` |
| Facility as `PlaceKind` on place rows | `FacilityKind` on `facilities` collection |
| `submitUserLocation` / `/me/locations` (new call sites) | `submitUserPlace` / `/me/places`, `POST /me/facilities` |
| **Map contributions** (target) | **Your submissions** / `/profile/submissions` |
| Separate “contribute API” | Same catalog write paths + moderation |

#### 8.4.5 Locked decisions (architecture review)

| ID | Decision |
|----|----------|
| D1 | Facilities in **`facilities` collection** |
| D2 | Member gear pin = **facility `outdoor_shop`**, not `EntityKind.shop` |
| D3 | `parentPlaceId` when amenity belongs to a trail; optional for area-only |
| D4 | Trail detail amenities: query **`parentPlaceId`**, not area siblings only |
| D5 | Operator = **workspace**; all tenant kinds → `/publishing/*` |
| D6 | Pending catalog UX: **submissions list**, no public draft URL for unlisted rows |
| D7 | Cutover: optional `CATALOG_V2` read flag → single deploy → redirects **CPC-6** |
| F1–F6 | FAB **Host · Find crew · Add on map**; compose wire host/seek/add only ([`CREATE_FLOW.md`](./CREATE_FLOW.md)) |

#### 8.4.6 Phase plan & checklists

Mark `[x]` in the PR that completes the item. **Gate:** `npm run verify:system:quick` each PR; **`npm run verify:system`** before closing **CPC-7**.

---

**CPC-0 — Tier-1 canon (docs only)**  
*Context for implementers: §8.4.1–8.4.5; no code required.*

- [x] `SYSTEM_COHERENCE.md` §8.4 + **C26** (this section)
- [x] `CREATE_FLOW.md` — FAB **Host · Find crew · Add on map**, compose wire, legacy map
- [x] `DOMAIN.md` — Place vs Facility vs Shop layers; geography §8.4.2
- [x] `DOMAIN_CANONICALS.md` §1.7 — ontology + compose wire
- [x] `NAVIGATION.md` — FAB, `/profile/submissions` target, contributions redirect note
- [x] `API_ROUTING.md` — target `/facilities`, `/places/catalog` (stubs marked **CPC**)
- [x] `DOCS_INDEX.md` — CREATE_FLOW blurb
- [x] `scripts/bounded-context-manifest.json` — **`facilities`** context stub (populate in CPC-2+)
- [x] `npm run verify:docs`

---

**CPC-1 — Shared types & contracts**  
*Depends: CPC-0. Context: `packages/shared-types` mirrors §8.4.1.*

- [x] `FacilityDTO`, `FacilityKind`, `PlaceCatalogQuery`, `FacilityCatalogQuery`
- [x] `PlaceViewerAccessDTO`, `FacilityViewerAccessDTO`, shared `CatalogActionId` (or extend activity pattern)
- [x] `moderationStatus` + `publicationStatus` enums (catalog)
- [x] `registeredByUserId` on DTOs; `@deprecated submittedById` dual-read
- [x] `PLACE_CATALOG_KINDS` + `isPlaceCatalogKind` (facility split in CPC-2; deprecated `DESTINATION_*` aliases)
- [x] Compose wire: `plan` / `contribute`, `PlanMode`, `parseComposeWire` / `formatComposeWire` + legacy map
- [x] Tests: `compose-route.test.ts`, `compose.test.ts`, `placeKind.test.ts`
- [x] `npm run verify:system:quick` (2026-10-16)

---

**CPC-2 — Data: `facilities` collection + backfill**  
*Depends: CPC-1. Context: migrate from `locations` where `isFacilityPlaceKind`.*

- [x] `facilities` schema in API domain types + `collections.ts`
- [x] Mongo migration M1: create collection + indexes (`areaId`, `parentPlaceId`, `facilityKind`, moderation/publication)
- [x] M2: backfill from facility rows in `locations`
- [x] M3: backfill `community-shop` → `outdoor_shop` facilities
- [x] M4: backfill `moderationStatus` / `publicationStatus` on places (and facilities)
- [x] Staging row-count reconciliation script / test (`reconcileCatalogCpcMigration` + `catalog-cpc-migration.test.ts`)
- [x] API tests: migration idempotency or fixture seed

---

**CPC-3 — API: facility routes + place policy + catalog reads**  
*Depends: CPC-2. Context: `buildPlaceViewerAccess`; replace `place-nearby-facilities`.*

- [x] `GET /facilities`, `GET /facilities/:id`, `POST /me/facilities` (list + detail + member submit; admin `POST /facilities` deferred)
- [x] `GET /places/catalog` (evolve from `/places/registry`; places only, `segment=place`)
- [x] `GET /facilities/catalog`
- [x] `buildPlaceViewerAccess` + wire on `GET /places/:id`
- [x] `buildFacilityViewerAccess` + wire on `GET /facilities/:id`
- [x] Place detail: `nearbyFacilities[]` by `parentPlaceId` (`facilities` collection)
- [x] `apps/api/tests/place-viewer-access-contract.test.ts` (new)
- [x] `apps/api/tests/facility-catalog-contract.test.ts` (new)
- [x] Extend `detail-surface-lineage-contract.test.ts` for facility activate → public GET
- [x] Dual-write places/facilities moderation fields during transition (`withCatalogLifecycleFields` + `upsertFacilityFromLocationRow` on admin update)

---

**CPC-4 — API: member submit unification**  
*Depends: CPC-3 (or parallel after CPC-1 for places-only).*

- [x] All member place submits → `POST /me/places` only (remove new `/me/locations` clients)
- [x] Facility submit → `POST /me/facilities` with `areaId`, optional `parentPlaceId`, `facilityKind`
- [x] Admin: `/admin/facilities` uses facility store (not `locations` segment only)
- [x] Audit actions: `place.submit`, `facility.submit` (keep `location.submit` alias one release)
- [x] `notifyAdminsLocationSubmitted` → generic catalog submit copy (`notifyAdminsCatalogSubmitted`)
- [x] §8.4.9 implementation alignment map + §3 matrix vocabulary (no **contribute** in architecture rows)
- [x] FE facades: `memberCatalogSubmitClientApi`, `placeCatalogReadsClientApi`, `placeCatalogClient` (+ legacy shims)
- [x] API facade: `place-submit.ts`; routes use `buildPlaceSubmitPayload`
- [x] Terminology guards: `cpc-terminology-guard.test.ts` (API), `cpcTerminologyGuard.test.ts` (FE subset)

---

**CPC-5 — Discovery: explore map & list**
*Depends: CPC-3.*

- [x] Explore map reads facilities from `facilities` collection
- [x] Shop **tenant** pins unchanged (`shop_profiles` context)
- [x] Community outdoor_shop: peek-only projection (`catalog-profile-exposure`)
- [x] Update `explore-map-layers.test.ts`
- [x] Area lens rollups use facility map pins (`placeKind` on explore items)

---

**CPC-6 — FE: routes, detail shells, redirects**  
*Depends: CPC-3, CPC-5.*

- [x] Canonical `/place/:id` — single `PlaceDetailSections`
- [x] `/facility/:id` — `FacilityDetailSections`
- [x] Client redirects: `/trail`, `/camp`, `/venue`, `/event` → `/place/:id`
- [x] `/profile/submissions` + redirect `/contributions`
- [x] `routingCatalog.ts`, `entity-path.ts` (`placeDetailPath` → `/place/:id`)
- [x] `TrailDetail` / `CampDetail` / `EventDetail` → redirect wrappers
- [x] `placeDetailClientApi`, `facilityDetailClientApi` hooks
- [x] `consumerDetailQaMatrixGuard` / domain tests updated

---

**CPC-7 — FE: legacy removal & guards**  
*Depends: CPC-6.*

- [x] Member `POST /me/facilities` — **no** `locations` dual-write (`facility-submit.ts` + guard)
- [x] Admin facility CRUD — **no** `locations` dual-write (`createAdminFacility` + guard)
- [x] Terminology guard: `submitUserLocation` scan + catalog submit orchestrators in FE guard
- [x] API guard: member facility route + contribute route naming (`cpc-terminology-guard`)
- [x] **§5.1** HTTP surface-first model (public / `/me` / `/admin`); catalog registrar matrix §8.4.9
- [x] `catalog-http-surface-guard.test.ts` — places + facilities registrars; no profile-first monolith routes
- [x] `updateAdminLocation` — facility sync **only** when `locationRowRepresentsFacility` (legacy amenity rows in `locations`)
- [x] Public place wire: `registeredByUserId` only; `submittedById` on **admin** DTO (`toLocationDto` + guards)
- [x] Remove `GET /me/status` flat publish dual-read (nested `publish` only; Oct 2026)
- [x] **C26** → mitigated in §7 (CPC-0–6 shipped; dual-read removal telemetry-gated)
- [x] `npm run verify:system` (full gate — Oct 2026)

---

**CPC-8 — Ops & links**  
*Depends: CPC-6.*

- [x] `operations/EXPLORE_MAP_RUNBOOK.md` — facility seed (`seed:catalog-facilities`)
- [x] Agent manifest — `/place/`, `/facility/`, `/api/places`, `/api/facilities`; discover URLs use `placeDetailPath` (canonical `/place/:id`)
- [x] Push review prompt — `canonicalPlaceDetailPath` in `review-prompt.ts`
- [x] `PRE_DEPLOY_CHECKLIST.md` CPC cutover bullets

---

**CPC-9 — FAB Host · Find crew · Add on map + compose wire**  
*Can start after CPC-1; must finish before CPC-7. Context: `CreateIntentSheet`, `composeFlowCatalog`.*

- [x] `COMPOSE_MENU_OPTIONS` → **Host** · **Find crew** · **Add on map** (bottom nav **Plan** = schedule, not FAB)
- [x] compose wire: `host:*` \| `seek:fixed:*` \| `seek:flexible` \| `add:*`
- [x] Find crew: fixed → `availabilityFlowEngine`; flexible → `SeekFlexibleComposeSheet` / `member_availability`
- [x] Add on map: **Place** (trail/camp/other) \| **Facility** (kinds); drop standalone **Shops** chip
- [x] `formatComposeQuery` / `parseExploreCompose` v3 canonical only (`packages/shared-types/compose-route.ts`)
- [x] `composeFlowCatalog.ts` storage ids: `host.*` / `seek.fixed.*` / `add.*`
- [x] Update area CTAs (`AreaDetailView` find links → `seek.fixed.*`)
- [x] `composeFlowCatalog.test.ts` / `exploreComposeRouteGuard` (host/seek/add only)
- [x] Add-on-map wizard modules: `addFlow.ts` / `addFacilityFlow.ts` / `CreateAddFlow.tsx`
- [ ] `src/content/productNorthStar.ts` if FAB strings centralized

**Supersession (shipped):** Product FAB **Host · Find crew · Add on map** with v3 `?compose=` (`host` \| `seek` \| `add` only); leftover `plan` / `contribute` / `organize` / `find` tokens are not accepted — [`CREATE_FLOW.md`](./CREATE_FLOW.md).

---

#### 8.4.9 Implementation alignment map (anti-drift)

**Rule:** Product says **Add on map**; code and HTTP say **catalog** + **submit**. Leftover `contribute:place:*` compose tokens are not accepted.

| Concern | Read (catalog) | Write (submit) | Provenance | Do **not** add |
|---------|----------------|----------------|------------|----------------|
| **Place** | `GET /places/catalog` (alias `/places/registry`) · `GET /places/:id` | `POST /me/places` · operator place submit | `registeredByUserId` | `/contribute`, `contributeApi`, `submitUserLocation` (new) |
| **Facility** | `GET /facilities/catalog` · `GET /facilities/:id` | `POST /me/facilities` · `POST/PATCH /admin/facilities` | same | Facility rows as primary `PlaceKind` on `locations` (new) |
| **FAB UI** | — | Wizards call facades below | — | Server modules named `*Contribute*` |

**Frontend facades (canonical):**

| Facade | Role |
|--------|------|
| `src/api/domains/placeCatalogClient.ts` | `fetchPlaceCatalog` → `/places/catalog` |
| `src/api/domains/facilities.ts` | facility catalog HTTP + admin |
| `src/hooks/memberCatalogSubmitClientApi.ts` | `submitMemberPlace`, `submitMemberFacility`, `fetchMyPlaceSubmissions` |
| `src/hooks/placeCatalogReadsClientApi.ts` | picker/list reads |

Legacy shim (one release, no new imports): `placeRegistry.ts`. `placeCatalogApi.ts` removed — use `memberCatalogSubmitClientApi` / `placeCatalogReadsClientApi`.

**API services (canonical):**

| Service | Role |
|---------|------|
| `services/place-catalog.ts` | `buildPlaceCatalog` |
| `services/place-registry.ts` | organize picker merge (transitional name; calls catalog builders) |
| `services/place-submit.ts` | `buildPlaceSubmitPayload` |
| `services/facility-submit.ts` | `buildFacilitySubmitInput` |
| `services/catalog-submit-notifications.ts` | admin notify on catalog submit |

**Route registrars (`registerMe*`, `registerPublic*`, `registerAdmin*`):** HTTP **mount layer only** (auth + path) — see **§5.1**. Domain logic lives in services + stores — not duplicated “user type” domain modules and **not** a single `registerPlaceRoutes` / `registerFacilityRoutes` that branches on profile. Prefer extending `place-catalog` / `facilities-store` over new `register*Contribute*` files.

| Context | Public read registrar | Member submit registrar | Admin CRUD registrar |
|---------|----------------------|-------------------------|----------------------|
| **places** | `registerPublicPlaceRoutes` | `registerMeSubmittedPlaceRoutes` | `registerAdminPlaceRoutes` |
| **facilities** | `registerPublicFacilityRoutes` | `registerMeFacilityRoutes` | `registerAdminFacilityRoutes` |

**Admin UI:** `AdminPlaces.tsx` is a **catalog console** with `catalogSegment` (`outdoor` \| `facility`); outdoor → `/admin/places`, facility → `/admin/facilities` API. Target rename to shared `AdminCatalogConsole` is **CPC-9** cosmetic, not a second product surface.

---

#### 8.4.10 Creation lifecycles — activities vs catalog (Host vs Add on map)

**Not “lifestyle”** — use **lifecycle**: what state the row is in, who transitions it, and what appears on the map.

| FAB branch | Entity | Member “register” (create row) | Member “publish” (go public on map) | Admin / platform |
|------------|--------|----------------------------------|-------------------------------------|------------------|
| **Host** | `activities` (hosted) | `POST /publishing/activities` → **DRAFT** | `POST /publishing/activities/:id/publish` → **PUBLISHED** | Moderation suspend |
| **Availability (Find crew)** | `member_availability` | `PUT /me/availability` (open + optional fixed slot) | Fixed slot → explore map `source: availability` when visible | Hide visibility / prune past slots |
| **Add → place** | `locations` (place row) | `POST /me/places` → **DRAFT** + moderation **pending** | **No member publish** — inventory = `/profile/submissions` | Approve → `status: active` + `moderationStatus: approved` + `publicationStatus: listed` (`/admin/places`) |
| **Add → facility** | `facilities` | `POST /me/facilities` → same pending pattern | **No member publish** | `/admin/facilities` (`facilities` only — §5.1) |
| **Host side-effect** | Place **anchor** (not catalog) | `submitMemberPlace` with `activityAnchor` (ACTIVE, **not** registry-listed) | Tied to activity publish, not catalog | — |
| **Operator / admin create** | Place / facility | Admin or operator POST | Admin can create **active** immediately; operator paths use tenant headers | Audit + map cache |

**Do not** mirror hosted **draft + publish** for member catalog submits: §8.4.1 — **no member-facing draft editor**; one wizard submit, then moderation. Vocabulary: **submit** (member) · **approve / list** (admin) · not “publish” in consumer copy for places.

**Frontend pattern (mirror activities, different steps):**

| Layer | Activities (hosting) | Catalog (place / facility) |
|-------|----------------------|----------------------------|
| Wizard UI | `CreateHostingActivityFlow` + `hostingFlowEngine.ts` + `hostingFlows/` | `CreateAddFlow` + `addFlow.ts` / `addFacilityFlow.ts` |
| Compose shell (map + list) | `src/explore/create/` — `useComposeRoute`, `ComposeHost`, `useHostingWizardPrefill` (**not** `useExplore*` on create paths) | same FAB host |
| Orchestrator | `hostingActivityPublish.ts` (`createActivity` → `publishActivity`) | **`catalogPlaceSubmit.ts` / `catalogFacilitySubmit.ts`** — draft from wizard → `memberCatalogSubmitClientApi` only; **no** second publish call |
| Console edit | `/publishing/activities` drafts | **None** for members — only `/profile/submissions` read + admin queue |
| Pickers | `placeCatalogReadsClientApi` | same |

**Implementation phases (flow cleanup):**

- **CPC-5** — Map/list read `facilities` collection; keep activity publish path unchanged.
- **CPC-9a** — Extract `catalogPlaceSubmit.ts` / `catalogFacilitySubmit.ts` from explore wizards; rename flows; wire compose v2 ids.
- **CPC-9b** — Admin: explicit **approve catalog submission** helper (single PATCH policy: moderation + publication + status) shared by places + facilities — not duplicate AdminPlaces save logic.
- **CPC-7** — Optional `POST /admin/places/:id/list` alias only if needed; prefer one `approveCatalogRow()` service over new member routes.

---

#### 8.4.7 Suggested PR order

`CPC-0` → `CPC-1` → `CPC-2` → `CPC-3` + `CPC-4` → `CPC-5` → `CPC-9` (parallel with CPC-5/6) → `CPC-6` → `CPC-7` → `CPC-8`.

#### 8.4.8 Bounded contexts (target manifest)

| Context id | Responsibility | Storage |
|------------|----------------|---------|
| `places` | Place catalog, place detail | `locations` (place rows) |
| `facilities` | Amenities, facility catalog, facility detail | `facilities` |
| `shop_profiles` | Operator shop storefront (profile only) | `tenants`, merchants |
| `publishing_workspace` | Operator activities, tenant place submit | `activities`, places |
| `compose` | FAB wizards | — |

§3 **Places** / **Facilities** rows and §8.4.9 implementation map are the living alignment source (updated CPC-4).

### 8.6 Platform program (P0–P6) — CEO-approved Oct 2026

**Purpose:** Whole-repo strategic refactor (scalability, performance, debt) **without losing context** between waves. **Engineering work is horizontal** (API registrar + `src/api/domains/*` + UI roots per §3.1) — JSON and gates track it; they do not replace code alignment. **CTO whole-system audit** (12 pillars, greenfield vs brownfield): `scripts/cto-audit-pillars.json` · baseline `npm run system:audit` → `scripts/system-audit-baseline.json`. **This section + machine JSON are the only living roadmap** — do not add `AUDIT_*`, `PLAN_*`, or parallel CTO markdown.

#### 8.6.0 Authorization (CTO charter — 2026-10-17)

> **CTO coherence program (PCOH): complete (`MIG-COH-00`…`12`). Remaining schedule: `MIG-SURFACE-ACTIVITY-DETAIL` (S10f), `MIG-P5-SLO-SMOKE`. S10e/S10f gate release.**

| Rule | Detail |
|------|--------|
| **Capacity** | ~**30–40%** engineering on platform waves; product continues on strangler slices |
| **WIP limit** | At most **2** migrations `in_progress` at once (`refactor-program.json` → `capacity.maxInProgressMigrations`; enforced by `verify:refactor-program`) |
| **P0–P1** | **Complete** (Oct 2026) — census, W0 audit, CPC catalog wire, seeking storage gate |
| **P4** | **API routes only** — CQRS-light complete (eng); not whole-product UI/storage unification |
| **P4b** | **In progress** — remaining `MIG-SURFACE-*` + identity boundary after PCOH |
| **PCOH** | **Complete** — §8.8 UPL/BWL separation, domain dedup, `MIG-COH-00`…`12` |
| **P5–P6** | P5 SLO with COH-08 ops; P6 gated on §7 / S10g |

Board one-liner: *P4 thinned the API; **PCOH** (§8.8) finished UPL/BWL coherence; remaining ACTIVITY-DETAIL S10f + P5 SLO; release gated on S10e/S10f.*

| Artifact | Role |
|----------|------|
| [`scripts/refactor-program.json`](../scripts/refactor-program.json) | Phases **P0–P6** + **P4b**, migrations **MIG-***, `authorization`, `capacity`, P5 `slos` |
| [`scripts/repo-census-baseline.json`](../scripts/repo-census-baseline.json) | P0 inventory (`npm run repo:census`; knip issue count optional) |
| [`scripts/bounded-context-manifest.json`](../scripts/bounded-context-manifest.json) | Context → API/FE roots (update per migration PR) |
| §7 register | **C27** (docs) · **C28** (program spine) · close rows when migrations complete |

**Gate every phase:** `npm run verify:system:quick` minimum; phase close → `npm run verify:system` + update this table + `refactor-program.json` status fields.

#### 8.6.1 Phases (outcomes)

| Phase | Owner | Window | Outcome | Status |
|-------|-------|--------|---------|--------|
| **P0** | platform | 2–6 wk | Census + doc trim + **W0** system audit (`system:audit` v2) | **Complete** |
| **P1** | product-eng | 4–8 wk | CPC catalog wire + seeking storage gate | **Complete** (repeat `seeking:deploy-gate` per env at release) |
| **P2** | platform | 6–10 wk | **MIG-OUTBOX**, **MIG-EXPLORE-READ** (flags); **S10e** promote ops | **Complete** (eng) |
| **P3** | platform | 6–10 wk | **MIG-CLIENT-QUERY** (TanStack Query on consumer reads) | **Complete** (eng) |
| **P4** | platform | 8–12 wk | **API only** — CQRS-light; all **`apps/api/src/routes/**`** → `services/*` (no `*-store` in routes) | **Complete** (eng) |
| **P4b** | product-eng | 8–16 wk | Remaining surface unification after PCOH | **In progress** |
| **PCOH** | product-eng + platform | pre-launch | §8.8 coherence program (`MIG-COH-*`) | **Complete** |
| **P5** | platform | 4–6 wk | SLO smoke + staging baselines (`p5:slo-smoke`) | **In progress** (eng preflight; ops/staging before close) |
| **P6** | platform | ongoing | **C1**/S10g, §7 burn-down | **Gated** |

**Relationship to S0–S13:** **S8–S11** eng closed. **S13** methodology + guards shipped; **product parity** (W10, peek→detail, explore IA) is **P4b**, not “done” because P4 API passed. **P*** = platform capacity (~30–40%) on top of product slices.

#### 8.6.2 Migration register (machine + human)

| ID | Phase | Focus | Status |
|----|-------|-------|--------|
| **MIG-P0-CENSUS** | P0 | `repo:census` baseline; SPA routes, API registrars, knip count | **Complete** |
| **MIG-P0-DOCS** | P0 | Stub superseded experiment plans; archive copies | **Complete** |
| **MIG-W0-SYSTEM-AUDIT** | P0 | CTO baseline: collections, route map (`register*` + mounted routers + `registerActivityRoute`) | **Complete** |
| **MIG-MANIFEST-DOMAINS** | P0 | All `src/api/domains/*` assigned in manifest | **Complete** |
| **MIG-PLAN-HUB** | P0 | Plan manage deep links (one surface, not program center) | **Complete** |
| **MIG-CPC-P1** | P1 | CPC-7+ catalog vocabulary (**C26**) | **Complete** |
| **MIG-SEEKING-READ** | P1 | `seeking:deploy-gate`; C20 read paths | **Complete** |
| **MIG-OUTBOX** | P2 | Side-effect outbox (production default on; `SIDE_EFFECT_OUTBOX=0` blocked in prod) | **Complete** |
| **MIG-EXPLORE-READ** | P2 | Map `presentation` is the card copy. No second `discoveryCard` payload or projection flag | **Complete** |
| **MIG-CLIENT-QUERY** | P3 | `clientQueryKeys` + hooks across discovery, social, member, messaging, place detail | **Complete** |
| **MIG-CQRS-ROUTES** | P4 | Route CQRS guard; entire `apps/api/src/routes/**` tree → read/command services (no `*-store`) | **Complete** |
| **MIG-CQRS-ROUTE-DATA** | P4 | Route layer → services for `auth-users`, `chat-data`, `social-data` (guard enforced) | **Complete** |
| **MIG-CQRS-ROUTE-AUTH** | P4 | `auth.ts` → `auth-*-commands` + `auth-session-flow`; HTTP cookies in `auth-route-http` | **Complete** |
| **MIG-P5-SLO-SMOKE** | P5 | `npm run p5:slo-preflight` in `verify:domain` + staging `p5:slo-smoke` + PRE_DEPLOY SLO checklist | **In progress** (eng probes in `verify:domain`; ops/staging before close) |
| **MIG-SURFACE-ACTIVITY-DETAIL** | P4b | Activity L3 + guest/join + peek parity (S13-W6–W7, S10f) | **In progress** |
| **MIG-SURFACE-EXPLORE-IA** | P4b | Map / browse / list / discover one IA | **Complete** |
| **MIG-SURFACE-MEMBER-PEOPLE** | P4b | Profile lenses + people browse unity | **Complete** |
| **MIG-SURFACE-ADMIN-OPS** | P4b | Admin surface catalog + boundaries | **Complete** (folded into COH-11) |
| **MIG-SERVICE-IDENTITY-BOUNDARY** | P4b | Services off raw `auth-users` / chat-data libs | **Complete** |
| **MIG-DOCS-EXPERIMENT-STUB** | P4b | Experiment plans → stubs; bodies in `docs/archive/experiment/` | **Complete** |
| **MIG-ROUTING-CANON-P0** | P4b | `routing-canonical-map.json` + `verify:routing-canon` + §8.7 schedule | **Complete** |
| **MIG-ROUTING-CANON-P1** | P4b | Publishing plane: `/publishing` only — delete `/host` SPA + API shims | **Complete** |
| **MIG-ROUTING-CANON-P2** | P4b | Member identity: `/member/:id` SPA ↔ API `/member/:userId/*` | **Complete** |
| **MIG-ROUTING-CANON-P3** | P4b | People/discovery API family under `/me/member-discovery/*`; drop `/social` mount | **Complete** |
| **MIG-ROUTING-CANON-P4** | P4b | Trust: `POST /safety/reports` + `safetyApi` domain module | **Complete** |
| **MIG-ROUTING-CANON-P5** | P4b | Engagement `/me/*` domain module boundaries (goals, wishlist, follows) | **Complete** (folded into COH-09) |
| **MIG-ROUTING-CANON-P11** | P4b | SPA legacy route purge (no `Navigate` aliases) after API/client aligned | **Complete** (folded into COH-12) |

#### 8.7 Routing alignment (end-to-end — no redirect shims)

**Machine map:** [`scripts/routing-canonical-map.json`](../scripts/routing-canonical-map.json) · **Gate:** `npm run verify:routing-canon` (strict enforcement after Phase 0).

| Phase | Migration | Delete (same PR as new canon) | Horizontal touch |
|-------|-----------|-------------------------------|------------------|
| **0** | MIG-ROUTING-CANON-P0 | — | Map + §8.7 + program JSON |
| **1** | MIG-ROUTING-CANON-P1 | `legacyHostApiRewrite`, `legacyPublishingPathDeprecation`, `/host/*` SPA, `LegacyPublishingConsoleRedirect` | `operator/*`, `organisationApi`, guards |
| **2** | MIG-ROUTING-CANON-P2 | `/users/:id/public-profile` (+ brief, upcoming) | `accountApi`, `useMemberProfilePage`, API registrar |
| **3** | MIG-ROUTING-CANON-P3 | `/social/people*`, `/users/browse`, `/users/search`, `/me/member-discovery-quota` | `registerMemberDiscoveryRoutes`, explore people panel |
| **4** | MIG-ROUTING-CANON-P4 | `POST /reports`, `socialApi.reportContent` | `safety.ts`, content report hook |
| **5** | MIG-ROUTING-CANON-P5 | Cross-leaks in leftover `socialApi` (goals/wishlist) | `wishlistApi` / `entityFollowApi` / `reviewsApi` + `apiLegacyGuard` (folded into COH-09) |
| **6–10** | MIG-SURFACE-* + MIG-SERVICE-IDENTITY-BOUNDARY | Per context | discovery, places, admin, services |
| **11** | MIG-ROUTING-CANON-P11 | `App.tsx` legacy `Navigate` routes | `routingHygiene` bans |

**Doc corpus:** **MIG-DOCS-EXPERIMENT-STUB** complete — `docs/experiment/README.md` only; superseded files stubbed at `docs/` root or removed. Schedules **only** in §8.

#### 8.6.3 Context continuity (do not skip)

1. **Phase charter** — one row in §8.6.1; expand only in `refactor-program.json` `exitCriteria`, not new docs.
2. **Strangler** — dual-run until exit criteria; then delete legacy paths in the **same PR** as manifest update.
3. **Freeze** — while a migration is `in_progress`, no new legacy URLs/strings in that `feRoots` tree (`verify:domain` + code review).
4. **Handoff** — `DOCS_INDEX` § Platform program blurb updated at phase close (one paragraph).
5. **Agents / humans** — read `DOCS_INDEX` → §8 → manifest; **do not** recreate `experiment/*` plan markdown.

#### 8.6.4 P0 checklist (doc trim targets)

- [x] `refactor-program.json` + `verify:refactor-program` in `verify:system` (incl. CTO line + WIP limit)
- [x] Archive [`system-refactor-plan`](./archive/system-refactor-plan-2026-10.md) + [`system-structure-deep-audit`](./archive/system-structure-deep-audit-2026-10.md); experiment stubs
- [x] `repo:census` baseline — SPA `<Route>` count, API `register*Routes` files, knip `issueCount`
- [x] Tier-1 dedupe policy — no duplicate phase schedules in `experiment/*` ([`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md))
- [x] Living experiment plans ≤ **12** files (excl. `README.md`; enforced by `verify:docs`)
- [x] **MIG-PLAN-HUB** + **MIG-W0-SYSTEM-AUDIT** → P0 `complete` in `refactor-program.json`
- [ ] **S10f** human QA + **S10e** ops promote (release gates for P2+; track in §8.1)

### 8.8 Coherence program 2026 (PCOH) — sole implementation schedule

**Authority:** Pre-launch aggressive deduplication, strict **UPL / BWL separation**, one write path per entity. **Do not implement from** `docs/archive/**`, retired `docs/experiment/` plans, or superseded root stubs (`UAE_Trail_Homepage.md`, `design-tokens.md`, …) — **PCOH + `MIG-COH-*`** in [`refactor-program.json`](../scripts/refactor-program.json) drive work.

**Code contracts (not prose docs):**

| Layer | Module | Role |
|-------|--------|------|
| **UPL** | [`src/content/upl-glossary.ts`](../src/content/upl-glossary.ts), [`workspaceVocabulary.ts`](../src/content/workspaceVocabulary.ts), [`geographyVocabulary.ts`](../src/place/geographyVocabulary.ts), [`productNorthStar.ts`](../src/content/productNorthStar.ts) | Member-visible labels only |
| **BWL** | [`packages/shared-types/src/wire-lexicon.ts`](../packages/shared-types/src/wire-lexicon.ts), [`collections.ts`](../apps/api/src/lib/collections.ts) | HTTP, JSON, Mongo, internal modules |
| **Presentation** | `packages/shared-types` `*-display`, `*-presentation`, `viewer-access` | Maps BWL → UI labels/paths |

**Rules:** R1 UPL only in `src/content/*` + vocabulary modules. R2 BWL stable until a `MIG-COH-*` PR migrates it. R3 No UPL words in new route path segments. R4 Presentation builders are the only place that combines BWL + UPL. R5 Work by manifest **context id**.

#### 8.8.1 UI Product Language (UPL) — complete glossary

| UPL term | Meaning |
|----------|---------|
| Find your crew | North-star people discovery (`productNorthStar`, explore people panel) |
| Explore | Map-first home `/explore` |
| Activity | Scheduled outing |
| Host | Person leading **this** activity |
| Hosted by | Card/detail attribution |
| Host an outing | Create/publish on map (FAB Host + Host / publish capability) |
| Looking for company | Seeking mode on map (not availability calendar) |
| Area | Admin-curated name grouping Places/Facilities (hub `/area/:slug`); **not a map pin**. Country / state / region come from map geography |
| Place | Trail, camp, or event venue in catalog |
| Facility | Amenity POI |
| Spots | Map lens for Place pins |
| People | Browse/discover members (not map pins) |
| Buddies | Page title for mutual connections |
| Friends | List label for accepted buddies (UPL only) |
| Following | One-way member follow |
| Plan | Personal hub `/plan` |
| Goals | Personal outdoor targets |
| Availability | When I'm free to go (Plan) — **not** seeking |
| Pro membership | Upgrade for **individual guides** and **shops/agencies** |
| Operator | Shop or agency **business** (UI) — not HTTP console prefix |
| Publishing workspace | Console shell (manage outings, team, requests) |
| Wishlist, Groups, Messages, Reviews, Shop | Engagement surfaces |

**Join copy:** Host / join request / comment **for the host** (`upl-glossary`, `joinWithdrawCopy`). BWL JSON is **`hostNote`** (COH-06); not a second product field.

#### 8.8.2 Backend Wire Lexicon (BWL) — complete glossary

| BWL | Meaning |
|-----|---------|
| `activities` + `activity_mode: hosted \| seeking` | All outings; **delete** parallel `participant_intents` (MIG-COH-01) |
| `activity_requests` / `note` / `hostNote` | Join queue; joiner message vs host decision |
| `host_id`, `created_by_id` | Activity person ids (keep; UPL “Host”) |
| `locations` (+ HTTP `/places` only after COH-02) | Place catalog |
| `facilities`, `areas` | CPC |
| `tenants`, `tenant_memberships` | Business orgs |
| `pro_applications` | Target collection rename; HTTP is `/me/pro-application` now (COH-03). Collection still `host_applications` |
| `auth_users` | Members |
| `buddy_*` | Mutual graph — **never** `friend` in BWL |
| `user_follows`, `entity_follows` | Follow edges |
| `member_availability`, `user_goals` | Plan commitment (distinct from seeking) |
| `user_wishlist` (migrated from `user_favorites`) | COH-09 |
| `/publishing` | Publishing workspace HTTP (COH-04); `x-organisation-id` |
| `/me/member-discovery/*` | People discovery API (keep this prefix; network `segment=buddies`, alias `friends`) |
| `explore_map` sources | `activity` · `place` · `facility` · `shop` · `agency`. Area is not a pin. Retire `demand`; `venue` / `catalog_place` → `place` (COH-02) |
| `UserRole`, `HostPublishingTier`, `GET /me/status` | RBAC / capabilities — not UPL |

#### 8.8.3 Bounded contexts — topics covered (manifest §3)

All **17** contexts: `discovery`, `compose`, `participation`, `member_identity`, `member_publish_capabilities`, `publishing_workspace`, `communication`, `social_graph`, `places`, `facilities`, `shop_profiles`, `member_discovery`, `engagement`, `areas`, `availability`, `media`, `platform_ops`.

**Cross-cutting (in PCOH scope):** auth & account lifecycle; notifications & push; check-in; viewer access; side-effect outbox; explore Redis cache; agent/OG; premium place PDF; member discovery quota; coordination attention; journey map pins; legacy SPA redirects; `verify:system` / journey tests.

**Removed products (do not restore):** trail-points wallet, `/host` API/SPA, `/social` graph mount, bare rewards domains (`manifest.removedProducts`), **shop product catalog** (`/shop/products`, `/shop/checkout`, `/admin/shop`, `ProductDetail`, Mongo `products` / `shop_orders` / `order_line_items`).

#### 8.8.4 Canonical API flows (one BWL path each)

Discover map `GET /explore/map` (guest catalog) · overlay `GET /me/discover/overlay` · People `GET /me/member-discovery/*` (`segment=buddies`) · Buddies `/me/buddies` · Follow `/me/following` · Goals `/me/goals` · Availability `/me/availability` · Wishlist `/me/wishlist` · Join/RSVP `/activities/:id/requests` · Host queue `/publishing/requests` · Pro apply `/me/pro-application` · Capability `GET /me/status` · Places `/places/*` · Facilities `/facilities/:id` · Areas `/areas` (names, not pins) · Safety `POST /safety/reports` · Chat `/chat` · Reviews `/reviews`.

**Delete flows:** participant-intent CRUD/join, `demand:` map ids, dual `/locations` HTTP. `/people` orphan registrar removed (COH-05).

#### 8.8.5 PCOH phases (execution order)

| Phase | MIG-COH | BWL focus | UPL focus |
|-------|---------|-----------|-----------|
| **0** | MIG-COH-00 | `wire-lexicon`, leak guards | `upl-glossary`, program JSON |
| **1** | MIG-COH-01 | Seeking = activities only; drop intents | “Looking for company” copy |
| **2** | MIG-COH-02 | HTTP `/places`; map `place` + `facility`; Area is a name | Place, Facility, Area, Spots |
| **3** | MIG-COH-03 | `pro_applications`, `/me/pro-application` | Pro membership only |
| **4** | MIG-COH-04 | `/publishing` mount | Guide/Operator workspace titles |
| **5** | MIG-COH-05 | People API cleanup; `buddies` segment | People, Friends, crew |
| **6** | MIG-COH-06 | JSON `hostNote` | Comment for the host |
| **7** | MIG-COH-07 | Publisher resolver; `/member` for individuals; `/guide` removed | Host / business attribution |
| **8** | MIG-COH-08 | Map public vs overlay; outbox invalidation | — |
| **9** | MIG-COH-09 | Deleted `socialApi` / `socialRouter`; `buddiesApi` · `groupsApi` · `wishlistApi` · `entityFollowApi` · `reviewsApi`; `user_wishlist` | Page titles unchanged |
| **10** | MIG-COH-10 | Single Host compose tree (`create/hosting` + `hostingFlowEngine`); organize/createOrganize shims removed | Host (FAB) |
| **11** | MIG-COH-11 | Admin `registerAdmin*` + `adminSurfacesAcceptance`; shop `registerShop*` split; `socialGraphRouter` / `demandFlow.ts` shims deleted | Admin console (`pages/admin/*`, no `Admin*.tsx` prefix) |
| **12** | MIG-COH-12 | Navigate-only page shims deleted; `verify:domain` fe/api/journey shards; `routingHygiene` bans | Bookmark redirects live in `App.tsx` only |

**Waves:** W1 = COH-00+01+03 · W2 = COH-02+04+06 · W3 = COH-05+07+08 · W4 = COH-09+10 · W5 = COH-11+12. **WIP:** max 2 `in_progress` migrations (`refactor-program.json`).

**Supersedes:** P4b surface/routing tranches as *schedule* (work folds into COH rows). `MIG-ROUTING-CANON-P5/P11` → COH-09/12. SLO (`MIG-P5-SLO-SMOKE`) runs with COH-08 ops.

#### 8.8.6 Locked defaults (CTO)

| Decision | Default |
|----------|---------|
| People HTTP prefix | Keep `/me/member-discovery/*` (COH-05; not `/me/people/*`) |
| BWL roster segment | `buddies`; UPL label “Friends” |
| `organizer_note` rename | Done (COH-06): JSON/Mongo `hostNote` only. Not snake `host_note` on the wire |
| `locations` collection | HTTP first in COH-02; collection rename optional same phase |
| Publishing HTTP | `/publishing` |
| Activity `host_id` | Keep in BWL |
| Individual public URL | `/member/:userId` (community and Pro). `/guide` is not a surface |
| Explore map HTTP | Public `GET /explore/map` (default **slim pin**; `?projection=full` for nested DTOs); signed-in peek `GET /me/discover/overlay` (viewerAccess index only) |
| Explore map cache bust | `scheduleExploreMapCacheInvalidation` (durable outbox in production); direct Redis delete only in processor/tests/seeds |
| FE social facade | Deleted (COH-09). Use `buddiesApi`, `groupsApi`, `wishlistApi`, `entityFollowApi`, `reviewsApi` — no `socialApi` / `socialRouter` |
| Wishlist collection | `user_wishlist` (startup migrate from `user_favorites`) |
| Reviews HTTP | `GET /reviews` public on `userRouter` before `requireAuth`; writes keep per-route auth |
| Host compose tree | `create/hosting` + `hostingFlowEngine` + `hostingFlows` (COH-10). No `organizeFlow.ts` / `createOrganize` / `CreateActivityFlow` |
| Seeking compose engine | `availabilityFlowEngine.ts` + `CreateAvailabilityFixedFlow.tsx` (no `CreateDemandFlow` / `demandFlow.ts` / `demandWizardSteps`) |
| People browse module | `src/people-discovery/*` only. No `explore/ui/peopleBrowse` re-export; no `explore/peopleBrowseTab.ts` |
| Shop HTTP | `shop.ts` mounts `registerShopPublicRoutes` (`GET /shop/shops/:id`) and `registerShopMerchantManageRoutes` (`/shop/organisation/*`). Mongo collection stays `merchant_profiles` |
| Admin HTTP | `admin.ts` mounts `registerAdmin*` only. Pages: `src/pages/admin/*` (folder-as-namespace; no root `Admin*.tsx`) |
| SPA legacy pages | No Navigate-only page modules (`ShopManage`, `AgencyManage`, `BecomeHost`, `Membership`, `MerchantPublic`). Bookmark aliases stay inline in `App.tsx`; `routingHygiene` bans new links |
| Identity / chat / review data libs | `auth-users-store`, `auth-tokens-store`, `chat-messages-store`, `social-reviews-store`. No `auth-users.ts` / `auth-tokens.ts` / `chat-data.ts` / `social-data.ts` (no re-export shim) |

#### 8.8.7 Definition of done

One seeking model · one join pipeline · one place HTTP prefix · one publishing HTTP prefix · one pro onboarding BWL · UPL only in content modules · BWL in wire-lexicon · publisher resolver on map/detail/notifications · no `socialApi` / `socialRouter` / empty `socialGraphRouter` · one Host compose tree · shop `registerShop*` · admin `registerAdmin*` + `adminSurfacesAcceptance` · no Navigate-only page modules · identity/chat/review data in `*-store` (no `auth-users.ts` / `chat-data.ts` / `social-data.ts`) · `verify:domain` fe/api/journey shards · `npm run verify:system` + journey suite per §8.8.3.

### 8.9 Architecture north star (Nov 2026 — platform defaults)

**Purpose:** Single target for **tech stack, performance, security, and code practice** so future work strengthens the current monorepo — not a parallel platform. **Do not add** new Tier-1 files for this; update this section + `ARCHITECTURE.md` + ops checklists when defaults change.

#### Target shape (keep)

| Layer | Choice | Rule |
|-------|--------|------|
| **Client** | Vite SPA + React 19 + TanStack Query | Domain modules in `src/api/domains/*`; hooks facades; `routingCatalog` for paths |
| **API** | Express 5 + Mongo driver (no Mongoose) + Zod | Surface-first `register*` → services → stores (stores not imported from routes) |
| **Contracts** | `packages/shared-types` | One wire lexicon; hand-written domains until OpenAPI generation ships (wave 3) |
| **Edge** | **Canonical:** nginx same-origin → `api:4000` | Vercel = static SPA + thin `/api` proxy only — **not** Express on serverless |
| **Realtime chat** | SSE + Redis pub/sub + short-lived tickets | Terminate **`/chat/stream` on the API origin** (avoid long-lived streams through Vercel proxy) |
| **Mobile** | Capacitor WebView over `dist/` | Same API/session rules as web until native push is a product requirement |
| **Capabilities** | `GET /me/status` only | Not `UserRole` / `isHostRole` for product gates |

#### Production defaults (must match code)

| Default | Expected | Ops / env |
|---------|----------|-----------|
| **Outbox** | Durable notifications + explore cache bust | On when `NODE_ENV=production`; do not set `SIDE_EFFECT_OUTBOX=0` |
| **Redis** | Rate limits, SSE tickets, explore blob, presign owners | `REDIS_URL` required in production |
| **Explore map** | Viewport fetch + slim pin DTO | Staging promote: `EXPLORE_MAP_BBOX=1` + `VITE_EXPLORE_MAP_BBOX=1` after **S10e** (`PRE_DEPLOY_CHECKLIST`) |
| **Session** | httpOnly refresh cookie + **in-memory access token** | No bearer in `localStorage`; profile hint `uaetrail_user` is non-secret |
| **Assets** | Hashed chunks immutable; `index.html` no-store | Vercel/nginx cache policy — entry chunk must not be `no-cache` |

#### Implementation waves (sequencing)

| Wave | Focus | Exit |
|------|-------|------|
| **W0** | Prod parity | Outbox on in prod; Vercel entry cache; staging bbox checklist; chat/SSE to API origin documented |
| **W1** | Session + media hardening | Memory token + refresh bootstrap; CSP scripts without `unsafe-inline`; local dev media ACL; sharp pixel budget; staging demo-login requires `ALLOW_DEMO_LOGIN=true` |
| **W2** | Explore read model | Slim pin DTO default; overlay index; Mongo participant cap; catalog `-thumb.jpg` on local upload; `formatMediaCatalogUrl`; S10e bbox = ops promote |
| **W3** | Program tail | Platform-admin TOTP when secret set; SSE per-user connection cap; P4b guards shipped — **S10f human QA** + **P5 staging SLO** + **participant_intent store removal** = ops/backfill gates |

Track wave status in **`scripts/refactor-program.json`** (`MIG-ARCH-W0` + §8.9 table) — not new markdown plans.

#### Out of scope — do not propose or document as roadmap

These are **rejected** for UAE Trail unless the CEO explicitly reopens platform strategy:

- Rewriting the consumer app in **Next.js / Remix / Nest** or splitting into **microservices**
- **WebSockets** for chat (use SSE on API origin first)
- **Mongoose**, **Kafka**, or a second activity/join storage path
- **OpenAPI-first** client before route schemas stabilize (after P4b)
- **SSR/SSG for `/explore`** or the map shell (optional prerender for `/`, `/activity/:id`, place detail only)
- New **`AUDIT_*` / `PLAN_*` / `ALIGNMENT_*`** Tier-1 markdown (use §8.9 + `refactor-program.json`)
- Removing **intentional** legacy SPA redirects (`/host/*` → `/publishing/*`, `/trail` → `/place/:id`, inbound `/become-host`)

#### Horizontal change rule (unchanged)

One bounded context per PR: API registrar + `src/api/domains/*` + UI root + guard when the invariant must not regress. Gate: **`npm run verify:system`**.

---

## 9. Change checklist (any substantial PR)

1. Which **capability** (§1) and **context** (§3) does this touch?
2. Does it introduce a **second write path** for the same entity? If yes, stop and extend the existing service.
3. Update **Tier 1** doc(s): `CREATE_FLOW`, `NAVIGATION`, `API_ROUTING`, or `MEMBER_MODEL` — not only experiment plans.
4. **Program CPC** work: check off items in §8.4.6; run **`npm run verify:system`** (or `verify:system:quick` before push); explore/FAB also needs `test:explore-alignment`.
5. **Platform program (P0–P6):** if touching a migration in [`refactor-program.json`](../scripts/refactor-program.json), update manifest roots + migration `status` in the same PR.
6. **Architecture defaults (§8.9):** do not add rejected stack items (Next.js rewrite, WebSockets for chat, microservices) to Tier-1 “future” lists.

---

## 10. Related documents

| Question | Read |
|----------|------|
| Why we build this | `NORTHSTAR.md` |
| What entities exist | `DOMAIN.md` |
| Who can publish / publishing workspace | `MEMBER_MODEL.md` |
| FAB and join behavior | `CREATE_FLOW.md` |
| Who sees full detail vs peek | `DOMAIN_CANONICALS.md` §15 |
| HTTP paths | `API_ROUTING.md` |
| Deploy & monorepo layers | `ARCHITECTURE.md` |
| System-wide debt register | §7–8 (this file) |
| Platform north star (defaults + rejected stack) | **§8.9** (this file) |
| Coherence implementation schedule | **§8.8** + `refactor-program.json` `MIG-COH-*` |
| UPL vs BWL | `src/content/upl-glossary.ts` · `packages/shared-types/src/wire-lexicon.ts` |
