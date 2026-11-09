# Navigation contract

Companion to [`DOMAIN.md`](./DOMAIN.md) and [`NORTHSTAR.md`](./NORTHSTAR.md). Defines **where users go** for each intent. Routes stay stable; new links must follow this contract.

**Product intent:** Help people **find like-minded company outdoors** in the UAE & GCC — discover plans, connect, chat, go together. See north star for voice and audience (residents, expats, visitors; hikes, camps, runs, and more).

## Three surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Marketing** | `/` | First impression — story, trust, sign up (not live catalog) |
| **Browse** | `/explore` | Map-first discovery — activities (`activity-discovery`), places/shops (`places-discovery`), people (`people-discovery`); map/list/search are projections |
| **List discovery** | `/list` | Full-screen explorer (thumbnails · list · calendar, date-sorted; same filters as explore; `listDiscoveryPath()` ↔ map via `exploreMapPathFromListSearch()`) |
| **Personal hub** | `/profile`, `/profile/settings`, `/profile/edit`, `/profile/history` | Account hub, settings stack, outing **history** + journey map |
| **Plan tab** | `/plan` | Active layer — goals, upcoming outings. Page title **`PRODUCT_PLAN_SURFACE_TITLE`** (**My Plans**); bottom nav label **Plan**. |
| **Mobile tabs (`md:hidden`)** | `/explore`, `/list`, `/plan`, `/chat` | **Five tabs** — **Trips** · **Venues** · **Plans** · **Crews** · **Chat**. Trips/Venues use map (`/explore`) + list (`/list`) projections via `mobileFiveTabHomePath()` · `resolveMobileFiveTab()`. Crews → `listPeopleDiscoveryPath()`. Contract: `src/config/mobileFiveTabNav.ts` · § **Mobile five-tab bottom nav** below. |
| **Mobile tabs (guests)** | Same five-tab row | **Trips** / **Venues** on `/explore` and `/list`; **Plans** · **Crews** · **Chat** → feature explainer when gated. **Profile** is not a tab. |
| **Entity detail** | `/trail`, `/camp`, `/venue`, `/activity`, `/shop`, `/agency`, `/partner`, `/member/:userId`, `/area/:slug` | Place, scheduled outing, shop, brand profile, person card, or curated **area** hub |

### Profile hub (`/profile`)

- **Priority order:** Consumer hub (identity card + **stats row**, About you bio/speaks, **Goals teaser** → Plan **Wishlist** (`planWishlistTabPath()` / `tab=wishlist`), launcher **tiles**, **My cars** + **Safety & emergency** rows) — not a full settings stack on the hub. **Settings** via launcher or `/profile/settings` (account, privacy, notifications).
- **Badges:** `/profile/badges` — earned badges + share (`ProfileBadges.tsx`); launcher tile + badge-earn notifications → `PROFILE_BADGES_PATH`. Legacy `/rewards`, `/trail-points` redirect here. **Not** on Plan.
- **Submissions:** `/profile/submissions` — places and facilities you submitted + link to **Reviews** (`/profile/reviews`). Leftover **`/contributions`** inbound-redirects here. Launcher tile; back stack → Profile. **Add on the map** on Explore FAB is the create path; inventory lives here, not the Plan tab.
- **Edit profile:** `/profile/edit` — name, gender, bio, speaks, location (no DOB edit on this screen).
- **Pull-to-refresh** reloads hub data at scroll top.
- **Sign out:** Profile hub (bottom) and Settings → Account.
- **Outing history + map:** `/profile/history` — joined / hosted / self **past** outings; **History · My Map** tabs (`PROFILE_HISTORY_MAIN_TABS`). Journey map at `/profile/history/map`. Legacy `/profile/my-trips` redirects; `/trips`, `/trips/map`, `/activities` → `/plan` or history via `resolveInboundTripsHubRedirect`.
- **Saved (wishlist):** `/plan?view=plans&tab=wishlist` (`planWishlistTabPath()` / `planSavedPath()`). Legacy `lens=saved|goals` and `/profile/wishlist` normalize on load. Profile shows a teaser only — not a second full list ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §6.2 · `src/plan/`).
- **Cars & safety (profile hub):** **My cars** (`/profile/vehicles`, add/edit under that path) and **Safety & emergency** (`/profile/settings/safety`) open from `/profile`, not the settings index. **Settings stack:** `/profile/settings` → **Display** (theme, 12/24-hour time, metric/imperial — saved on this device; signed-out pages follow the guest theme, which starts as the system theme), Account, Privacy, Notifications; **iPhone & iPad** (`#ios-install`, Safari steps) and **Android** (`#android-install`, Samsung Internet / Chrome manual steps — no in-app install prompt). Back returns to the screen that opened the page (profile, settings, or the rideshare host step) and restores that screen’s scroll position and the control that was used.
- **Desktop/tablet shell (`md+`, `src/config/desktopNav.ts`):** Resizable left `DesktopSideNav` for **guests and members** (Explore · Browse · gated My Plans / Friends / Groups / Chat · Search · Post; **Find Crew** only when signed in). Slim `Header` — members use the account menu; guests use **Sign in / Join free**. Gated actions open a **right-rail feature explainer** (not a centered “Oops” popup) with sign up / log in. Anonymous **`GET /explore/map`** returns a **preview catalog** (max **3 outings** and **3 places**). Map search omits **People** until signed in. Hosts get **Hosting schedule** (`planHostedSchedulePath()`). Map pin summary docks left on desktop. Mobile chrome is unchanged.
- **Hamburger (header, below `lg`):** next to the notifications bell on tab chrome and tablet `Header` — Explore, Browse, **My Plans**, Outing history, Chat, Profile/Signup, **Install app** → Android (Chrome and Edge `beforeinstallprompt` when the browser offers it; otherwise the settings steps) / iOS (deep-link to the matching settings hash). **Platform admins** (`platform_admin`) also see **Admin console** → `/admin/overview` on consumer surfaces (admin drawer on `/admin/*`). Their identity, contact, bio, units, and time format live at **`/admin/account`**. Full **`/profile`** hub (privacy, cars, history, languages, and the rest) is after **Switch to visitor**. **My Plans**, history, and Chat send guests through sign-in and back to that path. Notifications are the bell only, not in the drawer.
- **View public card (eye):** opens `/member/:userId` — preview should match what **other signed-in members** see (`public` visibility), not the owner’s full hub (API P3).
- **Pro membership:** `/profile/pro-membership` — Individual, Business (subtype required), or Partner paths ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)).

### Member profile (`/member/:userId`)

- **Person** surface (member card or trusted view) — not the business **storefront** (`/agency/:slug`, `/shop/:id`). Link from Who’s going, buddies, activity rosters. Individual Pro is the same `/member/:userId` page.
- **Guests:** sign-in prompt; no public member card (policy P3). **Signed-in** viewers follow `profileVisibility` ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Profile visibility).

### Plan (`/plan`)

- **Bottom nav middle tab** — UI label **My Plans**; route **`/plan`** (`PLAN_PATH`) — not `/me/plans` (API) or `/profile/plans` (alias redirect only).
- **Forward commitments** only — past outings → **`/profile/history`** · journey map → **`/profile/history/map`**.
- **Canonical query** (new links; legacy still parses): `view=plans` · `tab=upcoming|wishlist` · `filter=hosting|joined` · `layout=list|calendar` · `lens=availability` (Find crew **share availability** editor only — `planAvailabilityPath()`). Page: **`src/plan/PlanPage.tsx`** · URL helpers: **`src/plan/planRouting.ts`**.
- **Summary** on the hub counts hosting, joined, goals, and saved places from the same catalog queries as the lists (`usePlanHubSummary`). Host console data loads only when the member can host, and stays fresh for 60s so the summary and the hosting list share one fetch.
- **Upcoming list and calendar** open the outing (`/activity/:id`) for going and pending rows. Hosting and looking-for-company rows open the same manage paths as before (`planHostedActivityManagePath` / intent manage). **Back** returns to the same Plan URL (filter, layout, scroll) with that row focused. **Available** is an indicator strip only; **edit availability** via the calendar link or `planAvailabilityPath()` (`lens=availability`).
- **Mobile chrome** (`src/plan/planTab.ts`): **Upcoming** · **Wishlist**; goals on Wishlist. Legacy `?lens=saved|goals|calendar` normalizes on load (`calendar` → `layout=calendar`).
- **`/profile/plans`** → **`/plan`**. **`/trips`**, **`/activities`** → `/plan` or history (`inboundTripsRedirect.ts`).

#### “Plan” disambiguation

| Term | Meaning |
|------|---------|
| **My Plans** (tab) | **`/plan`** — upcoming (list + **calendar**), wishlist + goals; availability **editor** via `planAvailabilityPath()` |
| **Host · Find crew · Add** (FAB) | Explore **`?compose=`** — not the Plan tab |
| **Activity detail Plan** | Outing facts on L3 — not **`/plan`** |
| **`GET /me/*`** | API prefix — not the My Plans page URL |

### Outing history (`/profile/history`)

- **Profile inventory** — past joined / hosted / self outings (`?view=completed&role=`); journey map at `/profile/history/map`. `?view=plans` redirects to `/plan`.
- **Main tabs (list surface):** History · My Map (`PROFILE_HISTORY_MAIN_TABS`).
- **Manage & crew chat:** Hosted/joined **Manage outing** sheets and explore map peek **`open_crew_chat`** → **`/chat?group=<id>`**. See [`COMMUNICATION.md`](./COMMUNICATION.md) and [`NAVIGATION.md`](./NAVIGATION.md) § `/plan`.

### Publishing console (`/publishing/*` routes)

- **Canonical SPA `/publishing/*`** — publishing workspace routes only (no `/operator` SPA alias). Product UI uses **Organizer workspace** (community / Pro) or **Operator workspace** (agency / shop); capabilities from **`GET /me/status`** (`useMemberStatus`, `publish.*`). No `/host` or `/organizer` SPA trees. Tenant HTTP API: **`/publishing/*`** only. `/operator/:slug` is **not** a public storefront.
- **Shell nav:** `PUBLISHING_CONSOLE_LINKS` + `ConsoleShell` (`src/console/*`); route pages in `src/pages/publishing/*`. Copy: `src/content/workspaceVocabulary.ts`.
- **`/publishing/overview`:** `ConsoleHubSections` — stats, **Up next** preview, header **Add activity** — not a second copy of the shell link list. Below that: **personal** shortcuts (trips as participant, **Chat** → `/chat`, explore map).
- **Member profile (`/profile`):** consumer hub only; buddies open **Organizing** → `planHostedSchedulePath()` (hosted filter on `/plan`), not `/publishing/overview`. Pro/agency/shop management remains `/publishing/*`.

### Admin console (`/admin/*`)

- **Audience:** `platform_admin` only (`ProtectedRoute`); signed-in members use `/explore`, not `/`.
- **Shell nav:** `ADMIN_LINKS` in `src/constants/index.ts` — desktop sidebar (`AdminConsoleSidebar`) + mobile admin drawer (`DashboardLayout`, `MobileMenu`). Consumer hamburger includes **Admin console** when role is `platform_admin` and the member is not already on `/admin/*`.
- **Staff provisioning API:** `POST /admin/platform-admins`, `DELETE /admin/platform-admins/:userId` — not self-serve signup.
- **Out of consumer methodology:** admin tables use `adminApi` + `DashboardLayout` — not discovery card VM, map peek, or entity tab footers (`SYSTEM_COHERENCE` §6.2.6). Guard: `adminSurfacesAcceptance.test.ts`.

#### Platform admin route catalog (S13-W9)

| Route | Page module | Sidebar (`ADMIN_LINKS`) | Job |
|-------|-------------|-------------------------|-----|
| `/admin/overview` | `pages/admin/Overview` | Overview | Metrics + shortcuts |
| `/admin/activities` | `pages/admin/Activities` | Activities | Outing moderation |
| `/admin/areas` | `pages/admin/Areas` | Areas | Curated **names** (not map pins); country/state/region from geography |
| `/admin/places` | `pages/admin/Places` | Places | Trails, camps, event venues (`/admin/locations` → redirect) |
| `/admin/facilities` | `pages/admin/Places` (`catalogSegment=facility`) | Facilities | Amenity POIs (parking, toilet, …) — `facilities` collection, map `source: facility` |
| `/admin/users` | `pages/admin/Members` | Users & Members | Member search, suspend, staff grant (`MEMBER_MODEL.md`) |
| `/admin/hosts` | `pages/admin/Organisations` | Operators | Host / tenant applications (`/admin/organizers` → redirect) |
| `/admin/groups` | `pages/admin/Groups` | Groups | Platform groups |
| `/admin/reports` | `pages/admin/Reports` | Reports | Content reports queue |
| `/admin/audit-log` | `pages/admin/AuditLog` | Audit Log | Audit trail |
| `/admin/settings` | `pages/admin/Settings` | Broadcast | Platform broadcast |
| `/admin/account` | `pages/admin/Account` | Account | Staff photo, name, contact, bio, units, time format, theme. Full member profile (`/profile`) only after **Switch to visitor**. |
| `/admin/notifications` | `pages/admin/Notifications` | — (deep link / ops only) | Notification ops |
| `/admin/login` | `SignIn` | — | Staff sign-in entry |

### Friends (`/buddies`)

- Consumer label **Friends**; tabs `?tab=friends|requests|following`.
- **Explore map people panel → Followed:** sub-segments **People** (member follows), **Places** and **Hosts & operators** (entity follows from map/profile); URL `followedKind=places|events`. (Panel URL `view=people`; legacy `view=social` — browse people, not chat; see § Browse — people & crew below.) Private **wishlist** saves live on **Plan → Saved** (`planSavedPath()`; `/profile/wishlist` redirects).

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
- **Scroll order** (matches `Home.tsx`, v2 sections in `src/components/home/marketing/sections/`):
  1. Hero carousel (`HomeHeroSection` — includes trust chips)
  2. Upcoming outings (`HomeActivitiesSection` — public API + curated fallback)
  3. How it works (`HomeHowItWorksSection`)
  4. Reviews + FAQ (`HomeReviewsFaqSection`)
- **Do not add** seeking posts, become-host, buddies, shops, or full map UX to Home — those belong on `/explore` or in-app.
- **Copy:** `src/content/homeMarketing.ts` · fallback cards: `homeLanding.ts` · **Components:** `src/components/home/marketing/**`
- **Layout:** Guest `/` uses a minimal wrapper in `Layout.tsx` (main + deferred site footer only). Signed-in product chrome (`ProductShell`: header, bottom nav, compose rail) loads only on non-marketing routes.

Legacy browse URLs (`/map`, `/discovery`, `/calendar`, bare `/activities` as browse) redirect via `App.tsx` — do not link to them from new UI. Legacy **`/trips`**, **`/activities`**, **`/trips/map`** redirect to **`/plan`**, **`/profile/history`**, or **`/profile/history/map`** (`inboundTripsRedirect.ts`) — canonical active hub is **`/plan`**.

## Source of truth (code)

| Intent | Helper | File |
|--------|--------|------|
| Explore URLs | `explorePath()`, `exploreActivitiesPath()`, `explorePlacesPath()`, `exploreShopsPath()` | `src/explore/routing.ts` · import via `config/routingCatalog` in app code |
| Back from detail | `detailBackPath(kind)` | `src/explore/routing.ts` |
| My activities hub | `myActivitiesPath('joined' \| 'hosted')` | `src/explore/routing.ts` |
| Leftover `?fulfillIntent=` on explore | Stripped on load (`exploreBrowseUrlSync`); pin via `explorePath({ pin })` only | `src/explore/routing.ts`, `src/explore/exploreBrowseUrlSync.ts` |
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

- **Desktop (`lg+`) and mobile:** map-first. Catalog list is the full-screen `/list` explorer (not a map sidebar).
- **Map framing:** upper-UAE overview (zoom ~8); optional GPS / **Locate** recenters at the same regional zoom (not street-level).
- Landing on `/explore` is map-only. **List** pill and hamburger **Browse** open `/list` (`listDiscoveryPathFromExploreSearch()`), keeping current filters. Inbound `/explore?list=1` / `browse=1` (except People) rewrite to `/list`.
- **List explorer (`/list`):** Windows Explorer-style **Thumbnails · List · Calendar** (`?layout=`), always sorted by date. Sticky search when a query is applied. Draggable filter FAB (snap to corners) with applied-count badge. Mobile thumbnails are **two columns**. Type icon sits on the cover. Tapping a plan opens entity detail; **Back** returns to this list URL (nested chat/location return to detail first). **`/list` is a mobile tab-shell root** (`MOBILE_BOTTOM_NAV_TAB_PATHS`) for Trips/Venues/Crews list projections — not a duplicate sixth tab. **Desktop map List** opens the same explorer as a full-height resizable left drawer on `/explore?list=1` (close returns to the map; full screen hides the map). Thumbnail cards keep a fixed size and add columns as the drawer widens. Hamburger **Browse** and the mobile List pill still go to `/list`. Schedule chips use the coming weekday within six days, otherwise `Sat 09 Nov 26`, then the clock from Display settings (`7:00 AM` or `07:00`). Place rows show distance from the viewer’s location when the browser provides a fix.
- **Mobile map filters:** **Activities · Places · Search** intent pill (`ExploreMapMobileLayerChrome`) expands a **frosted segmented CTA bar** (shared `EXPLORE_MAP_CHROME_FROST` with List / Find crew) — activities: All · Anyday · Hiking · Camping · Rideshare · Others; places: All · UAE · Trails · Spots · Shops · Camping · Others (spots vs camping share wire `filter=camping`; highlight uses `placesMenuKey`). List explorer filters live in the floating filter pop on `/list`.
- **Guest join:** tapping Join on an activity opens a signup sheet (returns to map after auth).
- Pass `list: true` to `explorePath()` for the mobile People sheet and the **desktop** catalog drawer on `/explore`. Mobile catalog list still uses `listDiscoveryPath()` (`/list`).
- **My plan on map:** `explorePath({ myPlan: true, list: true })` sets `myPlan=1` (legacy `myTrips=1` still parses) and filters pins to the signed-in member’s wishlist + joined/pending **activities**.
- Filter/panel query params select map context; they do not imply list mode.
- **Others drill-down (Activities tab):** `filter=others` → optional `subtype=events|activities`; when `subtype=activities`, optional `outingTopic` (`climbing`, `trail_run`, `workshop`, `community`, …). Helpers: `explorePath({ filter: 'others', subtype: 'activities', outingTopic: 'climbing' })`.

## Browse — people & crew (Explore map panel)

**Job:** who can I go with, who’s going, who’s looking — **not** chat. Chat is [`/chat`](#chat-chat) ([`COMMUNICATION.md`](./COMMUNICATION.md)).

Map pill label **Find your crew** (see `explorePeopleBrowseCopy.ts`); opens `view=people` on desktop (`peopleBrowseOpen`; mobile `listMode=people`; legacy `view=social` / `view=going` still parse). Query `peopleTab=looking|available|going|connect` (default **looking** omitted in URL; legacy `socialTab`, `all`→`connect`, `friends`→`going`, `discover`→`available`). Panel title **Find your crew** — list **Buddies** (`listCat=people`, URL `buddies=` mirrors `peopleTab`). **Looking for** tab is public (published seeking activities); other tabs → sign-in when needed.

| Segment (`peopleTab`) | Label | Data / actions |
|-----------------------|-------|----------------|
| `looking` | Looking for | Published **`activities`** (`activityMode: seeking`) from **`GET /explore/map`** — same `ExploreListRow` as Activities list; not member availability. |
| `available` | Free | `GET /explore/people/availability` — members who marked days + kinds; edit yours on Plan → **Available** (`planAvailabilityPath()`). |
| `going` | Friends | `GET /me/member-discovery/roster` + social trip hints — buddies with upcoming outings. |
| `connect` | Everyone | Directory from `GET /users/browse` / roster; **3** directory rows preview free, then Pro lock; profile opens count toward **3 unique profiles / 30d** (`MEMBER_DISCOVERY_QUOTA_LIMIT`). |

Cards show city, outings attended, and a subtle upcoming outing hint (link opens activity on map). **Friends → Host an outing** opens compose (`explorePlanWithBuddyPath`). Profile quick launcher: **People** (this panel), **Friends** (`/buddies`), **Messages** (chat). **Join me** on activity detail (`ActivityInviteLauncher`). APIs: [`API_ROUTING.md`](./API_ROUTING.md) § Member people reads (browse).

## Explore FAB (+)

**Shipped (CPC v3):** **Host** · **Find crew** · **Add on map** — see [`CREATE_FLOW.md`](./CREATE_FLOW.md). **Not** the bottom nav **Plan** tab (`/plan`). Domain lens: **What** (Host / fixed seek → activity) · **Where** (Add → place/facility) · **Who** / **How** on detail only — [`DOMAIN.md`](./DOMAIN.md) § What · Where · Who · How.

Signed-in members tap **+** on `/explore` (or list FAB) to compose. **Guests** → sign-in sheet, then the same compose URL. Closing the wizard returns to the explore or list surface the member opened it from (scroll and the control that opened compose are restored). Community rideshare **To** uses `GET /geo/rideshare-destinations` (see [`API_ROUTING.md`](./API_ROUTING.md) § Geo search). **My cars** and **Safety** opened from that step use the same back stack as the profile hub.

| Choice | Opens |
|--------|--------|
| **Host** | `hostingFlowEngine` / per-kind hosting wizards |
| **Find crew** | Fixed map seek (`seekingFlowEngine`) or **Share availability** (`member_availability`) |
| **Add on map** | Place or facility submit |

Compose URLs are `host:*` / `seek:*` / `add:*` only.

**Going from:** required map pin on **Host** / **Find crew (fixed)** activity flows; **Add on map** uses place/facility pin only.

**Components:** `CreateIntentSheet.tsx`, `ExploreExperience.tsx` (compose URL via `parseExploreCompose`).

## Activity detail (`/activity/:id`)

**Public consumer page (scroll layout):** **Back** · **Share** (hero on mobile, banner on desktop) · cover when present. **Published outing** = same L1 discovery projection as map peek (`buildActivityDetailPageShellCard` → `ActivityDiscoveryPublishedBody` — when/where lines, requirement chips, price). **Hero block:** date · title · venue link. **Host** row · **participants** (policy) · **meeting point** (crew only) · **Transport** strip (accessible by from organize capture · rideshare available with linked plan summary · host **Offer rideshare** when entitled). Linked rideshare and parent-plan cards open the other outing; **Back** returns to the previous screen at the same scroll position with that card focused. **CTAs:** wire `mapPeekActions` — **mobile/tablet** floating footer · **desktop (`lg+`)** sticky right-column card. No Plan/Place/Buddies/Transport tabs on the public route. Wire/API: `activity`, `viewerAccess`, `presentation` — [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.

**Layering (same pattern as place):** one URL, thin kind files — not one mega `ActivityDetailView` per route.

| Layer | Activity | Place (reference) |
|-------|----------|-------------------|
| Loader | `ActivityDetail.tsx` | `PlaceDetailPage.tsx` |
| Kind pick | `ActivityDetailByKind` | `PlaceDetailPage` (`kind`) |
| L3 shell | `*ActivityDetailPage` → `ActivityDetailPageShell` | `*PlaceDetailPage` → `PlaceDetailPageShell` |
| Public body | `ActivityDetailSections` | `PlaceScrollDetailPage` (no public tab bar) |

Section visibility is **`GET /activities/:id` → `presentation.sections`** (one policy; embed reads the same object and groups chrome in `tabs`). Legacy `?tab=` scrolls via `activityDetailScrollAnchors` — no public tab bar. **Embed only:** `ActivityManageSheet` uses `layout="embedded"`. Host preview passes `previewMode`. Catalog places: `/trail`, `/camp`, `/venue`; areas: `AreaDetailPage`. Chrome: `MobileDetailScrollShell`.

**Place detail (`/trail` · `/camp` · `/venue`):** Same scroll chrome as activity (`MobileDetailScrollShell`) — **Back** · kind label · **Share** (header). Registry rows without `images[0]` are excluded from map/registry queries and return **404** on `GET /places/:id` when active (draft preview by submitter still allowed). **Hero image:** region · area · title. **Sections:** kind facts · ratings · about · **Transport** · scheduled activities · **Nearby facilities** (`nearbyFacilities` from `GET /places/:id` + `facility:` / `nearby:` tags) · reviews. **Footer:** **Arrange trip** only. Premium guide on consumer scroll via **`PlacePremiumGuidePanel`** (shared with legacy **`PlaceDetailTabs`** guide tab). **Map peek:** `PlacePeekHero` · kind facts · ratings · scheduled · **Arrange trip** + **View details**.

**Pin summaries (map projection):** `ActivityPeekCard` · `PlacePeekCard` compose shared **`MapPeekShell`** chrome (`MapPeekOverlay` on map); **View details** → consumer detail templates above. “Explore” is the `/explore` surface name only — not this module naming.

**Map peek (activity pins):** Same outing as detail — **hero facts** · **Going** + **Rides & spots** strips (`mapPeekStrips` from L1 `resolveActivityEngagementPolicy` — guest on `GET /explore/map`, signed-in overlay `GET /me/discover/overlay`) · **footer actions** (`mapPeekActions` wire ids — join, crew chat, share/manage for host, withdraw/offer rideshare when entitled). Host **Manage** opens `ActivityManageSheet` on the map (participants view) without leaving `/explore`. Host **Share** opens `ActivityInviteShareSheet` (buddies + link) on peek, People sheet compact rows (`ExploreListRowWireFooter` + `ListFeedActionsProvider`), list explorer (`/list`), and detail `plan_host_share` footer. Chips: **Joined** (participant), **N invited** (host/crew pending Join me invites via `pendingJoinInviteCount`), host row **My host profile** when `showHostSelfProfileLink`. Pro gates: roster mask + host profile upsell on people row (`entitlements`). **Authoritative matrix:** `src/activity/activity-detail-cta-matrix.test.ts` · [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.

**Crew gating:** roster, meeting point, crew chat gated on `viewerAccess.canAccessCrewSurfaces`. Pending viewers see published facts + join CTAs; crew blocks unlock after approval/RSVP. Welcome sheet: **Join group chat** · meeting on page when entitled. Deep link: `?joined=1`. **Host:** manage via wire **Manage** / `ActivityManageSheet` (not a public tab). Copy: `src/content/activityDetailCopy.ts` · engagement: `activityPeekEngagement.ts` · scroll layout guard: `src/config/activityDetailScrollLayoutGuard.test.ts`.

## Back navigation

Header **Back** walks the in-app stack (`src/utils/backStack.ts`) and pops browser history so the previous screen keeps its scroll position and the control that opened the next screen (`data-nav-focus`, restored by `src/utils/viewReturnMemory.ts`). Auth, verify, and edit/create forms are skipped. A declared parent (`detailBackPath`, profile, Plan, Explore) is used only when nothing in this session is underneath (pasted URL, reload). Hamburger **My Plans** from Explore stores that Explore return. A tagged place opened from an outing returns to that outing.

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

Canonical paths only in **new UI**. Bookmark aliases mount in `src/App.tsx` and delegate to `src/routing/inboundBookmarkRedirects.tsx` — do not add new links to legacy paths.

| Legacy path | Redirect target | Removal target |
|-------------|-----------------|----------------|
| `/map` | `/explore` | 2026-Q4 |
| `/discovery` | `/explore` (+ param transform) | 2026-Q4 |
| `/calendar` | `/explore` | 2026-Q4 |
| `/shop` (bare) | `/explore?panel=shops` | 2026-Q4 |
| `/trips`, `/trips/map` | **nginx 301** → `/plan` or `/profile/history/map` (`nginx/snippets/legacy-bookmark-redirects.conf`); `/activities` — notification normalize only (`resolveInboundPlanHubPath`) | — |
| `/profile/plans` | `/plan` | 2026-Q4 |
| `/profile/wishlist` | Plan wishlist tab (`planWishlistRedirectPath()` / `InboundProfileWishlistRedirect`) | 2026-Q4 |
| `/rewards`, `/my-rewards`, `/trail-points` | `/profile/badges` | 2026-Q4 (Trail Points wallet removed; badges kept) |
| `/community` | **nginx 301** → `/explore` (Q&A feed removed; no SPA route) | — |
| `/membership` | `/explore` (`App.tsx` bookmark redirect; not product home) | 2026-Q4 |
| `/organizer/*`, `/host/*`, `/operator/*` (console) | `/publishing/*` (`InboundRetiredPublishingConsoleRedirect`) | 2026-Q4 |
| `/become-organizer` | `/become-host` | 2026-Q4 |
| `/become-host` | `/profile/pro-membership` | 2026-Q4 (Pro / agency / shop; buddy Host / publish uses `/welcome` + `canPublish`) |
| `/dashboard/*` | role-based redirect | 2026-Q4 |
| `/admin/organizers` | `/admin/hosts` | 2026-Q4 |
| `/admin/shop` | `/admin/hosts` (shop catalog admin removed) | 2026-Q4 |
| `/admin/locations` | `/admin/places` | 2026-Q4 |
| `/product/:id` | `/explore?panel=shops` (product catalog removed) | 2026-Q4 |
| `/host/locations`, `/host/places` | `/publishing/places` | 2026-Q4 |
| `/event-spot/:id`, `/community-activity/:id`, `/event/:id` (place) | `/venue/:id` | 2026-Q4 |
| `/people` | `/explore?…` people browse (`explorePeopleBrowsePath`) | 2026-Q4 |
| `/merchant/:id` | `/shop/:id` | 2026-Q4 |
| `/shop/manage`, `/agency/manage`, `/merchant/dashboard` | `/organisation/manage?kind=shop` or `?kind=agency` | 2026-Q4 |
| `/sign-up`, `/sign-in` | auth aliases | keep |

**Personal commitments (active):** canonical **`/plan`** (`PLAN_PATH`). **Outing history:** **`/profile/history`**. Legacy **`TRIPS_PATH`** (`/trips`) redirects only — do not link in new UI.

## Mobile tab shell (signed-in, `md:hidden`)

| Tab (UI label) | Route | Chrome |
|----------------|-------|--------|
| **Explore** | `/explore` | Unified tab header (avatar · brand · notifications) |
| **My Plans** | `/plan` | `ConsumerShell` — Upcoming · Wishlist (`planTab.ts`); goals block on Wishlist |
| **Chat** | `/chat` | Inbox filters (people · groups · outings); legacy `/messages` → `/chat` |

- **Five bottom tabs** — Profile is **not** a tab; open via header avatar / hamburger (`MOBILE_FIVE_TAB_UI_LABELS` · `MOBILE_BOTTOM_NAV_TAB_PATHS`).
- Sub-routes (e.g. `/profile/settings`, `/chat?group=`, entity detail) use **back** chrome (`MobileDetailShell` or stack `ConsumerShell`).
- User groups and activity outing chats appear in Chat inbox (Groups / Outings filters).

## Consumer detail surfaces (entity pages)

**S9 shells (eng complete):** `consumerDetailQaMatrixGuard` · `npm run consumer-detail:qa-routes` (**S10f** manual). **Shell:** `MobileDetailShell` for entity detail; hubs use `ConsumerShell`. Tab wire ids: [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §3.1.

| Surface | Route | Tabs / layout (today → target) | Not a standalone page |
|---------|-------|--------------------------------|-------------------------|
| **Activity** | `/activity/:id` | **Scroll layout** — discovery facts + transport strip + wire CTAs (embed/manage: legacy tabs) | — |
| **Place (trail)** | `/trail/:id` | **Overview · Facts · Transport · Guide** (`?tab=`; legacy `location` → transport) | — |
| **Place (camp)** | `/camp/:id` | same as trail | — |
| **Place (venue)** | `/venue/:id` | same as trail | — |
| **Area** | `/area/:slug` | **Overview · Places · Activities** (`?tab=`); people preview on Overview | — |
| **Shop** | `/shop/:id` | `EntityPublicDetailShell` — **About · Products · Location** (`?tab=`) | — |
| **Agency / partner** | `/agency`, `/partner` | `EntityPublicDetailShell` — **About · Outings · Contact** (`?tab=`) | Individual Pro → `/member/:userId` |
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

User-facing labels: **Explore** = map-first tab and map chrome; **Browse** = full-screen list explorer on `/list`. Guest landing drawer includes both **Explore** (map) and **Browse** (`/list`). Internal URL panel name `venues` stays in query strings only.

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

## Mobile five-tab bottom nav (implementation plan)

**Status:** **Phases 0–5 shipped in code** — five-tab shell, scoped map↔list, Crews list, drawer/sidebar **Trips · Venues** (no standalone **Browse**). Run **`npm run verify:system`** before release; close **`MIG-SURFACE-MOBILE-FIVE-TAB`** in `refactor-program.json` when verify is green. **Contexts:** `discovery`, `people-discovery`, `member_identity`.

### Target (mobile-first)

| Tab (label) | Product scope | Map projection | List projection |
|-------------|---------------|----------------|-----------------|
| **Trips** | Activities + seeking on the map catalog | `tripsMapHomePath()` → `/explore` activities scope | `tripsListHomePath()` → `/list` trips bucket (`listCat=activities` when scoped) |
| **Venues** | Places, trails, camps, shops, facilities | `venuesMapHomePath()` → `/explore` venues scope | `venuesListHomePath()` → `/list?listCat=venues` |
| **Crews** | Friends, available, going, directory (`peopleTab`) | *Not a tab home* — full-screen people list only for v1 | `crewsHomePath()` → `listPeopleDiscoveryPath()` (`/list?listCat=people`) |
| **Plan** | Upcoming, wishlist, availability editor | — | `/plan` only |
| **Chat** | Inbox | — | `/chat` only (hide tab in thread `?to=` / `?group=`) |

**Engines stay shared:** `/explore` + `/list` — tabs are **section entry + highlight**, not five duplicate page trees. Map ↔ list handoff: `browseListMapHandoff.ts`, `listDiscoveryPathFromExploreSearch()`, `exploreMapPathFromListSearch()`.

### Locked product defaults (`MOBILE_FIVE_TAB_DEFAULTS`)

| Decision | Value |
|----------|--------|
| Trips default projection | **Map** |
| Venues default projection | **Map** |
| Remember map/list per tab | **Yes** (`sessionStorage` `uaetrail:nav.trips.projection` / `…venues…`) |
| Mobile list mode | **Full `/list`** (not `/explore?list=1` as tab home) |
| Switch Trips ↔ Venues tab | **Clear** the other section’s browse scope (filters/topics) |
| Guests | All **five labels** visible; **Crews** · **Plan** · **Chat** gated |
| Optional later | `/crew` redirect alias → same as `crewsHomePath()` |

### Code contract (use for all new links)

| Helper | Role |
|--------|------|
| `mobileFiveTabHomePath(tab)` | Tab bar `to=` — respects remembered projection for Trips/Venues |
| `resolveMobileFiveTab(pathname, search)` | Active tab highlight; `null` off-tab routes (detail, threads, admin, …) |
| `readMobileFiveTabProjection` / `writeMobileFiveTabProjection` | Map \| List persistence |
| `MOBILE_FIVE_TAB_UI_LABELS` | Tab copy: Trips · Venues · Plans · Crews · Chat |

Import from `src/config/mobileFiveTabNav.ts` (re-export via `routingCatalog` when UI ships). Tests: `src/config/mobileFiveTabNav.test.ts`.

### Active-tab rules (summary)

- **`/list`** — `listCat=people` → **Crews**; `venues` → **Venues**; else **Trips**.
- **`/explore`** — `view=people` \| `social` \| `going` → **Crews**; `panel=venues` \| `shops` or `pinKind=places` \| `shops` → **Venues**; else **Trips**.
- **`/plan`** → **Plan**; **`/chat`** (no thread params) → **Chat**.

### In-tab Map \| List UX

- Mobile keeps the floating **List** FAB on the map (scoped handoff via `listDiscoveryPathFromExploreSearch` / `exploreMapPathFromListSearch` + `panel` / `listCat`). Optional header toggle is **not** required for v1.
- **Crews:** bottom tab + `/list?listCat=people` only — no map **Crews** chip (desktop people rail via nav/deep links unchanged).
- **5-column tab bar:** icons + short labels; verify touch targets (`--bottom-nav-height`).

### Implementation phases (check off in PRs)

**Phase 0 — Contract (done when tests green)**  
- [x] `mobileFiveTabNav.ts` path builders + resolver + defaults  
- [x] `mobileFiveTabNav.test.ts`  
- [x] Documented in Tier-1 + `MIG-SURFACE-MOBILE-FIVE-TAB`

**Phase 1 — Tab shell**  
- [x] `MobileBottomNav.tsx` — 5 tabs, `mobileFiveTabHomePath`, active via `resolveMobileFiveTab`  
- [x] `MOBILE_BOTTOM_NAV_TAB_PATHS` — `/explore` · `/list` · `/plan` · `/chat`  
- [x] `shouldShowMobileBottomNav` — show on `/list`; hide `?list=1` explore drawer  
- [x] `mobileBottomNav.test.ts` + `memberSurfacesAcceptance` tab copy guards  
- [x] Five-column tab grid (`grid-cols-5`, compact labels)

**Phase 2 — Trips & Venues projections**  
- [x] Tab tap applies scoped defaults (`mobileFiveTabHomePath`)  
- [x] Map **List** FAB → scoped `/list`; list → map sets `panel` + `pinKind` (single-scope handoff)  
- [x] Desktop `list=1` drawer unchanged; mobile full-screen `/list` for catalog

**Phase 3 — Crews tab**  
- [x] Tab → `crewsHomePath()`; guest → feature explainer (map chip guest gate)  
- [x] Map Crews chip removed (Crews tab is the entry)  
- [x] People overlay on map: deep link redirect to `/list` (signed-in mobile); desktop rail unchanged

**Phase 4 — Auth & redirects**  
- [x] Post-auth default remains `/explore` (Trips map) unless return URL set  
- [x] Signed-in `/` → Trips map (today `/explore`)  
- [x] Hamburger + landing drawer **Trips · Venues** (not a standalone **Browse** IA)

**Phase 5 — Desktop + doc closure**  
- [x] `desktopNav.ts` primary **Trips · Venues** list homes (+ existing hub sections)  
- [x] Tier-1 aligned (`NAVIGATION`, `ARCHITECTURE`, `SYSTEM_COHERENCE`, `DOMAIN_CANONICALS`)  
- [ ] `npm run verify:system` (run before merge)

### Verification gates

| Gate | Command / file |
|------|----------------|
| Contract | `npx vitest run src/config/mobileFiveTabNav.test.ts` |
| Nav hygiene | `src/config/mobileBottomNav.test.ts`, `src/member/memberSurfacesAcceptance.test.ts` |
| List ↔ map handoff | `src/list/routing.test.ts`, `browseListMapHandoff` callers |
| Full system | `npm run verify:system` before merge |

### Out of scope (later)

- Unified `/trips/*` route tree shell (same engines, new chrome host) — only if Capacitor stack nav requires it.  
- Sixth tab or burying Plan/Chat.  
- Tier-1 doc duplication — this section is the single plan; do not add `ALIGNMENT_*` / `NAVIGATION_FIVE_TAB.md`.

---

## Adding new links

1. Pick the surface (browse / personal / detail).
2. Use helpers from `src/explore/routing.ts`, `src/list/routing.ts`, and (mobile tabs) `src/config/mobileFiveTabNav.ts` — no raw `/explore?…` strings outside those modules and `platform.ts`.
3. Detail pages pass `backTo={detailBackPath('…')}` unless a tighter parent context exists.
