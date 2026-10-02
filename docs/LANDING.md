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

| Section | Component | Job |
|---------|-----------|-----|
| Hero | `HomeMobileLaunch`, `HomeDesktopHero` | Promise + CTAs |
| Trust chips | `HomeProofStrip` | 3-second scan (no paragraphs on mobile) |
| Live proof | `HomeLiveActivityRail` | Real upcoming outings — show early (public API + fallback) |
| Why us | `HomeValueProps` | Outcomes only — see / say / connect (no duplicate headline on mobile) |
| How it works | `HomeDayTimeline` | Numbered journey — only place for ordered steps |
| Map preview | `HomeProductPreview` | Static mock when live rail is thin; hidden on mobile when live data is strong |
| Social proof | `HomeTestimonials` | Featured quote on mobile; grid on desktop |
| FAQ | `FaqPreview` in `Home.tsx` | Objections (2 items on mobile) |
| Close CTA | `HomeMarketingClose` | Repeat hero conversion |
| Founder | `HomeFounderStory` | Brand trust (desktop; hidden on mobile) |

**Scroll order** (must match `src/pages/Home.tsx`):

1. Hero  
2. Proof strip  
3. Live activity rail  
4. Value props  
5. How it works  
6. Product preview (conditional)  
7. Testimonials  
8. FAQ  
9. Closing CTA  
10. Founder story  

## What does **not** belong here

Put these on **`/explore`** or in-app flows — not on Home unless explicitly requested:

- Demand / “find a group” posting mechanics  
- Become-a-host / agency / shop signup flows  
- Buddies, social groups, DMs, badges hub  
- Full map filters, venues panel, shops panel  
- Host console, check-in, waitlist detail  
- Profile hub IA  

Home may **mention** host-approved joins and the map — that is the acquisition story. It must not **teach** the full two-sided marketplace.

## Copy source of truth

- All marketing strings: `src/content/homeLanding.ts`  
- FAQ preview ids: `src/content/platformFaqs.ts` (`HOME_FAQ_PREVIEW`)  
- Page shell: `src/pages/Home.tsx`  
- Section UI: `src/components/home/*`  

Top-of-file comment in `homeLanding.ts` must stay: *visitors convert here; members live on map + profile*.

## Hero CTAs (current)

- **Mobile:** Open Map (primary button) + Join free (underlined text link) — `HOME_HERO_PRIMARY_CTA`, `HOME_HERO_JOIN_CTA`
- **Desktop primary:** View on Map → `/explore` (`HOME_HERO_PRIMARY_CTA_DESKTOP`)
- **Desktop secondary:** Join Free → auth with return to `/explore` (glass pill button, not underlined — `HOME_HERO_JOIN_CTA_DESKTOP`)
- Desktop header: Log in pill → sign-in with return  

## Responsive rules

- **Mobile hero:** minimum height `--home-launch-min: max(22rem, min(52svh, 52dvh))` — uses **svh** for stable mobile browser chrome; the block **may grow taller** if headline/CTAs wrap (large text, long copy). Flex column: brand on top, copy/CTAs `margin-top: auto` with safe-area foot padding. No negative-margin overlap hacks. **Short screens** (`max-height: 720px` / `520px`) and **narrow** (`@container max-width: 360px`) tighten type and CTA width. Headline `HOME_HERO_HEADLINE`, subline `HOME_HERO_SUBLINE_MOBILE`.  
- **Mobile (rest):** cap live rail to 2 cards; hide product preview when live API is healthy  
- **Desktop:** left-aligned hero copy, full section subtitles, founder story visible  
- Shared hero image overlays on **mobile and desktop:** `.landing-hero-overlay-r` (left scrim), `.landing-hero-overlay-t` (top/bottom). Same crop: `object-position: center 30%`.  

## Before changing Home

1. Confirm change is for **guests only**  
2. Ask: does this belong on signup funnel or on `/explore`?  
3. Update this doc + `NAVIGATION.md` § Home if section order or jobs change  
4. Avoid duplicate messages across proof strip and value props  

## Related docs

- [`NORTHSTAR.md`](./NORTHSTAR.md) — product concept, voice, surface jobs  
- [`NAVIGATION.md`](./NAVIGATION.md) — three surfaces, auth redirects  
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — signed-in default landing is `/explore`  
- [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) — map copy (not Home copy)  
