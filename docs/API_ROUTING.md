# HTTP API routing conventions

**Branch:** `experiment-ui` · **Base path:** `/api/v1` (see `apps/api/src/routes/index.ts`).

Companion: [`DOMAIN.md`](./DOMAIN.md), [`experiment/explore-backend-alignment.md`](./experiment/explore-backend-alignment.md), [`CREATE_FLOW.md`](./CREATE_FLOW.md).

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

**Legacy:** `POST /host/participant-intents/:intentId/fulfill` — tenant-scoped link after publish; prefer **`link-activity`** on `/me` for the demand poster.

Registration: `registerMeParticipantIntentRoutes.ts` (not mixed with `/me/rewards`).

---

## Activities (organize)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/activities`, `/activities/:id` | Public browse / detail |
| POST | `/activities/:id/requests` | Request to join |
| POST | `/activities/:id/rsvp` | I'm going |
| GET/PATCH | `/me/requests` | Member’s activity requests |
| * | `/host/activities/*` | CRUD, publish, participants, check-in |
| GET/PATCH | `/host/requests` | Host queue for **activities** only |

---

## Client facades (`src/api/domains`)

| Domain module | Routes |
|---------------|--------|
| `activities.ts` | `/activities`, `/me/requests`, `/host/activities`, `/host/requests` |
| `explore.ts` | `/explore/map`, **`/me/participant-intents`** (+ requests, link-activity) |
| `social.ts`, `chat.ts` | Groups, DMs, inbox |
| `places.ts` | `/me/places` (canonical), `/me/locations` (legacy alias) |

Prefer **`exploreApi`** for demand; avoid `fulfillParticipantIntent` on host for poster-owned intents.

---

## UI component naming (related)

Manage sheets for demand should align with API (**`ParticipantIntent*`**, not `MemberDemand*`) and live under Trips/explore — see [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md). Host folder is for **`/host/*`** activity console only.
