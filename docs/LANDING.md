# Landing / marketing page (`/`)

Companion to [`NAVIGATION.md`](./NAVIGATION.md) and [`NORTHSTAR.md`](./NORTHSTAR.md). Defines **who sees Home**, **what it must do**, and **what must not appear here**.

## Voice (north star)

Lead with **togetherness and crew**, not architecture:

- **Promise:** Find your people; get outside; go together  
- **Audience:** Residents, expats, tourists, visitors in UAE & GCC  
- **Activities:** Hikes, camps, runs, jogs, group outings — examples, not limits  
- **Mechanisms** (map, hosts, join requests) support the story — they are not the headline  

See [`NORTHSTAR.md`](./NORTHSTAR.md) for full product concept and copy anti-patterns.

## Audience (non-negotiable)

| User | Route `/` |
|------|-----------|
| **Signed out** (guest) | Renders marketing page |
| **Signed in** (any role) | **Immediate redirect** to `/explore` — never sees Home |

Enforced in `src/pages/Home.tsx` (`Navigate` when `user` is set). Post-auth fallback is also `/explore` (`src/utils/authRedirect.ts`).

**Home is not the product home.** The map (`/explore`) is where members live.

## Goal

Convert anonymous visitors in one visit:

1. **Primary:** Open Map (`EXPLORE_MAP_PATH`) — browse before or after signup
2. **Secondary:** Join free (`joinAuthPath(EXPLORE_MAP_PATH)`) — underlined link → account → land on map

Do **not** use Home to onboard signed-in users or document the full app.

## What belongs here (guest signup funnel)

Homepage v2 (`src/components/home/marketing/sections/*`, `src/content/homeMarketing.ts`):

| Section | Component | Job |
|---------|-----------|-----|
| Hero carousel | `HomeHeroSection` | Promise, CTAs; **static** photo carousel (no live outing cards) |
| Upcoming outings | `HomeActivitiesSection` | Public `GET /activities` only; honest empty state when none live |
| How it works | `HomeHowItWorksSection` | Only place for ordered steps |
| Reviews + FAQ | `HomeReviewsFaqSection` | Social proof + objections |

**Scroll order** (must match `src/pages/Home.tsx`):

1. Hero carousel  
2. Upcoming outings  
3. How it works  
4. Reviews + FAQ  

## What does **not** belong here

Put these on **`/explore`** or in-app flows — not on Home unless explicitly requested:

- Demand / “find a group” posting mechanics  
- Become-a-host / agency / shop signup flows  
- Buddies, social groups, DMs, Trail Points  
- Full map filters, venues panel, shops panel  
- Operator desk, check-in, waitlist detail  
- Profile hub IA  

Home may **mention** host-approved joins and the map — that is the acquisition story. It must not **teach** the full two-sided marketplace.

## Copy source of truth

| What | Where |
|------|--------|
| Marketing strings | `src/content/homeMarketing.ts` |
| Activity rail (featured → upcoming, wire photos) | `useHomeLandingActivities` → `GET /activities` |
| Activity rail shape (types only) | `src/content/homeLanding.ts` |
| Home emirate chips | Derived from loaded activity cards only (`HomeActivitiesSection`) |
| Review carousel | `GET /reviews/marketing-highlights` via `useHomeMarketingReviews` (hidden when empty) |
| Canonical CTA labels | `src/content/productNorthStar.ts` (`PRODUCT_EXPLORE_CTA`, `PRODUCT_JOIN_CTA`) |
| Full FAQ corpus + JSON-LD | `src/content/platformFaqs.ts` |
| Page shell | `src/pages/Home.tsx` |
| Guest layout chrome | `src/components/layout/Layout.tsx` (minimal shell on `/`; no bottom nav / compose rail) |
| Product chrome (other routes) | `src/components/layout/ProductShell.tsx` (lazy) |
| Section UI | `src/components/home/marketing/**` |
| Hero image paths | `src/config/marketingHeroImages.ts`, `public/landing/hero/*` |
| Hero slides | `src/utils/buildHeroSlides.ts` |

## Performance (guest `/`)

- **Route / bundle:** `Home` and heavy sections (`HomeActivitiesBlock`, how-it-works, reviews/FAQ, site footer) load via `React.lazy` + `Suspense`; activities API runs on `requestIdleCallback` inside the deferred block.
- **Layout:** Guest `/` skips `ProductShell` (map nav, compose rail, API banner on marketing path) so first paint is hero + header only.
- **Hero images:** Art-directed `<picture>` at 768px; tiny LQIP optional per slide; first slide uses `landing/hero/hero-summit-hiker-*` (OG JPEG/WebP at repo root kept for meta). Neighbor slides prefetch after LCP; carousel crossfade uses `--hero-crossfade-*` in `home-tokens.css`.
- **Fonts:** Self-hosted Plus Jakarta (`src/styles/fonts.css`) — no Google Fonts CDN.
- **Dev:** Service worker is unregistered on localhost; production PWA uses `public/sw.js` (localhost fetch passthrough).
- **Assets:** `npm run heroes:optimize` / `heroes:lqip` after banner imports (`scripts/dev/optimize-hero-images.mjs`, `scripts/dev/generate-hero-lqips.mjs`).

## Hero (v2 — current)

**Order:** eyebrow → H1 → subcopy → **Explore the map** + **Join free** (side by side). Background carousel uses **curated static images** only; real outings are in **Upcoming outings** below.

| Element | Copy source |
|---------|-------------|
| H1 | `HOME_HERO.headline` |
| Subcopy | `HOME_HERO.subcopy` |
| Primary CTA | Explore the map → `/explore` |
| Secondary CTA | Join free → auth, return `/explore` |
| Header | Log in · Join free (`HOME_HEADER_NAV`) |

Guest `/` UI lives under `src/components/home/marketing/**` only (v1 launch components removed).

## Responsive notes (v2)

- Hero overlaps header via negative margin; carousel min-height from `--hero-height-mobile` / desktop cap in tokens.
- **Upcoming outings:** horizontal card carousel on narrow viewports; emirate filter scrolls with edge fade.
- **Reviews:** horizontal snap carousel on mobile.
- Signed-in users never see this page — no mobile bottom nav conflict for guests on `/` beyond global Layout.

## Before changing Home

1. Confirm change is for **guests only**  
2. Ask: does this belong on signup funnel or on `/explore`?  
3. Update this doc + `NAVIGATION.md` § Home if section order or jobs change  
4. Avoid duplicate messages across hero proof chips and FAQ

## Related docs

- [`NORTHSTAR.md`](./NORTHSTAR.md) — product concept, voice, surface jobs  
- [`NAVIGATION.md`](./NAVIGATION.md) — three surfaces, auth redirects  
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — signed-in default landing is `/explore`  
- `src/explore/exploreCopy.ts` — map copy (not Home copy)  
