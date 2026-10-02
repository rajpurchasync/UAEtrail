# Navigation contract

Companion to [`DOMAIN.md`](./DOMAIN.md) and [`NORTHSTAR.md`](./NORTHSTAR.md). Defines **where users go** for each intent. Routes stay stable; new links must follow this contract.

**Product intent:** Help people **find like-minded company outdoors** in the UAE & GCC — discover plans, connect, chat, go together. See north star for voice and audience (residents, expats, visitors; hikes, camps, runs, and more).

## Three surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Marketing** | `/` | First impression — story, trust, sign up (not live catalog) |
| **Browse** | `/explore` | Map-first discovery — activities, places, shops |
| **Personal hub** | `/profile`, `/profile/settings`, `/profile/edit`, `/trips` | Account hub, settings stack, trips (upcoming / past / wishlist) |
| **Mobile tabs (signed-in)** | `/explore`, `/trips`, `/messages` | Map · My trips · **Chat** bottom nav (`md:hidden`; route stays `/messages`); same bar on **`/profile`**, settings stack, **Friends**, **Contributions**, and related profile stack routes |
| **Entity detail** | `/trail`, `/camp`, `/event`, `/activity`, `/shop`, `/operator` | Single place, trip, or host |

### Profile hub (`/profile`)

- **Priority order:** Consumer hub (identity card + **stats row**, About you bio/speaks, **year goal**, plan **carousel**, launcher **tiles**) — not stacked settings menus. **Settings** via More sheet or `/profile/settings`.
- **Edit profile:** `/profile/edit` — name, gender, bio, speaks, location (no DOB edit on this screen).
- **Pull-to-refresh** reloads hub data at scroll top.
- **Sign out:** Profile hub (bottom) and Settings → Account.
- **Wishlist:** `/trips?segment=wishlist` (legacy `/profile/wishlist` redirects). Settings → **Saved map & alerts** links to the same segment.
- **Settings stack:** `/profile/settings` index → Account, Privacy, Notifications sub-routes; **iPhone & iPad** (`#ios-install`, Safari steps) and **Android** (`#android-install`, Samsung Internet / Chrome manual steps — no in-app install prompt).
- **Hamburger (header):** next to the notifications bell on tab chrome and desktop `Header` — Explore, My Trips, Messages, Profile/Signup, Download → Android / iOS (deep-link to the matching settings hash). Notifications are the bell only, not in the drawer.

### Trips (`/trips`)

- **Main tabs:** Plans · Completed · Map (`?view=plans|completed`; map at `/trips/map`). Legacy `segment` / `tab` query params normalize on load.
- **Plans:** goal card → **Upcoming** heading with All · Hosted · Joined · Wishlist pills (default `?role=all`; wishlist uses `segment=wishlist`). Hosted/Joined lists are **future** outings only.
- **Completed:** Joined · Hosted · Self (**My plans** / demand intents) — **past** outings (`?view=completed&role=`).
- **My trips map:** `/trips/map` (also the Map main tab).
- **`/activities`** redirects to `/trips` for bookmarks and old links.
- **Manage & crew chat:** Hosted/joined **Manage outing** sheets and explore host peek → **Message crew** opens **`/messages?group=<id>`** (not chat on `/trips`). Deep links: [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md). Full messaging contract: [`COMMUNICATION.md`](./COMMUNICATION.md).

### Host console (`/host/*`)

- **Shell nav:** `HOST_CONSOLE_LINKS` in the org console (overview, activities, join requests, places, team, messages, …) — primary way to reach host tools.
- **`/host/overview`:** Host stats, **Up next** preview, header **Add activity** — not a second copy of the shell link list. Below that: **personal** shortcuts (trips as participant, messages, explore map).
- **Member profile (`/profile`):** consumer hub only; hosts open **Hosting** → `/host/overview` (no host tool menu on profile).

### Friends (`/buddies`)

- Consumer label **Friends**; tabs `?tab=friends|requests|following`.

### Chat (`/messages`)

Canonical detail: **[`COMMUNICATION.md`](./COMMUNICATION.md)**.

- **Inbox:** Direct chats, **Groups** (family/friends), and **Outing chats** (activity crew) in one list; filters `people` / `groups` / `outings`.
- **Direct thread:** `/messages?to=<userId>` (optional `activity` context).
- **Group / crew thread:** `/messages?group=<groupId>` — all wall chat UI lives here (not on `/groups`).
- **Hosts:** same component at `/host/messages` (org shell); deep links still use `?group=` / `?to=`.
- **API:** prefer **`GET /chat/inbox`** (direct + groups with `chatPreview`); wall supports `?since=` and `POST .../wall/read`; optional `replyToMessageId` on wall POST.

### Groups (`/groups`)

- **List + manage:** create family/friends groups, members, invites, kids, **who can message** (wall post policy).
- **Chat:** tap **Message** → `/messages?group=<id>` (single chat surface).

### Community (`/community`)

- **Secondary surface** (desktop nav link) — Q&A, activity reports, tips; **not** the product home (`/explore` is).
- **Mobile:** route redirects to `/` (marketing); use explore + profile hubs for day-to-day discovery.
- **Constants:** `COMMUNITY_PATH` in `src/config/surfacePaths.ts` (re-exported from `routingCatalog`).

### Post-auth member details (`/welcome`)

After sign-up, sign-in, or OTP verify, **participants** and **shop members** (`merchant_admin`) with incomplete profile fields are sent to **`/welcome`** — **finish signing up**, not “confirm profile”.

| Step | Field | Stored on |
|------|--------|-----------|
| 1 | Date of birth | `profile.dateOfBirth` |
| 2 | Gender | `profile.gender` |
| 3 | Where you're based (country) | `profile.countryCode` |

**Languages** are added later from **Profile → Edit profile** or Settings → Member details (`PATCH /me/profile`), not during `/welcome`.

- One question per screen; saves on **Finish** via `PATCH /me/profile/signup-details`.
- After **Finish** → **`/explore`** (optional map location prompt). No host/invite chooser.
- First explore visit may prompt **center map on you**; default map view is **upper UAE** until GPS is allowed.
- **Edit anytime:** Profile → Edit profile, or Settings → **Member details** (same fields).
- **`ProtectedRoute`** blocks other routes until complete (except `/welcome`).
- **Demo accounts:** `visitor@` / `shop@` skip the gate after reseed; `visitor2@` is intentionally incomplete for wizard QA.

### Home (`/`) — marketing only

Full spec: **[`LANDING.md`](./LANDING.md)** · Voice: **[`NORTHSTAR.md`](./NORTHSTAR.md)**.

- **Guests only** — signed-in users redirect to `/explore` (`src/pages/Home.tsx`).
- **Not the product home** — members always land on and live on `/explore`.
- **Goal:** convert visitors via **Open Map** (primary button) and **Join free** (underlined text link); post-auth → `/explore`.
- **Guest hero:** headline + subline + **Open Map** + **Join free** link. Desktop header: Log in pill.
- **Scroll order** (matches `Home.tsx`):
  1. Hero (`HomeMobileLaunch` / `HomeDesktopHero`)
  2. Proof strip (`HomeProofStrip`)
  3. Live activity rail (`HomeLiveActivityRail` — public API + fallback)
  4. Value props (`HomeValueProps`)
  5. How it works (`HomeDayTimeline`)
  6. Product preview (`HomeProductPreview` — conditional; hidden on mobile when live rail is healthy)
  7. Testimonials (`HomeTestimonials`)
  8. FAQ preview (2 on mobile)
  9. Closing CTA (`HomeMarketingClose`)
  10. Founder story (`HomeFounderStory` — desktop; hidden on mobile)
- **Do not add** demand posting, become-host, buddies, shops, or full map UX to Home — those belong on `/explore` or in-app.
- **Copy:** `src/content/homeLanding.ts`. **Components:** `src/components/home/*`.

Legacy browse URLs (`/map`, `/discovery`, `/calendar`, bare `/activities` as browse) redirect via `App.tsx` — do not link to them from new UI. **`/activities` → `/trips`** is the personal hub exception.

## Source of truth (code)

| Intent | Helper | File |
|--------|--------|------|
| Explore URLs | `explorePath()`, `exploreActivitiesPath()`, `explorePlacesPath()`, `exploreShopsPath()` | `src/explore/routing.ts` · import via `config/routingCatalog` in app code |
| Back from detail | `detailBackPath(kind)` | `src/explore/routing.ts` |
| My activities hub | `myActivitiesPath('joined' \| 'hosted')` | `src/explore/routing.ts` |
| Fulfill participant intent (return from auth) | `explorePath({ fulfillIntent })`, `exploreFulfillIntentReturnPath()` | `src/explore/routing.ts` |
| Platform nav constants | `EXPLORE_MAP_PATH`, `joinAuthPath()` | `src/config/platform.ts` |
| Sign-in with return | `buildSignInRedirect(location)`, `signInPathForReturn(path)` | `src/utils/authReturnContext.ts` |
| Post-auth fallback | `resolveAuthExitFallback()` → explore | `src/utils/authRedirect.ts` |
| Trips hub URLs | `tripsPlansPath()`, `parseTripsSegment`, … | `src/trips/tripsRouting.ts` |
| Crew chat deep link | `activityGroupChatPath()`, `navigateToActivityGroupChat()` | `src/utils/activityGroupChatNav.ts` |
| Open crew chat from activity id | `openActivityGroupChat()` | `src/utils/openActivityGroupChat.ts` |
| Notification → route | `resolveNotificationPath()` | `src/utils/notificationRouting.ts` |

## Browse defaults

- **Desktop (`lg+`):** browse **list panel open** by default (`list=1` synced to URL). Mobile: map-first (`list=0` unless opened).
- **Map framing:** upper-UAE overview (zoom ~8); optional GPS / **Locate** recenters at the same regional zoom (not street-level).
- Landing on `/explore` without `list` → desktop opens list; mobile stays map-only.
- **Mobile map filters:** horizontal scroll — All · Hiking · Camping · Rideshare · Activities · Shops (no “More” sheet).
- **Guest join:** tapping Join on an activity opens a signup sheet (returns to map after auth).
- First map visit shows a 3-step coach (localStorage `uaetrail:explore-coach-seen`); guest join banner appears after coach is dismissed.
- Pass `list: true` to `explorePath()` only when opening the browse sheet intentionally.
- **My trips map:** `explorePath({ myTrips: true, list: true })` sets `myTrips=1` and filters pins to the signed-in member’s wishlist + joined/pending activities.
- Filter/panel query params select map context; they do not imply list mode.
- **Others drill-down (Activities tab):** `filter=others` → optional `subtype=events|activities`; when `subtype=activities`, optional `outingTopic` (`climbing`, `trail_run`, `workshop`, `community`, …). Helpers: `explorePath({ filter: 'others', subtype: 'activities', outingTopic: 'climbing' })`.

## Explore FAB (+)

Full spec: **[`CREATE_FLOW.md`](./CREATE_FLOW.md)**.

Signed-in members tap **+** on `/explore` to compose. **Guests** → sign-in, then return to explore.

### Level 1 — `I would like to…`

| Choice | Wizard |
|--------|--------|
| **Organize** | Host publish (`CreateActivityFlow`) — requires approved host |
| **Find** | Demand post (`CreateDemandFlow`) — any signed-in member |
| **Add** | Place catalog (`CreateContributeFlow`) |

### Level 2 sub-options (same sheet, back navigation)

| Branch | Options |
|--------|---------|
| Organize | Hiking · Camping · Event · Activity |
| Find | Rideshare · Hiking · Camping · Activities |
| Add | Camping Spots · Hiking Trails · Shops · Others |

**Organize → Activity:** generic buddy flow — free-text “what” (run, jog, …); **no** hike/camp sub-picker. See CREATE_FLOW § Organize → Activity.

**Going from:** required map pin on all Organize and Find **activity** flows; Add uses place location pin only.

**Components:** `CreateIntentSheet.tsx`, `ExploreExperience.tsx` (compose URL via `parseExploreCompose`).

## Back navigation

| Entity | `detailBackPath()` kind | Destination |
|--------|-------------------------|-------------|
| Activity | `'activity'` | `/explore` (activities) |
| Trail | `'trail'` | `/explore?panel=venues&filter=hiking` |
| Camp | `'camp'` | `/explore?panel=venues&filter=camping` |
| Event venue | `'event'` | `/explore?panel=venues&filter=others` |
| Shop | `'shop'` | `/explore?panel=shops&filter=shops` |
| Host profile | `'host'` | `/explore` |
| Generic / 404 | `'explore'` | `/explore` |

## Legacy redirects (`App.tsx`)

Canonical paths only in **new UI**. Legacy URLs redirect in `src/App.tsx` — do not add new links to these.

| Legacy path | Redirect target | Removal target |
|-------------|-----------------|----------------|
| `/map` | `/explore` | 2026-Q4 |
| `/discovery` | `/explore` (+ param transform) | 2026-Q4 |
| `/calendar` | `/explore` | 2026-Q4 |
| `/shop` (bare) | `/explore?panel=shops` | 2026-Q4 |
| `/activities` (any) | `/trips` (preserves query; `create=*` → explore compose) | 2026-Q4 |
| `/rewards`, `/my-rewards`, `/trail-points` | `/profile/badges` | 2026-Q4 (Trail Points wallet removed; badges kept) |
| `/membership` | `/explore` (`Membership.tsx`; not product home) | 2026-Q4 or fold |
| `/organizer/*` | `/host/*` | 2026-Q4 |
| `/become-organizer` | `/become-host` | 2026-Q4 |
| `/become-host` | `/profile/pro-membership` | 2026-Q4 (Pro / agency / shop; buddy Organize uses `/welcome` + `canPublish`) |
| `/dashboard/*` | role-based redirect | 2026-Q4 |
| `/admin/organizers` | `/admin/hosts` | 2026-Q4 |
| `/admin/locations` | `/admin/places` | 2026-Q4 |
| `/host/locations` | `/host/places` | 2026-Q4 |
| `/event-spot/:id`, `/community-activity/:id` | `/event/:id` | 2026-Q4 |
| `/merchant/:id` | legacy merchant page | TBD |
| `/sign-up`, `/sign-in` | auth aliases | keep |

Personal hub canonical route: **`/trips`** (`TRIPS_PATH`). Legacy `/activities` redirects to `/trips` in `App.tsx`.

## Mobile tab shell (signed-in, `md:hidden`)

| Tab | Route | Chrome |
|-----|-------|--------|
| **Explore** | `/explore` | Unified tab header (avatar · brand · notifications) |
| **Trips** | `/trips` | Plans · Completed · Map (`tripsRouting.ts`) |
| **Messages** | `/messages` | Same header (avatar · title · compose); search + pills below |
| **Profile** | `/profile` (avatar in header on other tabs) | Profile hub / settings stack |

- One mobile header component in Layout for all four bottom-nav roots; sub-routes (e.g. `/profile/settings`, message threads) use their own back chrome.
- User groups and activity outing chats appear in Messages inbox (Groups / Outings pills).

## Auth redirects

- Gated actions → always `buildSignInRedirect()` or `signInPathForReturn(returnPath)`.
- Never bare `/signin` when the user should return to the current page or action.
- Participants without a redirect → `EXPLORE_MAP_PATH` after sign-in.

## Copy

User-facing label for map browse: **Explore** (nav, drawer, CTAs). Internal URL panel name `venues` stays in query strings only.

## Connections QA (local / staging seed)

Buddy, follow, and group flows for manual QA use demo users from the main seed.

| Command | When |
|---------|------|
| `cd apps/api && SEED_DATA=true npm run seed` | Full reset + `seedConnectionsDemo` (with demo users) |
| `cd apps/api && SEED_CONNECTIONS=true npm run seed` | Refresh buddy/follow data only (demo users must already exist) |

**Primary tester:** `visitor@uaetrails.app` / `Visitor@12345` (see root `README.md`).

After seed, the API logs a **Connections QA** playbook (buddies, incoming/outgoing requests, follow notifications, friends group). UI entry points:

| Scenario | Where |
|----------|--------|
| Accept / decline incoming | `/buddies`, `/member/:id` |
| Cancel outgoing pending | `/buddies` (Sent), `/member/:id` (Cancel request) |
| Unfriend | `/buddies`, member profile |
| Follow alerts | Notifications → **Connections** |
| Leave friends/family group | `/groups` → **Leave group** (non-owner members) |

API integration coverage: `apps/api/tests/connections-flow.test.ts`.

## Adding new links

1. Pick the surface (browse / personal / detail).
2. Use helpers from `src/explore/routing.ts` (or `routingCatalog`) — no raw `/explore?…` strings outside those modules and `platform.ts`.
3. Detail pages pass `backTo={detailBackPath('…')}` unless a tighter parent context exists.
