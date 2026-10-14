# HTTP API routing conventions

**Branch:** `main` · **Base path:** `/api/v1` (see `apps/api/src/routes/index.ts`).

Companion: [`DOMAIN.md`](./DOMAIN.md), [`CREATE_FLOW.md`](./CREATE_FLOW.md), [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

---

## Prefix rules

| Prefix | Auth | Purpose |
|--------|------|---------|
| **`/activities`** | Public read; tenant write via `/operator` | Published **Organize** outings (join, RSVP, detail) |
| **`/explore/map`** | Public | Discovery payload (activities, venues, shops, **demand**) |
| **`/me/*`** | Signed-in member | Own profile, intents, groups, inbox, activity participation |
| **`/operator/*`** | Verified + **tenant** (`x-organisation-id`) | **Publishing console** (any tier): publish, roster, **activity** join queue |
| **`/host/*`** | Legacy (rewritten to `/operator/*`) | `Deprecation: true` + `Link` — no separate mount (`legacy-host-api-rewrite.ts`) |
| **`/users/*`** | Optional auth | Public member profiles |
| **`/chat/*`**, **`/social/*`** | Auth | DMs, reviews, people discovery |
| **`/admin/*`** | `PLATFORM_ADMIN` | Moderation, **Users** (`GET/PATCH /admin/users*`), tenants, metrics — `admin.ts` mounts `registerAdmin*` only |
| **`POST /admin/platform-admins`** | Master admin only | Grant `PLATFORM_ADMIN` to an existing member by email |
| **`DELETE /admin/platform-admins/:userId`** | Master admin only | Revoke platform staff (not master accounts) |

**Naming**

- **Resource paths** use kebab-case plural nouns (`participant-intents`, not `intents` or `demand`).
- **No tab or marketing names** on `/me/*` (`plan-needs-you`, `member-hub-stats` are forbidden — use capability names like `coordination-attention`, `profile-stats`). Presentation (`label`, consumer `path`) belongs in the SPA, not JSON.
- **DB collection** `participant_intents` → URL **`/me/participant-intents`** (product copy: *demand* / *Find*).
- **Type field** on intents: `kind` (`ParticipantIntentKind`) — parallels activity `activityType` / shared `outingCategory`.
- Do **not** add catch-all `/plans` or `/me/intents` (legacy plan doc paths are obsolete).

---

## Join requests: activities vs demand

**Demand** pins are always **public** on the map and use **approval-style join only** — no RSVP, no **I'm going**, no `participationMode` or `joinMode` on intents. Organize activities keep both modes.

Same product verb (**request to join**), two entities:

| Step | Published activity | Demand (`participant_intents`) |
|------|-------------------|----------------------------------|
| **Create request** | `POST /activities/:activityId/requests` | `POST /me/participant-intents/:intentId/requests` |
| **My status** | In activity detail `myRequest` | `GET …/requests/mine` |
| **Poster / host lists** | `GET /host/requests` (tenant) | `GET /me/participant-intents/:intentId/requests` (owner) |
| **Approve / reject** | `PATCH /host/requests/:id` | `POST …/requests/:requestId/approve` · `…/reject` |
| **Member list (outgoing)** | `GET /me/requests` | *(future: aggregate or trips)* |

Deprecated alias (do not use in new clients): `…/join-requests` mirrors `…/requests`.

Storage: `activity_requests` vs `participant_intent_requests`.

### M2 join unification (in progress)

| Step | Status | Behavior |
|------|--------|----------|
| **M1** | Shipped | Find post → `activities` row (`activityMode: seeking`, `participantIntentId`). |
| **M2a** | Superseded by M2c | Transitional dual-write (Oct 2026); replaced by single **`activity_requests`** store. |
| **M2b** | Shipped | `POST /activities/:id/requests` is canonical for seeking pins (mirrors `participant_intent_requests`); intent `POST` delegates to activity when **`activityId`** is set; `GET …/requests/mine` reads `activity_requests` when needed. |
| **M2c** | Shipped | Seeking joins read/write **`activity_requests`** only; `/me/participant-intents/…/requests` is an alias (no new `participant_intent_requests` when **`activityId`** is set). Legacy intents without **`activityId`** still use the intent collection. |

Clients may keep intent URLs until M2b; host queue for buddy seeking rows uses the mirrored `activity_requests` row.

| **M2d** | Shipped | After `backfill-seeking-activities`, Find writes only `activities` (`activityMode: seeking`). `/me/participant-intents/*` read-through via `activityId` / `participantIntentId`. **Default:** stub write **off**; set `PARTICIPANT_INTENT_STUB_WRITE=true` only for legacy dual-write rollback. |

---

## Participant intents (`/me/participant-intents`)

**Deprecation (M2d):** New clients should treat **`activityId`** on seeking rows as canonical (map pin, join, manage). These routes remain **compatibility aliases** over `activities` + `activity_requests` after `PARTICIPANT_INTENT_STUB_WRITE=false`. Do not add new product flows that depend on `participant_intents` persistence.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/participant-intents` | List my intents |
| POST | `/me/participant-intents` | Create (Find flow); **M1** also writes `activities` row (`activityMode: seeking`, `participantIntentId`). Response includes **`activityId`** (published map activity; `seekingActivityId` is a deprecated alias). |
| — | `npm run backfill-seeking-activities` | One-off **M1** backfill for active intents missing `seekingActivityId` (`--dry-run`, `--limit=N`) |
| — | `npm run seeking:storage-status` | Ops readiness report before flipping `PARTICIPANT_INTENT_STUB_WRITE=false` (`--strict` fails if backfill incomplete or stub write on) |
| PATCH | `/me/participant-intents/:intentId` | Update own active intent |
| POST | `/me/participant-intents/:intentId/cancel` | Remove from map |
| POST | `/me/participant-intents/:intentId/link-activity` | **Poster** links published activity (`convertedActivityId`) |
| POST | `/me/participant-intents/:intentId/requests` | Member asks to join |
| GET | `/me/participant-intents/:intentId/requests` | **Poster** lists requests |
| GET | `/me/participant-intents/:intentId/requests/mine` | Caller’s request on this intent |
| POST | `…/requests/:requestId/approve` \| `…/reject` | **Poster** decides |

**Legacy:** `POST /host/participant-intents/:intentId/fulfill` — deprecated (returns `Deprecation` header). Demand **posters** must use **`POST /me/participant-intents/:intentId/link-activity`**. Explore publish already calls `exploreApi.linkParticipantIntentToActivity`.

**Publish gate:** `POST /operator/activities` and `POST /operator/activities/:id/publish` (legacy `/host/*` rewritten) require `profileComplete` + `canPublish` (see `member-publish-gate.ts`), except platform admin acting on a tenant. **Join/participate** does not require profile completion.

**Consumer vs console:** Buddy **organize / manage joins** use **Plan** + `/activity/:id` + `/me/participant-intents/*` — not consumer bookmarks to legacy `/host/overview` (redirects to `/operator/overview`). **Tenant publishing HTTP** is **`/operator/*` only**; legacy `/host/*` is rewritten + deprecation headers (`legacy-host-api-rewrite.ts`).

Registration: `registerMeParticipantIntentRoutes.ts`.

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
| * | `/operator/activities/*` | CRUD, publish, history — canonical; `/host/activities/*` alias (`registerHostActivityRoutes`) — FE: `listHostActivities`, … (`activities.ts` → `/operator/…`) |
| GET | `/host/activities/:id/participants` | Approved roster + flags (`registerHostActivityParticipantRoutes`) |
| POST/DELETE | `/host/activities/:id/participants/:participantId/checkin` | Confirm / undo attendance |
| POST | `/host/activities/:id/participants/:participantId/revoke` | Remove joiner (note → notification) |
| POST | `/host/activities/:id/participants/:participantId/rating` | Host rates attended participant (after outing ends) |
| GET/PATCH | `/operator/requests` | Activity join queue (canonical); `/host/requests` alias |
| GET | `/me/status` | Member capabilities (`MemberStatusDTO`; **`publish`** nested); legacy `/me/host-status`, `/me/operator-status` |

Storage: `activity_invites` (`COLLECTIONS.ACTIVITY_INVITES`) · indexes in `mongo-indexes.ts`.

---

## Buddies (`/me/buddies`)

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/buddies` | List accepted buddy relationships |
| POST | `/me/buddy-requests/:id/accept` | Accept request — also upserts **mutual** `user_follows` (no follow notification) |
| GET | `/me/buddies/activity-presence` | Buddies × **published activities** on explore map (hosting / participant previews). Query: `date` (explore date preset). |

Registration: `registerBuddyRoutes.ts` · service: `buddy-activity-presence.ts`.

Explore **people browse panel** (map; URL `view=people`; legacy `view=social` / `view=going`) uses **`GET /social/people`** (see below) — `activity-presence` remains for map-adjacent tooling. **Chat** is `/chat/*` and `/messages` — not these routes.

---

## Member people reads (browse)

**Bounded context:** `member_discovery` ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §3.2). **Mount:** `/social` is historical; paths below are **browse** (relationship + outing status), not messaging.

| Method | Path | Who |
|--------|------|-----|
| GET | `/social/people/preview` | Network avatars + counts for explore map people pill (map-going faces merged on client from `GET /explore/map`) |
| GET | `/social/people` | **Network roster** — friends / following for map people panel. Query: `segment=all\|friends\|followed` |
| GET | `/me/member-discovery/roster` | **Discovery roster** — who’s going, hosts, looking-for **person rows**, followed, directory (`q`, `date`, `omitDirectory`, pagination); `meta.quota`. Same list component as `/list?listCat=people` (**Buddies**) |
| GET | `/explore/seeking-activities` | **Looking for outings** — published `activityMode: seeking` as `ExploreMapItemDTO[]` (same assembler as map; optional auth). People **Looking for** tab + list Buddies segment use this read, then client `activity-discovery` filters |

Registration: `registerSocialPeopleRoutes.ts` · `registerMemberDiscoveryRoutes.ts` · `registerPublicPlaceRoutes.ts` (`/explore/seeking-activities`) · services: `member-people-engagement.ts`, `member-discovery-roster.ts`, `explore-seeking-activities-read.ts`.

---

## Reviews (`social_reviews`)

| Method | Path | Who |
|--------|------|-----|
| GET | `/reviews` | Public list. Query: `targetType=location\|tenant\|activity`, `targetId`, pagination |
| POST | `/reviews` | Signed-in · place, host/shop, or **activity** (activity requires host check-in) |
| GET | `/me/reviews` | Signed-in member's reviews |
| PATCH | `/me/reviews/:id` | Edit own review |

Registration: `registerSocialReviewRoutes.ts` (mounted on root `socialRouter` in `routes/social.ts`).

---

## Wishlist (`/me/wishlist`)

Private saves — **venue** (`locationId`) or **activity** (`activityId`) only. Mongo: `user_favorites` (`COLLECTIONS.USER_WISHLIST`). Not demand, not member follows.

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/wishlist` | List wishlist rows with hydrated place/activity labels |
| POST | `/me/wishlist` | Create (exactly one of `locationId`, `activityId`) |
| PATCH | `/me/wishlist/:id` | Toggle `alertOnMatch` for geographic/category alerts |
| DELETE | `/me/wishlist/:id` | Remove row |
| GET | `/me/wishlist/check` | Query `locationId` or `activityId` → `{ saved, wishlistItemId }` |

Registration: `registerMeWishlistRoutes.ts` · store: `wishlist-store.ts` · match alerts: `wishlist-alerts.ts`.

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

JSON download of profile, join requests, participations, **wishlist**, **entity follows**, **member following**, **goals**, **badges**, **journey map pins**, shop orders, and push subscription count. Registration: `registerAccountLifecycleRoutes.ts` · `buildUserDataExport` in `data-export.ts`. Rate-limited (`sensitiveDataLimiter`).

---

## Member discovery (directory / quota)

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/member-discovery-quota` | Free vs Pro profile-open quota |
| GET | `/me/member-discovery/roster` | `friendsGoing`, `hostsGoing`, `seekingOnMap`, `followed`, paginated `directory`, `meta.quota`. Query: `date`, `q` |
| GET | `/users/browse` | Directory only (paginated public members; excludes self + buddies) |

Profile opens from Discover: `GET /users/:id/public-profile?from=discover` (quota). Registration: `registerMemberDiscoveryRoutes.ts` · roster: `member-discovery-roster.ts` · views: `member_profile_views` collection.

---

## Member status (`GET /me/status`)

Signed-in **member capabilities** — profile gates, **publish** workspace eligibility, role labels. **Publish is not its own route**; it is the **`publish`** object on this response (dual-read: same fields also appear flat for legacy clients). Resolved in `apps/api/src/services/member-status.ts` — do not re-derive tiers from `UserRole`.

| Field (subset) | Meaning |
|----------------|---------|
| `profileComplete` | **Organize/publish** after `/welcome` (legacy wire: `signupProfileComplete`) |
| `publish.canPublish` | May create/publish tenant activities |
| `publish.canAccessPublishingWorkspace` | May open publishing workspace (`/operator/*` UI) |
| `publish.ownedProfiles` | Tenants member may publish as |
| `profileRoleLabel` | Display key for profile chrome |

Canonical client: `memberApi.getMemberStatus()` · `useMemberStatus()`. Legacy routes: `/me/host-status`, `/me/operator-status` (`Deprecation` + `Link` → `/me/status`).

Capability map: [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

---

## Client facades (`src/api/domains`)

| Domain module | Routes |
|---------------|--------|
| `member.ts` | **`/me/status`** |
| `badges.ts` | **`/me/badges`** |
| `activities.ts` | `/activities`, `/me/requests`, `/host/activities`, `/host/requests` |
| `explore.ts` | `/explore/map`, **`/me/participant-intents`** (+ requests, link-activity) |
| `social.ts`, `chat.ts` | Groups, DMs, inbox |
| `places.ts` | `/me/places` (canonical), `/me/locations` (legacy alias) |

Prefer **`exploreApi`** for demand; avoid `fulfillParticipantIntent` on host for poster-owned intents.

---

## UI component naming (related)

Manage sheets for demand should align with API (**`ParticipantIntent*`**, not `MemberDemand*`) and live under Trips/explore — see [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md). **`src/components/activity/*`** is for **`/operator/*`** and Plan **hosted** manage (`ActivityManageSheet`, **`ActivityParticipantsPanel`** for roster / check-in / revoke / rate). Legacy import path `components/activity/*` is shim-only.

Do **not** add `OrganisationActivity*` symbols or `*OrganisationActivity` client methods — one **Activity** model for community and business hosts; **organisation** naming is tenant storefront scope only ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Organisation in filenames). Member read-only attendance: **`ActivityParticipationStatus`** (not a host roster panel).
