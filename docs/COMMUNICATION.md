# Communication & messaging

**North star:** Help people **connect and go together** — chat supports outings, not a separate social network.  
**Not in scope here:** Explore **people browse** (who’s going, Buddies list, map `view=people` panel, `/me/member-discovery/*` roster) — that is **member_discovery** / browse ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §3.2, [`NAVIGATION.md`](./NAVIGATION.md) § Browse — people & crew).  
**Navigation:** [`NAVIGATION.md`](./NAVIGATION.md) (routes) · **Plan / host manage:** [`NAVIGATION.md`](./NAVIGATION.md) § `/plan` (crew chat from manage surfaces) · **Domain:** [`DOMAIN.md`](./DOMAIN.md).

## Surfaces (where users chat)

| Surface | Route | What it is |
|---------|--------|------------|
| **Chat inbox** (UI label; route `/messages`) | `/messages` | **One inbox** for everyone: **Direct**, **Groups**, **Outing chats** — `?to=`, `?group=`, optional `?activity=` |
| **Groups admin** | `/groups` | Create/manage groups, members, **who can message** — **no inline chat** |
| **Activity detail** | `/activity/:id` | Plan/Buddies footers + welcome sheet → **group chat**; invite via `ActivityInviteLauncher`; crew only when `viewerAccess.canAccessCrewSurfaces` |
| **Plan (My Plans)** | `/plan` | Hosted manage sheet (`ActivityManageSheet`) → same detail shell + **Message crew**; joined peek sheet → full plan / group chat |
| **Explore** | `/explore` | Map peek **`viewerAccess.mapPeekActions`** (join, pending, participant, …); activity **host user** sees **Chat · Manage** + **View details** on own pins; shops use **`PeekDetailLink`** (View / Rate); cancel/delete via **`HostActivityCancelDialog`**; withdraw on activity detail only |

Legacy redirects only: `/host/messages`, `/operator/messages`, `/dashboard/messages` → `/messages` ([`NAVIGATION.md`](./NAVIGATION.md)). **Do not** add a second inbox route or host-only messages shell.

**Open DM affordance (FE):** `MessageMemberButton` (`src/components/chat/MessageMemberButton.tsx`) — `memberUserId` + optional `activityId`; contextual label via `messageLabel`. Not `HostMessageButton` / `OrganizerMessageButton` (deprecated shims).

## Two transports (by design today)

| Channel | Storage | Real-time | Unread |
|---------|---------|-----------|--------|
| **Direct messages** | `chat` messages (`/chat/*`) | SSE (`useChatStream`) | `GET /chat/conversations` |
| **Group / crew chat** | `social_group_wall` per group | SSE `group_wall_message` on `/chat/stream` + `GET .../wall?since=` fallback poll | `chatPreview.unreadCount` on `GET /me/groups` |

Do **not** merge transports in storage without a product decision — inbox already unifies **threads** in the UI.

## Frontend architecture (scalable)

| Layer | Canonical | Notes |
|--------|-----------|--------|
| **Route** | `MESSAGES_PATH` (`/messages`), `messagesToUserPath`, `messagesGroupPath` | Stable URLs — do not rename to `/chat` |
| **Product copy** | **Chat** | Tab label, headers (`NAVIGATION.md`) |
| **Feature entry** | `src/messaging` | `messagingApi`, `groupsApi` (group metadata), path helpers |
| **HTTP (app code)** | `messagingApi` | `direct.*` = DM; `crew.*` = group wall; inbox + stream ticket on root |
| **Wire impl** | `chatApi`, `groupsApi` in `src/api/domains/*` | Used only behind `messagingApi` / facade — not from pages |
| **Page** | `Messages.tsx` | Inbox + fullscreen `ChatThreadRouter` |
| **Thread UI** | `@/chat` (`src/components/chat`) | `ChatThreadRouter`, `ChatMessageBubble`, `useDirectChatThread` |

**Guards:** `src/messaging/clientGuard.test.ts` (CI) and ESLint `uaetrail/no-retired-messaging-api` — no `api.getInbox` / `api.sendMessage` / wall methods or deep `components/messages/*` imports in app code.

**Shared FE (DM + group wall):** `ChatThreadRouter` → `DirectChatThread` | `GroupChatThread`; `useDirectChatThread` (DM data); `ChatThreadShell`, `ChatThreadHeaderBar`, `useThreadReply`, `ChatReplyComposer`, `ChatMessageBody`, `MessageSwipeReplyShell` under `@/chat`. **Shared API:** `apps/api/src/lib/reply-preview.ts` for `replyToPreview` enrichment.

### Unified inbox

- **`GET /chat/inbox`** or **`GET /me/inbox`** — same payload: `{ direct: ChatConversationDTO[], groups: MemberInboxGroupDTO[] }` (preferred for Messages tab and nav badge).
- **Legacy:** `GET /chat/conversations` + `GET /me/groups` still work; new UI should use inbox endpoints above.

### Direct (`/chat`)

- **List:** `GET /chat/conversations` (subset of inbox `direct`)
- **Thread:** `GET /chat/messages/:userId` (paginated)
- **Send:** `POST /chat/messages` — body max **2000** chars; optional `replyToMessageId` (must be in the same 1:1 thread); returns **`replyToPreview`** when replying. Thread **GET** and SSE use the same enrichment. UI: swipe/long-press reply (no reactions on DMs).
- **Policy:** `assertCanMessageUser` + rate limit on send; thread read uses the same relationship rules (activity inquiry alone does not unlock **GET** without a lasting buddy/join link).
- **Policy detail:** `apps/api/src/services/chat-policy.ts` — buddies and/or shared activity / join-request context
- **Deep link:** `/messages?to=<userId>` optional `activity=<activityId>` for context banner

### Group wall (`/me/groups/.../wall`)

Used for **family/friends groups** and **activity crew** (`social_groups.type === 'activity'`).

- **List groups + inbox preview:** `GET /me/groups` → each row includes **`chatPreview`**: `{ lastMessageBody, lastMessageAt, unreadCount }`
- **Full thread (initial):** `GET /me/groups/:groupId/wall` (default limit 120, oldest→newest)
- **Incremental sync:** `GET /me/groups/:groupId/wall?since=<ISO8601>` (newer messages only)
- **Older history:** `GET /me/groups/:groupId/wall?beforeMessageId=<id>&limit=` (preferred) or `?before=<ISO8601>` — ascending batch; **`meta.hasMoreOlder`** when more exist. Only one of `since`, `before`, `beforeMessageId`.
- **Send:** `POST /me/groups/:groupId/wall` — body max **600** chars (plain text for new replies); optional `replyToMessageId` (validated in-group); returns enriched message (author, reactions, **`replyToPreview`** when replying). Wall **GET** / **SSE** include the same preview. Client still resolves quotes from the loaded thread when preview is absent. Legacy messages may use embedded `↩[id:…]` quote text in `body`.
- **Mark read:** `POST /me/groups/:groupId/wall/read` → `wallLastReadAt` on membership
- **Reactions:** `POST /me/groups/:groupId/wall/:messageId/reactions`
- **Post policy:** `wallPostPolicy`: `all_members` | `admins_only` — `PATCH /me/groups/:groupId`
- **Deep link:** `/messages?group=<groupId>`

Shared types: `GroupWallPostPolicy`, `SocialGroupChatPreviewDTO`, `GroupWallReplyPreviewDTO`, `groupWallBodySnippet` in `@uaetrail/shared-types`.

## Activity crew chat (Plan · detail · Explore ↔ Messages)

**One group per published activity** — not a second chat product.

| Concern | Implementation |
|---------|----------------|
| Create group | `ensureActivityGroupChat` on publish / organize (`activity-group-chat.ts`) |
| Auto-enroll | **RSVP** and **host-approved** joiners added to activity group (idempotent); welcome UI on detail (`?joined=1` after approve notification) |
| Roster | Host always in group; confirmed participants in crew surfaces when `canAccessCrewSurfaces` |
| Resolve id | `GET` activity group chat endpoints on activities domain; `groupChatId` on activity DTO when known |
| Open thread | `openActivityGroupChat()` → `navigateToActivityGroupChat()` → `/messages?group=` |
| Return after chat | `messagesReturnTo` router state — e.g. back to Plan manage sheet or `/activity/:id` |
| Closed chat | Server rejects wall post **1 week after** activity `startAt` |
| Pending joiners | No crew chat or meeting precision until **participant** (RSVP instant or approved request) |

**Activity crew post policy (§21 AD-6):** `ActivityDTO.groupChatPostPolicy` (`all_participants` \| `host_only`) syncs to the activity group `wallPostPolicy` (`all_members` \| `admins_only`); wall **POST** enforces via `canMemberPostToGroupWall` — participants may **read** when `host_only`. Host PATCH may set policy; organize/manage UI still open.

**Demand / seeking** activities use the same crew rules once the viewer is a confirmed participant on the linked hosted activity.

### Entry points

| User action | UI | Chat route |
|-------------|-----|------------|
| Plan → Hosted → manage sheet → Message crew | `ActivityManageSheet` | `/messages?group=` + return to `/plan` or detail |
| Activity detail → Buddies / Plan footer (joined) | `ActivityDetailView` | Same |
| Explore peek (participant/host) | `mapPeekActions` chat id | Same |
| Approve join notification | `meta.path` → `/activity/:id?joined=1` | Welcome sheet → group chat |

See [`NAVIGATION.md`](./NAVIGATION.md) § Activity detail and [`NAVIGATION.md`](./NAVIGATION.md) § `/plan` (manage lives on Plan + embedded detail).

## Invites vs chat

| Mechanism | Purpose |
|-----------|---------|
| **Share link** `/activity/:id` | Off-platform or guest view; Join free in-app |
| **DM with link** | `ActivityInviteLauncher` → `sendMessage` with activity context |
| **Group wall post** | Share message + URL to family/friends group |
| **Crew chat** | In-app thread for host + approved joiners only |
| **Join me** | `POST /activities/:id/invites` (`inviteeUserId` or `inviteeUserIds[]`) — host or going member → in-app notification (friend name + outing type + date) + `/explore?pin=activity:{id}&invite=1` (map peek banner). **Does not auto-join** — invitee uses RSVP / request flow; host approval where required. UI: `ActivityInviteLauncher` (link + multi-friend select); explore peek **Invite crew** opens the same sheet. **Host an outing** (`planWith` query) pre-selects buddy on publish success. |

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
| Direct chat thread | `DirectChatThread`, `useDirectChatThread` | `@/chat` |
| Crew chat thread | `GroupChatThread` via `ChatThreadRouter` | `@/chat` |
| Host activity manage | `useHostActivityManageActions` · `DELETE /host/activities/:id` via `api.cancelHostActivity` | `src/hooks/` |

## Trips / architecture rules

- **Plan** (`/plan`, `planHubRouting.ts`) owns **your** plans, hosted manage, and personal map — not chat APIs.
- Chat always goes through **Messages** + `/me/groups` / `/chat` — do not add `trips*Message` clients.
- **Explore** discovery stays on `/explore`; opening crew chat leaves the map and returns via `messagesReturnTo` when launched from Trips/host manage.

## Future (not shipped)

- Dedicated group-wall SSE channel (today: reuses `/chat/stream` + `group_wall_message` event)
- Optional per-activity `groupChatPolicy` (host-only vs full crew)

### Unified thread API (deferred — product decision)

**Today (intentional):** `GET /chat/inbox` unifies the **list**; **thread bodies** use two transports — `GET /chat/messages/:userId` (DM) and `GET /me/groups/:groupId/wall` (crew). The app hides this behind `messagingApi.direct` and `messagingApi.crew`.

**Not required for scale** while inbox + `messagingApi` + `@/chat` stay the FE contract.

**If product later wants one thread wire:** add a projection route (e.g. `GET /me/threads/:threadId/messages`) that routes internally to DM or wall — **without** merging `chat_messages` and `social_group_wall` storage unless explicitly approved. Pagination, reactions, and post policy must stay equivalent to today’s endpoints. Until then, do not add parallel “thread” CRUD in routes or clients.
