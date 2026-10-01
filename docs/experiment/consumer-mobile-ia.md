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

Consumer pattern (not Settings-style chevron lists on the hub):

- **Identity hero (~40dvh):** larger avatar + completion ring, name/meta, visibility; tappable **Followed by · Joined · Hosted**; header actions (view public left, share + edit right).
- **Quick launcher:** emoji + label grid — **Friends**, **Badges** (earned count), **Contributions**, **Settings**, **Hosting** (when applicable). No **Trips** / **Messages** (bottom tabs).
- **Bio & speaks:** **Edit profile** only (`/profile/edit`), not on the hub.
- **Member goal:** summary card on Profile; same editor on **Trips → Upcoming** (primary context for progress).
- **Sign out:** single row below goal (not in launcher).
- **Chrome:** unified mobile tab header title **Profile**.
- **Trail Points / rewards hub:** not part of profile IA for now (`/my-rewards` may remain for legacy links only).

## Personal goals

- **API:** `GET/PUT/DELETE /me/goals/active` — one active goal per member (`user_goals`).
- **Progress:** Checked-in outings in the calendar year; filter `hiking` | `camping` | `all_outings`.
- **UI:** Goal card on `/profile`; wishlist saves do **not** count.
- **Notifications:** Halfway + complete on check-in; optional behind-pace nudge when loading your goal (≤1×/28d).
- **Public profile:** `yearGoal` strip when the member has a current-year goal and full visibility.

Signed-in **Friends**, **Contributions**, **Groups**, **My badges**, and **My requests** keep the bottom tab bar visible (stack pages off Profile).

## Trips hub (`/trips`) — Phase 2 (in progress)

- **Segments (scroll):** **Upcoming** · **Completed** · **Wishlist** (`?segment=`; legacy `past` → `completed`).
- **Role chips** (Upcoming & Completed): **Joined** · **Hosted** (hosts) · **Self** (`?role=`; legacy `tab=` normalized away).
- **Upcoming + Joined:** goal card + upcoming carousel + suggestions (no nested Past tab).
- **Completed + Joined:** attended outings only; **Hosted:** past hosted; **Self:** placeholder until demand API.
- **Map:** `/trips/map` (stub → explore my-trips until dedicated map ships).
- Legacy `/profile/wishlist` → `/trips?segment=wishlist`.

## Friends (`/buddies`)

- UI title **Friends**; tabs `?tab=friends|requests|following`.

## Follow (member profiles)

- One-way **Follow** alerts you when they **host/publish an outing** on the map — not when they post find-a-group demand pins.
- **Buddies** still receive notifications for both hosted activities and demand posts from friends.

## Profile settings stack

- `/profile/settings` — index
- `/profile/settings/account` · `/privacy` · `/notifications`
- `/profile/edit` — consumer edit (no DOB field)
- `/profile/badges` — redirects to Trail Points with badges sheet open (`/my-rewards?panel=badges`)

## Explicitly out of scope

- **Trip photo memories** — no per-trip photo uploads, galleries, or trip-scoped media collections. Past trips remain **list + map pins** only; avoids Mongo/S3 growth from user-generated trip albums until there is a clear retention and moderation story.
