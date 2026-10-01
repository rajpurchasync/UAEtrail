# Communication & messaging

**North star:** Help people **connect and go together** — chat supports outings, not a separate social network.  
**Navigation:** [`NAVIGATION.md`](./NAVIGATION.md) (routes) · **Trips / host:** [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md) (crew chat from manage surfaces) · **Domain:** [`DOMAIN.md`](./DOMAIN.md).

## Surfaces (where users chat)

| Surface | Route | What it is |
|---------|--------|------------|
| **Messages inbox** | `/messages` | One inbox: **Direct**, **Groups** (family/friends), **Outing chats** (activity crew) |
| **Host org inbox** | `/host/messages` | Same `Messages` UI in host shell; same `?to=` / `?group=` deep links |
| **Groups admin** | `/groups` | Create/manage groups, members, **who can message** — **no inline chat** |
| **Activity detail** | `/activity/:id` | Crew callout (join/open chat), invite share panel |
| **Trips** | `/trips` | Hosted/joined manage sheets → **Message crew** → `/messages?group=` |
| **Explore** | `/explore` | Peek sheet → host/joiner actions → crew chat or DM per policy |

Legacy: `/dashboard/messages` may still exist for older host console paths — prefer `/messages` and `/host/messages` for new UI.

## Two transports (by design today)

| Channel | Storage | Real-time | Unread |
|---------|---------|-----------|--------|
| **Direct messages** | `chat` messages (`/chat/*`) | SSE (`useChatStream`) | `GET /chat/conversations` |
| **Group / crew chat** | `social_group_wall` per group | SSE `group_wall_message` on `/chat/stream` + `GET .../wall?since=` fallback poll | `chatPreview.unreadCount` on `GET /me/groups` |

Do **not** merge these in the UI without a product decision — inbox already unifies **threads**; backend stays dual until a single inbox API exists.

### Direct (`/chat`)

- **List:** `GET /chat/conversations`
- **Thread:** `GET /chat/messages/:userId` (paginated)
- **Send:** `POST /chat/messages` — body max **2000** chars; `assertCanMessageUser` + rate limit
- **Policy:** `apps/api/src/services/chat-policy.ts` — buddies and/or shared activity / join-request context
- **Deep link:** `/messages?to=<userId>` optional `activity=<activityId>` for context banner

### Group wall (`/me/groups/.../wall`)

Used for **family/friends groups** and **activity crew** (`social_groups.type === 'activity'`).

- **List groups + inbox preview:** `GET /me/groups` → each row includes **`chatPreview`**: `{ lastMessageBody, lastMessageAt, unreadCount }`
- **Full thread (initial):** `GET /me/groups/:groupId/wall` (default limit 120, oldest→newest)
- **Incremental sync:** `GET /me/groups/:groupId/wall?since=<ISO8601>`
- **Send:** `POST /me/groups/:groupId/wall` — body max **600** chars; returns enriched message (author + reactions)
- **Mark read:** `POST /me/groups/:groupId/wall/read` → `wallLastReadAt` on membership
- **Reactions:** `POST /me/groups/:groupId/wall/:messageId/reactions`
- **Post policy:** `wallPostPolicy`: `all_members` | `admins_only` — `PATCH /me/groups/:groupId`
- **Deep link:** `/messages?group=<groupId>`

Shared types: `GroupWallPostPolicy`, `SocialGroupChatPreviewDTO` in `@uaetrail/shared-types`.

## Activity crew chat (Trips ↔ Explore ↔ Messages)

**One group per published activity** — not a second chat product.

| Concern | Implementation |
|---------|----------------|
| Create group | `ensureActivityGroupChat` on publish / organize (`activity-group-chat.ts`) |
| Roster | Host + **confirmed** participants synced on join approve (`syncActivityGroupChatRoster`) |
| Resolve id | `GET` activity group chat endpoints on activities domain; `groupChatId` on activity DTO when known |
| Open thread | `openActivityGroupChat()` → `navigateToActivityGroupChat()` → `/messages?group=` |
| Return after chat | `messagesReturnTo` router state — e.g. back to Trips manage sheet |
| Closed chat | Server rejects wall post **1 week after** activity `startAt` |
| Pending joiners | Join **request note** only — no crew chat until **approved** |

**Demand / “My plans”** intents do **not** get an activity crew chat until converted to an organized activity.

### Trips entry points

| User action | UI | Chat route |
|-------------|-----|------------|
| Hosted → Manage outing → Message crew | `HostActivityManageSheet` | `/messages?group=` + return to `/trips?...` |
| Joined → row actions | Trips lists / `ActivityInviteSharePanel` | Same |
| Check-in / roster | Manage sheet | Chat separate from roster |

See [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md) for manage capabilities and deep links (`peek=`, `checkin=`).

## Invites vs chat

| Mechanism | Purpose |
|-----------|---------|
| **Share link** `/activity/:id` | Off-platform or guest view; Join free in-app |
| **DM with link** | `ActivityInviteSharePanel` → `sendMessage` with activity context |
| **Group wall post** | Share message + URL to family/friends group |
| **Crew chat** | In-app thread for host + approved joiners only |

Inviting does not add someone to crew chat; **join approval** (or host roster rules) does.

## Notifications

| Kind | Typical title | Deep link |
|------|---------------|-----------|
| `message` | New message | `/messages?to=<senderId>` |
| `group_message` | New message in {group} | `/messages?group=<groupId>` |

Routing: `src/utils/notificationRouting.ts` — keep in sync with [`NAVIGATION.md`](./NAVIGATION.md).

## Frontend source of truth (code)

| Intent | Helper | File |
|--------|--------|------|
| Crew chat path | `activityGroupChatPath`, `navigateToActivityGroupChat` | `src/utils/activityGroupChatNav.ts` |
| Resolve + open crew chat | `openActivityGroupChat` | `src/utils/openActivityGroupChat.ts` |
| Inbox threads | `groupThreadFromSocialGroup`, `loadGroupThreadPreviews` | `src/utils/inboxThreads.ts` |
| Inbox preview text | `formatWallInboxPreview` | `src/utils/wallMessagePreview.ts` |
| Wall post policy (client) | `canMemberPostToGroupWall` | `src/utils/groupWallPostPolicy.ts` |
| Wall post policy (server) | `canMemberPostToGroupWall` | `apps/api/src/lib/group-wall-policy.ts` |
| Crew chat UI | `GroupWallThreadPanel` | `src/components/messages/` |
| Host actions | `useOrganisationActivityHostActions.openGroupChat` | `src/hooks/` |

## Trips / architecture rules

- **Trips** (`/trips`, `tripsRouting.ts`) owns **your** plans, hosted manage, and personal map — not chat APIs.
- Chat always goes through **Messages** + `/me/groups` / `/chat` — do not add `trips*Message` clients.
- **Explore** discovery stays on `/explore`; opening crew chat leaves the map and returns via `messagesReturnTo` when launched from Trips/host manage.

## Future (not shipped)

- Unified `GET /me/inbox` (direct + group previews in one call)
- Dedicated group-wall SSE channel (today: reuses `/chat/stream` + `group_wall_message` event)
- Server-side `replyToMessageId` for wall threads (today: plain-text quote in body)
- Optional per-activity `groupChatPolicy` (host-only vs full crew)
