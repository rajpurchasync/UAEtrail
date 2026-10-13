# Homepage design tokens

**Scope:** Guest marketing homepage (`/`) only — see [UAE_Trail_Homepage.md](./UAE_Trail_Homepage.md) and [LANDING.md](./LANDING.md).

**Rule:** Use only these tokens in homepage UI. No hard-coded colors, font sizes, or spacing in components. Implement as CSS custom properties (and map into Tailwind in Phase 1).

**Related:** Copy strings live in [content.md](./content.md).

---

## Color

### Primary green

Aligned with `emerald` in [tailwind.config.js](../tailwind.config.js).

| Token | Value | Usage |
|-------|-------|--------|
| `--green-600` | `#059669` | Primary buttons, links, selected chips |
| `--green-700` | `#047857` | Primary hover / active |
| `--green-50` | `#ecfdf5` | Section tints (e.g. How it works background) |

### Neutrals (Tailwind gray scale)

| Token | Value |
|-------|-------|
| `--gray-50` | `#f9fafb` |
| `--gray-100` | `#f3f4f6` |
| `--gray-200` | `#e5e7eb` |
| `--gray-300` | `#d1d5db` |
| `--gray-400` | `#9ca3af` |
| `--gray-500` | `#6b7280` |
| `--gray-600` | `#4b5563` |
| `--gray-700` | `#374151` |
| `--gray-800` | `#1f2937` |
| `--gray-900` | `#111827` |

### Semantic

| Token | Value | Usage |
|-------|-------|--------|
| `--ink` | `#111827` (`--gray-900`) | Primary body text; final CTA band background |
| `--surface` | `#ffffff` | Page and card backgrounds |
| `--surface-muted` | `#f9fafb` (`--gray-50`) | Subtle section alternates |

### Hero overlay (`--hero-overlay`)

Dark gradient over hero photos so white text meets **≥ 4.5:1** contrast on every slide.

**Desktop (left → right):**

```css
--hero-overlay: linear-gradient(
  90deg,
  rgba(17, 24, 39, 0.88) 0%,
  rgba(17, 24, 39, 0.72) 42%,
  rgba(17, 24, 39, 0.35) 70%,
  rgba(17, 24, 39, 0.15) 100%
);
```

**Mobile (bottom → top):**

```css
--hero-overlay-mobile: linear-gradient(
  0deg,
  rgba(17, 24, 39, 0.92) 0%,
  rgba(17, 24, 39, 0.75) 45%,
  rgba(17, 24, 39, 0.25) 100%
);
```

Use `--ink` (`#111827`) as the loading placeholder behind the first hero image when the photo is not yet loaded.

### Price tag colors

All **bg / text / border** pairs must meet **WCAG 4.5:1** contrast for normal text.

**Free (green)**

| Token | Value |
|-------|-------|
| `--tag-free-bg` | `#ecfdf5` (`--green-50`) |
| `--tag-free-text` | `#047857` (`--green-700`) |
| `--tag-free-border` | `#a7f3d0` (`emerald-200`) |

**Cost shared (amber)** — from `amber` in tailwind.config.js

| Token | Value |
|-------|-------|
| `--tag-shared-bg` | `#fffbeb` (`amber-50`) |
| `--tag-shared-text` | `#b45309` (`amber-700`) |
| `--tag-shared-border` | `#fde68a` (`amber-200`) |

**Paid (blue)**

| Token | Value |
|-------|-------|
| `--tag-paid-bg` | `#eff6ff` |
| `--tag-paid-text` | `#1d4ed8` |
| `--tag-paid-border` | `#bfdbfe` |

---

## Typography

| Token | Value | Usage |
|-------|-------|--------|
| `--font-sans` | `"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, sans-serif` | All homepage text |
| `--font-weight-normal` | `400` | Body |
| `--font-weight-medium` | `500` | Labels, emphasis (Tailwind `font-semibold` in this repo) |
| `--font-weight-semibold` | `600` | Headings, buttons (Tailwind `font-bold` in this repo) |

### Type scale

| Token | Size | Typical use |
|-------|------|-------------|
| `--text-xs` | `12px` | Legal, fine print |
| `--text-sm` | `14px` | Proof points, meta, helper text |
| `--text-base` | `16px` | Body, buttons |
| `--text-lg` | `18px` | Subcopy, card titles |
| `--text-xl` | `24px` | H2 (section titles) |
| `--text-2xl` | `32px` | Large quotes |
| `--text-5xl` | `48px` | Display (rare) |
| `--text-hero` | `clamp(2.25rem, 4vw + 1rem, 3.5rem)` | Hero H1 (36px → 56px) |

Line height: **1.25** for headings, **1.5** for body unless a component spec says otherwise.

---

## Spacing

Base unit: **4px**. Use token names in layout; avoid arbitrary pixel values.

| Token | Value |
|-------|-------|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |
| `--space-24` | `96px` |

**Common compositions**

- Proof points row gap: `--space-6` (24px) per spec (`gap-24` = 24px).
- Activity card hover lift: `2px` (not a spacing token; transform only).
- Card grid gap: `--space-6` (24px) default.

---

## Radius

| Token | Value | Usage |
|-------|-------|--------|
| `--radius-sm` | `8px` | Chips, buttons |
| `--radius-md` | `12px` | Cards (`ActivityCard`, `ReviewCard`, `StepCard`) |
| `--radius-lg` | `16px` | Feature panels |

---

## Shadow

| Token | Value | Usage |
|-------|-------|--------|
| `--shadow-card` | `0 2px 8px rgba(0, 0, 0, 0.06)` | Card at rest |
| `--shadow-card-hover` | `0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)` | Card hover; header solid state |
| `--shadow-header` | `0 2px 8px rgba(0, 0, 0, 0.06)` | Sticky header after scroll |

---

## Layout

| Token | Value | Usage |
|-------|-------|--------|
| `--content-max-width` | `1120px` | Centered content column |
| `--gutter-mobile` | `16px` | Horizontal padding &lt; 768px |
| `--gutter-tablet` | `24px` | 768px – 1023px |
| `--gutter-desktop` | `32px` | ≥ 1024px |
| `--section-padding-y-mobile` | `64px` | Vertical section padding |
| `--section-padding-y-desktop` | `96px` | Vertical section padding ≥ 1024px |
| `--header-height-mobile` | `56px` | Sticky header |
| `--header-height-desktop` | `64px` | Sticky header |
| `--hero-content-max-width` | `560px` | Hero text column |
| `--hero-height-desktop` | `min(520px, 72svh)` | Hero region desktop cap |
| `--hero-height-mobile` | `min(460px, 68svh)` | Hero region mobile cap |
| `--hero-crossfade-duration` | `1.15s` | Hero slide opacity crossfade |
| `--hero-crossfade-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Hero crossfade easing |
| `--hero-kenburns-duration` | `8s` | Subtle zoom on active slide (disabled with reduced motion) |

**Touch targets:** minimum **44×44px** for interactive controls.

**Minimum viewport width:** **360px** — no horizontal page scroll.

---

## Motion

| Token | Value | Usage |
|-------|-------|--------|
| `--duration-hover` | `150ms` | Buttons, chips, small UI |
| `--duration-ui` | `250ms` | Card hover, image zoom, filter fade |
| `--duration-carousel` | `500ms` | Hero crossfade |
| `--duration-faq` | `200ms` | FAQ accordion expand |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Default easing (`ease-out`) |

**Carousel autoplay interval:** 5500ms (not a CSS token; behavior in `HeroCarousel`).

**`prefers-reduced-motion: reduce`:** No autoplay, no crossfade/scroll animations, no card image zoom. Dots, arrows, keyboard navigation, and accordion still work.

---

## Breakpoints

| Token | Min width | Notes |
|-------|-----------|--------|
| `--bp-min` | `360px` | Supported minimum; design at 360 first |
| `--bp-sm` | `640px` | 2-column activity grid |
| `--bp-md` | `768px` | Tablet gutters |
| `--bp-lg` | `1024px` | 3-column grid, desktop header |
| `--bp-xl` | `1280px` | Wide desktop |

Implement with standard `@media (min-width: …)` or Tailwind `screens` alignment in Phase 1.

---

## Focus and interaction

| Token | Value | Usage |
|-------|-------|--------|
| `--focus-ring-width` | `2px` | Visible focus outline |
| `--focus-ring-color` | `var(--green-600)` | Focus ring color |
| `--focus-ring-offset` | `2px` | Outline offset from control |
| `--focus-ring` | `2px solid var(--green-600)` | Shorthand; apply with `outline-offset: var(--focus-ring-offset)` |

Buttons: hover darken + **1px** translateY lift (disable lift under reduced motion).

Cards: hover **2px** translateY + `--shadow-card-hover`; image scale **1.03** over `--duration-ui` (disable under reduced motion).

---

## Component inventory

Build each with states: **default, hover, focus, active, disabled, loading**. Verify on guest `/` (and in PR review).

| Component | Variants / notes |
|-----------|------------------|
| `Button` | primary, secondary, ghost, on-dark |
| `Chip` | filter (emirate), selected (filled green) |
| `PriceTag` | free, cost-shared, paid |
| `InfoPopover` | ⓘ trigger; hover, focus, tap |
| `ActivityCard` | Whole card is one link; skeleton variant |
| `HeroCarousel` | Slides, dots, arrows, pause/play |
| `ProofPoint` | Icon + 2–3 words |
| `StepCard` | Number badge, icon, title, copy |
| `ReviewCard` | Featured + compact |
| `FaqAccordion` | One open at a time; `aria-expanded` |
| `SectionHeader` | H2 + subtitle + optional action |
| `Header` | Transparent over hero → solid on scroll |
| `Footer` | Column layout |

---

## Image rules

From [UAE_Trail_Homepage.md](./UAE_Trail_Homepage.md) §3.1.

1. **One photo per activity**, matching the real location. Do not reuse the same asset for different emirates or venues.
2. **Dimensions**
   - Hero: **1600×900**; provide **800×450** in `srcset` for mobile.
   - Activity cards: **800×450** (16:9).
3. **Format:** AVIF/WebP preferred; each file **≤ 200 KB**.
4. **Focal point:** Set per image so mobile crops keep the subject visible.
5. **Copy policy:** Do not show “Real members, not stock photos” unless every image is verified real member photography.

**Hero slides (content):** 4–5 slides; mix hike, camp, run, bouldering, rideshare — see [content.md](./content.md).

**Alt text:** Descriptive sentences (e.g. “Hikers walking the Jebel Jais ridge at sunrise”), not generic “activity image”.

**Loading:** Active slide `eager` + `fetchpriority="high"` with `decoding="async"`; neighbor slides prefetch after LCP. Optional LQIP (`*-lqip.webp`) per slide; assets live under `public/landing/hero/`. No document-level hero preload — avoids competing with JS on first paint.

---

## Content readiness (design blockers)

Quality depends on PO/content before final polish:

- [ ] 5 real photos, each matching the activity location (see Image rules).
- [x] FAQ answers — [content.md](./content.md) § FAQ / `homeMarketing.ts`.
- [ ] Replace illustrative review quotes with verified members — [content.md](./content.md) § Reviews.
- [ ] Founder full name if Final CTA band is re-enabled — [content.md](./content.md) §4.5 (deferred).

---

## Implementation (Phase 1+)

1. Add a global CSS file (e.g. `src/styles/home-tokens.css`) defining `:root { … }` variables from this doc.
2. Extend Tailwind `theme.extend` to reference the same values where practical.
3. Do not add a separate design-preview route; homepage components ship on `/` only.
4. Do not add new dependencies for tokens alone.
