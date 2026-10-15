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
| **Express demand** | Say what I want when nothing fits | Explore FAB → Find → **`activities`** (`activityMode: seeking`); intent stub for manage |
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
    ORG["Organize wizards"]
    FIND["Demand wizards"]
    ADD["Contribute wizards"]
  end

  subgraph participation [Participation subsystem]
    JOIN["activity_requests + RSVP"]
    INTENT["participant_intents stub"]
    CREW["activity crew groups"]
  end

  subgraph identity [Member identity]
    WEL["/welcome signup gate"]
    HS["GET /me/status"]
    PUB["public member profile"]
  end

  subgraph publishing [Publishing organisations]
    TEN["tenants + memberships"]
    HOST["/host console"]
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
  FIND --> INTENT
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

Each context has **one write path** and **one public read model** where possible. Crossing boundaries happens through **services** and **shared-types**, not duplicate business rules in React.

| Context | Responsibility | Frontend home | API home | Storage (see `collections.ts`) |
|---------|----------------|---------------|----------|--------------------------------|
| **Discovery (Explore umbrella)** | **Explore** = discovery shell (URL, layout, chrome). **Projections:** map, list (`list=1`), browse catalogue (`browse=1`, `/list`), search — not separate data stores. **Activity discovery** = hosted + seeking outings from `GET /explore/map`. **Places discovery** = venue/shop pins from same read (filters in explore/list). **People discovery** = roster, availability, directory (`member_discovery` APIs); *Looking for* tab composes **activity-discovery** seeking rows. | Shell: `src/explore/shell/*`. Activity: `src/activity-discovery/*`, activities list in `src/explore/ui`, `src/list/*`. Places: entity detail + list filters. People: `src/people-discovery/*` | `lib/explore-map.ts`, `GET /explore/map` | `activities`, `locations`, `participant_intents`, `tenants` (shops) |
| **Compose** | FAB intents, wizards, draft → publish payload | `src/explore/ui/*`, `compose.ts`, `organizeFlow.ts` | `POST /operator/activities`, `POST /me/participant-intents` | `activities`, `participant_intents` |
| **Participation** | Join, waitlist, RSVP, seeking joins, **Join me** invites | `useActivityJoin*`, detail + explore selection | `join-request.ts`, `activity-invite.ts`, intent join **aliases** (`participant-intent-requests-store`) | **`activity_requests`** (canonical); `participant_intent_requests` legacy-only; `activity_participants`, `activity_invites` |
| **Browse — member people** | Who can I go with? Network roster + availability + discover directory (quota). **Looking for** tab: `GET /explore/seeking-activities` + `selectSeekingActivitiesFromExploreCatalog` (`src/activity-discovery`). | `src/people-discovery/*` (`PeopleBrowsePanel`, tabs), `ListDiscoverPeopleView` | `explore-seeking-activities-read.ts`, `member-people-engagement.ts`, `member-discovery-roster.ts`, `registerMemberDiscoveryRoutes`, `registerSocialPeopleRoutes` | Composes `buddy_*`, `user_follows`, explore catalog (read), `member_profile_views` |
| **Member identity** | Profile, welcome gate, visibility, public card | `src/pages/Profile*`, `src/member/*` | `registerProfileRoutes`, `public-member-profile`, `profile-viewer-access` | `auth_users` profile fields |
| **Member publish capabilities** | Who may organize/publish & open publishing workspace (tier + `profileComplete`) | `useMemberStatus`, `organizePublishGate` | **`services/member-status.ts` only** | `tenants`, `tenant_memberships` |
| **Publishing console** | Tenant-scoped CRUD, check-in, activity join queue | `src/pages/operator/*`, `src/console/*`, `components/activity/` | `routes/host/*` + `/operator` alias | same + `activities` |
| **Communication** | DMs, inbox, group & outing chat (product label **Chat**) | `Messages.tsx`, `src/messaging`, `@/chat` | `routes/chat.ts`, `activity-group-chat`, `member-inbox` | `chat_messages`, `social_groups`, wall collections |
| **Social graph** | Relationship **writes** & group metadata (not browse roster UI) | `Buddies.tsx`, `Groups.tsx`, `/buddies` | `registerBuddyRoutes`, `buddy-activity-presence.ts`, `registerGroupRoutes`, `registerFollowRoutes` | `buddy_*`, `user_follows`, `social_groups*` |
| **Places** | Registry, contribute, venue detail; **places discovery** = venue/shop pins from explore catalog | `src/places-discovery/*` (list/map selectors), `PlaceDetail*`, `TrailDetail`, contribute flows | `place-registry`, `location-submit`, `/places` | `locations` (+ **`areaId`** on catalog rows) |
| **Areas** | Curated **hub** (`areaId`); many trails/camps/facilities/shops per area via **`place.areaId`**; Locations lens = hub pins + rollups; Activities lens = outings | `/area/:slug`, Find **Area & map pin**, admin place **area** link | `areas-store`, `explore-map-area-lens.ts`, `organizePublishArea.ts`, `place-kind.ts` | `areas`; **`locations.areaId`** (all catalog kinds); **`participant_intents.areaId`** (seeking); hosted geography = **`activity.locationId` → place.areaId** (no activity-area write) |
| **Commerce** | Shop public + merchant manage (affiliate) | `ShopPublic`, `ShopManage` | `routes/shop.ts` | `merchant_profiles`, `tenants` (SHOP) |
| **Engagement** | Goals, map pins, wishlist, follow | explore wishlist save, entity/member follow | `registerMeGoalsRoutes`, `registerMeWishlistRoutes`, `registerEntityFollowRoutes`, … | `user_goals`, `user_favorites`, `entity_follows`, `user_follows` |
| **Platform ops** | Admin console, audit, applications, master-granted staff | `src/pages/Admin*` (`/admin/users` **Users** nav) | `routes/admin.ts` + `routes/admin/registerAdmin*` | `host_applications`, `audit_logs`, `auth_users` (staff role) |

**Rule:** If a change touches “who can do X,” find the row above first. Do not add a second resolver in a route file or a random hook.

**Viewer access (read vs act):** **Capabilities** = may organize/publish / open publishing workspace (`member_publish_capabilities`). **Detail exposure** = may see full entity payload (`activity-viewer-access`, `profile-viewer-access`). **Guest sheets** = sign-in copy only — not authorization. Canonical model: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.

### 3.1 Context alignment matrix (API · FE · storage)

Pick a **context id** when changing code; touch registrar + `src/api/domains/*` + UI roots together. Machine-readable paths: `scripts/bounded-context-manifest.json`.

| Context | Collections (wire) | Key HTTP | FE domain module | UI roots |
|---------|-------------------|----------|------------------|----------|
| discovery | `activities`, `locations`, `participant_intents`, shop tenants | `GET /explore/map` · browse also `/list` | `exploreApi` | `src/discovery` (card VM), `src/explore/shell`, `src/activity-discovery`, `src/places-discovery`, `src/explore/*`, `src/list/*` — pin UI §6.1 |
| compose | `activities`, `participant_intents` | `POST /operator/activities`, `POST /me/participant-intents` | `exploreApi`, `organisationApi` | `src/explore/ui/*` |
| participation | `activity_requests`, `activity_participants`, `activity_invites` (+ intent join alias) | **`POST /activities/:id/requests`** (canonical seeking + hosted); `/me/participant-intents/.../requests` alias; tenant **`GET /host/requests`** (console API, also Plan manage) | `activitiesApi`, `exploreApi` | Activity detail, Plan manage sheet, `JoinRequestDetail` |
| *(cross-cut)* | — | `GET /activities/:id` (`viewerAccess`, `myJoinInvite`) | — | **`activity-viewer-access.ts`**, **`activity-invite.ts`** |
| member_discovery | `member_profile_views` (+ read-only compose from map/users) | `/me/member-discovery/*`, `/social/people` (browse network roster), `/users/browse`, `public-profile?from=discover` | `accountApi` (`getMemberPeopleNetwork*`, discovery roster) | `src/people-discovery` — Explore **Find crew** panel, list **Buddies** (`listCat=people`), `MemberProfile` discover |
| member_identity | `auth_users` profile | `/me/profile`, `/users/:id` | `accountApi`, `memberApi` | `Profile*`, `src/member/*` |
| member_publish_capabilities | `tenants`, `tenant_memberships` | **`GET /me/status`** (legacy `/me/host-status`, `/me/operator-status`) | `memberApi` | **`useMemberStatus`** |
| publishing_workspace | + `activities` | `/operator/*` + tenant header | `organisationApi`, `activitiesApi` | `src/pages/operator/*`, `src/console/*`, `components/activity/*`, `activity/*` |
| communication | `chat_messages`, group wall | `/chat/*`, group wall | `messagingApi` (`chatApi` + wall via `socialApi`) | `Messages.tsx`, `src/messaging` |
| social_graph | `buddy_*`, `user_follows`, `social_groups*` | `/me/buddies`, `/me/buddy-requests`, `/me/groups`, `/me/following`, … | `socialApi` | `Buddies`, `Groups` — relationship admin; **not** the explore people browse panel |
| places | `locations` | `/places`, `/me/places` | `placeApi`, `placeRegistry` | `TrailDetail`, `CampDetail`, contribute |
| commerce | `merchant_profiles`, `products` | `/shop/*` | `shopApi` | `ShopPublic`, shop UI |
| engagement | `user_badges`, `user_goals`, `user_favorites`, `entity_follows`, … | `/me/badges`, `/me/goals`, `/me/wishlist`, `/me/entity-follows` | `badgesApi`, `goalsApi`, `socialApi` (wishlist + entity follow) | `ProfileBadges`, goals, `useEntityFollows`, wishlist guards |
| platform_ops | `host_applications`, `audit_logs` | `/admin/*`, `POST/DELETE /admin/platform-admins` (master) | `adminApi` | `src/pages/Admin*`, `DashboardLayout`, `ADMIN_LINKS` — **ops tables**, not discovery L1/L2 |

**API mounts:** `/auth`, `/admin`, `/operator` (legacy `/host/*` rewritten), `/chat`, `/shop`, `/media`, `/reports`, `/` (`user.ts` + `social.ts`) — see `apps/api/src/routes/index.ts`.

### 3.2 Browse — member people vs communication (do not conflate)

| User question | Bounded context | Surfaces | Not this |
|---------------|-----------------|----------|----------|
| Who can I go with? Who’s on an outing? Who’s looking for a crew? | **member_discovery** + **discovery** map | `/explore` People panel (`view=people`), `/list?listCat=people` (**Buddies**), shared `PeopleBrowseTabContent` | `/messages`, group walls |
| Who do I talk to? What did the crew say? | **communication** | `/messages` (**Chat** tab), `/groups` → Message → thread | Explore people panel, roster APIs |

**One member model, two jobs:** browse reads show **relationship + outing status** (friend/following, trip hint, looking-for row, directory card). Chat surfaces use the **social graph** for eligibility but are a separate transport ([`COMMUNICATION.md`](./COMMUNICATION.md)).

**Naming for new code:** prefer `memberDiscovery`, `memberPeople`, `browsePeople` — reserve **social** for `social_graph` mutations, `/social/groups`, reviews, and legacy HTTP paths (`/social/people`) until a routed rename ships. Guest gate intent `explore-social` means **browse people panel**, not inbox.

**Target consolidation (implementation):** one map-enriched **member people read** with views (`networkRoster`, `discoveryRoster`) behind stable routes; UI labels “Buddies” / map panel can diverge from code names.

---

## 4. Surfaces vs routes (contract)

Canonical navigation: [`NAVIGATION.md`](./NAVIGATION.md). Structural rules:

| Surface | Route anchor | Never confuse with |
|---------|--------------|-------------------|
| Marketing | `/` | Product home (`/explore`) |
| Browse + create | `/explore?compose=…` | `/host/activities/new` as consumer default |
| Personal hub | `/profile`, **`/plan`** | Legacy `/trips` redirects; not `/activities` browse |
| Entity | `/activity/:id`, place URLs | “Trip” entity (does not exist) |
| Host console | `/host/*` (tenant workspace) | Buddy **Organize** (map FAB) + **Plan hosted** manage (same APIs, consumer surface) |
| Pro / business | `/profile/pro-membership` | `/become-host` as product entry (redirect only) |
| Messaging | `/messages` (+ `?group=` / `?to=`) | Chat embedded only on entity/Plan flows → `/chat` |
| List layout (browse) | `/list?…` (handoff) · mobile **List** pill on `/explore` | A second product home, `/map`, or **List bottom-nav tab** |
| **Publishing workspace** | `/operator/*` (legacy `/host/*` → rewrite) | Consumer **Organize** on `/explore` (same APIs, different shell) |
| **Platform admin** | `/admin/*` | Consumer peek/detail, Explore chrome, or `ConsumerShell` |
| **Public person** | `/member/:userId` | `/profile` (self hub) or tenant storefront (`/guide`, `/agency`, `/shop`) |
| **Tenant storefront** | `/guide/:slug`, `/agency/:slug`, `/shop/:id`, … | Activity **host row** (person vs brand) — link resolver picks surface |

**Auth shells:** `ProtectedRoute` uses **`UserRole`** for coarse access (admin, host console shell). **Product gates** (Organize, paid host, profile chips) use **`MemberStatusDTO`** from **`GET /me/status`** (`useMemberStatus`). See [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) — mixing these layers is a top source of incoherence.

### 4.1 Browse routing strategy (scalable default)

Aligned with [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §4.1 and [`NORTHSTAR.md`](./NORTHSTAR.md):

- **Few browse surfaces, many filterable views** — `/explore` map-first; **map list** (`list=1` / List pill) vs **discover browse** (`browse=1`, hamburger Browse, optional `/list`) share filter vocabulary (`src/list/routing.ts` ↔ `explorePath()`). **Mobile bottom nav stays three tabs** — Explore · Plan · Chat (middle tab route `/trips`) ([`NAVIGATION.md`](./NAVIGATION.md)).
- **One discovery read path on the server** — `GET /explore/map` (+ query). Map stage, explore list sheet, and list discovery UI are **projections**; avoid separate “catalog” endpoints per category unless a new bounded context is approved in Tier-1.
- **Many entity URLs where identity matters** — `/activity`, place paths, `/shop`, brand paths: sharing, notifications, per-id cache and `viewerAccess`. These are **not** browse department homepages.
- **Private engagement off the public map** — wishlist, entity follow, member follow, goals: `/me/*` and trips/profile UI ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Follow · Wishlist · Goal).

**Scale levers (prefer before new route trees):** bbox/region or cursor on explore map; normalized query cache keys; lighter list DTO if poster feed outgrows map payload; SSR on entity + marketing only unless SEO category landings are explicitly added.

---

## 5. API shape (how the backend stays one system)

**Mount order:** `apps/api/src/routes/index.ts` — `auth`, `admin`, `host`, `shop`, `chat`, `media`, `reports`, `social`, **`user`** (broad public + `/me`).

**Thin routes:** `apps/api/src/routes/user/register*.ts`, `routes/host/register*.ts`, and `routes/admin/registerAdmin*.ts` — validate, call **service**, map DTO. Mount shells: `user.ts`, `host.ts`, `admin.ts`.

**Domain rules:** Prefer `apps/api/src/domain/*` (pure) + `apps/api/src/services/*` (orchestration). Avoid new business rules in `lib/*-store.ts` without a service façade.

**Contracts:** `packages/shared-types` — wire DTOs, explore projection, participation enums. API `domain/` may mirror rules but **shared-types** is what the SPA imports.

**Explore read model:** Single aggregator `GET /explore/map` — clients should not reconstruct the map from three legacy catalog calls.

**Async side effects:** Fire-and-forget rewards, email, notifications, and group-chat roster updates use `scheduleNotification` / `scheduleSideEffect` (`apps/api/src/lib/schedule-side-effect.ts`) — failures **warn-log** with `logContext` (see `DEV_RUN.md`). **Chat inbox:** non-buddy partners use batched policy (`batchCanMessagePartnersFromViewer`); policy failure surfaces `directConversationsDegraded` (not silent empty inbox); regression `apps/api/tests/chat-policy.test.ts`. **Media:** private-bucket kinds deny anonymous presign (`media-access.test.ts`). **Search:** user substring search escapes via `regex-search` (`regex-search.test.ts`, `naming-coherence.test.ts`). **Read paths:** activity assembly, `/me/reviews`, `/me/entity-follows`, member browse + people rows (`countCheckedInParticipationsForUserIds`, `filterInboxMessageablePartnerIds`, read-only `batchResolveMemberProfileRoleLabelsForDirectory`), active tenant memberships (`tenant-access` + `findTenantsByIds`), host join-queue locations, wishlist profile hydration, group wall unread aggregation, publish fan-out actor labels (`resolveNotificationActorDisplayNamesForRecipients`); legacy demand map pins batch hide (`batchShouldHideFromMapMemberDiscovery`) — `naming-coherence.test.ts`. **Mount fetches / explore hygiene:** `useSafeAsyncEffect` (**S10a–b**), browse URL + pin-deep-link deps (**S10d**) — `systemCoherenceGuard.test.ts`. **Release (S10e/f):** vNext promote + manual QA — [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md), `npm run consumer-detail:qa-routes`; tracker **§8.1**.

Detail: [`API_ROUTING.md`](./API_ROUTING.md).

---

## 6. Frontend shape (how the SPA stays one system)

| Layer | Role |
|-------|------|
| `src/pages/*` | Route shells — lazy in `App.tsx` |
| `src/explore/*` | **Discovery shell** — map stage, compose, browse chrome, join overlays |
| `src/discovery/*` | **Discovery read models** — card VM from `GET /explore/map` (pins, list, posters) |
| `src/pages/operator/*`, `src/console/*` | **`/operator/*` console** — shell, hub stats (`ConsoleHubSections`), join queue |
| `src/components/organisation-console/*` | Pro onboarding, public tenant profile editors (wire: organisation) |
| `src/api/domains/*` | HTTP clients per context — composed in `services.ts` as `api` |
| `src/config/*`, `src/content/*` | Routes helpers and canonical copy |
| `src/member/*` | Host-status display helpers and guards |

**API client:** Prefer `api.getMemberHostStatus()`, `exploreApi.*`, `organisationApi.*`. Domain modules only — `legacyApi.ts` removed; see `apiLegacyGuard.test.ts`.

**Publish payload:** Single builder `activityPublishPayload.ts` for explore Organize and host console forms (shared across surfaces).

### 6.1 Discovery UI stack (methodology)

**Explore** names the **route and shell** (`/explore`, `ExploreMapStage`, filter pills). It is **not** a prefix for entity UI. Consumer discovery follows one vertical stack:

| Layer | Responsibility | Canonical modules |
|-------|----------------|-------------------|
| **L0 Wire** | Map/list DTO from API | `ExploreMapItemDTO` (`shared-types`), `GET /explore/map` |
| **L1 Card VM** | Projection for peek + list + poster | `src/discovery/discoveryCardModel.ts`, `buildDiscoveryCardViewModel` |
| **L2 Map peek** | Minimized card on map/list | `MapPeekShell` + `peek/{entity}/*` + `*PeekCard` |
| **L3 Entity detail** | Marketing depth, join, tabs | `src/activity/detail/*`, `*PlaceDetailPage`, `/area/:slug` |

**Naming (L2):** One shared shell — **`MapPeekShell`**. Per entity — **`{Entity}PeekCard`**, **`{Entity}PeekBody`**, **`{Entity}PeekActions`** (activity wire actions via **`ActivityPeekEngagementActions`**). Do **not** stack extra prefixes (`PinSummary`, `Explore`) on entity parts.

**Routing rule:** `mapPeekSlots` is the **only** module that branches on `card.source` for the activity map peek **mount** (`ActivityMapPeekHost` — React surface, not activity organizer). New logic goes under `peek/{activity|place|area|shop}/`, not new `Explore*Peek*` files.

**Looking-for / seeking (unified with activity):** Product = **activity** (`activityMode: seeking`); publisher = **organizer** on wire. Map/list peek = same stack as hosted outings: `ActivityMapPeekHost` → `ActivityPeekCard` → `peek/activity/*` + `resolveActivityPeekEngagement` (`viewerAccess.mapPeekActions`). **No** intent-only peek UI in app code — map wire is activity-backed (M0/M1). L1 cards force `source: 'activity'` for seeking. Ops: backfill old DB rows (`seeking:storage-status`); keep `pin=demand:` URL rewrite only (`seekingPinHygieneGuard`).

**Parity rule:** Engagement affordances on L2 must match L3 for the same viewer state (`resolvePeekDetailAccess`, activity engagement policy) — see `consumer-detail-surfaces-plan.md`.

**Folder rule:** `src/explore/ui/Explore*.tsx` legacy map chrome may keep the surface prefix until a dedicated pass; **entity** logic does not.

**Geography vocabulary (do not mix):** **Place** = catalog entity (`locations`). **`venue`** = explore wire for a Place on Spots. **Area** = curated hub (`source: 'area'` pin). **Facility** = amenity Place counted in `areaLensStats.facilities` — not an Area. FE anchor: `src/place/geographyVocabulary.ts` · guards: `geographyTerminologyGuard.test.ts`.

Canon table: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) (Discovery UI file names). Guards: `mapPeekNaming.test.ts`, `discoveryUiMethodologyGuard.test.ts`, `geographyTerminologyGuard.test.ts`.

### 6.2 Frontend surface architecture (system methodology)

**Purpose:** One **object-centric** stack (wire → projection → shell → page composer) across **all** user-facing families — not only map peek and entity detail. Experiment plans (`consumer-detail-surfaces-plan`, `member-surfaces-implementation-plan`) are **workstreams under this section**; they do not replace it.

#### 6.2.1 Surface families (layout chrome)

| Family | Routes (anchor) | Shell / layout | Uses L1–L3 discovery stack? |
|--------|-----------------|----------------|----------------------------|
| **Marketing & auth** | `/`, sign-in, `/welcome` | Marketing layout · guest rules on `/` | No — CTAs hand off to `/explore` |
| **Discovery shell** | `/explore`, `list=1`, `browse=1`, `/list` | `ExploreExperience` + map stage / browse asides | **L1–L2** on pins/rows/posters; not L3 |
| **Personal hub** | `/profile`, `/profile/settings/*` | `ConsumerShell` + profile stack | Launcher only — not a second browse home |
| **Plan & commitments** | `/plan` | `ConsumerShell` | Embeds manage sheets; may deep-link L3 |
| **Communication** | `/chat`, `/messages`, `/groups` | Tab chrome / inbox | No peek; people **names** link to `/member` or storefront |
| **Entity detail (L3)** | `/activity`, place URLs, `/area`, `/shop`, org slugs | `MobileDetailShell` / `EntityPublicDetailShell` | L3 — parity with L2 via `resolvePeekDetailAccess` |
| **Member & people browse** | `/member/:id`, Explore `view=people`, `/list?listCat=people`, `/buddies` | `ConsumerShell` (profile) · `PeopleBrowsePanel` (discover) | **People rows** = own card VM (`memberPeople*`); seeking tab = **activity L1** |
| **Publishing workspace** | `/operator/*` | `ConsoleShell` / `DashboardLayout` (tenant) | Preview may embed consumer L3 — **manage** is separate |
| **Platform admin** | `/admin/*` | `DashboardLayout` + `ADMIN_LINKS` | **Never** reuse `MapPeekShell` or consumer detail footers |

#### 6.2.2 Profile & publisher identity matrix

One **person account**; **one consumer profile page** (`/member/:userId` — `MemberProfile` / `MemberProfileView`). `/buddies`, people browse, host rows, and chat link here; browse **lens** is query only (`memberProfilePath(…, { lens })`). Full lens × audience table: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §3.2.2. Capabilities (`GET /me/status` → `publish`) gate **organize/workspace** — not profile read ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)).

| Viewer intent | Canonical route | Primary module | `viewerAccess` / policy |
|---------------|-----------------|----------------|-------------------------|
| **Self** | `/profile`, `/profile/edit` | `Profile*` | N/A (authenticated `/me/*`) |
| **Another member** | `/member/:userId` | `MemberProfile` | `resolveProfileViewerAccess` on `GET …/public-profile` |
| **Discover directory** | Same + `discover=1` / `lens: discover` | `MemberProfile` | Public visibility + discovery quota (Pro unlimited) |
| **Friends / Going** | Same + `lens: friends` (optional) | `MemberProfile` | `accepted_buddy` → full exposure |
| **Available tab** | Same + `lens: available` (optional) | `MemberProfile` | Signed-in → public card at minimum |
| **Host / Looking for** | Same + `lens: host` (optional) | `MemberProfile` | Participant + host-of-activity levels |
| **Host on activity** | Activity Plan tab **host row** | `ActivityDetail*` publisher strip | Link **person** (`/member`) vs **tenant** (`/guide`, `/agency`, `/shop`) from wire `publisher` |
| **Pro guide storefront** | `/guide/:slug` | `OrganisationPublicProfile` | Public tenant profile — not `/member` |
| **Agency / partner** | `/agency/:slug`, `/partner/:slug` | Same | Workspace team ≠ consumer buddy graph |
| **Shop brand** | `/shop/:id` | `ShopPublicPage` | Commerce context |
| **Available / roster** | Explore people tabs `available`, `going`, `connect` | `PeopleBrowseTabContent` | Roster APIs (`member_discovery`); **not** full L3 until tap through |
| **Owner preview** | Eye from profile / console | Consumer L3 with `preview` / manage affordances | Same wire as public; extra actions only in workspace |

**Target:** One **member browse row** projection (directory / availability / network roster) shared by `PeopleBrowsePanel` and list `listCat=people` — distinct from **`DiscoveryCardModel`** (map catalog entities). Keep **member** for person ids and profile routes; **people** for the browse surface name only.

#### 6.2.3 Discovery projections (one catalog, many lenses)

**Server:** `GET /explore/map` (+ query filters) is the default catalog; people directory and rosters compose from **`member_discovery`** + map read ([§3.2](./SYSTEM_COHERENCE.md#32-browse--member-people-vs-communication-do-not-conflate)).

**Client — same filter vocabulary everywhere:**

| Projection | Entry | Row/card builder | Deep link |
|------------|-------|------------------|-----------|
| Map pins | `/explore` | L1 `buildDiscoveryCardViewModel` → L2 peek | `pin=` / selection |
| Map list panel | `list=1` | Same L1 → compact row + `mapPeekActions` | Peek or L3 |
| Discover browse | `browse=1` or `/list` | `buildListFeedCards` / posters | Entity routes |
| Header search | Explore search modal | `exploreItemSearch` taxonomy | Entity or filtered explore |
| People — looking | `peopleTab=looking` | Activity L1 (seeking) | `/activity` |
| People — network | `going` / `connect` | Network roster VM | `/member`, message |
| People — available | `available` | Availability + directory VM | `memberProfilePath(id, { lens: 'available' })` — **not** discover quota |

**URL sync:** `explorePath()` ↔ `listDiscoveryPath()` ↔ `exploreBrowseUrlSync` / hydrate — do not add parallel query dialects per surface ([`NAVIGATION.md`](./NAVIGATION.md) § Explore URLs).

#### 6.2.4 L0–L3 by bounded context (extension of §6.1)

| Context | L1 (card VM) | L2 (peek / row) | L3 (detail composer) |
|---------|--------------|-----------------|----------------------|
| Activity (hosted + seeking) | `discoveryCardModel` | `peek/activity/*` | Kind **page composers** (`*ActivityDetailPage` → shell) — **not** one `ActivityDetailBody` with kind `if` chains |
| Place | L1 place slice | `peek/place/*` | `buildPlaceDetailPageModel` + kind hero composers → `PlaceDetailPage` → `PlaceDetailCore` (**reference**) |
| Area | L1 area pin | `peek/area/*` | `AreaDetailPage` sections/tabs |
| Shop | L1 shop pin | `peek/shop/*` | `ShopPublicPage` |
| Member (browse) | `memberPeople*` row VM | Optional mini-card in people panel | `MemberProfile` |
| Tenant storefront | Org list cards (browse) | — | `OrganisationPublicProfile` |

#### 6.2.4.1 Shared L3 kind pattern (activity + place)

One methodology for catalog **detail templates** — not one URL for every entity:

| Step | Activity (`/activity/:id`) | Place (`/trail` · `/camp` · `/venue`) |
|------|----------------------------|----------------------------------------|
| Route loader | `ActivityDetail.tsx` (wire, modals, SEO) | `PlaceDetailPage.tsx` |
| Kind key | `ActivityDetailKind` from `activityType` | `PlaceDetailKind` from route wrapper |
| Kind route file | `*ActivityDetailPage` → `ActivityDetailPageShell` | `*PlaceDetailPage` → `PlaceDetailPage` |
| L1 | `buildActivityDetailPageModel` | `buildPlaceDetailPageModel` |
| Public body | `ActivityConsumerDetailBody` (scroll; peek L1 card) | `PlaceDetailCore` tabs/sections |
| **Presentation wire** | `GET /activities/:id` → `presentation.consumerLayout` (+ `engagement`, `mapPeekActions` via `viewerAccess`) | Place: catalog fields on `GET /places/:id` (no `consumerLayout` yet — tabs local) |
| Embed-only kind slot | `*ActivityDetailPlanSections` → `ActivityDetailBody` | — |
| Shared core | `ActivityDetailView` + `MobileDetailShell` | `PlaceDetailCore` |

Host preview / `ActivityManageSheet` embed `ActivityDetailView` with `isEmbedded: true` → `presentation.tabs` + `footerByTab` (no `consumerLayout`). They skip `ActivityDetailByKind`.

#### 6.2.5 Cross-cutting kits (one implementation per concern)

| Concern | Canonical location | Surfaces |
|---------|-------------------|----------|
| Guest sign-in / browse gate | `guestBrowseGate*`, `ActivityDetailGuestGate`, `ExploreGuestJoinSheet` | Peek details, L3, people tabs (non-public) |
| Join / RSVP / request | `useActivityJoinFlow`, wire footers | L2 actions, L3 footers, Plan manage |
| `viewerAccess` → UI | `mapViewerAccessToUi`, `resolvePeekDetailAccess` | L2–L3 parity guards |
| Participation modals | Activity manage / invite sheets | Explore host on map, L3, `/operator` queue |

#### 6.2.6 Admin & operator (out of consumer methodology)

- **Admin (`/admin/*`):** CRUD tables, moderation queues, metrics — `adminApi` + `DashboardLayout`. Does **not** adopt discovery card VM or entity tab footers; may link **out** to consumer URLs for inspection only.
- **Operator (`/operator/*`):** Tenant-scoped publishing — `ConsoleShell`, join request queue, activity forms. **Organize** on the map remains consumer shell; shared **publish payload** (`activityPublishPayload.ts`) is the cross-surface write contract.

**Program:** **S13** (§8) — implementation waves; activity kind page split is **S13d**, not a standalone architecture.

---

## 7. Incoherence register (honest debt)

Track consolidation here; sub-roadmaps link out but **this table is the system-wide backlog**.

| ID | Symptom | Why it hurts | Target state | Tracker |
|----|---------|--------------|--------------|---------|
| **C1** | Three permission notions (`UserRole`, `HostStatusDTO`, tenant middleware) | Wrong gates in UI; workspace confused with Organize | Roles = shell; **`GET /me/status`** / `MemberStatusDTO` = product; tenant header = **`/operator/*`** (legacy `/host/*` rewritten) | [`MEMBER_MODEL.md`](./MEMBER_MODEL.md), `host-member-model.mdc`, `hostMemberGuard.test.ts` (no `isHostRole` in product gates) |
| **C2** | Organisation/Host naming mix in UI | New code uses wrong copy or imports | `Host*` + `Activity*` for publish/roster; `Organisation*` only for tenant storefront wire; host user copy | [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) P2 · [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Organisation in filenames |
| **C3** | ~~Large `host.ts` / `admin.ts` monoliths~~ | — | **Mitigated (Oct 2026):** host + admin mount shells with `register*` registrars | [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) P2 |
| **C4** | Parallel place detail pages (`Trail` / `Camp` / `Event`) | Duplicate SEO/loading patterns | `PlaceDetailCore` + thin kind wrappers (`placeDetailCore.test.ts`) | **R3 done** — routes unchanged for SEO |
| **C5** | `components/activities/*` modals vs explore wizards | Two create UX paths | Explore compose only for consumer create | Mostly done — audit `components/activities` |
| **C6** | Shop = `tenant` + `merchant_profile` | Two writes for one brand | Documented split; sync on ShopManage save | [`DOMAIN.md`](./DOMAIN.md) |
| **C7** | Premium location unlock + old membership page | Legacy freemium copy vs north star | Product TBD | [`NORTHSTAR.md`](./NORTHSTAR.md) |
| **C8** | `/community`, `/membership` routes | Secondary surfaces vs explore-first IA | Both redirect to `/explore`; `COMMUNITY_PATH` kept for inbound links only | [`NAVIGATION.md`](./NAVIGATION.md) legacy table |
| **C9** | Notification + privacy matrix incomplete | Rare group/private actor QA | API `notification-actor-label`; FE `notificationConsumerGuard` + `notificationRouting.test`; API route side effects → `scheduleSideEffect` / `scheduleNotification` | **Eng done (Oct 2026)** — manual QA for edge notification kinds |
| **C10** | 100+ markdown files, multiple “plans” | Agents read wrong doc | **Tier 1** only for truth; experiment defers | [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) |
| **C11** | Long flat `api.*` surface | Wrong facade | Domain modules in `src/api/domains/*` | [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §10–12 |
| **C12** | Notification meta dialects | Routing sprawl | `NotificationMeta` + `actorUserId` | §11 |
| **C13** | Many `*Routing.ts` helpers | Import confusion | `routingCatalog` + `inferNotificationPath` | §10 |
| **C14** | Doc corpus duplication | Contradictory terms | **Update Tier-1 only** — [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) | |
| **C15** | Buddy/friend vocabulary | Fake entity ids | User ids only | [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Naming vocabulary |
| **C16** | ~~Parallel detail policy~~ | — | **Mitigated (Oct 2026):** API `viewerAccess`, map enrich, `mapViewerAccessToUi`; FE shim is wire-only | [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15 |
| **C17** | Discovery card projection sprawl | Optional API `DiscoveryCardProjection` on map wire | `src/discovery` VM + `buildDiscoveryEnrichedCard`; detail wire footers (`activityDetailAcceptance` AD-PRES-02, R6) | **R1 + R6 done (FE)** — slim map DTO promotion is R5 ops |
| **C18** | `ExploreExperience` orchestration hub | Was ~900 LOC monolith | Shell hooks + `exploreBrowseUrlSync` / `exploreBrowseUrlHydrate` / apply-handlers + selection sub-hooks | **R2 done** — wiring & browse URL hook under guard budgets; public browse/selection contracts unchanged |
| **C19** | Global explore map blob | Full fetch default; bbox behind flags | `explore-map-base` + vNext bbox — [`explore-map-vnext-spec.md`](./experiment/explore-map-vnext-spec.md) | **R5 shipped (flagged)** — staging runbook |
| **C20** | Seeking **read** paths (M2d write fixed) | Legacy `demand:` deep links only in routing + notification rewrite | Activity-primary map pins; `seekingPinHygieneGuard` | **R4 done (read)** — compat parsers remain |
| **C21** | **Surface/role prefixes in shared components** (`Host*`, `Explore*`, `Plan*` outside owning folders; Host→Organizer synonym renames) | Same mistake as C2; blocks reuse and coherent refactors | Module names = bounded context; props = neutral ids; copy in labels/`workspaceVocabulary` | [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §13 · [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) P5 · `moduleNamingGuard.test.ts` |
| **C22** | **Find vs Organize split in UI** (legacy host-manage peek, `participantIntentId` publish paths, transport vs `link-activity`) | Same map activity, different chrome and wrong transport link | **S12** in [`CREATE_FLOW.md`](./CREATE_FLOW.md) — one host peek; parent `linkToParentActivityId` for transport | **S12 done** |
| **C23** | ~~**Activity L3 monolith**~~ | — | **Done (S13-W7)** — thin `ActivityDetailBody` + `ActivityDetailPlanColumn` / `ActivityDetailSidebarColumn`; kind `planSections` on plan column | **S13-W7** |
| **C24** | **People surfaces split** (`PeopleBrowsePanel`, `ListDiscoverPeopleView`, `Buddies`, activity host row) without shared people card VM | Inconsistent roster masks, duplicate buddy CTAs | `memberBrowseRowModel` + one `PeopleBrowseTabContent` — §6.2.2 | **S13-W3 done** |
| **C25** | ~~Admin / platform_ops FE roots under-documented~~ | — | **Done (S13-W9)** — `NAVIGATION.md` admin table, `adminSurfacesAcceptance`, manifest `feRoots` | **S13-W9** |

**Not debt (intentional):** stable URLs (`/trail`, `/host`, `/guide`, `/venue`; legacy `/operator` redirect); Mongo collection names; `x-organisation-id` header; `getOrganisationProfile` / `organisation-console/` for **storefront** — not for activity roster or `createHostActivity`.

---

## 8. Consolidation phases (system-wide)

Ordered for **coherence**, not feature count:

| Phase | Outcome | Primary docs / commands |
|-------|---------|-------------------------|
| **S0** | Single doc entry + automated phrase guards | `DOCS_INDEX`, `verify:docs` |
| **S1** | One member capability resolver (`GET /me/status`; legacy paths rewritten) enforced server-side | `MEMBER_MODEL`, `verify:host-member` |
| **S2** | Host route modularization + fulfill removal | **Done** — `HOST_CLEANUP_ROADMAP` P1–P2 |
| **S3** | API mount shells: **`user.ts`**, **`admin.ts`** → `register*` modules only | **Done** — admin registrars + platform master staff; user already modular |
| **S4** | Frontend `api.*` stays domain-only | **Done (guards)** — `apiLegacyGuard`, `domainImportGuard`, `consumerApiIndexGuard`, `hooksApiFacadeGuard`, ESLint R8; `api/index` only in `src/hooks` facades |
| **S5** | Privacy notification matrix + viewer access everywhere | [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) P2 |
| **S6** | Place detail internal merge + SEO pass | **Done** — R3 `PlaceDetailCore`, thin trail/camp/event wrappers (`placeDetailCore.test.ts`) |
| **S7** | **Viewer access VA-1–VA-7** (activity detail + explore peek on API contract) | **Done** — §15.8; layer-7 hook `composeActivityViewerAccess` / `applyActivityViewEntitlements` |
| **S7b** | **Activity detail tabs** (Plan · Place · Buddies · Transport) + unified engagement policy | **Done** — program `complete`; wire footers + `activityDetailAcceptance` / AD-CTA matrix |
| **S7c** | **Viewer access naming** (wire-first, collapse resolver soup) | **Done (NA-1–NA-6)** — plan §22; API `buildActivityViewerAccess`; [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.11 |
| **S8** | **Discovery architecture** — card VM, explore shell, seeking read cleanup, map vNext spec | **Wave closed (R0–R6, R4 read, R8)** — R5 vNext **promote** via [`EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md); §3 metrics (seeking branches, slim map default) = optional follow-up |
| **S9** | **Consumer detail shell alignment** — place/area/shop/agency IA + shared chrome vs activity reference | **Eng complete** — shells Phases 1–7; lineage **§3.2** + API `detail-surface-lineage-contract`; §8.1 `consumerDetailQaMatrixGuard`; §15.3 `consumerDetailAntiDriftGuard`. **Pending:** product §0 + §8 manual (`npm run consumer-detail:qa-routes`) — [`consumer-detail-surfaces-plan.md`](./experiment/consumer-detail-surfaces-plan.md) |
| **S10** | **Production hygiene audit (Oct 2026)** — security, trust, perf, stability (not new audit markdown) | **Eng complete** — **§8.1** waves **core + S10a–d** shipped; **S10e/f** = ops/human gates ([`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md)); **S10g** deferred. **Out of scope:** **C18** rewrite; **C19** prod default = staging promote only |
| **S11** | **Structural module naming (P5 SN-1–SN-8)** — context folders, not synonym renames | **SN-1–SN-8 done** — `useMemberStatus`, `tenantActivityClientApi`, `/operator` mount, `moduleNamingGuard` SN-6 | [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) P5 |
| **S12** | **Hosted + seeking activity coherence** (one host, one map pin, linked transport) | **S12a–d done** | [`CREATE_FLOW.md`](./CREATE_FLOW.md) § Coherence program |
| **S13** | **Frontend surface methodology** — profiles, discovery projections, admin/operator boundaries, L3 composers (§6.2) | **Eng complete** — W1–W9; **W10** human QA pending | This file §6.2 · §8.3 · manifests · guards |

### 8.3 S13 — unified frontend & UI program (final phase plan)

**Canonical architecture:** §6.1 (discovery L0–L3) + §6.2 (surface families). **This section** is the **only** implementation schedule for remaining UI structure work. Experiment trackers defer here:

| Experiment plan | Role under S13 |
|-----------------|----------------|
| [`consumer-detail-surfaces-plan.md`](./experiment/consumer-detail-surfaces-plan.md) | S9 **done** (shells/chrome); remaining = **S13-W4–W5** (activity kind composers, optional area/place polish) |
| [`member-surfaces-implementation-plan.md`](./experiment/member-surfaces-implementation-plan.md) | People panel **shipped**; remaining = **S13-W1–W2** (lens URLs, row VM, dedupe modules) |
| [`activity-detail-tabs-implementation-plan.md`](./experiment/activity-detail-tabs-implementation-plan.md) | Tabs/CTA matrix **done**; kind-specific **body** = **S13-W4** only |

#### 8.3.1 Synthesis — one vertical stack per object

**Surfaces** (§6.2.1) provide **route chrome only** — map stage, `ConsumerShell`, `DashboardLayout`, marketing layout. They do **not** own entity UI.

**Per object** (activity, place, area, shop, person), the same five layers apply everywhere the object appears:

| Layer | Responsibility | Policy |
|-------|----------------|--------|
| **L0 Wire** | API DTO + `viewerAccess` / entitlements | Server only — [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15 |
| **L1 Projection** | Card/row view model | `discoveryCardModel` (catalog pins) · `memberPeople*` (people browse) · future `activityDetailPageModel` (L3) |
| **L2 Peek / row / poster** | Minimized engagement | `MapPeekShell` + `peek/{entity}/*` · list rows · list posters |
| **L3 Page composer** | Sections + tabs for one id | `*ActivityDetailPage`, `PlaceDetailCore`, `MemberProfile`, `ShopPublicPage`, … |
| **L3 Shell** | Shared chrome (hero, tabs, sticky footer) | `MobileDetailShell`, `EntityPublicDetailShell`, `ActivityDetailPageShell` |

```mermaid
flowchart LR
  subgraph discovery [Discovery shell only]
    MAP["/explore map"]
    LIST["list=1 / browse=1 / /list"]
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

**Cross-cutting kits** (§6.2.5): guest gate, join flow, `mapViewerAccessToUi` — imported by L2/L3; never forked per surface.

#### 8.3.2 Baseline — already shipped (do not rebuild)

| Area | Status | Proof |
|------|--------|--------|
| Discovery L1 + unified activity peek (hosted + seeking) | Done | S8, §6.1, `discoveryUiMethodologyGuard` |
| `viewerAccess` on activity detail + peek parity | Done | S7, `mapDetailEngagementParity` |
| Place L3 (`PlaceDetailCore` + kind routes) | Done | S6, `placeDetailCore.test.ts` |
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
| **1** | **S13-W1** | **Profile link lenses** | **`memberProfileLink(userId, lens)`** (`src/member/memberProfileLink.ts`) used by people browse, `/buddies`, roster chips, `memberDiscoverProfilePath`; wire = `memberProfilePath` in shared-types | `memberProfileLink.test.ts`, `memberSurfacesAcceptance` S13; no duplicate `explore/ui/peopleBrowse` implementations |
| **2** | **S13-W2** | **People browse module unity** | One `PeopleBrowseTabContent` import path; delete or re-export duplicate under `explore/ui/peopleBrowse`; `ListDiscoverPeopleView` uses same module | `memberSurfacesAcceptance`, `listModuleHygiene` |
| **3** | **S13-W3** | **Member browse row VM** | `src/people-discovery/memberBrowseRowModel.ts` — L1 rows for directory, availability, going, seeking; **not** authorization | `memberBrowseRowModel.test.ts` + panel/list consume VM; C24 closed |
| **4** | **S13-W4** | **Profile L3 polish** | `MemberProfileView` sections keyed off `viewerAccess` only; activity publisher strip uses `resolveActivityPublisherProfilePath`; owner `?view=public` unchanged | `detailSurfaceWiringAcceptance`, §15 profile tests |
| **5** | **S13-W5** | **Discovery projection parity** | L1/L2 engagement parity per `listCat` / people tab; member browse L1 in methodology guards | `discoveryUiMethodologyGuard` DISC-METH-07–09 · `listModuleHygiene` peopleBrowse shim |
| **6** | **S13-W6** | **Guest + participation kit** | `guestBrowseGateCopy` + `ExploreGuestSignInCard` for people browse, member profile, activity L3, peek-details | `guestParticipationKitGuard.test.ts` + `detailSurfaceWiringAcceptance` DS-WIRE-02 |
| **7** | **S13-W7** | **Activity L3 kind composers** | `buildActivityDetailPageModel(wire)`; per-kind `*ActivityDetailPage` composes sections (place pattern); remove unwired `planFacts` / shrink `ActivityDetailBody` | `activityDetailAcceptance` per kind; C23 closed |
| **8** | **S13-W8** | **Entity L3 leftovers (S9)** | Optional: area tabbed hub; place Facts/Transport tab labels; shop/agency `EntityPublicDetailShell` parity audit | `consumerDetailQaMatrixGuard` rows green |
| **9** | **S13-W9** | **Ops surfaces catalog** | `NAVIGATION.md` § Platform admin table; `systemCoherenceGuard` lists all `Admin*` routes; manifest `feRoots` (C25) | No consumer peek imports in `src/pages/Admin*` |
| **10** | **S13-W10** | **Release gates** | Human QA `npm run consumer-detail:qa-routes`; ops S10e vNext promote if scheduled | `PRE_DEPLOY_CHECKLIST` |

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

### 8.2 S12 — hosted + seeking coherence (phase plan)

| Phase | Outcome | Primary code | Status |
|-------|---------|--------------|--------|
| **S12a** | Transport child links via `linkedActivityId` / `linkParentToRideshareActivity`; **no** `link-activity` on rideshare publish | `useExploreRideshareOrganizeLinks.ts`, `organizeActivityPublish.ts`, `linkActivityRideshareOffer.ts` | **Done** |
| **S12b** | Owner peek = `ExploreActivityMapPeekActions` for seeking + hosted (legacy demand-owner fork only without activity host wire) | `exploreSelectionSelectedCard.ts`, `enrichListFeedCard.ts` | **Done** |
| **S12c** | Find success + intent manage → same transport surfaces as Organize (`LinkRidesharePanel`, paste link) | `DemandSubmitSuccessSheet.tsx`, `ParticipantIntentManageSheet.tsx`, `navigateParticipantIntentManage.ts` | **Done** |
| **S12d** | Docs/guards: no new `demand`-only product gates; intent APIs read-through only | `seekingPinHygieneGuard` (S12d tests), `exploreCardModel` legacy flags | **Done** |

### 8.1 S10 remediation waves (phase plan)

Work **in order**; extend `systemCoherenceGuard.test.ts` / `naming-coherence.test.ts` per wave; update §5 bullets when a wave closes.

| Wave | Goal | Scope (representative) | Guard / proof | Status |
|------|------|------------------------|---------------|--------|
| **S10-core** | P0–P1 audit items shipped | Demo login, regex search, demo passwords, metrics auth, side effects, inbox batch + degrade, media ACL, shop rails, batched reads (assembler, reviews, entity-follows) | `verify:domain` + §5 | **Done** |
| **S10a** | Consumer **mount-fetch races** (`useSafeAsyncEffect`) | Inbox, Profile hub/edit/badges, place detail, explore peek hooks, `MemberProfile`, `ProductDetail`, `ActivityDetail`, `TripsMap`, `ShopPublic`; **AreaDetail** uses React Query (OK); plan sections = deep-link sync only | `systemCoherenceGuard` S10a lists | **Done** (Oct 2026) |
| **S10b** | Publishing workspace (`/host/*`) mount-fetch races | `Activities`, `JoinRequests`, `Places`, `History`, `Team`, `PublicProfileEdit`, `ConsoleShell` reviews chip; hub via `useConsoleHubData` (React Query) | `systemCoherenceGuard` S10b | **Done** (Oct 2026) |
| **S10c** | API **read batching** (N+1) | Read/list paths batched (incl. member browse, wishlist, group unread, publish notify actor labels); private-profile notify fan-out may still resolve per recipient | `naming-coherence.test.ts` | **Done** (Oct 2026) |
| **S10d** | Explore **runtime hygiene** (not C18 rewrite) | Browse URL migrations, organize/pin-deep-link callback deps, rideshare gate deps | `systemCoherenceGuard` S10d | **Done** (Oct 2026) |
| **S10e** | **C19** map vNext **promote** | Staging flags `EXPLORE_MAP_VNEXT` + `VITE_EXPLORE_MAP_VNEXT`; p95 bbox vs full map per runbook | `npm run s10e:staging-checklist` (`--verify` optional); [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md) | **Pending (ops)** — code shipped flagged |
| **S10f** | **Manual QA** | S9 §8 routes + C9 notification edge cases | `npm run consumer-detail:qa-routes` (prints both checklists) | **Pending (human)** |
| **S10g** | **C1** platform admin hardening | MFA, impersonation, cross-tenant — not a quick slice | `MEMBER_MODEL` / security review | Deferred |

Phases **S0–S4** (guards), **S6–S8** (core), and **S7/S7b/S7c** are in place; **S5** manual QA + knip optional. **S8** coded tracks are complete — remaining discovery scale work is **R5 promotion** (ops) and debt in [`system-refactor-plan.md`](./experiment/system-refactor-plan.md) §7 (not blockers). **S7** supersedes ad-hoc peek/detail gating in the SPA (**C16** mitigated). **S9** eng is complete; §8 manual QA overlaps **S10f**. **S10** engineering remediation closed Oct 2026 — run **`npm run verify:system`** before release; staging vNext (**S10e**) and printed QA routes (**S10f**) are the remaining human/ops gates.

---

## 9. Change checklist (any substantial PR)

1. Which **capability** (§1) and **context** (§3) does this touch?
2. Does it introduce a **second write path** for the same entity? If yes, stop and extend the existing service.
3. Update **Tier 1** doc(s): `CREATE_FLOW`, `NAVIGATION`, `API_ROUTING`, or `MEMBER_MODEL` — not only experiment plans.
4. Run **`npm run verify:system`** (or `verify:system:quick` before push); explore work also needs `test:explore-alignment`.

---

## 10. Related documents

| Question | Read |
|----------|------|
| Why we build this | `NORTHSTAR.md` |
| What entities exist | `DOMAIN.md` |
| Who can publish / host console | `MEMBER_MODEL.md` |
| FAB and join behavior | `CREATE_FLOW.md` |
| Who sees full detail vs peek | `DOMAIN_CANONICALS.md` §15 |
| HTTP paths | `API_ROUTING.md` |
| Deploy & monorepo layers | `ARCHITECTURE.md` |
| System-wide debt register | §7–8 (this file) |
| Host/tenant cleanup tasks | `HOST_CLEANUP_ROADMAP.md` |
