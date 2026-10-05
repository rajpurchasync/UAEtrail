# HTTP API routing conventions

**Branch:** `main` · **Base path:** `/api/v1` (see `apps/api/src/routes/index.ts`).

Companion: [`DOMAIN.md`](./DOMAIN.md), [`CREATE_FLOW.md`](./CREATE_FLOW.md), [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

---

## Prefix rules

| Prefix | Auth | Purpose |
|--------|------|---------|
| **`/activities`** | Public read; write via `/host` | Published **Organize** outings (join, RSVP, detail) |
| **`/explore/map`** | Public | Discovery payload (activities, venues, shops, **demand**) |
| **`/me/*`** | Signed-in member | Own profile, intents, groups, inbox, activity participation |
| **`/host/*`** | Verified + **tenant** (`x-tenant-id`) | Organisation console: publish, check-in, **activity** join queue |
| **`/users/*`** | Optional auth | Public member profiles |
| **`/chat/*`**, **`/social/*`** | Auth | DMs, reviews, favorites |

**Naming**

- **Resource paths** use kebab-case plural nouns (`participant-intents`, not `intents` or `demand`).
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

---

## Participant intents (`/me/participant-intents`)

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/participant-intents` | List my intents |
| POST | `/me/participant-intents` | Create (Find flow) |
| PATCH | `/me/participant-intents/:intentId` | Update own active intent |
| POST | `/me/participant-intents/:intentId/cancel` | Remove from map |
| POST | `/me/participant-intents/:intentId/link-activity` | **Poster** links published activity (`convertedActivityId`) |
| POST | `/me/participant-intents/:intentId/requests` | Member asks to join |
| GET | `/me/participant-intents/:intentId/requests` | **Poster** lists requests |
| GET | `/me/participant-intents/:intentId/requests/mine` | Caller’s request on this intent |
| POST | `…/requests/:requestId/approve` \| `…/reject` | **Poster** decides |

**Legacy:** `POST /host/participant-intents/:intentId/fulfill` — deprecated (returns `Deprecation` header). Demand **posters** must use **`POST /me/participant-intents/:intentId/link-activity`**. Explore publish already calls `exploreApi.linkParticipantIntentToActivity`.

**Publish gate:** `POST /host/activities` and `POST /host/activities/:id/publish` require `signupProfileComplete` + `canPublish` (see `member-publish-gate.ts`), except platform admin acting on a tenant.

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
| GET | `/activities/:id/invites` | Pending **Join me** invitee ids the caller sent for this activity |
| POST | `/activities/:id/invites` | **Join me** — host or confirmed participant invites another member (notification only; invitee still RSVPs / requests; host approval when required). Rate limit: **20 sends / activity / sender / 24h** (`ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY`) |
| * | `/host/activities/*` | CRUD, publish, participants, check-in |
| GET/PATCH | `/host/requests` | Host queue for **activities** only |

Storage: `activity_invites` (`COLLECTIONS.ACTIVITY_INVITES`) · indexes in `mongo-indexes.ts`.

---

## Buddies (`/me/buddies`)

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/buddies` | List accepted buddy relationships |
| GET | `/me/buddies/activity-presence` | Buddies × **published activities** on explore map (hosting / participant previews). Query: `date` (explore date preset). |

Registration: `registerBuddyRoutes.ts` · service: `buddy-activity-presence.ts`.

Explore **Who's going** panel (UI) loads this for the **Buddies** segment — not a separate `/whos-going/*` API.

---

## Member discovery (Explore Discover segment)

| Method | Path | Who |
|--------|------|-----|
| GET | `/me/member-discovery-quota` | Free vs Pro profile-open quota |
| GET | `/me/member-discovery/roster` | Strangers on trips (`onTrips`) + public directory + `meta.quota`. Query: `date`, `q`, pagination |
| GET | `/users/browse` | Directory only (paginated public members; excludes self + buddies) |

Profile opens from Discover: `GET /users/:id/public-profile?from=discover` (quota). Registration: `registerMemberDiscoveryRoutes.ts` · roster: `member-discovery-roster.ts` · views: `member_profile_views` collection.

---

## Member host capabilities (`GET /me/host-status`)

Signed-in **member contract** for publish gates, host console access, and profile role labels. Resolved server-side in `apps/api/src/services/member-host-status.ts` — clients must not re-derive tiers from `UserRole`.

| Field (subset) | Meaning |
|----------------|---------|
| `signupProfileComplete` | Buddy **Organize** + demand allowed after `/welcome` |
| `canPublish` | Can open host publish APIs (community buddy tenant or business) |
| `canAccessHostConsole` | `/host/*` chrome (publish, messages, team) |
| `isCommunityHost` | **Host** label after first map activity or demand post |
| `hostTiers` | `community` \| `professional` \| `business` flags |
| `profileRoleLabel` | Display key for profile chrome |

Canonical frontend client: `memberApi.getMemberHostStatus()` (`src/api/domains/member.ts`). Legacy: `organisationApi.getMyOrganisationStatus`.

Capability map: [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) · `GET /me/host-status`.

---

## Client facades (`src/api/domains`)

| Domain module | Routes |
|---------------|--------|
| `member.ts` | **`/me/host-status`** |
| `badges.ts` | **`/me/badges`** |
| `activities.ts` | `/activities`, `/me/requests`, `/host/activities`, `/host/requests` |
| `explore.ts` | `/explore/map`, **`/me/participant-intents`** (+ requests, link-activity) |
| `social.ts`, `chat.ts` | Groups, DMs, inbox |
| `places.ts` | `/me/places` (canonical), `/me/locations` (legacy alias) |

Prefer **`exploreApi`** for demand; avoid `fulfillParticipantIntent` on host for poster-owned intents.

---

## UI component naming (related)

Manage sheets for demand should align with API (**`ParticipantIntent*`**, not `MemberDemand*`) and live under Trips/explore — see [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md). Host folder is for **`/host/*`** activity console only.
