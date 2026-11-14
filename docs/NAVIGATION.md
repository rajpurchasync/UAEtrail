# Navigation contract

Companion to [`DOMAIN.md`](./DOMAIN.md) and [`NORTHSTAR.md`](./NORTHSTAR.md). Defines **where users go** for each intent. Routes stay stable; new links must follow this contract.

**Client URL writes:** Explore/list filter sync and create (`?compose=`) sessions commit through React Router (`setSearchParams` / `navigate`, often via `src/routing/productSearchMutation.ts`). Do not use raw `history.replaceState` for product navigation. Detail: [`CREATE_FLOW.md`](./CREATE_FLOW.md).

**Product intent:** Help people **find like-minded company outdoors** in the UAE & GCC — discover plans, connect, chat, go together. See north star for voice and audience (residents, expats, visitors; hikes, camps, runs, and more).

## Three surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Marketing** | `/` | First impression — story, trust, sign up (not live catalog) |
| **Browse** | `/explore` | Map-first discovery — activities (`activity-discovery`), places/shops (`places-discovery`), people (`people-discovery`); map/list/search are projections |
| **List discovery** | `/list` | Full-screen explorer (thumbnails · list · calendar, date-sorted; same filters as explore; `listDiscoveryPath()` ↔ map via `exploreMapPathFromListSearch()`) |
| **Personal hub** | `/profile`, `/settings`, `/profile/edit`, `/profile/history` | Account hub, **app settings**, edit profile, outing **history** + journey map |
| **Plan tab** | `/plan` | Active layer — goals, upcoming outings (bottom nav middle tab; UI label **My Plans** — `PRODUCT_PLAN_SURFACE_TITLE`) |
| **Mobile tabs (signed-in)** | `/explore`, `/plan`, `/chat` | **Three tabs only** — **Explore** · **My Plans** · **Chat** (`md:hidden`). **No List tab.** List explorer from the **List** pill or hamburger **Browse** (`/list`, `listDiscoveryPathFromExploreSearch()`), not bottom nav. **Facebook / Instagram / WhatsApp** icon row above tabs (`src/config/socialLinks.ts`); same bar on **`/profile`**, settings stack, **Friends**, **Submissions**, and related profile stack routes |
| **Mobile tabs (guests)** | `/explore`, `/plan`, `/chat` | Same three tabs; **Explore** is the live map. **My Plans** and **Chat** show the **right-rail feature explainer** (not the full auth page). **Profile** is not a tab; guests reach account flows via sign-in CTAs. |
| **Entity detail** | `/trail`, `/camp`, `/venue`, `/activity`, `/shop`, `/agency`, `/partner`, `/member/:userId`, `/area/:slug` | Place, scheduled outing, shop, brand profile, person card, or curated **area** hub |

### Profile hub (`/profile`)

- **Priority order:** Consumer hub (identity card + **stats row**, About you bio/speaks, **Goals teaser** → Plan **Wishlist** (`planWishlistTabPath()` / `tab=wishlist`), launcher **tiles**, **My cars** + **Safety & emergency** rows) — not a full settings stack on the hub. **App settings** via launcher or `/settings` (display, account, privacy; `/profile/settings` redirects).
- **Badges:** `/profile/badges` — earned badges + share (`ProfileBadges.tsx`); launcher tile + badge-earn notifications → `PROFILE_BADGES_PATH`. Legacy `/rewards`, `/trail-points` redirect here. **Not** on Plan.
- **Submissions:** `/profile/submissions` — places and facilities you submitted + link to **Reviews** (`/profile/reviews`). Leftover **`/contributions`** inbound-redirects here. Launcher tile; back stack → Profile. **Add on the map** on Explore FAB is the create path; inventory lives here, not the Plan tab.
- **Edit profile:** `/profile/edit` — name, gender, bio, speaks, location (no DOB edit on this screen).
- **Pull-to-refresh** reloads hub data at scroll top.
- **Sign out:** Profile hub (bottom) and Settings → Account.
- **Outing history + map:** `/profile/history` — joined / hosted / self **past** outings; **History · My Map** tabs (`PROFILE_HISTORY_MAIN_TABS`). Journey map at `/profile/history/map`. Legacy `/profile/my-trips` redirects; `/trips`, `/trips/map`, `/activities` → `/plan` or history via `resolveInboundTripsHubRedirect`.
- **Want to go (wishlist):** `/plan?view=plans&tab=wishlist` (`planWishlistTabPath()` / `planSavedPath()`). Catalog venues (`locationId`) sit with **Goals** on that tab and compose onto the journey map. Legacy `lens=saved|goals` and `/profile/wishlist` normalize on load. Profile shows a teaser only — not a second full list ([`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §6.2 · `src/plan/`).
- **Cars & safety (profile hub):** **My cars** (`/profile/vehicles`, add/edit under that path) and **Safety & emergency** (`/settings/safety`) open from `/profile`, not the settings index. **App settings:** `/settings` → **Display** (theme, 12/24-hour time, metric/imperial — saved on this device; signed-out pages follow the guest theme, which starts as the system theme), Account, Privacy, **Notifications** (`/settings/notifications` — history, preferences, saved map alerts; legacy `/notifications*` redirects); **iPhone & iPad** (`#ios-install`, Safari steps) and **Android** (`#android-install`, Samsung Internet / Chrome manual steps — no in-app install prompt). Back returns to the screen that opened the page (profile, settings, or the rideshare host step) and restores that screen’s scroll position and the control that was used.
- **Desktop/tablet shell (`md+`, `src/config/desktopNav.ts`):** Resizable left `DesktopSideNav` for **guests and members**. **Go:** one **Explore** (`/explore`). On desktop the browse list (thumbnails or rows) sits on the left of the map and is resizable and collapsible; outing filters live in that panel. Collapsing it leaves the applied filters visible, with **Show browse** to open it again. Signed-in **My Plans** · Chat. Guests see Explore + Chat only in Go. **People** (signed in): **Find Crew** (map `view=people` — seeking pins beside the crew list, without outing filters) and **Social** (Friends `/buddies` + Groups `/groups` + people catalog `/list?listCat=people`). **Map:** Search · Post. **You:** outing history (`/profile/history`, past trips — not upcoming My Plans) and the rest of your hub links; **notification history** lives under **Settings** (`/settings/notifications`), reached from the header **bell** (popover footer) or the settings hub — not a duplicate sidebar row. Hosts get **Hosting schedule** under **Hosting**. Slim `Header` — members use the account menu; guests use **Sign in / Join free**. Gated actions open a **right-rail feature explainer** (not a centered “Oops” popup) with sign up / log in. Anonymous **`GET /explore/map`** returns a **preview catalog** (max **3 outings** and **3 places**). Map search omits **People** until signed in. Hosts/operators with `canAccessPublishingWorkspace` get **Hosting schedule** (`planHostedSchedulePath()`) under **Hosting** — not a second My Plans. Map pin summary docks left on desktop. Mobile bottom nav stays Explore · My Plans · Chat.
- **Hamburger (header, below `lg`):** next to the notifications bell on tab chrome and tablet `Header` — Explore, **My Plans**, **Social**, Outing history, Chat, Profile/Signup, **Install app** → Android (Chrome and Edge `beforeinstallprompt` when the browser offers it; otherwise the settings steps) / iOS (deep-link to the matching settings hash). **Platform admins** (`platform_admin`) also see **Admin console** → `/admin/overview` on consumer surfaces (admin drawer on `/admin/*`). Their identity, contact, bio, units, and time format live at **`/admin/account`**. Full **`/profile`** hub (privacy, cars, history, languages, and the rest) is after **Switch to visitor**. Guests do not see My Plans, Social, or Outing history in the drawer. Notifications are the bell only, not in the drawer.
- **View public card (eye):** opens `/member/:userId` — preview should match what **other signed-in members** see (`public` visibility), not the owner’s full hub (API P3).
- **Pro membership:** `/profile/pro-membership` — Individual, Business (subtype required), or Partner paths ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)).

### Member profile (`/member/:userId`)

- **Person** surface (member card or trusted view) — not the business **storefront** (`/agency/:slug`, `/shop/:id`). Link from Who’s going, buddies, activity rosters. Individual Pro is the same `/member/:userId` page.
- **Guests:** sign-in prompt; no public member card (policy P3). **Signed-in** viewers follow `profileVisibility` ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Profile visibility).

### Plan (`/plan`)

- **Bottom nav middle tab** — UI label **My Plans**; route **`/plan`** (`PLAN_PATH`) — not `/me/plans` (API) or `/profile/plans` (alias redirect only).
- **Forward commitments** only — past outings → **`/profile/history`** · journey map → **`/profile/history/map`**.
- **Canonical query** (new links; legacy still parses): `view=plans` · `tab=upcoming|wishlist` · `filter=hosting|joined` · `layout=list|calendar` · `lens=availability` (Find crew **share availability** editor only — `planAvailabilityPath()`) · `planAdd=menu|goal|wishlist` (Add a Plan FAB). Page: **`src/plan/PlanPage.tsx`** · URL helpers: **`src/plan/planRouting.ts`**. Signed-in **today briefing** for the next joined outing: **`/plan/today`** (`PLAN_TODAY_PATH`).
- **Add a Plan** (FAB, all breakpoints): Create Trip (same `compose=host` as Trips) · Mark Availability (`compose=seek:flexible`) · Set a Goal · Want to go (catalog venues). Not an Explore lens.
- **Geo tree (country → state → area → venue counts):** **`/geo`** (country count chips), **`/geo/country/:code`**, and **`/geo/n/:id`**. Area hubs stay **`/area/:slug`**. Search still uses country/area/venue names. **`/venue/:id`** is the event-venue detail hub (`PlaceDetailPage` kind `event`; `placeDetailPath('event', id)`). **`/trail`** and **`/camp`** inbound aliases still redirect to `/place/:id`. `/event/:id` bookmarks redirect to `/venue/:id`.
- **Summary** on the hub counts hosting, joined, goals, and want-to-go venues from the same catalog queries as the lists (`usePlanHubSummary`). Host console data loads only when the member can host, and stays fresh for 60s so the summary and the hosting list share one fetch.
- **Upcoming list and calendar** open the outing (`/activity/:id`) for going and pending rows. Hosting and looking-for-company rows open the same manage paths as before (`planHostedActivityManagePath` / intent manage). **Back** returns to the same Plan URL (filter, layout, scroll) with that row focused. **Available** is an indicator strip only; **edit availability** via the calendar link or `planAvailabilityPath()` (`lens=availability`).
- **Hosting hub** (`/hosting`, all breakpoints): dedicated **Hosting** workspace — stats (upcoming / pending / week / history), host tools (approvals, chat, manage, past trips, profile, places, team), upcoming schedule, past trips list + `/publishing/history`. Same glass/account chrome as Profile and publishing overview. **My Plans** stays on `/plan` only. Legacy `/plan?filter=hosting` redirects to `/hosting`.
- **Mobile chrome** (`src/plan/planTab.ts`): **Upcoming** · **Wishlist**; goals on Wishlist. Legacy `?lens=saved|goals|calendar` normalizes on load (`calendar` → `layout=calendar`).
- **`/profile/plans`** → **`/plan`**. **`/trips`**, **`/activities`** → `/plan` or history (`inboundTripsRedirect.ts`).

#### “Plan” disambiguation

| Term | Meaning |
|------|---------|
| **My Plans** (tab) | **`/plan`** — upcoming (list + **calendar**), wishlist + goals; availability **editor** via `planAvailabilityPath()` |
| **Create Trip / Add a venue / Find a Crew** (tab FABs) | Create-flow session **`?compose=`** on the current surface — not the Plan tab |
| **Add a Plan** (Plan FAB) | `?planAdd=` launcher on `/plan` — Create Trip / availability reuse `?compose=`; Set a Goal / Want to go stay on Plan |
| **Activity detail Plan** | Outing facts on L3 — not **`/plan`** |
| **`GET /me/*`** | API prefix — not the My Plans page URL |

### Outing history (`/profile/history`)

- **Profile inventory** — past joined / hosted / self outings (`?view=completed&role=`); journey map at `/profile/history/map`. `?view=plans` redirects to `/plan`.
- **Main tabs (list surface):** History · My Map (`PROFILE_HISTORY_MAIN_TABS`).
- **Manage & crew chat:** Hosted/joined **Manage outing** sheets and explore map peek **`open_crew_chat`** → **`/chat?group=<id>`**. See [`COMMUNICATION.md`](./COMMUNICATION.md) and [`NAVIGATION.md`](./NAVIGATION.md) § `/plan`.

### Publishing console (`/publishing/*` routes)

- **Canonical SPA `/publishing/*`** — publishing workspace routes only (no `/operator` SPA alias). Product UI uses **Organizer workspace** (community / Pro) or **Operator workspace** (agency / shop); capabilities from **`GET /me/status`** (`useMemberStatus`, `publish.*`). No `/host` or `/organizer` SPA trees. Tenant HTTP API: **`/publishing/*`** only. `/operator/:slug` is **not** a public storefront.
- **Host mode home:** Pro/agency/guide console roles land on the **hosting hub** after sign-in and **Switch to Host** (`resolveHostingHubPath` / `navigateToHostModeHome`) — not Explore or Profile. **Switch to Visitor** returns to `/explore`.
- **Host mode chrome:** while role is `tenant_*` (not visitor), primary nav is **Hosting (`/hosting`) · My Plans (`/plan`) · Chat** — no Explore tab, no Map tools, no Find crew. Hamburger leads with **Hosting** and still includes **Explore**. Visitor switch restores the consumer Explore chrome.
- **Combined hosting (two modes):** when the same account has **community** buddy outings and a **workspace** (guide / agency / shop), `HostingModeSwitcher` toggles **Community** (`/hosting`) ↔ **Operator/Guide workspace** (`/publishing/overview`). Preference stored in `uaetrail.hostingSurfaceMode`.
- **Shell nav:** `PUBLISHING_CONSOLE_LINKS` + `ConsoleShell` (`src/console/*`); route pages in `src/pages/publishing/*`. Copy: `src/content/workspaceVocabulary.ts`.
- **`/publishing/overview`:** `ConsoleHubSections` — stats, **Up next** preview, header **Add activity** — not a second copy of the shell link list. Below that: **personal** shortcuts (trips as participant, **Chat** → `/chat`, explore map).
- **Member profile (`/profile`):** consumer hub only; buddies open **Organizing** → `planHostedSchedulePath()` (hosted filter on `/plan`), not `/publishing/overview`. Pro/agency/shop management remains `/publishing/*`.

### Admin console (`/admin/*`)

- **Audience:** `platform_admin` only (`ProtectedRoute`); signed-in members use `/explore`, not `/`.
- **Shell nav:** `ADMIN_LINKS` in `src/constants/index.ts` — desktop sidebar (`AdminConsoleSidebar`) + mobile admin drawer (`DashboardLayout`, `MobileMenu`). Consumer hamburger includes **Admin console** when role is `platform_admin` and the member is not already on `/admin/*`.
- **Staff provisioning API:** `POST /admin/platform-admins`, `DELETE /admin/platform-admins/:userId` — not self-serve signup.
- **Out of consumer methodology:** admin tables use `adminApi` + `DashboardLayout` — not discovery card VM, map peek, or entity tab footers (`SYSTEM_COHERENCE` §6.2.6). Guard: `adminSurfacesAcceptance.test.ts`.

#### Platform admin route catalog

Grouped nav (`ADMIN_NAV_GROUPS` / flat `ADMIN_LINKS`). Legacy `/admin/overview` redirects to Inbox.

| Route | Page module | Sidebar (`ADMIN_LINKS`) | Job |
|-------|-------------|-------------------------|-----|
| `/admin/inbox` | `pages/admin/Inbox` | Inbox | Work-queue hub + real pending counts |
| `/admin/inbox/submissions` | `pages/admin/Submissions` | Submissions | Map suggestion review wizard |
| `/admin/hosts` | `pages/admin/Organisations` | Operators | Host / tenant applications (`/admin/organizers` → redirect) |
| `/admin/reports` | `pages/admin/Reports` | Reports | Content reports triage |
| `/admin/alerts` | `pages/admin/Alerts` | Safety | Banners + amenity condition queue + host verification |
| `/admin/places` | `pages/admin/Places` | Places | Trails, camps, event venues (`/admin/locations` → redirect) |
| `/admin/facilities` | `pages/admin/Places` (`catalogSegment=facility`) | Facilities | Amenity POIs (parking, toilet, …) — `facilities` collection, map `source: facility` |
| `/admin/areas` | `pages/admin/Areas` | Areas | Curated **names** (not map pins); country/state/region from geography |
| `/admin/users` | `pages/admin/Members` | Users & Members | Member search, suspend, staff grant (`MEMBER_MODEL.md`) |
| `/admin/groups` | `pages/admin/Groups` | Groups | Platform groups |
| `/admin/activities` | `pages/admin/Activities` | Activities | Outing moderation |
| `/admin/settings` | `pages/admin/Settings` | Broadcast | Platform broadcast |
| `/admin/audit-log` | `pages/admin/AuditLog` | Audit Log | Audit trail |
| `/admin/account` | `pages/admin/Account` | Account | Staff photo, name, contact, bio, units, time format, theme. Full member profile (`/profile`) only after **Switch to visitor**. |
| `/admin/notifications` | `pages/admin/Notifications` | — (Ops group / deep link) | Notification ops |
| `/admin/overview` | — | — | Redirect → `/admin/inbox` |
| `/admin/login` | `SignIn` | — | Staff sign-in entry |

### Friends (`/buddies`)

- Consumer label **Friends**; tabs `?tab=friends|requests|following`.
- **Explore map people panel → Followed:** sub-segments **People** (member follows), **Places** and **Hosts & operators** (entity follows from map/profile); URL `followedKind=places|events`. (Panel URL `view=people`; legacy `view=social` — browse people, not chat; see § Browse — people & crew below.) Private **wishlist** venues live on **Plan → Want to go** (`planSavedPath()`; `/profile/wishlist` redirects).

### Chat (`/chat`)

Canonical detail: **[`COMMUNICATION.md`](./COMMUNICATION.md)**. Legacy `/messages` redirects here.

- **Inbox:** Direct chats, **Teams** (family/friends walls), and **Outing crew** (activity `social_groups`) in one list; filters `people` / `groups` / `outings`.
- **Direct thread:** `/chat?to=<userId>` (optional `activity` context).
- **Group / crew thread:** `/chat?group=<groupId>` (optional `activity=<activityId>` for outing crew) — all wall chat UI lives here (not on `/groups`).
- **Legacy `/host/messages` and `/operator/messages`:** redirect to `/chat` (one inbox). Notification meta normalizes to `/chat` with the same query params.
- **API:** prefer **`GET /chat/inbox`** (direct + groups with `chatPreview`); wall supports `?since=` and `POST .../wall/read`; optional `replyToMessageId` on wall POST.

### Teams (`/groups`)

Product label **Teams** (family/friends `social_groups`); optional **team chat** — adults only.

- **List + manage:** create family/friends teams; **Members** (`?section=members`, optional `focus=invite|add-kid`) for invites, roster (kids: name on roster; **trip details** when joining outings); **Edit group** (`?section=edit`) for name, image, delete. Chat **Permissions** (who can post) lives in the thread gear sheet — not Edit group. `groupsManagePath()`; legacy `?section=invite|kids|settings` and `?tab=` redirect.
- **From Crews tab:** `?from=crews` on `/groups` or `/buddies` → back returns to `/list?listCat=people` hub (`crewsHomePath()`).
- **Chat:** hub **Team chat** → `/chat?group=<id>` (single chat surface).

### Crews tab home (`/list?listCat=people`, hub segment)

Mobile five-tab **Crews** — discovery rails + **My crew** card (signed in): **Friends** (`/buddies?from=crews`), **Teams** (`/groups?from=crews`). Not the chat inbox.

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
- **Map framing:** upper-UAE overview (zoom ~8); optional GPS / **Locate** recenters at the same regional zoom (not street-level). Zoomed out, the map shows **country / emirate / area count bubbles** from the cached geo tree (`GET /geo/tree`); from zoom 9 it uses the existing pins.
- Landing on `/explore` is map-only. **List** pill and hamburger **Browse** open `/list` (`listDiscoveryPathFromExploreSearch()`), keeping current filters. Inbound `/explore?list=1` / `browse=1` (except People) rewrite to `/list`.
- **List explorer (`/list`):** Windows Explorer-style **Thumbnails · List · Calendar** (`?layout=`), always sorted by date. Sticky search when a query is applied. Draggable filter FAB (snap to corners) with applied-count badge. Mobile thumbnails are **two columns**. Type icon sits on the cover. Tapping a plan opens entity detail; **Back** returns to this list URL (nested chat/location return to detail first). Do not add `/list` to `MOBILE_BOTTOM_NAV_TAB_PATHS`. **Desktop map List** opens the same explorer as a full-height resizable left drawer on `/explore?list=1` (close returns to the map; full screen hides the map). Thumbnail cards keep a fixed size and add columns as the drawer widens. Hamburger **Browse** and the mobile List pill still go to `/list`. Schedule chips use the coming weekday within six days, otherwise `Sat 09 Nov 26`, then the clock from Display settings (`7:00 AM` or `07:00`). Place rows show distance from the viewer’s location when the browser provides a fix.
- **Mobile map filters:** **Activities · Places · Search** intent pill (`ExploreMapMobileLayerChrome`) expands a **frosted segmented CTA bar** (shared `EXPLORE_MAP_CHROME_FROST` with List / Find crew) — activities: All · Anyday · Hiking · Camping · Rideshare · Others; places: All · UAE · Trails · Spots · Shops · Camping · Others (spots vs camping share wire `filter=camping`; highlight uses `placesMenuKey`). List explorer filters live in the floating filter pop on `/list`.
- **Guest join:** tapping Join on an activity opens a signup sheet (returns to map after auth).
- First map visit shows a 3-step coach (localStorage `uaetrail:explore-coach-seen`); guest join banner appears after coach is dismissed.
- Pass `list: true` to `explorePath()` for the mobile People sheet and the **desktop** catalog drawer on `/explore`. Mobile catalog list still uses `listDiscoveryPath()` (`/list`).
- **My plan on map:** `explorePath({ myPlan: true, list: true })` sets `myPlan=1` (legacy `myTrips=1` still parses) and filters pins to the signed-in member’s wishlist + joined/pending **activities**.
- Filter/panel query params select map context; they do not imply list mode.
- **Others drill-down (Activities tab):** `filter=others` → optional `subtype=events|activities`; when `subtype=activities`, optional `outingTopic` (`climbing`, `trail_run`, `workshop`, `community`, …). Helpers: `explorePath({ filter: 'others', subtype: 'activities', outingTopic: 'climbing' })`.

## Browse — people & crew (Explore map panel)

**Job:** who can I go with, who’s going, who’s looking — **not** chat. Chat is [`/chat`](#chat-chat) ([`COMMUNICATION.md`](./COMMUNICATION.md)).

Map pill label **Find your crew** (see `explorePeopleBrowseCopy.ts`); opens `view=people` on desktop (`peopleBrowseOpen`; mobile `listMode=people`; legacy `view=social` / `view=going` still parse). Query `peopleTab=looking|available|going|connect` (default **looking** omitted in URL; legacy `socialTab`, `all`→`connect`, `friends`→`going`, `discover`→`available`). Panel title **Find your crew** — list **Crews** (`listCat=people`, URL `buddies=` mirrors `peopleTab`; hub segment = Crews home). **Looking for** tab is public (published seeking activities); other tabs → sign-in when needed.

| Segment (`peopleTab`) | Label | Data / actions |
|-----------------------|-------|----------------|
| `looking` | Looking for | Published **`activities`** (`activityMode: seeking`) from **`GET /explore/map`** — same `ExploreListRow` as Activities list; not member availability. |
| `available` | Free | `GET /explore/people/availability` — members who marked days + kinds; edit yours on Plan → **Available** (`planAvailabilityPath()`). |
| `going` | Friends | `GET /me/member-discovery/roster` + social trip hints — buddies with upcoming outings. |
| `connect` | Everyone | Directory from `GET /users/browse` / roster; **3** directory rows preview free, then Pro lock; profile opens count toward **3 unique profiles / 30d** (`MEMBER_DISCOVERY_QUOTA_LIMIT`). |

Cards show city, outings attended, and a subtle upcoming outing hint (link opens activity on map). **Friends → Host an outing** opens compose (`explorePlanWithBuddyPath`). Profile quick launcher: **People** (this panel), **Friends** (`/buddies`), **Messages** (chat). **Join me** on activity detail (`ActivityInviteLauncher`). APIs: [`API_ROUTING.md`](./API_ROUTING.md) § Member people reads (browse).

## Explore FAB (+)

**Shipped (CPC v3):** **Host** · **Find crew** · **Add on map** — see [`CREATE_FLOW.md`](./CREATE_FLOW.md). **Not** the bottom nav **My Plans** tab (`/plan`). Domain lens: **What** (Host / fixed seek → activity) · **Where** (Add → place/facility) · **Who** / **How** on detail only — [`DOMAIN.md`](./DOMAIN.md) § What · Where · Who · How.

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
| Scroll body | `ActivityConsumerDetailBody` | `PlaceConsumerDetailPage` (scroll; no public tab bar) |

Public scroll slots come from **`GET /activities/:id` → `presentation.consumerLayout`** (same policy pass as embed `tabs`). Legacy `?tab=` scrolls via `activityDetailConsumerAnchors` — no public tab bar. **Embed only:** `ActivityManageSheet` / host preview use tabbed `ActivityDetailView` (`layout=embedded`). Catalog places: `/trail`, `/camp`, `/venue`; areas: `AreaDetailPage`.

**Place detail (`/trail` · `/camp` · `/venue`):** Same modal chrome as activity (`ActivityConsumerDetailModalShell`) — **Back** · kind label · **Share** (header). Registry rows without `images[0]` are excluded from map/registry queries and return **404** on `GET /places/:id` when active (draft preview by submitter still allowed). **Hero image:** region · area · title. **Sections:** kind facts · ratings · about · **Transport** · scheduled activities · **Nearby facilities** (`nearbyFacilities` from `GET /places/:id` + `facility:` / `nearby:` tags) · reviews. **Footer:** **Arrange trip** only. Premium guide on consumer scroll via **`PlacePremiumGuidePanel`** (shared with legacy **`PlaceDetailTabs`** guide tab). **Map peek:** `PlacePeekHero` · kind facts · ratings · scheduled · **Arrange trip** + **View details**.

**Pin summaries (map projection):** `ActivityPeekCard` · `PlacePeekCard` compose shared **`MapPeekShell`** chrome (`MapPeekOverlay` on map); **View details** → consumer detail templates above. “Explore” is the `/explore` surface name only — not this module naming.

**Map peek (activity pins):** Same outing as detail — **hero facts** · **Going** + **Rides & spots** strips (`mapPeekStrips` from L1 `resolveActivityEngagementPolicy` — guest on `GET /explore/map`, signed-in overlay `GET /me/discover/overlay`) · **footer actions** (`mapPeekActions` wire ids — join, crew chat, share/manage for host, withdraw/offer rideshare when entitled). Host **Manage** opens `ActivityManageSheet` on the map (participants view) without leaving `/explore`. Host **Share** opens `ActivityInviteShareSheet` (buddies + link) on peek, People sheet compact rows (`ExploreListRowWireFooter` + `ListFeedActionsProvider`), list explorer (`/list`), and detail `plan_host_share` footer. Chips: **Joined** (participant), **N invited** (host/crew pending Join me invites via `pendingJoinInviteCount`), host row **My host profile** when `showHostSelfProfileLink`. Pro gates: roster mask + host profile upsell on people row (`entitlements`). **Authoritative matrix:** `src/activity/activity-detail-cta-matrix.test.ts` · [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15.

**Crew gating:** roster, meeting point, crew chat gated on `viewerAccess.canAccessCrewSurfaces`. Pending viewers see published facts + join CTAs; crew blocks unlock after approval/RSVP. Welcome sheet: **Join group chat** · meeting on page when entitled. Deep link: `?joined=1`. **Host:** manage via wire **Manage** / `ActivityManageSheet` (not a public tab). Copy: `src/content/activityDetailCopy.ts` · engagement: `activityPeekEngagement.ts` · consumer layout guard: `src/config/activityDetailConsumerLayoutGuard.test.ts`.

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
| `/profile/settings`, `/profile/settings/*` | `/settings` + same suffix (`InboundLegacyProfileSettingsRedirect`) | keep (bookmarks) |
| `/notifications`, `/notifications/settings`, `/notifications/saved` | `/settings/notifications` (+ preferences / saved sub-routes via `InboundLegacyNotificationsRedirect`) | keep (bookmarks) |
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

- **Three bottom tabs only** — Profile is **not** a tab; open via header avatar / hamburger (`MOBILE_BOTTOM_NAV_TAB_PATHS`).
- Sub-routes (e.g. `/settings`, `/chat?group=`, entity detail) use **back** chrome (`MobileDetailShell` or stack `ConsumerShell`).
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

User-facing labels: **Explore** = map-first product home (`/explore`). On desktop, browse (list or thumbnails) is the left panel of that view, not a second destination. **People** groups **Find Crew** and **Social** (friends, groups, and the people catalog). Internal URL panel name `venues` stays in query strings only.

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
