# UAE Trail: Homepage UI/UX Plan (v2, focused scope)
**For Cursor** · Product Owner + Senior UI/UX view

> **Scope:** Guest marketing homepage (`/`) UI/UX only. See [`LANDING.md`](./LANDING.md) for funnel rules and [`content.md`](./content.md) + `src/content/homeMarketing.ts` for live copy.

## Shipped state (Oct 2026)

**Live on `/`:** `src/pages/Home.tsx` + `src/components/home/v2/**` · Copy: `src/content/homeMarketing.ts` · Activity fallback data: `src/content/homeLanding.ts`.

| # | Section | Component |
|---|---------|-----------|
| — | Header | `HomeMarketingHeader` (Log in · Join free; solid on scroll) |
| 1 | Hero carousel | `HomeHeroSection` + `HeroCarousel` |
| 2 | Upcoming outings | `HomeActivitiesSection` + `EmirateChips` + `ActivityCardCarousel` |
| 3 | How it works | `HomeHowItWorksSection` |
| 4 | Reviews + FAQ | `HomeReviewsFaqSection` |
| — | Footer | Site `Footer` via `Layout` (not v2 marketing footer) |

**Not on `/` (by PO choice):** dark **Final CTA** band (`HomeFinalCtaSection` exists but is not rendered). Hero ends with proof chips → **Explore the map** / **Join free**; no separate helper line under buttons.

**Hero content order:** eyebrow → H1 → subcopy (one line) → **proof points** → CTAs → linked activity chip on carousel.

---

## 1. Product Brief

### 1.1 Problem
- The same message appears three times: trust strip, "Find your people", "How it works".
- Hero background is a single static image; it doesn't show what the app offers.
- Activity cards reuse the same photos for different places (a Dubai beach run and a Jebel Jais hike share an image).
- Inconsistent time formats, duplicated labels ("Co-founder · Co-founder"), names without surnames, "Free to join" can mislead when some activities cost AED 120-200.
- Visitors can't tell in ~5 seconds what the product does and what to do next.

### 1.2 Goals
| Goal | Metric | Target |
|---|---|---|
| Understand the product fast | 5-second test: % who can say what it does | ≥ 80% |
| Drive discovery | Click-through to map or an activity from the hero and cards | +X% vs baseline |
| Convert interest | Sign-up button clicks / sessions | +X% vs baseline |
| Feel polished and trustworthy | Usability test: "looks trustworthy" rating | ≥ 4/5 |
| Fast and smooth | Lighthouse mobile Performance ≥ 90, CLS < 0.1, LCP < 2.5 s | Pass |

### 1.3 Non-goals
Map, chat, create-activity flow, payments, and any pages other than the homepage.

### 1.4 Personas (for design decisions)
1. **Newcomer / solo:** needs reassurance (verified host, clear plan) and an obvious first step.
2. **Regular hiker:** wants to scan what's on this week and filter by emirate fast.
3. **Host (secondary on this page):** needs to see that hosting exists; details come later.

### 1.5 Design principles
1. **One job per section.** Merge anything that repeats.
2. **Show the product.** Real activities in the hero and cards.
3. **Scan first, read second.** Short copy, strong hierarchy, icons only where they add meaning.
4. **Green/white theme stays.** Dark appears only in the hero overlay (no final CTA band on `/`).
5. **Mobile first.** Most UAE traffic will be on phones.
6. **Accessible by default.** Contrast, keyboard, reduced motion.

---

## 2. Homepage Structure (4 sections + header/footer)

```
Header (sticky) — HomeMarketingHeader
1. Hero carousel          → Promise, proof, CTAs, live outing chip
2. Upcoming outings       → What's on (API + curated fallback)
3. How it works           → Steps + Open the map
4. Reviews + FAQ          → Trust + objections
Footer — global Layout Footer
```

**Removed / merged / deferred**
- Trust strip under hero → proof points inside hero (**before** CTAs).
- Standalone value-prop / "Find your people" sections → merged into hero + how it works.
- **Final CTA band** → deferred; hero + footer CTAs sufficient for v2.1.
- Full founder block on `/` → footer founder lines only (`HOME_FOOTER_FOUNDERS`).

---

## 3. Design System Foundations (Phase 0)

**Tokens to define in `docs/design-tokens.md` and implement as CSS variables / theme file**
| Group | Tokens |
|---|---|
| Color | `--green-600` (primary), `--green-700` (hover), `--green-50` (tint), neutrals (`--gray-50 … --gray-900`), `--ink` (text), `--surface`, `--hero-overlay` (dark gradient) |
| Tag colors | Free = green, Cost shared = amber, Paid = blue (each with bg/text/border, all ≥ 4.5:1 contrast) |
| Type | One family, weights 400/500/600. Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48 (hero H1 clamps 36 → 56) |
| Spacing | 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96 |
| Radius | 8 (chips/buttons), 12 (cards), 16 (feature panels) |
| Shadow | 2 levels: card rest, card hover |
| Layout | Max content width 1120 px; gutters 16 (mobile) / 24 (tablet) / 32 (desktop); section padding 64 mobile / 96 desktop |
| Motion | 150 ms (hover), 250 ms (UI), 500 ms (carousel crossfade); ease-out |
| Breakpoints | 360 (min), 640, 768, 1024, 1280 |

**Core components to build (each with states: default, hover, focus, active, disabled, loading)**
`Button` (primary, secondary, ghost, on-dark), `Chip` (filter, selected), `PriceTag`, `InfoPopover (ⓘ)`, `ActivityCard`, `HeroCarousel`, `ProofPoint`, `StepCard`, `ReviewCard`, `FaqAccordion`, `SectionHeader`, `Header`, `Footer`.

**Content readiness (blocks quality, not code)**
- [ ] 5 real photos, each matching the activity location (see 3.1).
- [x] FAQ answers — `src/content/homeMarketing.ts` (full list on `/faq` in `platformFaqs.ts`).
- [ ] Replace placeholder member reviews with real quotes + permission (`HOME_REVIEWS` uses illustrative copy until then).
- [ ] Founder full name on any future Final CTA band (section not on `/`).

### 3.1 Image rules
- One photo per activity, matching the place. No reuse of the Hatta lake photo for Jebel Jais, or a desert dune for Dubai Kite Beach.
- Hero: 1600×900 (also 800×450 for mobile via `srcset`); cards: 800×450. AVIF/WebP, each ≤ 200 KB.
- Focal point set per image so crops on mobile keep the subject visible.
- Remove "Real members, not stock photos" unless all images are real.

---

## 4. Section Specs

### 4.0 Header (shipped)
- **Desktop & mobile:** Logo (left) · right: **Log in** (ghost over hero) · **Join free** (primary; `PRODUCT_JOIN_CTA`).
- Optional nav links via `navLinks` prop — default empty (no dead Events / Host links).
- Over hero: transparent + white text; after ~40 px scroll → solid `bg-home-surface` + shadow.
- Sticky; skip-to-content link.

### 4.1 Hero (carousel) — shipped
**Layout**
- Left-aligned column: eyebrow → H1 → subcopy → **proof points** → primary/secondary CTAs.
- Linked **activity chip** on carousel (slide-specific title, emirate, time, price).
- Dark gradient overlay (`--hero-overlay` / `--hero-overlay-mobile`).

**Copy** (canonical: `HOME_HERO` in `homeMarketing.ts`)

| Element | Text |
|---|---|
| Eyebrow | OUTDOOR COMMUNITY · UAE & GCC (short: UAE & GCC outdoors on mobile) |
| H1 | Find your people. Get outside together. |
| Subcopy | Hikes, camps, trail runs and group outings across the UAE & GCC — for residents and visitors alike. |
| Primary button | Explore the map |
| Secondary button | Join free |
| Proof points | Host-approved groups · Residents & visitors · Free to join |

**Proof points:** 3-column grid on mobile; flex wrap on desktop. Pills with green dot (`ProofPoint`).

**Helper text** (optional, not shipped): *Free to browse and sign up. Some activities are paid.*

**Slides (4-5)**
- Each slide = a real upcoming activity; mix types: hike, camp, run, bouldering, rideshare.
- **Activity chip** bottom-left (or bottom of text column on mobile): `Jebel Jais Group Hike · RAK · Fri, 6:00 AM · AED 120` → links to that activity. Chip has a small arrow icon and hover lift.
- Text content stays fixed; only the image and chip change.

**Behavior**
- Crossfade 500 ms; autoplay every 5.5 s.
- Pauses on hover, keyboard focus and touch; **pause/play button** available.
- Dots (bottom-right desktop, bottom-center mobile), prev/next arrows on desktop only, swipe on mobile.
- `prefers-reduced-motion`: no autoplay, no animation; dots/arrows still work.
- Loading: first slide eager + `fetchpriority="high"`, rest lazy; show the first slide's image as a blurred placeholder or solid dark color to avoid flash.
- Empty/error state: fall back to 2-3 static curated slides; if only 1 slide, hide dots/arrows/pause.

**Accessibility**
- `role="region"`, `aria-roledescription="carousel"`, slides labeled "1 of 5".
- Images are real `<img>` with meaningful alt (e.g. "Hikers walking the Jebel Jais ridge at sunrise").
- Autoplay region not announced while auto-rotating; announced politely after user interaction.
- Arrow keys switch slides; Tab reaches chip and controls.

### 4.2 Upcoming outings — shipped
**Header row:** H2 **Upcoming outings** · subtitle from `HOME_ACTIVITIES` · **View all →** → `/explore`

**Emirate filter:** `EmirateChips` — rounded-full pills, UAE / emirate flag icons (`UaeEmirateFlagIcon`), horizontal scroll + edge fade on mobile; `aria-pressed` toggles; counts in `(n)`; only emirates with activities + **All**.

**Cards:** `ActivityCardCarousel` on mobile (snap scroll); skeleton ×6 while loading; curated fallback when API empty/fails (`HOME_LANDING_FALLBACK_ACTIVITIES`).

**Price tags:** `Free` · `Cost shared · AED …` · `Paid · AED …` + ⓘ popover.

**Error:** Message + **Try again** only when no cards to show; otherwise fallback cards.

### 4.3 How it works — shipped
- H2 "How it works" · subtitle "Find a plan, join the group, get outside."
- 3 `StepCard`s in a row (desktop) / stacked with a vertical connector line (mobile): number badge (green circle), icon, title, 1-2 line copy.

| # | Title | Copy |
|---|---|---|
| 1 | Open the map | Filter by emirate, tap a pin, and read the full plan: date, time, price and host. |
| 2 | Join or post yours | Request a spot and the host approves. A group chat opens so you know who you're meeting. Nothing fits? Post what you want. |
| 3 | Meet up outdoors | Add buddies and keep the chat so your next outing is one tap away. |

- Optional single CTA button under the steps: **Open the map**.
- Light green/gray tint background to separate from white sections.

### 4.4 Reviews + FAQ — shipped
**Reviews**
- H2 "People who found their outdoor crew".
- Carousel of 4 cards (featured + compact) — illustrative quotes in `HOME_REVIEWS` until real members approved.

**FAQ**
- Six questions; answers in `HOME_FAQ`; link **All FAQs →** to `/faq`.

### 4.5 Final CTA (deferred)

Component: `HomeFinalCtaSection` — **not rendered on `/`** (PO, Oct 2026). Re-enable in `Home.tsx` if a closing band is needed again.

Spec (if re-enabled):
- Dark band (`--ink`), centered. H2 "Ready to get outside with your crew?" · subcopy · **Explore the map** / **Join free** · optional founder one-liner.

### 4.6 Footer
- Columns: **Explore** (Map, Events) · **Host** (Host with us) · **Company** (About, Contact, FAQ) · **Legal** (Privacy, Terms, Community Guidelines) · Socials.
- Links to pages not built yet: either hide or point to a simple placeholder, decision by PO. Do not ship dead links.
- © 2026 UAE Trail line.

---

## 5. Content Rules (global)
- **Time format everywhere:** `Fri, 6:00 AM`, `Tomorrow, 5:00 PM`, `Sun, 5:00 PM`. One formatter function.
- **Price tag text:** `Free`, `Cost shared · AED 35`, `Paid · AED 120`.
- **Tone:** friendly, direct, short sentences; sentence case for headings.
- **No duplicated claims:** each message (verified hosts, host approves, group chat) appears once as a headline claim and at most once as a supporting detail.
- Emirate naming consistent: Dubai, Abu Dhabi, Sharjah, RAK (Ras Al Khaimah on first mention in tooltips), Fujairah, Ajman, UAQ.

---

## 6. Responsive Behavior Summary
| Element | ≥ 1024 | 640-1023 | < 640 |
|---|---|---|---|
| Header | Full nav | Full nav or condensed | Logo + Sign up + menu |
| Hero | Left text column, arrows + dots | Same, smaller H1 | Full-width text, bottom gradient, dots centered, swipe |
| Cards | 3 cols | 2 cols | 1 col |
| Filter chips | Wrap/inline | Inline | Horizontal scroll with fade |
| Steps | 3 in a row | 3 in a row (tight) | Stacked with connector |
| Reviews | Featured + 3 | Featured + 3 (2×) | Swipeable |
| Footer | 4-5 cols | 2 cols | Accordion or stacked |

Touch targets ≥ 44×44 px. No horizontal page scroll at 360 px.

---

## 7. Microinteractions and Polish
- Buttons: hover darken + 1 px lift; focus ring 2 px green + offset.
- Cards: hover lift and image zoom 1.03 (250 ms), disabled under reduced motion.
- Chips: selected state animates fill; keyboard arrows move between chips.
- Carousel: progress indicator on the active dot fills over 5.5 s (hidden under reduced motion).
- Section reveal: subtle fade-up (12 px) on scroll, once, disabled under reduced motion.
- Skeletons for any data-driven area; never show layout jumps.
- Header shrink/solid transition on scroll.

---

## 8. Phased Delivery

| Phase | Name | Outcome | Est. |
|---|---|---|---|
| 0 | Foundations | Tokens, components list, wireframes, content and image readiness, baseline | 1-2 d |
| 1 | Components | Build shared components in isolation | 2-3 d |
| 2 | Homepage assembly | 5-section layout, merged content, copy fixes | 2 d |
| 3 | Hero carousel | Slides, behavior, accessibility | 2 d |
| 4 | Polish and states | Loading/empty/error, microinteractions, responsive pass | 1-2 d |
| 5 | QA and launch | Cross-device, a11y, performance, analytics | 1-2 d |

### Phase 0: Foundations
**Designer:** wireframes (mobile first, then desktop) for all 5 sections; hi-fi for hero and card; tag color palette; image focal points; clickable prototype for the 5-second test.
**PO:** confirm copy in Sections 4-5, decide on placeholders for pages that don't exist yet, collect photos and testimonials, record baselines.
**Cursor:** set up `.cursor/rules`, `docs/design-tokens.md`, `docs/content.md`.

**Cursor prompt (tokens)**
```
Read .cursor/rules and docs/design-tokens.md. Implement the design tokens as
<CSS variables / theme file> exactly as documented (color, tag colors, type
scale, spacing, radius, shadow, motion, breakpoints). Create a small
/styleguide route that shows each token and component state. Do not add new
dependencies. Show a file plan first.
```

### Phase 1: Components
Build in this order: `Button`, `PriceTag`, `Chip/EmirateChips`, `InfoPopover`, `ActivityCard` (+ skeleton), `StepCard`, `ReviewCard`, `FaqAccordion`, `SectionHeader`, `Header`, `Footer`. Every component shows all states on `/styleguide`.

**Cursor prompt (components)**
```
Build these components using only design tokens: Button (primary/secondary/
ghost/on-dark), PriceTag (free|cost-shared|paid), EmirateChips (controlled,
horizontal scroll, aria-pressed), InfoPopover (hover/focus/tap, aria-
describedby), ActivityCard (+ skeleton; whole card is a link), StepCard,
ReviewCard, FaqAccordion (aria-expanded, one open at a time), Header
(transparent over hero, solid after scroll, mobile menu), Footer.
Add formatActivityTime() util: "Fri, 6:00 AM" / "Tomorrow, 5:00 PM" with tests.
Each component: typed props, keyboard support, visible focus, reduced-motion
respect, and an entry on /styleguide. Show file plan first.
```

### Phase 2: Homepage assembly
Assemble the 5 sections using the components; wire activities to existing data; remove the trust strip and "Find your people"; apply copy and fixes from Sections 4-5.

**Cursor prompt**
```
Read docs/content.md. Restructure the homepage at <path> into: Hero (static
first slide for now), Activities near you (EmirateChips filtering the grid
client-side, skeleton/empty/error states), How it works (3 StepCards),
Reviews + FAQ in one block, Final CTA with one-line founder note.
Remove the standalone trust strip and the "Find your people" section; move the
proof points into the hero. Use the single time formatter everywhere. Fix
duplicate/missing labels from docs/content.md. Mobile-first; verify 360/768/
1024/1440. Show file plan first.
```

### Phase 3: Hero carousel
Spec in 4.1.

**Cursor prompt**
```
Build HeroCarousel at <path>. Props: slides[{id,imageUrl,imageSrcSet,alt,
title,emirate,startsAt,priceLabel,href}]. Real <img> (not CSS backgrounds);
first slide eager + fetchpriority=high, others lazy; fixed aspect ratio to
prevent layout shift. Crossfade 500ms, autoplay 5500ms, pause on hover/focus/
touch, pause/play button, dots with progress fill, prev/next on desktop, swipe
on mobile. Disable autoplay/animation with prefers-reduced-motion. ARIA
carousel semantics and keyboard support. Bottom chip links to the activity
using formatActivityTime(). Overlay gradient from tokens. Fallback to static
slides on empty/error; hide controls if 1 slide. Tests: autoplay pause/resume,
reduced-motion, keyboard navigation.
```

### Phase 4: Polish and states
Add skeletons, empty/error states, microinteractions (Section 7), responsive tuning (Section 6). Check text truncation, long Arabic/English names, and slow-network behavior.

### Phase 5: QA and launch
**Visual:** 360 / 768 / 1024 / 1440; iOS Safari, Android Chrome, desktop Chrome/Safari/Edge.
**Accessibility:** keyboard-only run-through; screen reader check on carousel, chips, accordion; contrast on every slide; reduced-motion check.
**Performance:** Lighthouse mobile ≥ 90; LCP < 2.5 s; CLS < 0.1; hero image ≤ 200 KB.
**Content:** one time format; no duplicate labels; each image matches its location; no placeholder text or dead links.
**Usability test (5 people, 15 min each):** (1) 5-second test: "What does this site do?"; (2) task: find a Friday hike in RAK; (3) task: find how to sign up; (4) "What does Cost shared mean?" (tests the ⓘ).
**Analytics events:** `hero_slide_click`, `hero_cta_click`, `proof_point_view`, `emirate_chip_click`, `activity_card_click`, `info_icon_click`, `how_it_works_cta_click`, `faq_expand`, `final_cta_click`, `signup_click`, `header_nav_click`.

**Rollout:** preview URL → PO + designer sign-off → release → monitor 2 weeks (conversion, bounce, scroll depth, errors) → iterate (e.g. A/B test carousel vs static hero).

---

## 9. Cursor Setup

### `.cursor/rules/project.mdc`
```
# UAE Trail homepage rules
- Stack: <framework>, <language>, <styling>, <testing>. No new libs without asking.
- Theme: green/white. Only tokens from docs/design-tokens.md; no hard-coded colors/sizes.
- One component per file in <path>; typed props; each shown on /styleguide.
- Accessibility: semantic HTML, keyboard support, visible focus, alt text, contrast >= 4.5:1,
  respect prefers-reduced-motion.
- Images: real <img> with alt, width/height or aspect-ratio, lazy except the first hero slide.
- Time format: formatActivityTime() everywhere.
- Copy comes from docs/content.md; do not invent copy or testimonial names.
- Mobile-first; verify 360/768/1024/1440.
- Before large edits, present a file-by-file plan and wait for approval.
```

### Working method
1. One phase per branch and per Cursor chat; start each with "Read .cursor/rules, docs/design-tokens.md, docs/content.md."
2. Plan first, edit second.
3. Attach the current homepage screenshot/PDF and wireframes to the first prompt of each phase.
4. Small PRs per component, each with tests and a `/styleguide` entry.
5. PO + designer review diffs against the acceptance criteria before merge.

### Definition of Done (every phase)
Acceptance met · responsive · accessible · tests pass · Lighthouse thresholds met · copy approved · no placeholders or dead links · PO and designer sign-off.

---

## 10. Open Decision (PO, before Phase 2)
Header and footer links to pages that don't exist yet (Events, Host with us, About, Privacy, Terms): hide them, or point them to a simple placeholder? Recommendation: hide any link whose page isn't ready, so the homepage ships with no dead links.

---

## 11. v2.1 audit — completed (Oct 2026)

| Area | Status |
|------|--------|
| People-first H1 + single-line subcopy | Done |
| Proof points before CTAs | Done |
| Join free label sitewide on `/` | Done |
| Upcoming outings + emirate flags + API fallback | Done |
| FAQ answers | Done |
| Illustrative reviews | Done (replace with real when approved) |
| Final CTA band | **Removed from page** (not deleted from codebase) |
| a11y: section heading ids, 24px dots, `inert` drawers, chip roles | Done |

**Backlog:** real activity photos per location · verified testimonials · optional hero helper line · Lighthouse/analytics pass (§8 Phase 5) · re-enable Final CTA if conversion testing needs it.
