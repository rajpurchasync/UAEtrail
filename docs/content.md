# Homepage content

**Scope:** Guest marketing homepage (`/`) only — structure and copy from [UAE_Trail_Homepage.md](./UAE_Trail_Homepage.md) §4–5.

**Voice:** Align with [NORTHSTAR.md](./NORTHSTAR.md) — friendly, crew-first, get outside together. Map, hosts, and join flow are *how*, not the lead promise.

**Rule for implementers:** Canonical homepage strings live in `src/content/homeMarketing.ts`. Keep this doc aligned when copy changes. FAQ and review text below match that file.

**Design:** Tokens and image rules — [design-tokens.md](./design-tokens.md).

---

## Global content rules

### Time format

Use one formatter (`formatActivityTime()`) everywhere on the homepage:

| Example | When |
|---------|------|
| `Fri, 6:00 AM` | Default weekday + time |
| `Tomorrow, 5:00 PM` | Next calendar day |
| `Sun, 5:00 PM` | Other weekdays |
| `Today, …` | Allowed when same calendar day |

Do not use `(fixed)` in user-facing copy. Use a small **Fixed time** label only when the product needs to distinguish fixed vs flexible schedules.

### Price tag text

| Type | Format |
|------|--------|
| Free | `Free` |
| Cost shared | `Cost shared · AED 35` (amount varies) |
| Paid | `Paid · AED 120` (amount varies) |

### Tone

- Friendly, direct, short sentences.
- **Sentence case** for headings (not ALL CAPS except hero eyebrow as styled).

### No duplicated claims

Each of these appears **once** as a headline-level claim and **at most once** as supporting detail on the whole page:

- Verified hosts
- Host approves who joins
- Group chat when you join

### Emirate naming

Use consistently in chips, pills, and cards:

| Label | Notes |
|-------|--------|
| Dubai | |
| Abu Dhabi | |
| Sharjah | |
| RAK | Spell out **Ras Al Khaimah** on first mention in tooltips only |
| Fujairah | |
| Ajman | |
| UAQ | Umm Al Quwain |

Filter chip order when all are shown: `All · Dubai · Abu Dhabi · Sharjah · RAK · Fujairah · Ajman · UAQ`. Hide emirates with zero activities.

---

## §4.0 Header

### Visible strings

| Element | Copy |
|---------|------|
| Nav | Map |
| Nav | Events |
| Nav | Host with us |
| Action | Log in |
| Action | Sign up |

### Behavior (not user-facing copy)

- Sticky; height per [design-tokens.md](./design-tokens.md) (`--header-height-*`).
- Over hero: transparent background, white text.
- After ~40px scroll: solid `--surface`, subtle shadow, green/dark text.
- Skip-to-content link (accessible label; e.g. “Skip to main content”).
- Mobile: Logo · **Sign up** · hamburger (Map, Events, Host with us, Log in).

---

## §4.1 Hero

### Fixed copy (same on every slide)

| Element | Copy |
|---------|------|
| Eyebrow | HOSTED HIKES & CAMPS · UAE |
| H1 | Find your hiking or camping crew in the UAE |
| Subcopy (mobile) | `HOME_HERO.subcopy` in `homeMarketing.ts` |
| Subcopy (desktop) | `HOME_HERO.subcopyDesktop` — guest hero only |
| Primary button | Explore the map |
| Secondary button | Join free |

**Hero order (shipped):** eyebrow → H1 → subcopy → primary/secondary buttons.

### Carousel backgrounds (static)

- **Images only** — curated hike/camp art (`MARKETING_HERO_CAROUSEL_SLIDES` / `buildHeroSlides()`). No per-slide activity chip or links; live plans are in **Upcoming outings**.

### Alt text pattern

Full sentence describing the scene and place, e.g.  
`Hikers walking the Jebel Jais ridge at sunrise`

### Slide mix (4–5 slides)

Content types to cover: hike, camp, run, bouldering, rideshare. Image rules: [design-tokens.md](./design-tokens.md) § Image rules.

---

## §4.2 Upcoming activities

### Section header

| Element | Copy |
|---------|------|
| H2 | Upcoming activities |
| Subtitle | Real group plans from hosts and members. Pick one and go together. |
| Action | View all → |

### Emirate filter chips

Rounded-full pills with **UAE / emirate flag icons** (`UaeEmirateFlagIcon`). `All` plus emirates that have activities. Count suffix: `(3)` not `· 3`. Horizontal scroll + edge fade on mobile; `role="group"` + `aria-pressed`.

### Activity card

- **Title:** From API (max 2 lines, ellipsis).
- **Meta:** Clock icon + formatted time (see Global time format).
- **Footer:** PriceTag + ⓘ InfoPopover.

### InfoPopover — price definitions (one line each)

Use in popover body; keep aligned with product truth when FAQ answers are finalized.

| Type | Definition (draft for UI; confirm with PO) |
|------|---------------------------------------------|
| Free | No fee to join this activity. |
| Cost shared | Host splits shared costs (e.g. fuel, permits); you pay your share. |
| Paid | Set price per person to join. |

- **Learn more** link: `/host#activity-types` only when that anchor/page exists; otherwise hide the link.

### Empty and error states

| State | Copy |
|-------|------|
| Empty (filter) | No plans in {Emirate} yet. Post one or view all |
| Error | Couldn't load outings. (button: Try again) |

When the public API fails, show **curated fallback** cards from `HOME_LANDING_FALLBACK_ACTIVITIES` if available; error UI only when there are zero cards.

### Grid / carousel

Default: **6** cards max after filter; skeleton ×6 while loading; **horizontal carousel** on mobile (`ActivityCardCarousel`).

---

## §4.3 How it works

| Element | Copy |
|---------|------|
| H2 | How it works |
| Subtitle | Find a plan, join the group, get outside. |
| Optional CTA | Open the map |

### Steps

| # | Title | Copy |
|---|--------|------|
| 1 | Open the map | Filter by emirate, tap a pin, and read the full plan: date, time, price and host. |
| 2 | Join or post yours | Request a spot and the host approves. A group chat opens so you know who you're meeting. Nothing fits? Post what you want. |
| 3 | Meet up outdoors | Add buddies and keep the chat so your next outing is one tap away. |

Background: light green/gray tint (`--green-50` / `--surface-muted` per [design-tokens.md](./design-tokens.md)).

---

## §4.4 Reviews + FAQ

### Reviews

| Element | Copy |
|---------|------|
| H2 | People who found their outdoor crew |

**Layout:** 4 review cards in a horizontal carousel (mobile snap; dots on desktop/mobile).

**Copy:** Illustrative member quotes in `src/content/homeMarketing.ts` (`HOME_REVIEWS`) — replace with verified names/quotes when PO approves.

#### Featured (carousel card 1)

| Field | Value |
|-------|--------|
| Quote | I moved to Dubai solo… (see `HOME_REVIEWS.featured`) |
| Name | Sarah M. |
| Emirate | Dubai |

#### Compact (cards 2–4)

Omar K. · Abu Dhabi · Priya N. · Sharjah · James L. · RAK — full quotes in `HOME_REVIEWS.compact`.

### FAQ

| Element | Copy |
|---------|------|
| H3 | Common questions |
| Link (optional) | All FAQs → |

Omit **All FAQs →** if `/faq` (or equivalent) is not shipped.

| # | Question | Answer |
|---|----------|--------|
| 1 | What is UAE Trail? | UAE Trail helps you find people to get outside with in the UAE and GCC — hikes, camps, trail runs, jogs, and group outings. Browse real plans on the map, connect with a group, and go together. Residents, expats, and visitors are all welcome. |
| 2 | Is it free to use? | Yes. Creating an account and browsing the map is free. Many outings are free to join. Some plans share costs (fuel, permits) or charge a set price per person — each activity shows Free, Cost shared, or Paid before you request a spot. |
| 3 | How do I find hikes and camps? | Tap Explore the map to open the live map. Filter by emirate, tap a pin, and read the full plan — date, time, host, and price. You can browse scheduled outings and outdoor places across all seven emirates. |
| 4 | How do I join an activity? | Open a plan on the map and request to join, or tap I'm going when the host allows open RSVP. The host approves who comes along. Group chat opens once you're in so you know who you're meeting before you head out. |
| 5 | What do Free, Cost shared and Paid mean? | Free means no fee to join. Cost shared means the host splits shared expenses such as fuel or permits — you pay your share. Paid means a set price per person set by the host, often for guided or professional outings. Tap ⓘ on any activity card for a one-line reminder. |
| 6 | Can I host my own activity? | Yes. Sign up, finish your profile, then use Organize on the map to post a hike, camp, run, or group plan. Many members host buddy outings in the community. Paid or professional guiding goes through Pro membership in Profile when you're ready to publish those plans. |

Accordion: one open at a time; answers remain in the DOM for accessibility.

---

---

## §4.6 Footer

### Column headings

| Column | Links |
|--------|--------|
| Explore | Map, Events |
| Host | Host with us |
| Company | About, Contact, FAQ |
| Legal | Privacy, Terms, Community Guidelines |
| (column) | Socials |

### Copyright

`© 2026 UAE Trail`

---

## PO decisions (links)

From [UAE_Trail_Homepage.md](./UAE_Trail_Homepage.md) §4.0, §4.6, §10.

| Link / area | Decision |
|-------------|----------|
| Events | Ship only if route exists; else hide (recommended) or Coming soon placeholder |
| Host with us | Same |
| About, Privacy, Terms, Community Guidelines | Same |
| **Recommendation** | **Hide** any link whose destination is not ready — no dead links on homepage |

Map, Contact, FAQ: use existing routes when available.

---

## Diff vs legacy v1 (informational)

Guest `/` uses **`src/content/homeMarketing.ts`** + **`src/components/home/marketing/**`**. Legacy strings in `homeLanding.ts` remain for fallback activities and older components not on `/`.

| Area | Legacy v1 | Shipped v2 |
|------|-----------|--------------|
| Copy file | `homeLanding.ts` headlines | `homeMarketing.ts` |
| Structure | Trust strip, value props, founder block, final CTA | Hero proof + 4 sections; no final CTA band |
| Hero CTAs | Mixed labels | `PRODUCT_EXPLORE_CTA` / `PRODUCT_JOIN_CTA` |
| FAQ on home | 4 from `HOME_FAQ_PREVIEW` | 6 in `HOME_FAQ` |

---

## Assets

Image specs and focal-point rules: [design-tokens.md](./design-tokens.md) § Image rules.

Hero slide **types** (not URLs): hike, camp, run, bouldering, rideshare.
