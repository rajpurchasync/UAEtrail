# Navigation contract

Companion to [`DOMAIN.md`](./DOMAIN.md) and [`NORTHSTAR.md`](./NORTHSTAR.md). Defines **where users go** for each intent. Routes stay stable; new links must follow this contract.

**Product intent:** Help people **find like-minded company outdoors** in the UAE & GCC — discover plans, connect, chat, go together. See north star for voice and audience (residents, expats, visitors; hikes, camps, runs, and more).

## Three surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Marketing** | `/` | First impression — story, trust, sign up (not live catalog) |
| **Browse** | `/explore` | Map-first discovery — activities (`activity-discovery`), places/shops (`places-discovery`), people (`people-discovery`); map/list/search are projections |
| **List discovery** | `/list` | Full-screen poster/list browse (same filters as explore; `listDiscoveryPath()` ↔ map via `exploreMapPathFromListSearch()`) |
| **Personal hub** | `/profile`, `/profile/settings`, `/profile/edit`, `/profile/history` | Account hub, settings stack, outing **history** + journey map |
| **Plan tab** | `/plan` | Active layer — goals, upcoming outings (bottom nav middle tab; UI label **My Plans** — `PRODUCT_PLAN_SURFACE_TITLE`) |
| **Mobile tabs (signed-in)** | `/explore`, `/plan`, `/chat` | **Three tabs only** — **Explore** · **My Plans** · **Chat** (`md:hidden`). **No List tab.** Map-aligned list from the **List** pill (`list=1`); discover browse from hamburger **Browse** (`browse=1`) or optional full-screen `/list` (`listDiscoveryPathFromExploreSearch()`), not bottom nav. **Facebook / Instagram / WhatsApp** icon row above tabs (`src/config/socialLinks.ts`); same bar on **`/profile`**, settings stack, **Friends**, **Contributions**, and related profile stack routes |
| **Mobile tabs (guests)** | `/explore`, `/plan`, `/chat` | Same three tabs; **Explore** is the live map. **My Plans** and **Chat** show `GuestTabPlaceholder` + sign-in (`App.tsx` `PlanBrowseRoute`, `MessagesGate`) — not a second marketing home. **Profile** is not a tab; guests reach account flows via sign-in CTAs. |
| **Entity detail** | `/trail`, `/camp`, `/venue`, `/activity`, `/shop`, `/guide`, `/agency`, `/partner`, `/area/:slug` | Place, scheduled outing, shop, brand profile, or curated **area** hub |

### Profile hub (`/profile`)

- **Priority order:** Consumer hub (identity card + **stats row**, About you bio/speaks, **Goals teaser** → Plan **Wishlist** (`planWishlistTabPath()` / `tab=wishlist`), launcher **tiles**) — not stacked settings menus. **Settings** via More sheet or `/profile/settings`.
- **Badges:** `/profile/badges` — earned badges + share (`ProfileBadges.tsx`); launcher tile + badge-earn notifications → `PROFILE_BADGES_PATH`. Legacy `/rewards`, `/trail-points` redirect here. **Not** on Plan.
- **Submissions (target CPC-6):** `/profile/submissions` — places and facilities you submitted + link to **Reviews** (`/profile/reviews`). **`/contributions`** redirects here. Launcher tile; back stack → Profile. **Contribute** on Explore FAB is the create path; inventory lives here, not the Plan tab.
- **Contributions (today):** `/contributions` — same as above until CPC-6 redirect.
- **Edit profile:** `/profile/edit` — name, gender, bio, speaks, location (no DOB edit on this screen).
- **Pull-to-refresh** reloads hub data at scroll top.
- **Sign out:** Profile hub (bottom) and Settings → Account.
- **Outing history + map:** `/profile/history` — joined / hosted / self **past** outings; **History · My Map** tabs (`PROFILE_HISTORY_MAIN_TABS`). Journey map at `/profile/history/map`. Legacy `/profile/my-trips` redirects; `/trips`, `/trips/map`, `/activities` → `/plan` or history via `resolveLegacyTripsHubRedirect`.
- **Saved (wishlist):** `/plan?view=plans&tab=wishlist` (`planWishlistTabPath()` / `planSavedPath()`). Legacy `lens=saved|goals` and `/profile/wishlist` normalize on load. Profile shows a teaser only — not a second full list ([`experiment/member-surfaces-implementation-plan.md`](./experiment/member-surfaces-implementation-plan.md) D13).
- **Settings stack:** `/profile/settings` index → Account, Privacy, Notifications sub-routes; **iPhone & iPad** (`#ios-install`, Safari steps) and **Android** (`#android-install`, Samsung Internet / Chrome manual steps — no in-app install prompt).
- **Hamburger (header):** next to the notifications bell on tab chrome and desktop `Header` — Explore, **My Plans**, Messages, Profile/Signup, Download → Android / iOS (deep-link to the matching settings hash). Notifications are the bell only, not in the drawer.
- **View public card (eye):** opens `/member/:userId` — preview should match what **other signed-in members** see (`public` visibility), not the owner’s full hub (API P3).
- **Pro membership:** `/profile/pro-membership` — Individual, Business (subtype required), or Partner paths ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)).

### Member profile (`/member/:userId`)

- **Person** surface (member card or trusted view) — not the business **storefront** (`/guide/:slug`, `/agency/:slug`, `/shop/:id`). Link from Who’s going, buddies, activity rosters.
- **Guests:** sign-in prompt; no public member card (policy P3). **Signed-in** viewers follow `profileVisibility` ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Profile visibility).

### Plan (`/plan`)

- **Bottom nav middle tab** — UI label **My Plans**; route **`/plan`** (`PLAN_PATH`) — not `/me/plans` (API) or `/profile/plans` (alias redirect only).
- **Forward commitments** only — past outings → **`/profile/history`** · journey map → **`/profile/history/map`**.
- **Canonical query** (new links; legacy still parses): `view=plans` · `tab=upcoming|wishlist` · `filter=hosting|joined` · `layout=list|calendar` · `lens=availability` (availability editor stays on Plan — `planAvailabilityPath()` — not Profile settings). Helpers: **`src/plan/planRouting.ts`**.
- **Mobile chrome** (`src/plan/planTab.ts`): **Upcoming** · **Wishlist**; goals on Wishlist. Legacy `?lens=saved|goals|calendar` normalizes on load.
- **`/profile/plans`** → **`/plan`**. **`/trips`**, **`/activities`** → `/plan` or history (`legacyTripsRedirect.ts`).

#### “Plan” disambiguation

| Term | Meaning |
|------|---------|
| **My Plans** (tab) | **`/plan`** — upcoming, wishlist, goals, availability |
| **Host · Find crew · Add** (FAB) | Explore **`?compose=`** — not the Plan tab |
| **Activity detail Plan** | Outing facts on L3 — not **`/plan`** |
| **`GET /me/*`** | API prefix — not the My Plans page URL |

### Outing history (`/profile/history`)

- **Profile inventory** — past joined / hosted / self outings (`?view=completed&role=`); journey map at `/profile/history/map`. `?view=plans` redirects to `/plan`.
- **Main tabs (list surface):** History · My Map (`PROFILE_HISTORY_MAIN_TABS`).
- **Manage & crew chat:** Hosted/joined **Manage outing** sheets and explore map peek **`open_crew_chat`** → **`/chat?group=<id>`**. See [`experiment/member-surfaces-implementation-plan.md`](./experiment/member-surfaces-implementation-plan.md) and [`COMMUNICATION.md`](./COMMUNICATION.md).

### Publishing console (`/operator/*` routes)

- **Canonical URL `/operator/*`** — product UI uses **Organizer workspace** (community / guide) or **Operator workspace** (agency / shop); capabilities from **`GET /me/status`** (`useMemberStatus`, `publish.*`). Legacy `/host/*` and `/organizer/*` redirect to `/operator/*`. Tenant HTTP API: **`/operator/*` only** (legacy `/host/*` rewritten server-side).
- **Shell nav:** `OPERATOR_CONSOLE_LINKS` + `ConsoleShell` (`src/console/*`); route pages in `src/pages/operator/*`. Copy: `src/content/workspaceVocabulary.ts`.
- **`/operator/overview`:** `ConsoleHubSections` — stats, **Up next** preview, header **Add activity** — not a second copy of the shell link list. Below that: **personal** shortcuts (trips as participant, **Chat** → `/chat`, explore map).
- **Member profile (`/profile`):** consumer hub only; buddies open **Organizing** → `planHostedSchedulePath()` (hosted filter on `/plan`), not `/operator/overview`. Pro/agency/shop management remains `/operator/*`.

### Admin console (`/admin/*`)

- **Audience:** `platform_admin` only (`ProtectedRoute`); signed-in members use `/explore`, not `/`.
- **Shell nav:** `ADMIN_LINKS` in `src/constants/index.ts` — desktop sidebar + mobile admin drawer (`DashboardLayout`, `MobileMenu`).
- **Staff provisioning API:** `POST /admin/platform-admins`, `DELETE /admin/platform-admins/:userId` — not self-serve signup.
- **Out of consumer methodology:** admin tables use `adminApi` + `DashboardLayout` — not discovery card VM, map peek, or entity tab footers (`SYSTEM_COHERENCE` §6.2.6). Guard: `adminSurfacesAcceptance.test.ts`.

#### Platform admin route catalog (S13-W9)

| Route | Page module | Sidebar (`ADMIN_LINKS`) | Job |
|-------|-------------|-------------------------|-----|
| `/admin/overview` | `AdminOverview` | Overview | Metrics + shortcuts |
| `/admin/areas` | `AdminAreas` | Areas | Curated area registry |
| `/admin/places` | `AdminPlaces` | Places | Trails, camps, event venues (`/admin/locations` → redirect) |
| `/admin/activities` | `AdminActivities` | Activities | Outing moderation |
| `/admin/facilities` | `AdminPlaces` (`catalogSegment=facility`) | Facilities | Amenity POIs (parking, toilet, …) — same `locations` rows |
| `/admin/users` | `AdminMembers` | Users & Members | Member search, suspend, staff grant (`MEMBER_MODEL.md`) |
| `/admin/hosts` | `AdminOrganisations` | Operators | Host / tenant applications (`/admin/organizers` → redirect) |
| `/admin/groups` | `AdminGroups` | Groups | Platform groups |
| `/admin/shop` | `AdminShop` | Shop | Shop catalog ops |
| `/admin/reports` | `AdminReports` | Reports | Content reports queue |
| `/admin/audit-log` | `AdminAuditLog` | Audit Log | Audit trail |
| `/admin/settings` | `AdminSettings` | Broadcast | Platform broadcast / settings |
| `/admin/notifications` | `AdminNotifications` | — (deep link / ops only) | Notification ops |
| `/admin/login` | `SignIn` | — | Staff sign-in entry |

### Friends (`/buddies`)

- Consumer label **Friends**; tabs `?tab=friends|requests|following`.
- **Explore map people panel → Followed:** sub-segments **People** (member follows), **Places** and **Organizers & shops** (entity follows from map/profile); URL `followedKind=places|events`. (Panel URL `view=people`; legacy `view=social` — browse people, not chat; see § Browse — people & crew below.) Private **wishlist** saves live on **Plan → Saved** (`planSavedPath()`; `/profile/wishlist` redirects).

### Chat (`/chat`)

Canonical detail: **[`COMMUNICATION.md`](./COMMUNICATION.md)**. Legacy `/messages` redirects here.

- **Inbox:** Direct chats, **Groups** (family/friends), and **Outing chats** (activity crew) in one list; filters `people` / `groups` / `outings`.
- **Direct thread:** `/chat?to=<userId>` (optional `activity` context).
- **Group / crew thread:** `/chat?group=<groupId>` (optional `activity=<activityId>` for outing crew) — all wall chat UI lives here (not on `/groups`).
- **Legacy `/host/messages` and `/operator/messages`:** redirect to `/chat` (one inbox). Notification meta normalizes to `/chat` with the same query params.
- **API:** prefer **`GET /chat/inbox`** (direct + groups with `chatPreview`); wall supports `?since=` and `POST .../wall/read`; optional `replyToMessageId` on wall POST.

### Groups (`/groups`)

- **List + manage:** create family/friends groups, members, invites, kids, **who can message** (wall post policy). Manage deep links use `groupsManagePath()` (`?group=&tab=members|manage`).
- **Chat:** tap **Message** → `/chat?group=<id>` (single chat surface).

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
- **Scroll order** (matches `Home.tsx`, v2 sections in `src/components/home/v2/sections/`):
  1. Hero carousel (`HomeHeroSection` — includes trust chips)
  2. Upcoming outings (`HomeActivitiesSection` — public API + curated fallback)
  3. How it works (`HomeHowItWorksSection`)
  4. Reviews + FAQ (`HomeReviewsFaqSection`)
- **Do not add** demand posting, become-host, buddies, shops, or full map UX to Home — those belong on `/explore` or in-app.
- **Copy:** `src/content/homeMarketing.ts` · fallback cards: `homeLanding.ts` · **Components:** `src/components/home/v2/**`
- **Layout:** Guest `/` uses a minimal wrapper in `Layout.tsx` (main + deferred site footer only). Signed-in product chrome (`ProductShell`: header, bottom nav, compose rail) loads only on non-marketing routes.

Legacy browse URLs (`/map`, `/discovery`, `/calendar`, bare `/activities` as browse) redirect via `App.tsx` — do not link to them from new UI. Legacy **`/trips`**, **`/activities`**, **`/trips/map`** redirect to **`/plan`**, **`/profile/history`**, or **`/profile/history/map`** (`legacyTripsRedirect.ts`) — canonical active hub is **`/plan`**.

## Source of truth (code)

| Intent | Helper | File |
|--------|--------|------|
| Explore URLs | `explorePath()`, `exploreActivitiesPath()`, `explorePlacesPath()`, `exploreShopsPath()` | `src/explore/routing.ts` · import via `config/routingCatalog` in app code |
| Back from detail | `detailBackPath(kind)` | `src/explore/routing.ts` |
| My activities hub | `myActivitiesPath('joined' \| 'hosted')` | `src/explore/routing.ts` |
| Fulfill participant intent (return from auth) | `explorePath({ fulfillIntent })`, `exploreFulfillIntentReturnPath()` | `src/explore/routing.ts` |
| Platform nav constants | `EXPLORE_MAP_PATH`, `EXPLORE_DISCOVER_BROWSE_PATH`, `joinAuthPath()` | `src/config/platform.ts` |
| Discover browse on explore | `exploreDiscoverBrowsePath()` | `src/explore/routing.ts` |
| Sign-in with return | `buildSignInRedirect(location)`, `signInPathForReturn(path)` | `src/utils/authReturnContext.ts` |
| Post-auth fallback | `resolveAuthExitFallback()` → explore | `src/utils/authRedirect.ts` |
| Plan + history URL helpers | `planUpcomingPath`, `normalizePlanHubSearchParams`, `profileHistoryCompletedPath`, … | Import **`config/routingCatalog`** in app code; implement in `src/plan/planRouting.ts` + `src/member-plan/planHubRouting.ts` |
| List discovery URLs | `listDiscoveryPath()`, `listDiscoveryPathFromExploreSearch()` | `src/list/routing.ts` |
| Crew chat deep link | `activityGroupChatPath()`, `navigateToActivityGroupChat()` | `src/utils/activityGroupChatNav.ts` |
| Open crew chat from activity id | `openActivityGroupChat()` | `src/utils/openActivityGroupChat.ts` |
| Notification → route | `resolveNotificationPath()` | `src/utils/notificationRouting.ts` |

## Browse defaults

**Routing model:** One discovery feed (`/explore` + query; optional full-screen `/list`) over `GET /explore/map`. Category pills (Trips, Spots, Shops, topics) are **filters in the URL**, not `/hiking` or `/shops` path segments. Shareable records use **entity** routes (`/activity/:id`, `/trail/:id`, …). Detail: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §4.1 · [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §4.1.

- **Desktop (`lg+`):** **map-aligned list** panel open by default (`list=1`). Mobile: map-first (`list=0` unless List pill).
- **Map framing:** upper-UAE overview (zoom ~8); optional GPS / **Locate** recenters at the same regional zoom (not street-level).
- Landing on `/explore` without `list` → desktop opens map list; mobile stays map-only.
- **Mobile map list:** **List** pill (`list=1`, `ExploreBrowsePanel`) — Activities/Places tabs, search, calendar/filter, topic pills, compact rows.
- **Discover browse:** hamburger / desktop header **Browse** → `/explore?browse=1` (`EXPLORE_DISCOVER_BROWSE_PATH`) or `/list` full screen — `ListDiscoveryExperience`. **Desktop:** opens in the **right** aside (like **People** / Social); **map list** stays on the **left** (`list=1` can coexist with `browse=1`). Mobile: full-screen sheet over the map (mutually exclusive with list). Embedded discover exposes **Full screen browse** → `listDiscoveryPathFromExploreSearch()`. Do not add `/list` to `MOBILE_BOTTOM_NAV_TAB_PATHS`.
- **Mobile map filters:** horizontal scroll — All · Hiking · Camping · Rideshare · Activities · Shops (no “More” sheet).
- **Guest join:** tapping Join on an activity opens a signup sheet (returns to map after auth).
- First map visit shows a 3-step coach (localStorage `uaetrail:explore-coach-seen`); guest join banner appears after coach is dismissed.
- Pass `list: true` to `explorePath()` only when opening the browse sheet intentionally.
- **My plan on map:** `explorePath({ myPlan: true, list: true })` sets `myPlan=1` (legacy `myTrips=1` still parses) and filters pins to the signed-in member’s wishlist + joined/pending **activities**.
- Filter/panel query params select map context; they do not imply list mode.
- **Others drill-down (Activities tab):** `filter=others` → optional `subtype=events|activities`; when `subtype=activities`, optional `outingTopic` (`climbing`, `trail_run`, `workshop`, `community`, …). Helpers: `explorePath({ filter: 'others', subtype: 'activities', outingTopic: 'climbing' })`.

## Browse — people & crew (Explore map panel)

**Job:** who can I go with, who’s going, who’s looking — **not** chat. Chat is [`/messages`](#chat-messages) ([`COMMUNICATION.md`](./COMMUNICATION.md)).

Map pill label **Find your crew** (see `explorePeopleBrowseCopy.ts`); opens `view=people` on desktop (`peopleBrowseOpen`; mobile `listMode=people`; legacy `view=social` / `view=going` still parse). Query `peopleTab=looking|available|going|connect` (default **looking** omitted in URL; legacy `socialTab`, `all`→`connect`, `friends`→`going`, `discover`→`available`). Panel title **Find your crew** — list **Buddies** (`listCat=people`, URL `buddies=` mirrors `peopleTab`). **Looking for** tab is public (published seeking activities); other tabs → sign-in when needed.

| Segment (`peopleTab`) | Label | Data / actions |
|-----------------------|-------|----------------|
| `looking` | Looking for | Published **`activities`** (`activityMode: seeking`) from **`GET /explore/map`** — same `ExploreListRow` as Activities list; not member availability. |
| `available` | Free | `GET /explore/people/availability` — members who marked days + kinds; edit yours on Plan → **Available** (`planAvailabilityPath()`). |
| `going` | Friends | `GET /me/member-discovery/roster` + social trip hints — buddies with upcoming outings. |
| `connect` | Everyone | Directory from `GET /users/browse` / roster; **3** directory rows preview free, then Pro lock; profile opens count toward **3 unique profiles / 30d** (`MEMBER_DISCOVERY_QUOTA_LIMIT`). |

Cards show city, outings attended, and a subtle upcoming trip hint (link opens activity on map). **Friends → Plan a trip** opens compose (`explorePlanWithBuddyPath`). Profile quick launcher: **People** (this panel), **Friends** (`/buddies`), **Messages** (chat). **Join me** on activity detail (`ActivityInviteSharePanel`). APIs: [`API_ROUTING.md`](./API_ROUTING.md) § Member people reads (browse).

## Explore FAB (+)

**Shipped (CPC v3):** **Host** · **Find crew** · **Add on map** — see [`CREATE_FLOW.md`](./CREATE_FLOW.md). **Not** the bottom nav **My Plans** tab (`/plan`). Domain lens: **What** (Host / fixed seek → activity) · **Where** (Add → place/facility) · **Who** / **How** on detail only — [`DOMAIN.md`](./DOMAIN.md) § What · Where · Who · How.

Signed-in members tap **+** on `/explore` (or list FAB) to compose. **Guests** → sign-in, then return to explore.

| Choice | Opens |
|--------|--------|
| **Host** | `hostingFlowEngine` / per-kind hosting wizards |
| **Find crew** | Fixed map seek (`seekingFlowEngine`) or **Share availability** (`member_availability`) |
| **Add on map** | Place or facility submit |

Legacy compose URLs (`plan:*:hosting|seeking`, `organize:*`, `find:*`, `contribute:*`, `add:*`) still parse as aliases.

**Going from:** required map pin on **Host** / **Find crew (fixed)** activity flows; **Add on map** uses place/facility pin only.

**Components:** `CreateIntentSheet.tsx`, `ExploreExperience.tsx` (compose URL via `parseExploreCompose`).

## Activity detail (`/activity/:id`)

**Public consumer page (scroll layout):** **Back** · **Share** (hero on mobile, banner on desktop) · cover when present. **Published outing** = same L1 discovery projection as map peek (`buildActivityDetailPageShellCard` → `ActivityDiscoveryPublishedBody` — when/where lines, requirement chips, price). **Hero block:** date · title · venue link. **Host** row · **participants** (policy) · **meeting point** (crew only) · **Transport** strip (accessible by from organize capture · rideshare available · host **Offer rideshare** when entitled). **CTAs:** wire `mapPeekActions` — **mobile** floating footer · **desktop** row under banner (top-right). No Plan/Place/Buddies/Transport tabs on the public route. Wire/API: `activity`, `viewerAccess`, `presentation` — [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.

**Layering (same pattern as place):** one URL, thin kind files — not one mega `ActivityDetailView` per route.

| Layer | Activity | Place (reference) |
|-------|----------|-------------------|
| Loader | `ActivityDetail.tsx` | `PlaceDetailPage.tsx` |
| Kind pick | `ActivityDetailByKind` | `HikingPlaceDetailPage`, … |
| L3 shell | `*ActivityDetailPage` → `ActivityDetailPageShell` | `*PlaceDetailPage` → `PlaceDetailPageShell` |
| Scroll body | `ActivityConsumerDetailBody` | `PlaceConsumerDetailPage` (scroll; no public tab bar) |

Public scroll slots come from **`GET /activities/:id` → `presentation.consumerLayout`** (same policy pass as embed `tabs`). Legacy `?tab=` scrolls via `activityDetailConsumerAnchors` — no public tab bar. **Embed only:** `ActivityManageSheet` / host preview use tabbed `ActivityDetailView` (`layout=embedded`). Catalog places: `/trail`, `/camp`, `/venue`; areas: `AreaDetailPage`.

**Place detail (`/trail` · `/camp` · `/venue`):** Same modal chrome as activity (`ActivityConsumerDetailModalShell`) — **Back** · kind label · **Share** (header). Registry rows without `images[0]` are excluded from map/registry queries and return **404** on `GET /places/:id` when active (draft preview by submitter still allowed). **Hero image:** region · area · title. **Sections:** kind facts · ratings · about · **Transport** · scheduled activities · **Nearby facilities** (`nearbyFacilities` from `GET /places/:id` + `facility:` / `nearby:` tags) · reviews. **Footer:** **Arrange trip** only. Premium guide on consumer scroll via **`PlacePremiumGuidePanel`** (shared with legacy **`PlaceDetailTabs`** guide tab). **Map peek:** `PlacePeekHero` · kind facts · ratings · scheduled · **Arrange trip** + **View details**.

**Pin summaries (map projection):** `ActivityPeekCard` · `PlacePeekCard` compose shared **`MapPeekShell`** chrome (`MapPeekOverlay` on map); **View details** → consumer detail templates above. “Explore” is the `/explore` surface name only — not this module naming.

**Map peek (activity pins):** Same outing as detail — **hero facts** · **Going** + **Rides & spots** strips (`mapPeekStrips` from L1 `resolveActivityEngagementPolicy` on `GET /explore/map`) · **footer actions** (`mapPeekActions` wire ids — join, crew chat, share/manage for host, withdraw/offer rideshare when entitled). Host **Manage** opens `ActivityManageSheet` on the map (participants view) without leaving `/explore`. Host **Share** opens `ActivityInviteShareSheet` (buddies + link) on peek, map list (`list=1` compact rows — `ExploreListRowWireFooter` + `ListFeedActionsProvider`), discover browse (`/list` / `browse=1`), and detail `plan_host_share` footer. Chips: **Joined** (participant), **N invited** (host/crew pending Join me invites via `pendingJoinInviteCount`), host row **My host profile** when `showHostSelfProfileLink`. Pro gates: roster mask + host profile upsell on people row (`entitlements`). **Authoritative matrix:** [`experiment/activity-detail-tabs-implementation-plan.md`](./experiment/activity-detail-tabs-implementation-plan.md) **§6**.

**Crew gating:** roster, meeting point, crew chat gated on `viewerAccess.canAccessCrewSurfaces`. Pending viewers see published facts + join CTAs; crew blocks unlock after approval/RSVP. Welcome sheet: **Join group chat** · meeting on page when entitled. Deep link: `?joined=1`. **Host:** manage via wire **Manage** / `ActivityManageSheet` (not a public tab). Copy: `src/content/activityDetailCopy.ts` · engagement: `activityPeekEngagement.ts` · consumer layout guard: `src/config/activityDetailConsumerLayoutGuard.test.ts`.

## Back navigation

| Entity | `detailBackPath()` kind | Destination |
|--------|-------------------------|-------------|
| Activity | `'activity'` | `/explore` (activities) |
| Trail | `'trail'` | `/explore?panel=venues&filter=hiking` |
| Camp | `'camp'` | `/explore?panel=venues&filter=camping` |
| Event venue | `'event'` | `/explore?panel=venues&filter=others` |
| Shop | `'shop'` | `/explore?panel=shops&filter=shops` |
| Organizer profile (wire kind) | `'host'` | `/explore` |
| Generic / 404 | `'explore'` | `/explore` |

## Legacy redirects (`App.tsx`)

Canonical paths only in **new UI**. Legacy URLs redirect in `src/App.tsx` — do not add new links to these.

| Legacy path | Redirect target | Removal target |
|-------------|-----------------|----------------|
| `/map` | `/explore` | 2026-Q4 |
| `/discovery` | `/explore` (+ param transform) | 2026-Q4 |
| `/calendar` | `/explore` | 2026-Q4 |
| `/shop` (bare) | `/explore?panel=shops` | 2026-Q4 |
| `/trips`, `/trips/map`, `/activities` (any) | `/plan`, `/profile/history`, or `/profile/history/map` (preserves query; `create=*` → explore compose) | 2026-Q4 |
| `/profile/plans` | `/plan` | 2026-Q4 |
| `/rewards`, `/my-rewards`, `/trail-points` | `/profile/badges` | 2026-Q4 (Trail Points wallet removed; badges kept) |
| `/community` | `/explore` (`COMMUNITY_PATH` — legacy Q&A feed removed) | 2026-Q4 |
| `/membership` | `/explore` (`Membership.tsx`; not product home) | 2026-Q4 or fold |
| `/organizer/*` | `/host/*` | 2026-Q4 |
| `/become-organizer` | `/become-host` | 2026-Q4 |
| `/become-host` | `/profile/pro-membership` | 2026-Q4 (Pro / agency / shop; buddy Organize uses `/welcome` + `canPublish`) |
| `/dashboard/*` | role-based redirect | 2026-Q4 |
| `/admin/organizers` | `/admin/hosts` | 2026-Q4 |
| `/admin/locations` | `/admin/places` | 2026-Q4 |
| `/host/locations` | `/host/places` | 2026-Q4 |
| `/event-spot/:id`, `/community-activity/:id`, `/event/:id` (place) | `/venue/:id` | 2026-Q4 |
| `/people` | `/explore?…` people browse (`explorePeopleBrowsePath`) | 2026-Q4 |
| `/merchant/:id` | legacy merchant page | TBD |
| `/sign-up`, `/sign-in` | auth aliases | keep |

**Personal commitments (active):** canonical **`/plan`** (`PLAN_PATH`). **Outing history:** **`/profile/history`**. Legacy **`TRIPS_PATH`** (`/trips`) redirects only — do not link in new UI.

## Mobile tab shell (signed-in, `md:hidden`)

| Tab (UI label) | Route | Chrome |
|----------------|-------|--------|
| **Explore** | `/explore` | Unified tab header (avatar · brand · notifications) |
| **My Plans** | `/plan` | `ConsumerShell` — Upcoming · Wishlist (`planTab.ts`); goals block on Wishlist |
| **Chat** | `/chat` | Inbox filters (people · groups · outings); legacy `/messages` → `/chat` |

- **Three bottom tabs only** — Profile is **not** a tab; open via header avatar / hamburger (`MOBILE_BOTTOM_NAV_TAB_PATHS`).
- Sub-routes (e.g. `/profile/settings`, `/chat?group=`, entity detail) use **back** chrome (`MobileDetailShell` or stack `ConsumerShell`).
- User groups and activity outing chats appear in Chat inbox (Groups / Outings filters).

## Consumer detail surfaces (entity pages)

**Execution plan:** [`experiment/consumer-detail-surfaces-plan.md`](./experiment/consumer-detail-surfaces-plan.md) (**S9**). **Shell:** `MobileDetailShell` for entity detail; hubs use `ConsumerShell`. Tab wire ids: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §3.1.

| Surface | Route | Tabs / layout (today → target) | Not a standalone page |
|---------|-------|--------------------------------|-------------------------|
| **Activity** | `/activity/:id` | **Scroll layout** — discovery facts + transport strip + wire CTAs (embed/manage: legacy tabs) | — |
| **Place (trail)** | `/trail/:id` | **Overview · Facts · Transport · Guide** (`?tab=`; legacy `location` → transport) | — |
| **Place (camp)** | `/camp/:id` | same as trail | — |
| **Place (venue)** | `/venue/:id` | same as trail | — |
| **Area** | `/area/:slug` | **Overview · Places · Activities** (`?tab=`); people preview on Overview | — |
| **Shop** | `/shop/:id` | `EntityPublicDetailShell` — **About · Products · Location** (`?tab=`) | — |
| **Agency / guide** | `/guide`, `/agency`, `/partner` | `EntityPublicDetailShell` — **About · Outings · Contact** (`?tab=`) | — |
| **Member (person)** | `/member/:userId` | Profile card — not a tenant storefront | — |
| **Goals** | — | Embedded on **Plan → Wishlist** (`planWishlistTabPath()`) | No `/goals` route |
| **People (discovery)** | Explore `view=people` | Map panel **Find your crew** — **Available · Friends going · Everyone** | Legacy `/people` → explore people browse |
| **People (friends)** | `/buddies` | **Friends** — requests · following (not the same as map People panel) | — |
| **My Map** | `/profile/history/map` | Journey map under **history** stack | Not a root tab |
| **Explore / Plan / Chat** | see above | Discovery and commitments — **do not** force entity-detail template | — |

## Auth redirects

- Gated actions → always `buildSignInRedirect()` or `signInPathForReturn(returnPath)`.
- Never bare `/signin` when the user should return to the current page or action.
- Participants without a redirect → `EXPLORE_MAP_PATH` after sign-in.

## Copy

User-facing labels: **Explore** = map-first tab and map chrome; **Browse** = visual discover (categories, posters) via `browse=1` or `/list`. Guest landing drawer includes both **Explore** (map) and **Browse** (discover). Internal URL panel name `venues` stays in query strings only.

## Connections QA (local / staging seed)

Buddy, follow, and group flows for manual QA use demo users from the main seed.

| Command | When |
|---------|------|
| `cd apps/api && SEED_DATA=true npm run seed` | Full reset + `seedConnectionsDemo` (with demo users) |
| `cd apps/api && SEED_CONNECTIONS=true npm run seed` | Refresh buddy/follow data only (demo users must already exist) |

**Primary tester:** `visitor@uaetrails.app` with `DEMO_ACCOUNT_PASSWORD` from `.env` (see root `README.md`, `DEV_RUN.md`).

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
