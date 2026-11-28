# HTTP API routing conventions

**Branch:** `main` · **Base path:** `/api` (see `apps/api/src/routes/index.ts`).

**SPA client:** `VITE_API_BASE_URL` defaults to **`/api`** (unversioned — no `/api/v1` prefix). Set in `.env` / Docker build when the API is on another origin.

Companion: [`DOMAIN.md`](./DOMAIN.md), [`CREATE_FLOW.md`](./CREATE_FLOW.md), [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

---

## Prefix rules

| Prefix | Auth | Purpose |
|--------|------|---------|
| **`/activities`** | Public read; tenant write via `/publishing` | Published **hosted** outings (join, RSVP, detail) |
| **`/explore/map`** | Public | Guest discovery catalog (`source`: activity · place · facility · shop · agency). Home map sends `sources` (default `place,activity`) and `includeRideshare=1` only for the rideshare topic. Omit `sources` for the full catalog (`/list`). Destination is a filter (`?destination=`), not a pin. Signed-in peek is **`GET /me/discover/overlay`**. |
| **`/agent/manifest.json`**, **`/agent/discover`** | Public (rate-limited) | **AI / agent** entry manifest and text search over published outings + registry places |
| **`/me/*`** | Signed-in member | Own profile, intents, groups, inbox, activity participation |
| **`/publishing/*`** | Verified + **tenant** (`x-tenant-id`) | **Operator desk** HTTP (any kind): publish, roster, **activity** join queue. SPA is `/operator/*`. |
| **`/member/:userId/*`** | Optional auth | Public member card (`profile`, `brief`, `upcoming-activities`) — `registerPublicMemberRoutes.ts` |
| **`/me/discover/overlay`** | Auth | Per-viewer `viewerAccess` for public map item ids (not a second catalog) |
| **`/discover/*`** | Mixed | **Discover layer** — federated Find crew (`GET /discover/crew`, auth) · ranked recommendations (`GET /discover/recommendations`, `surface=map` optional auth · `surface=crew` auth) |
| **`/me/member-discovery/*`** | Auth | People network, directory browse, quota, user search (Find crew roster: **`GET /discover/crew`**) |
| **`/safety/reports`** | Auth | Member **content reports** (trust/safety) — `safety.ts` |
| **`/chat/*`** | Auth | DMs |
| **`/reviews`** | Public read; auth write | Social reviews (not content reports) |
| **`/admin/*`** | `PLATFORM_ADMIN` | Moderation, **Users** (`GET/PATCH /admin/users*`), tenants, metrics — `admin.ts` mounts `registerAdmin*` only |
| **`/shop/*`** | Public read (`GET /shop/shops/:id`) | Shop **consumer** page payload only — `registerShopPublicRoutes`. Desk edit: **`/publishing/shop-profile`** + `x-tenant-id` (`registerPublishingShopStorefrontRoutes`). **Retired:** `/shop/merchant/*` manage (Nov 2026). **Retired (Oct 2026):** product catalog / checkout |
| **`POST /admin/platform-admins`** | Master admin only | Grant `PLATFORM_ADMIN` to an existing member by email |
| **`DELETE /admin/platform-admins/:userId`** | Master admin only | Revoke platform staff (not master accounts) |

**Naming**

- **Resource paths** use kebab-case plural nouns (`member-availability` slots via `/me/availability`, not `intents` or `demand`).
- **No tab or marketing names** on `/me/*` (`plan-needs-you`, `member-hub-stats` are forbidden — use capability names like `coordination-attention`, `profile-stats`). Presentation (`label`, consumer `path`) belongs in the SPA, not JSON.
- **Crew availability** → **`PUT /me/availability`** (`member_availability`; fixed windows project to explore map `source: availability`). Legacy **`/me/seeking-posts`** HTTP removed (MIG-DISCO-REG).
- **Availability slots** use `kinds[]` on `member_availability` — parallels activity `activityType` / shared `outingCategory`.
- Do **not** add catch-all `/plans` or `/me/intents` (legacy plan doc paths are obsolete).

---

## Join requests (hosted activities only)

**Find crew** map pins (`source: availability`) are **not joinable** — discover → member profile → message. Join flows apply only to **hosted** published activities.

| Step | Published activity |
|------|-------------------|
| **Create request** | `POST /activities/:activityId/requests` |
| **My status** | In activity detail `myRequest` |
| **Host lists** | `GET /publishing/requests` (tenant) |
| **Approve / reject** | `PATCH /publishing/requests/:id` |
| **Member list (outgoing)** | `GET /me/requests` |

Deprecated alias (do not use in new clients): `…/join-requests` mirrors `…/requests`.

**Messages (COH-06):** JSON **`note`** (joiner → host) and **`hostNote`** (host decision / revoke). HTTP, DTO, and Mongo use **`hostNote` only**.

Storage: **`activity_requests`** only for new join traffic. Legacy **`participant_intent_requests`** rows are read/migrate only.

**Retired (MIG-DISCO-REG):** demand / seeking activity joins, `/me/seeking-posts/*`, `GET /explore/seeking-activities`. Ops: `migrate-seeking-to-availability` then `seeking:storage-status --strict`.

---

## Member availability (`/me/availability`)

**MIG-DISCO-REG:** Find crew = **availability registry** (open calendar + optional **fixed** map catalog). No new `activityMode: seeking` writes. Map pins: `availability:{userId}:{slotId}`.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/availability` | My slots + kinds + visibility |
| PUT | `/me/availability` | Upsert (open days + fixed slots) |
| GET | `/me/availability/match-preview` | Suggested hosted outings for open availability |
| GET | `/explore/map` | Catalog BFF (`sources=availability` for fixed crew pins) |

**Ops migration:** `npm run migrate-seeking-to-availability` (dev DB: legacy seeking activities → fixed slots; optional `--cancel-seeking`).

**Retired:** `/me/seeking-posts/*`, `GET /explore/seeking-activities`, client `seekingApi`.

---

## Member badges (`GET /me/badges`)

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/badges` | Signed-in member — earned + in-progress achievement badges |

Registration: `registerMeBadgesRoutes.ts` · service: `member-badges.ts`.  
**Removed (do not reintroduce):** `/me/rewards`, `/rewards/catalog`, `/rewards/leaderboard` — Trail Points wallet product retired; badge progress still records via `awardPoints` shim in `rewards.ts`.

---

## Activities (organize)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/activities`, `/activities/:id` | Browse / detail — **`composeActivityViewerAccess`** (social access + entitlements); response includes **`viewerAccess`** § [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) **§15** |
| POST | `/activities/:id/requests` | Request to join |
| POST | `/activities/:id/rsvp` | I'm going |
| GET/PATCH | `/me/requests` | Member’s activity requests |
| GET | `/activities/:id` | Activity detail includes `myJoinInvite` when the signed-in viewer has a pending Join me invite (and is not already going) |
| GET | `/me/coordination-attention` | Member coordination read-model — `items[]` with `kind`, `count`, optional `activityId` / `inviterDisplayName` (no UI copy or routes on wire). Plan **Needs you** strip maps kinds client-side. |
| GET | `/me/profile-stats` | Profile counters (`followerCount`, `joinedCount`, `hostedCount`, `activeParticipantIntentCount`, `isCommunityHost`) |
| GET | `/activities/:id/invites` | Pending **Join me** invitee ids the caller sent for this activity |
| POST | `/activities/:id/invites` | **Join me** — host or confirmed participant invites another member (notification only; invitee still RSVPs / requests; host approval when required). Rate limit: **20 sends / activity / sender / 24h** (`ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY`) |
| * | `/publishing/activities/*` | CRUD, publish, history — FE: `tenantActivityClientApi` (`activities.ts` → `/publishing/…`) |
| POST | `/publishing/activities/:id/suspend` | Host soft-hide: `published` → `suspended` (off visitor map/search/browse; keep in workspace) |
| POST | `/publishing/activities/:id/resume` | Host restore: `suspended` → `published` |
| GET | `/publishing/activities/:id/participants` | Approved roster + flags (`registerPublishingActivityParticipantRoutes`) |
| POST/DELETE | `/publishing/activities/:id/participants/:participantId/checkin` | Confirm / undo attendance |
| POST | `/publishing/activities/:id/participants/:participantId/revoke` | Remove joiner (`hostNote` → notification) |
| POST | `/publishing/activities/:id/participants/:participantId/rating` | Host rates attended participant (after outing ends) |
| GET/PATCH | `/publishing/requests` | Activity join queue (`hostNote` on decide) |
| GET | `/me/status` | Member capabilities (`MemberStatusDTO`; **`publish`** nested; `medicalSafetyProfileComplete`) |
| GET/PUT | `/me/profile` | Own profile. Safety fields: `bloodGroup`, `medicalConditions`, `emergencyContactName`, `emergencyContactPhone`. `PATCH /me/profile/medical-safety` replaces that block. |
| GET/POST | `/me/vehicles` | Owner garage (`member_vehicles`). `PATCH/DELETE /me/vehicles/:id`. Public rideshare detail embeds `rideshareVehicle` without `plateNumber`. |

Storage: `activity_invites` (`COLLECTIONS.ACTIVITY_INVITES`) · indexes in `mongo-indexes.ts`.

---

## Detail surfaces — platform alerts & partner referrals

Registered on the **`/`** user router (`composeUserPublicRoutes` — before `requireAuth`).

| Method | Path | Who | Notes |
|--------|------|-----|--------|
| GET | `/alerts/active?lat=&lng=&radiusKm=&region=` | Public | Active safety / ops banners for consumer detail pages (rate-limited per IP + resource like other catalog reads). |
| GET / POST / PATCH | `/admin/alerts` | Platform admin | Create, list, update platform alerts. `POST /admin/alerts/:id/expire` ends a banner. |
| POST | `/facilities/:id/condition-reports` | Signed-in | Amenity working / not_working / unknown — queued for curator confirm. |
| GET / POST | `/admin/amenity-reports` | Platform admin | Review queue; `POST /admin/amenity-reports/:id/confirm` sets `amenityState`. |
| POST | `/referrals/click` | Public | Fire-and-forget partner link telemetry — body `{ entityKind: 'facility', entityId, destinationUrl, source? }`; **204**; `destinationUrl` must match `facilities.partnerReferralUrl`. |

## Geo search (`/geo`)

Place autocomplete and community rideshare destinations. Registered in `apps/api/src/routes/geo-search.ts` (`apiRouter.use('/geo')`). Optional auth. Place autocomplete is cached on the API for 60s; destination search caches the public half (outings + catalog places) for 20s and loads the caller’s draft places on each request.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/geo/search?q=` | Place autocomplete. Photon, then Nominatim, then Google Places when `GOOGLE_MAPS_API_KEY` is set and the free providers return nothing. |
| GET | `/geo/reverse?lat=&lng=` | Community and city for a consented point (`Al Barsha, Dubai`). The coordinates themselves are stored on the activity as `originLat` / `originLng` for later matching. |
| POST | `/geo/resolve` | `{ placeId }` or `{ query }` → one place row with coordinates. |
| GET | `/geo/rideshare-destinations?q=` | Parallel search: published outing **meeting** points (`meetingLat` / `meetingLng` / `meetingPoint`), active catalog places that have an area and a cover, and the caller’s draft place submissions. Rides are excluded. |
| POST | `/geo/rideshare-destinations/resolve` | `{ kind, id }` → one destination row by id (`activity_meeting` · `catalog_place` · `pending_place`). |
| GET | `/geo/tree` | Geographic hierarchy (country → emirate → area → venue). UUID node ids. Cache 5m. |
| GET | `/geo/counts?ids=` | Coalesced facility / place / activity counts for node ids. |
| GET | `/geo/resolve?lat=&lng=` | Pin → `geoRef` chain (distinct from POST `/geo/resolve` place autocomplete). |
| GET | `/geo/:id/summary` | Node summary + breadcrumbs + child counts. |
| GET | `/geo/:id/facilities` · `/geo/:id/places` · `/geo/:id/activities` | Cursor lists under a node (`geoRef.chain`). |
| POST | `/vitals` | Sampled web-vitals RUM. In-memory buffer; at most one Mongo batch insert per minute per instance. Never one document per vital. |

Explore map/list search: `GET /explore/map?q=&country=&area=&venue=` filters pins by `geoRef` names/tokens (and existing title text). `GET /places` accepts the same `q` / `country` / `area` / `venue` params.

Member catalog suggestions (always-review): `GET/POST /me/submissions*` · admin `GET /admin/submissions` · `POST /admin/submissions/:id/review`.

Community host publish stores the chosen row on the activity `requirements` lines (`Rideshare destination activity:` / `Rideshare destination place:` / `Rideshare pending destination place:`). Pro hosts may pin any map destination and skip this search.

---

## Buddies (`/me/friends`)

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/friends` | List accepted buddy relationships |
| POST | `/me/friend-requests/:id/accept` | Accept request — also upserts **mutual** `user_follows` (no follow notification) |
| GET | `/me/friends/activity-presence` | Buddies × **published activities** on explore map (hosting / participant previews). Query: `date` (explore date preset). |

Registration: `registerFriendRoutes.ts` · service: `friend-activity-presence.ts`.

Explore **people browse panel** (map; URL `view=people`; legacy `view=social` / `view=going`) uses **`GET /me/member-discovery/network`** (see below) — `activity-presence` remains for map-adjacent tooling. **Chat** is `/chat/*` and `/messages` — not these routes.

---

## Member people reads (browse)

**Bounded context:** `member_discovery` ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §3.2). Paths are **browse** (relationship + outing status), not messaging.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/member-discovery/network/preview` | Network avatars + counts for explore map people pill |
| GET | `/me/member-discovery/network` | **Network roster** — Friends / following. Query: `segment=all\|friends\|followed` (`normalizePeopleSegment`) |
| GET | `/me/member-discovery/browse` | Directory only (paginated public members) |
| GET | `/me/member-discovery/search` | User search (e.g. new chat) |
| GET | `/me/member-discovery/quota` | Free vs Pro profile-open quota |
| GET | `/explore/map?sources=availability` | **Looking for** — fixed crew availability pins (`source: availability`, `member_availability`) |

Registration: `registerMemberDiscoveryRoutes.ts` · `registerDiscoverCrewRoutes.ts` · `registerPublicPlaceRoutes.ts` (`GET /explore/map`) · `availability-fixed-map-items.ts`, `member-people-engagement.ts`, `member-discovery-roster.ts`, `discover-crew-feed.ts`.

---

## Discover layer reads

**Bounded context:** Discover platform layer ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) · `MIG-DISCOVER-RECOMMENDATIONS`). Matching is **engine-only** — no consumer `/matching` route.

| Method | Path | Who |
|--------|------|-----|
| GET | `/discover/crew` | Signed-in · federated **Find crew** feed (friends going, hosts, followed, directory, availability-on-map). Query: `q`, `date`, `omitDirectory`, pagination; `meta.quota`. |
| GET | `/discover/recommendations` | Ranked rows for a surface. Query: **`surface=map`** (`limit` 1–20) — **optionalAuth** (buddy + wishlist boosts when bearer). **`surface=crew`** — auth required (`limit`, `from`/`to`, `date`, `area`, `kind` aligned with availability browse). |

Registration: `registerDiscoverCrewRoutes.ts` (member router) · `registerDiscoverRecommendationsRoutes.ts` (public router · `optionalAuth`) · services `discover-crew-feed.ts`, `discover-map-recommendations.ts`, `discover-crew-recommendations.ts` · shared scorer `packages/shared-types` `map-explore-recommendation-score.ts`.

---

## Reviews (`social_reviews`)

| Method | Path | Who |
|--------|------|-----|
| GET | `/reviews` | Public list. Query: `targetType=location\|tenant\|activity\|user`, `targetId`, pagination |
| POST | `/reviews` | Signed-in · place, operator (`tenant`), person (`user`), or **activity**. Activity reviews, and a host review that sends `activityId`, require host check-in and a finished schedule (`activityInstantHasEnded` on the place `countryCode`). A person review requires `activityId`. An operator profile review omits it. |
| GET | `/me/reviews` | Signed-in member's reviews |
| PATCH | `/me/reviews/:id` | Edit own review |

Registration: `registerReviewRoutes.ts` on `userRouter` **before** `requireAuth` so `GET /reviews` stays public; writes keep per-route auth.

---

## Wishlist (`/me/wishlist`)

Private saves — **venue** (`locationId`) or **activity** (`activityId`) only. Mongo: `user_wishlist` (`COLLECTIONS.USER_WISHLIST`; migrated from `user_favorites`). Not demand, not member follows.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/wishlist` | List wishlist rows with hydrated place/activity labels |
| POST | `/me/wishlist` | Create (exactly one of `locationId`, `activityId`) |
| PATCH | `/me/wishlist/:id` | Toggle `alertOnMatch` for geographic/category alerts |
| DELETE | `/me/wishlist/:id` | Remove row |
| GET | `/me/wishlist/check` | Query `locationId` or `activityId` → `{ saved, wishlistItemId }` |

Registration: `registerMeWishlistRoutes.ts` · store: `wishlist-store.ts` · match notify: `services/matching/wishlist-match-notify.ts`. Hosted publish (`notifyWishlistForPublishedActivity`) notifies members who saved that catalog place (`locationId`, index `wishlist_locationId`) and members whose geographic/category watch matches the pin. Fixed availability save → `notifyWishlistForMemberAvailability`. Place name and host display name come from the stored place and profile; a missing place row skips the saved-place fan-out.

---

## Entity follow (`/me/entity-follows`)

Public **follow** for places, host brands, and shops — outing alerts when followed entities publish (not private wishlist).

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/entity-follows` | List follows with hydrated labels |
| POST | `/me/entity-follows` | Follow (`locationId` \| `tenantId` \| `merchantId`) |
| DELETE | `/me/entity-follows/:id` | Unfollow |
| GET | `/me/entity-follows/check` | Query one target → `{ following, followId }` |

Registration: `registerEntityFollowRoutes.ts` · store: `entity-follow-store.ts` · publish fan-out: `entity-publish-notifications.ts`.

---

## Member follow (`/me/following`)

**People** you follow for social graph and publish alerts — not entity follows (`/me/entity-follows`) or wishlist.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/following` | List followed members (summary rows) |
| POST | `/me/following/:userId` | Follow a member |
| DELETE | `/me/following/:userId` | Unfollow |
| GET | `/me/follow-state/:userId` | `{ isFollowing, canFollow }` |

Registration: `registerFollowRoutes.ts` · store: `follow-store.ts` (`user_follows`).

---

## Personal goals (`/me/goals`)

Time-bounded outdoor targets — progress from joined/hosted outings and visited map pins in the goal window. Mongo: `user_goals`. Not wishlist saves.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/goals` | List up to **3** concurrent goals (`MemberGoalDTO`) |
| POST | `/me/goals` | Create goal (`activityFilter`, `countMode`, `targetCount`, `targetDate`) |
| PATCH | `/me/goals/:id` | Update goal |
| DELETE | `/me/goals/:id` | Remove goal |
| GET | `/me/goals/active` | Legacy primary goal only |
| PUT | `/me/goals/active` | Legacy upsert primary |
| DELETE | `/me/goals/active` | Legacy clear primary |

Registration: `registerMeGoalsRoutes.ts` · store: `member-goals-store.ts`.

---

## Member journey map (`/me/journey-map`, `/me/map-pins`)

Personal visited / wishlist pins and composed journey entries — not Explore.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/journey-map` | Signed-in — `MemberJourneyMapDTO` (pins + outing entries) |
| POST | `/me/map-pins` | Create manual pin |
| PATCH | `/me/map-pins/:id` | Update pin |
| DELETE | `/me/map-pins/:id` | Remove pin |

Registration: `registerMeMapPinsRoutes.ts` · service: `member-journey-map.ts`.

---

## Account data export (`GET /me/export`)

JSON download of profile, join requests, participations, **wishlist** (venues + activities only), **entity follows**, **member following**, **goals**, **badges**, **journey map pins**, and push subscription count. Registration: `registerAccountLifecycleRoutes.ts` · `buildUserDataExport` in `data-export.ts`. Rate-limited (`sensitiveDataLimiter`).

---

## Member discovery (directory / quota)

See **Member people reads** above for the full `/me/member-discovery/*` table. Profile opens from Discover: `GET /member/:userId/profile?from=discover` (quota). Views: `member_profile_views` collection.

---

## Member status (`GET /me/status`)

Signed-in **member capabilities** — profile gates, **publish** workspace eligibility, role labels. **Publish is not its own route**; workspace fields live under **`publish`** only (root: `profileComplete`, `profileRoleLabel`). Resolved in `apps/api/src/services/member-status.ts` — do not re-derive tiers from `UserRole`.

| Field (subset) | Meaning |
|----------------|---------|
| `profileComplete` | Host/publish after `/welcome` (`signupProfileComplete` on `GET /me/profile` only) |
| `medicalSafetyProfileComplete` | Join/RSVP gate — blood group, conditions (or `N/A`), emergency contact. Incomplete profiles return `medical_safety_profile_required`. |
| `publish.canPublish` | May create/publish tenant activities |
| `publish.canAccessPublishingWorkspace` | May open operator desk (SPA `/operator/*`; HTTP `/publishing/*`); sole resolver `resolvePublishingWorkspaceAccess` |
| `publish.isPlatformStaff` | Platform operator shell — not community host tier |
| `publish.ownedProfiles` | Tenants member may publish as |
| `profileRoleLabel` | Display key for profile chrome |

Canonical client: `memberApi.getMemberStatus()` · `useMemberStatus()`. **Removed:** `/me/host-status`, `/me/operator-status` (use `/me/status` only).

Capability map: [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

---

## Pro membership apply (`/me/pro-application`)

**COH-03:** Canonical HTTP for Pro / agency / shop onboarding. UPL = **Pro membership**. Collection remains `host_applications` until optional rename.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/pro-application` | Signed-in member — latest application |
| POST | `/me/pro-application` | Submit Pro membership application |
| GET | `/admin/pro-applications` | Platform admin queue |
| PATCH | `/admin/pro-applications/:id` | Approve / reject |

Legacy aliases (do not use in new clients): `/me/host-application`, `/admin/host-applications`. SPA: `/profile/pro-membership`.

---

## Platform admin list routes (paginated)

Shared query: `page` (1-based), `pageSize` (cap varies by route). Responses use `paginatedResponse` (`data` + `meta.total`) unless noted.

| Method | Path | Registrar | Notes |
|--------|------|-----------|-------|
| GET | `/admin/activities/moderation` | `registerAdminActivityModerationRoutes` | Outing moderation queue |
| GET | `/admin/places` · `/admin/locations` | `registerAdminPlaceRoutes` | Catalog places (alias) |
| GET | `/admin/facilities` | `registerAdminFacilityRoutes` | Facility catalog |
| GET | `/admin/groups` | `registerAdminGroupRoutes` | Platform groups (+ filters) |
| GET | `/admin/pro-applications` | `registerAdminHostApplicationRoutes` | Pro / host application queue |
| GET | `/admin/users` | `registerAdminUserRoutes` | Member search (`search`, `role`, `status`, …) |
| GET | `/admin/reports` | `registerAdminContentReportRoutes` | Content reports (`reason`, `targetType`, date range) |
| GET | `/admin/audit-log` | `registerAdminAuditRoutes` | Audit trail (`action`, `entityType`, `actor`, date range) |

SPA tables: `AdminTablePager` + `adminConsoleApi` list helpers — load pages, not full tables.

---

## Platform admin tenants (`/admin/tenants/*`)

Registered in `registerAdminTenantRoutes.ts` — paginated list, detail, moderation, discover flags, publishing team (same team schemas as `/publishing/*`).

| Method | Path | Who |
|--------|------|-----|
| GET | `/admin/tenants` | Platform admin — paginated tenant list (`page`, `pageSize`) |
| GET | `/admin/tenants/:id` | Tenant detail for Operators console |
| PATCH | `/admin/tenants/:id/status` | Suspend / activate (`comment` required when suspending) |
| PATCH | `/admin/tenants/:id/hidden` | Hide tenant from public discovery |
| PATCH | `/admin/tenants/:id/discover-featured` | Discover featured flag |
| POST | `/admin/tenants/:id/team` | Add publishing team member |
| PATCH | `/admin/tenants/:id/team/:membershipId` | Patch team membership |
| DELETE | `/admin/tenants/:id/team/:membershipId` | Remove team member |

SPA: `/admin/hosts` → `pages/admin/Operators` (see [`NAVIGATION.md`](./NAVIGATION.md) § Admin route catalog).

---

## Program CPC — catalog HTTP (target)

**Tracker:** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.4. Shipped paths below marked **(today)** until phase lands.

| Method | Path | Who | Status |
|--------|------|-----|--------|
| GET | `/places/:id` | Public + `viewerAccess` | **(today)** |
| GET | `/places/registry` | Organize picker (legacy) | **(today)** |
| GET | `/places/catalog` | Places-only catalog (`segment=place`) | **(today)** |
| POST | `/me/places` | Member place submit | **(today)** canonical; `POST /me/locations` → **410** |
| GET | `/me/places` | My submitted places | **(today)** |
| GET | `/facilities` | Listed amenities (paginated) | **(today)** |
| GET | `/facilities/:id` | Public facility detail + `viewerAccess` | **(today)** — map `source: facility` |
| GET | `/facilities/catalog` | Map / admin filters (`destinationId`, `onSiteId`, `facilityKind`) | **(today)** |
| POST | `/me/facilities` | Member facility submit → `facilities` only | **(today)** |
| GET/PATCH/DELETE | `/admin/facilities` | Platform admin facility CRUD → `facilities` only | **(today)** |
| GET | `/destinations` | Public curated **Destinations** (MIG-DESTINATION-GEO) | **(today)** — same data as `/areas`; not a map pin |
| GET | `/destinations/:slug` | Destination hub payload (`destination` key) | **(today)** |
| GET | `/areas` | Legacy alias of `/destinations` | **Deprecated** — `Deprecation: true` + `Link` successor; same list payload |
| GET | `/areas/:slug` | Legacy alias (`area` key in JSON) | **Deprecated** — use `/destinations/:slug` (`destination` key) |
| GET | `/shop/shops/:id` | **Operator** shop storefront (`EntityKind.shop`) | **(today)** — not FAB Add |

**Surface model:** Public read, member submit (`/me/*`), and platform admin (`/admin/*`) are **separate registrars** — not one `/facilities` POST gated by profile. See [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §5.1 · §8.4.9.

**Provenance:** `registeredByUserId` on place/facility rows — not a `/contribute` route.

---

## Client facades (`src/api/domains`)

| Domain module | Routes |
|---------------|--------|
| `member.ts` | **`/me/status`** |
| `badges.ts` | **`/me/badges`** |
| `activities.ts` | `/activities`, `/me/requests`, `/publishing/activities`, `/publishing/requests` |
| `shop.ts` | `GET /shop/shops/:id` (public read). Shop desk manage: `registerPublishingShopStorefrontRoutes` on `/publishing/shop-profile` |
| `explore.ts` | `/explore/map` |
| `availability.ts` | **`/me/availability`** (+ match-preview) |
| `groups.ts`, `chat.ts` | Groups, DMs, inbox |
| `friends.ts` | `/me/friends`, `/me/following` |
| `wishlist.ts`, `entityFollow.ts`, `reviews.ts` | `/me/wishlist`, `/me/entity-follows`, `/reviews` |
| `places.ts` | `/me/places` (canonical); `GET /me/locations` read alias only |
| `facilities.ts` | `/me/facilities`, `/admin/facilities` |
| `operatorPublic.ts` | Pro application + public tenant profile reads (`/me/pro-application`, tenant slug) |
| `admin.ts` | `/admin/pro-applications` (alias `/admin/host-applications`) |

---

## UI component naming (related)

Manage sheets for demand should align with API (**`ParticipantIntent*`**, not `MemberDemand*`) and live under Trips/explore — see [`NAVIGATION.md`](./NAVIGATION.md) § `/plan` and [`COMMUNICATION.md`](./COMMUNICATION.md). **`src/components/activity/*`** is for **`/publishing/*`** and Plan **hosted** manage (`ActivityManageSheet`, **`ActivityParticipantsPanel`** for roster / check-in / revoke / rate).

Do **not** add `OrganisationActivity*` symbols or `*OrganisationActivity` client methods — one **Activity** model for community and business hosts; **organisation** naming is tenant storefront scope only ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Organisation in filenames). Member read-only attendance: **`ActivityParticipationStatus`** (not a host roster panel).
