# Navigation contract

Companion to [`DOMAIN.md`](./DOMAIN.md) and [`NORTHSTAR.md`](./NORTHSTAR.md). Defines **where users go** for each intent. Routes stay stable; new links must follow this contract.

**Product intent:** Help people **find like-minded company outdoors** in the UAE & GCC — discover plans, connect, chat, go together. See north star for voice and audience (residents, expats, visitors; hikes, camps, runs, and more).

## Three surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Marketing** | `/` | First impression — story, trust, sign up (not live catalog) |
| **Browse** | `/explore` | Map-first discovery — activities, places, shops |
| **List discovery** | `/list` | Full-screen poster/list browse (same filters as explore; `listDiscoveryPath()` ↔ map via `exploreMapPathFromListSearch()`) |
| **Personal hub** | `/profile`, `/profile/settings`, `/profile/edit`, `/profile/history` | Account hub, settings stack, outing **history** + journey map |
| **Plan tab** | `/plan` | Active layer — goals, upcoming outings (bottom nav middle tab; UI label **My Plans** — `PRODUCT_PLAN_SURFACE_TITLE`) |
| **Mobile tabs (signed-in)** | `/explore`, `/plan`, `/chat` | **Three tabs only** — **Explore** · **My Plans** · **Chat** (`md:hidden`). **No List tab.** Map-aligned list from the **List** pill (`list=1`); discover browse from hamburger **Browse** (`browse=1`) or optional full-screen `/list` (`listDiscoveryPathFromExploreSearch()`), not bottom nav. **Facebook / Instagram / WhatsApp** icon row above tabs (`src/config/socialLinks.ts`); same bar on **`/profile`**, settings stack, **Friends**, **Contributions**, and related profile stack routes |
| **Mobile tabs (guests)** | `/explore`, `/plan`, `/chat` | Same three tabs; **Explore** is the live map. **My Plans** and **Chat** show `GuestTabPlaceholder` + sign-in (`App.tsx` `PlanBrowseRoute`, `MessagesGate`) — not a second marketing home. **Profile** is not a tab; guests reach account flows via sign-in CTAs. |
| **Entity detail** | `/trail`, `/camp`, `/venue`, `/activity`, `/shop`, `/guide`, `/agency`, `/partner`, `/area/:slug` | Place, scheduled outing, shop, brand profile, or curated **area** hub |

### Profile hub (`/profile`)

- **Priority order:** Consumer hub (identity card + **stats row**, About you bio/speaks, **Goals teaser** → Plan `?lens=goals`, launcher **tiles**) — not stacked settings menus. **Settings** via More sheet or `/profile/settings`.
- **Badges:** `/profile/badges` — earned badges + share (`ProfileBadges.tsx`); launcher tile + badge-earn notifications → `PROFILE_BADGES_PATH`. Legacy `/rewards`, `/trail-points` redirect here. **Not** on Plan.
- **Contributions:** `/contributions` — places you submitted (`getMySubmittedPlaces`) + link to **Reviews** (`/profile/reviews`). Launcher tile; back stack → Profile. **Add** on Explore map (`compose=add`) is the create path; inventory lives here, not Plan.
- **Edit profile:** `/profile/edit` — name, gender, bio, speaks, location (no DOB edit on this screen).
- **Pull-to-refresh** reloads hub data at scroll top.
- **Sign out:** Profile hub (bottom) and Settings → Account.
- **Outing history + map:** `/profile/history` — joined / hosted / self **past** outings; **History · My Map** tabs (`PROFILE_HISTORY_MAIN_TABS`). Journey map at `/profile/history/map`. Legacy `/profile/my-trips` redirects; `/trips`, `/trips/map`, `/activities` → `/plan` or history via `resolveLegacyTripsHubRedirect`.
- **Saved (wishlist):** `/plan?view=plans&lens=saved` (`planSavedPath()`). Legacy `/profile/wishlist` and `segment=wishlist` URLs normalize to the same lens. Profile shows a teaser only — not a second full list ([`experiment/member-surfaces-implementation-plan.md`](./experiment/member-surfaces-implementation-plan.md) D13).
- **Settings stack:** `/profile/settings` index → Account, Privacy, Notifications sub-routes; **iPhone & iPad** (`#ios-install`, Safari steps) and **Android** (`#android-install`, Samsung Internet / Chrome manual steps — no in-app install prompt).
- **Hamburger (header):** next to the notifications bell on tab chrome and desktop `Header` — Explore, **My Plans**, Messages, Profile/Signup, Download → Android / iOS (deep-link to the matching settings hash). Notifications are the bell only, not in the drawer.
- **View public card (eye):** opens `/member/:userId` — preview should match what **other signed-in members** see (`public` visibility), not the owner’s full hub (API P3).
- **Pro membership:** `/profile/pro-membership` — Individual, Business (subtype required), or Partner paths ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md)).

### Member profile (`/member/:userId`)

- **Person** surface (member card or trusted view) — not the business **storefront** (`/guide/:slug`, `/agency/:slug`, `/shop/:id`). Link from Who’s going, buddies, activity rosters.
- **Guests:** sign-in prompt; no public member card (policy P3). **Signed-in** viewers follow `profileVisibility` ([`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Profile visibility).

### Plan (`/plan`)

- **Bottom nav middle tab** — forward commitments, not past history (past outings → **`/profile/history`** · journey map → **`/profile/history/map`**).
- **Mobile tabs** (`?view=plans&tab=` — `src/plan/planTab.ts`): collapsible **goal progress** bar above **Upcoming** · **Wishlist** tabs. Upcoming: **Hosting | Joined** filters; **list ↔ calendar** toggle (`layout=calendar`); **Needs you** (participation only). Legacy `?lens=saved|goals|calendar` normalizes to tab/layout. **Available** editor: `?lens=availability` until moved to Profile.
- **Query helpers:** `tripsPlansPath()`, `planSavedPath()`, `planLensPath()`. Legacy `segment` / `tab` / `segment=wishlist` normalize on load.
- **`/trips`**, **`/activities`** redirect to `/plan` or `/profile/history` preserving query (`legacyTripsRedirect.ts`).

### Outing history (`/profile/history`)

- **Profile inventory** — past joined / hosted / self outings (`?view=completed&role=`); journey map at `/profile/history/map`. `?view=plans` redirects to `/plan`.
- **Main tabs (list surface):** History · My Map (`PROFILE_HISTORY_MAIN_TABS`).
- **Manage & crew chat:** Hosted/joined **Manage outing** sheets and explore map peek **`open_crew_chat`** → **`/chat?group=<id>`**. See [`experiment/member-surfaces-implementation-plan.md`](./experiment/member-surfaces-implementation-plan.md) and [`COMMUNICATION.md`](./COMMUNICATION.md).

### Host console (`/host/*`)

- **Host = user kind** (capabilities from `GET /me/host-status`); console is **tenant-scoped** manage UI, not a second activity entity.
- **Shell nav:** `HOST_CONSOLE_LINKS` + `ConsoleShell` (`src/console/*`); route pages in `src/pages/host/*`.
- **`/host/overview`:** `ConsoleHubSections` — stats, **Up next** preview, header **Add activity** — not a second copy of the shell link list. Below that: **personal** shortcuts (trips as participant, messages, explore map).
- **Member profile (`/profile`):** consumer hub only; buddy hosts open **Hosting** → Plan `?view=plans&role=hosted` (`tripsPlansPath('hosted')`), not `/host/overview`. Pro/agency console remains `/host/*` for tenant operators.

### Admin console (`/admin/*`)

- **Audience:** `platform_admin` only (`ProtectedRoute`); signed-in members use `/explore`, not `/`.
- **Shell nav:** `ADMIN_LINKS` in `src/constants/index.ts` — desktop sidebar + mobile admin drawer (`DashboardLayout`, `MobileMenu`).
- **`/admin/overview`:** Metrics and recent activity shortcuts.
- **`/admin/users`:** **Users** — search, suspend/activate, detail panel; master admin may grant/revoke platform staff (`MEMBER_MODEL.md`).
- Other entries: Places, Hosts (applications), Activities moderation, Groups, Shop, Reports, Audit log, Broadcast (`/admin/settings`).
- **Staff provisioning API:** `POST /admin/platform-admins`, `DELETE /admin/platform-admins/:userId` — not self-serve signup.

### Friends (`/buddies`)

- Consumer label **Friends**; tabs `?tab=friends|requests|following`.
- **Explore map people panel → Followed:** sub-segments **People** (member follows), **Places** and **Hosts & shops** (entity follows from map/profile); URL `followedKind=places|events`. (Panel URL `view=people`; legacy `view=social` — browse people, not chat; see § Browse — people & crew below.) Private **wishlist** saves live on **Plan → Saved** (`planSavedPath()`; `/profile/wishlist` redirects).

### Chat (`/chat`)

Canonical detail: **[`COMMUNICATION.md`](./COMMUNICATION.md)**. Legacy `/messages` redirects here.

- **Inbox:** Direct chats, **Groups** (family/friends), and **Outing chats** (activity crew) in one list; filters `people` / `groups` / `outings`.
- **Direct thread:** `/chat?to=<userId>` (optional `activity` context).
- **Group / crew thread:** `/chat?group=<groupId>` (optional `activity=<activityId>` for outing crew) — all wall chat UI lives here (not on `/groups`).
- **Hosts:** same component at `/host/messages` (org shell); consumer notification meta normalizes to `/chat` with the same query params.
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
| Plan hub URLs | `tripsPlansPath()`, `parseTripsSegment`, … | `src/member-plan/tripsRouting.ts` |
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
- **My trips map:** `explorePath({ myTrips: true, list: true })` sets `myTrips=1` and filters pins to the signed-in member’s wishlist + joined/pending activities.
- Filter/panel query params select map context; they do not imply list mode.
- **Others drill-down (Activities tab):** `filter=others` → optional `subtype=events|activities`; when `subtype=activities`, optional `outingTopic` (`climbing`, `trail_run`, `workshop`, `community`, …). Helpers: `explorePath({ filter: 'others', subtype: 'activities', outingTopic: 'climbing' })`.

## Browse — people & crew (Explore map panel)

**Job:** who can I go with, who’s going, who’s looking — **not** chat. Chat is [`/messages`](#chat-messages) ([`COMMUNICATION.md`](./COMMUNICATION.md)).

Map pill label **Find your crew** (see `explorePeopleBrowseCopy.ts`); opens `view=people` (`listMode=people`; legacy `view=social` / `view=going` still parse). Query `peopleTab=available|going|connect` (legacy `socialTab`, `all`→`connect`, `friends`→`going`, `discover`→`available`). Panel title **People** — same rows as list **Buddies** (`listCat=people`, URL `buddies=` mirrors `peopleTab`). Guests → sign-in (`explore-people-browse`).

| Segment (`peopleTab`) | Label | Data / actions |
|-----------------------|-------|----------------|
| `available` | Available | `GET /explore/people/availability` — members who marked days + kinds; edit yours on Plan → **Available** (`planLensPath('availability')`). |
| `going` | Friends going | `GET /me/member-discovery/roster` + social trip hints — buddies with upcoming outings. |
| `connect` | Everyone | Directory from `GET /users/browse` / roster; **3** directory rows preview free, then Pro lock; profile opens count toward **3 unique profiles / 30d** (`MEMBER_DISCOVERY_QUOTA_LIMIT`). |

Cards show city, outings attended, and a subtle upcoming trip hint (link opens activity on map). **Friends → Plan a trip** opens compose (`explorePlanWithBuddyPath`). Profile quick launcher: **People** (this panel), **Friends** (`/buddies`), **Messages** (chat). **Join me** on activity detail (`ActivityInviteSharePanel`). APIs: [`API_ROUTING.md`](./API_ROUTING.md) § Member people reads (browse).

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

## Activity detail (`/activity/:id`)

**Mobile-first shell:** **Back** · chrome **emoji + activity title** (truncated in sticky header) · **Share**. **Hero** (all tabs): linked venue · smart date (Today / Tomorrow / weekday, no year) · **large title** · fact chips (activity kind, time, free/paid, who can join, type extras — no Start/End labels on mobile tabs). **Icon tabs (UI labels only):** **Plan** · **Place** · **Buddies** · **Transport** (`?tab=place|buddies|transport`; default Plan). Wire/API names stay `activity`, `viewerAccess`, `rideshare`, `participant` — see [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §15. **Program checklist (exit criteria):** [`experiment/activity-detail-tabs-implementation-plan.md`](./experiment/activity-detail-tabs-implementation-plan.md).

| Tab (UI) | Purpose |
|----------|---------|
| **Plan** | Merged requirements + about + itinerary; host row; transport teaser → Transport tab |
| **Place** | Meeting / map — body only when `viewerAccess.canAccessCrewSurfaces` |
| **Buddies** | Roster + host queue; primary **host manage** surface (no fifth Manage tab) |
| **Transport** | **Always shown** — how to get there (reach-by / vehicle access from organize) + linked rideshare when present + sustainability nudge |

**Map peek (activity pins):** Same outing as detail — **hero facts** · **Going** + **Rides & spots** strips (`mapPeekStrips` from L1 `resolveActivityEngagementPolicy` on `GET /explore/map`) · **footer actions** (`mapPeekActions` wire ids — join, crew chat, share/manage for host, withdraw/offer rideshare when entitled). Host **Manage** opens `ActivityManageSheet` on the map (participants view) without leaving `/explore`. Host **Share** opens `ActivityInviteShareSheet` (buddies + link) on peek, map list (`list=1` compact rows — `ExploreListRowWireFooter` + `ListFeedActionsProvider`), discover browse (`/list` / `browse=1`), and detail `plan_host_share` footer. Chips: **Joined** (participant), **N invited** (host/crew pending Join me invites via `pendingJoinInviteCount`), host row **My host profile** when `showHostSelfProfileLink`. Pro gates: roster mask + host profile upsell on people row (`entitlements`). **Authoritative matrix:** [`experiment/activity-detail-tabs-implementation-plan.md`](./experiment/activity-detail-tabs-implementation-plan.md) **§6**.

**Crew gating:** roster, precise meeting, group chat entry gated on API `viewerAccess.canAccessCrewSurfaces` (confirmed participant or host; **pending / waitlisted** may open detail but see redacted crew — Buddies lock hint, Place tab lock card, no meeting body). Do not show locked meeting/chat rows for unconfirmed viewers; after RSVP or approval use welcome sheet (**Join group chat** · **See meeting location** → Place tab). Deep link: `?joined=1` (notification after host approve). **Host:** primary roster + pending queue on **Buddies** tab (`ActivityDetailHostBuddiesHub`); `ActivityManageSheet` still embeds the same detail for console deep links (`?tab=buddies`). **Mobile footers:** tab-primary actions via `activityDetailTabFooters.ts` (join on Plan, directions on Place, invite on Buddies, view ride on Transport when linked). Copy: `src/content/activityDetailCopy.ts` · tabs: `src/activity/activityDetailTab.ts` · engagement flags: `src/activity/activityDetailPresentation.ts` (peek: `activityPeekEngagement.ts`). Summary + §11 guards: [`experiment/member-surfaces-implementation-plan.md`](./experiment/member-surfaces-implementation-plan.md) §21 (ticks live in activity-detail program doc).

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
| `/trips`, `/trips/map`, `/activities` (any) | `/plan`, `/profile/history`, or `/profile/history/map` (preserves query; `create=*` → explore compose) | 2026-Q4 |
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
| **Activity** | `/activity/:id` | **Plan · Place · Buddies · Transport** (`?tab=`) — shipped | — |
| **Place (trail)** | `/trail/:id` | **Overview · Facts · Transport · Guide** (`?tab=`; legacy `location` → transport) | — |
| **Place (camp)** | `/camp/:id` | same as trail | — |
| **Place (venue)** | `/venue/:id` | same as trail | — |
| **Area** | `/area/:slug` | **Overview · Places · Activities** (`?tab=`); people preview on Overview | — |
| **Shop** | `/shop/:id` | `EntityPublicDetailShell` — **About · Products · Location** (`?tab=`) | — |
| **Agency / guide** | `/guide`, `/agency`, `/partner` | `EntityPublicDetailShell` — **About · Outings · Contact** (`?tab=`) | — |
| **Member (person)** | `/member/:userId` | Profile card — not a tenant storefront | — |
| **Goals** | — | Embedded on **Plan → Wishlist** (`planLensPath('goals')`) | No `/goals` route |
| **People (discovery)** | Explore `view=people` | Map panel — **Available · Friends going · Everyone** | No `/people` route (optional redirect TBD) |
| **People (friends)** | `/buddies` | Friends · Requests · Following | — |
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
