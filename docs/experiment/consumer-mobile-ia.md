# Consumer mobile IA (experiment-ui)

Companion to [`NAVIGATION.md`](../NAVIGATION.md). Tracks the profile / trips / friends refactor on `experiment-ui`.

## Bottom tabs (signed-in)

| Tab | Route | Label |
|-----|--------|--------|
| Map | `/explore` | Map |
| Trips | `/trips` (`/activities` redirects) | My trips |
| Messages | `/messages` | Messages |

Profile is reached from the header avatar (`/profile`), not a fourth tab.

Signed-in **Friends**, **Contributions**, **Groups**, **My badges**, and **My requests** keep the bottom tab bar visible (stack pages off Profile).

## Trips hub (`/trips`)

- Segments: **Upcoming** · **Past** · **Wishlist** (`?segment=`).
- Joined/hosted sub-views use `?tab=joined|hosted` and `?sub=` where applicable.
- **Map:** `explorePath({ myTrips: true, list: true })` → `/explore?myTrips=1&list=1` — pins from wishlist + joined/pending activities only.
- Legacy `/profile/wishlist` redirects to `/trips?segment=wishlist`.

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
