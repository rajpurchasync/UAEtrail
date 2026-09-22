# Navigation contract

Companion to [`DOMAIN.md`](./DOMAIN.md) and [`NORTHSTAR.md`](./NORTHSTAR.md). Defines **where users go** for each intent. Routes stay stable; new links must follow this contract.

**Product intent:** Help people **find like-minded company outdoors** in the UAE & GCC — discover plans, connect, chat, go together. See north star for voice and audience (residents, expats, visitors; hikes, camps, runs, and more).

## Three surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Marketing** | `/` | First impression — story, trust, sign up (not live catalog) |
| **Browse** | `/explore` | Map-first discovery — activities, places, shops |
| **Personal hub** | `/profile`, `/profile/settings`, `/activities?tab=joined\|hosted` | Account hub, settings stack, activity lists |
| **Entity detail** | `/trail`, `/camp`, `/event`, `/activity`, `/shop`, `/operator` | Single place, trip, or host |

### Profile hub (`/profile`)

- **Priority order:** Hero → **Up next** (activity, requests, messages) → profile completion → quick actions → hosting (hosts only) → collapsible stamps → settings link.
- **Pull-to-refresh** reloads hub data at scroll top.
- **Empty “Up next”:** single CTA → Explore map.
- **Settings stack:** `/profile/settings` — languages, host profiles, password, email, sign out (not on main hub).

### Home (`/`) — marketing only

Full spec: **[`LANDING.md`](./LANDING.md)** · Voice: **[`NORTHSTAR.md`](./NORTHSTAR.md)**.

- **Guests only** — signed-in users redirect to `/explore` (`src/pages/Home.tsx`).
- **Not the product home** — members always land on and live on `/explore`.
- **Goal:** convert visitors via **Explore the map** (primary) and **Join free** (secondary); post-auth → `/explore`.
- **Guest hero:** headline + subline + **Explore the map** (primary CTA) + **Join free** (secondary). Desktop header: Log in pill.
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

Legacy browse URLs (`/map`, `/discovery`, `/calendar`, `/shop`, bare `/activities`) redirect into `/explore` via `App.tsx` only — do not link to them from new UI.

## Source of truth (code)

| Intent | Helper | File |
|--------|--------|------|
| Explore URLs | `explorePath()`, `exploreActivitiesPath()`, `explorePlacesPath()`, `exploreShopsPath()` | `src/utils/exploreRouting.ts` |
| Back from detail | `detailBackPath(kind)` | `src/utils/exploreRouting.ts` |
| My activities hub | `myActivitiesPath('joined' \| 'hosted')` | `src/utils/exploreRouting.ts` |
| Fulfill participant intent (return from auth) | `explorePath({ fulfillIntent })`, `exploreFulfillIntentReturnPath()` | `src/utils/exploreRouting.ts` |
| Platform nav constants | `EXPLORE_MAP_PATH`, `joinAuthPath()` | `src/config/platform.ts` |
| Sign-in with return | `buildSignInRedirect(location)`, `signInPathForReturn(path)` | `src/utils/authReturnContext.ts` |
| Post-auth fallback | `resolveAuthExitFallback()` → explore | `src/utils/authRedirect.ts` |

## Browse defaults

- Landing on `/explore` without `list=1` → **map view** (list panel closed).
- **Mobile map filters:** primary row shows All · Hiking · Camping; Rideshare · Others · Shops live under **More**.
- **Guest join:** tapping Join on an activity opens a signup sheet (returns to map after auth).
- First map visit shows a 3-step coach (localStorage `uaetrail:explore-coach-seen`); guest join banner appears after coach is dismissed.
- Pass `list: true` to `explorePath()` only when opening the browse sheet intentionally.
- Filter/panel query params select map context; they do not imply list mode.

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

## Auth redirects

- Gated actions → always `buildSignInRedirect()` or `signInPathForReturn(returnPath)`.
- Never bare `/signin` when the user should return to the current page or action.
- Participants without a redirect → `EXPLORE_MAP_PATH` after sign-in.

## Copy

User-facing label for map browse: **Explore** (nav, drawer, CTAs). Internal URL panel name `venues` stays in query strings only.

## Adding new links

1. Pick the surface (browse / personal / detail).
2. Use the helper from `exploreRouting.ts` — no raw `/explore?…` strings outside that module and `platform.ts`.
3. Detail pages pass `backTo={detailBackPath('…')}` unless a tighter parent context exists.
