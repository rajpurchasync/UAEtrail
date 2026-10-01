# Consumer mobile IA (experiment-ui)

Companion to [`NAVIGATION.md`](../NAVIGATION.md). Tracks the profile / trips / friends refactor on `experiment-ui`.

**Phased redesign:** [`profile-and-trips-phases.md`](./profile-and-trips-phases.md) — **Phase 1** Profile hub first; **Phase 2** Trips hub + personal map (Nomadtable-style) after Phase 1 ships.

## Bottom tabs (signed-in)

| Tab | Route | Label |
|-----|--------|--------|
| Map | `/explore` | Map |
| Trips | `/trips` (`/activities` redirects) | My trips |
| Messages | `/messages` | Messages |

Profile is reached from the header avatar (`/profile`), not a fourth tab.

## Profile hub UX (`/profile`) — Phase 1

**Layout:** `ConsumerShell` `layout="tab"`, `suppressMobileHeader`, `maxWidth="4xl"` (matches Trips). Sticky filters/search live in shell `toolbar` on Trips only.

Consumer pattern (not Settings-style chevron lists on the hub):

- **Identity hero (~40dvh):** larger avatar + completion ring, name/meta, visibility; tappable **Followed by · Joined · Hosted**; header actions (view public left, share + edit right).
- **Quick launcher:** Lucide icon tiles (`glass-card-interactive`) — **Friends**, **Badges** (earned count), **Contributions**, **Settings**, **Hosting** (when applicable). No **Trips** / **Messages** (bottom tabs).
- **Bio & speaks:** **Edit profile** only (`/profile/edit`), not on the hub.
- **Member goal:** full warm card on Profile; **compact glass row** on **Trips → Upcoming**; editor uses shared **`ConsumerBottomSheet`** (warm header).
- **Sign out:** single row below goal (not in launcher).
- **Chrome:** unified mobile tab header title **Profile**.
- **Trail Points / rewards wallet:** removed from consumer IA. Legacy `/my-rewards`, `/trail-points`, `/rewards` redirect to **`/profile/badges`**; notification deep links normalize the same way.
- **Profile identity:** `glass-card` hero + Lucide actions (aligned with hub list rows / launcher).

## Personal goals

- **API:** `GET/PUT/DELETE /me/goals/active` — one active goal per member (`user_goals`).
- **Progress:** Checked-in outings in the calendar year; filter `hiking` | `camping` | `all_outings`.
- **UI:** Goal card on `/profile`; wishlist saves do **not** count.
- **Notifications:** Halfway + complete on check-in; optional behind-pace nudge when loading your goal (≤1×/28d).
- **Public profile:** `yearGoal` strip when the member has a current-year goal and full visibility.

Signed-in **Friends**, **Contributions**, **Groups**, **My badges**, **Notifications**, and **Join requests** use **`ConsumerShell` stack** (`maxWidth="4xl"`, back to Profile) and keep the bottom tab bar visible.

## Messages & groups (communication)

Canonical contract: [`../COMMUNICATION.md`](../COMMUNICATION.md) · routes in [`../NAVIGATION.md`](../NAVIGATION.md).

| Surface | Role |
|---------|------|
| **`/messages`** (tab) | Unified inbox: Direct · Groups · Outing chats; filters people / groups / outings |
| **`/groups`** | List/create/manage family & friends groups — **chat opens in Messages**, not inline |
| **`/host/messages`** | Same inbox UI for org hosts |

- **Trips** hosted/joined **Manage outing** → **Message crew** → `/messages?group=` (return state can point back to `/trips`).
- **Explore** activity peek / **Activity detail** → crew callout + invite panel (share link, DM, or group wall post).
- **Inbox previews** come from `GET /me/groups` `chatPreview` — do not fetch full walls per group for the list.

## Trips hub (`/trips`) — Phase 2 (in progress)

**Layout:** `ConsumerShell` tab + **toolbar** (map layer pills **Trips · Places · Shops**, search, outdoor map shortcut on Trips layer, segment + role chips, compact goal in scroll). Lists use **`ActivityHubListRow`** (hosted rows include actions menu).

- **Wishlist layers** (personal, not public map): **Trips** · **Places** · **Shops** (`?layer=`). Private saves + match alerts — **not** the same as Explore **Looking for** (public demand pins).
- **Segments (Trips layer only):** **Upcoming** · **Completed** · **Wishlist** (`?segment=`; legacy `past` → `completed`). Wishlist segment = saved **outings** only; places/shops use layer pills.
- **Looking for (demand)** stays on **`/explore`** — public participation (`participant_intents`). Not wishlist rows; Explore **Save** is disabled on demand cards. API rejects `participantIntentId` on `POST /me/favorites`.
- **Match notifications** (`wishlist_match`) are intent alerts only — they deep-link to the new public plan/demand pin; they do not mean demand was added to wishlist.

Canonical code comments: `src/trips/demandVsWishlist.ts`.
- **Role chips** (Upcoming & Completed): **Joined** · **Hosted** (hosts) · **My plans** (`?role=self`; legacy `tab=` normalized away).
- **Upcoming + Joined:** goal card + upcoming carousel + suggestions (no nested Past tab).
- **Completed + Joined:** attended outings only; **Hosted:** past hosted; **My plans:** demand intents via `GET /me/participant-intents` + `ParticipantIntentManageSheet` (no crew chat until organized).
- **Map:** `/trips/map` — personal outdoor map (pins + joined/hosted entries); not Explore.
- Legacy `/profile/wishlist` → `/trips?segment=wishlist`; starred **places** → `?layer=places`, **shops** → `?layer=shops`.

## Friends (`/buddies`)

- UI title **Friends**; tabs `?tab=friends|requests|following`.

## Follow (member profiles)

- One-way **Follow** alerts you when they **host/publish an outing** on the map — not when they post find-a-group demand pins.
- **Buddies** still receive notifications for both hosted activities and demand posts from friends.

## Profile settings stack

- `/profile/settings` — index
- `/profile/settings/account` · `/privacy` · `/notifications`
- `/profile/edit` — consumer edit (no DOB field)
- `/profile/badges` — earned + pipeline badges (no points wallet)

## Explicitly out of scope

- **Trip photo memories** — no per-trip photo uploads, galleries, or trip-scoped media collections. Past trips remain **list + map pins** only; avoids Mongo/S3 growth from user-generated trip albums until there is a clear retention and moderation story.
