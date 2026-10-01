# Profile + Trips redesign — phased plan (`experiment-ui`)

Companion to [`consumer-mobile-ia.md`](./consumer-mobile-ia.md) and [`NAVIGATION.md`](../NAVIGATION.md).

**Policy:** Complete **Phase 1** (Profile hub) before starting **Phase 2** (Trips hub). Phase 2 is large (new map surface, URL cleanup, list UX); do not ship Trips map until Phase 1 launcher + goal placement is stable on device.

---

## Why two phases

| Problem today | Phase 1 fixes | Phase 2 fixes |
|---------------|---------------|---------------|
| Profile menu buried in scroll; duplicates bottom tabs | Above-fold launcher; goal summary; no Trips/Messages in menu | — |
| Goal setup lives only on Profile | Goal **primary on Trips**, summary on Profile | Goal strip integrated into Trips chrome |
| Trips feels patched (`segment` + `tab` + `sub`, map jumps to Explore) | — | Single mental model: **Upcoming** vs **Completed** + **My map** |

---

## Phase 1 — Profile hub (do first)

**Outcome:** Profile reads as **identity + quick launcher**, not a Settings dashboard.

### Layout (target)

1. **Identity hero (~35–45% viewport)** — avatar, name, meta, stats (Followed by · Joined · Hosted), view public / share / edit.
2. **Quick launcher card (above fold)** — one grid, **emoji + short label** (not emoji-only):
   - **Friends** (badge for requests if any)
   - **Badges** (earned count)
   - **Contributions**
   - **Settings**
   - **Hosting** (hosts only)
   - Do **not** duplicate **Trips** or **Messages** (bottom tabs).
3. **Member goal** — compact progress on Profile; full editor reachable from here **and** from Trips (same API).
4. **Sign out** — separate, subtle; not in the grid.

### Docs / acceptance

- Update `consumer-mobile-ia.md` when shipped (remove “Go to” chevron list; document launcher).
- First-time test: Friends + Badges reachable without scrolling on iPhone SE-class height.

### Explicitly out of Phase 1

- Trips page restructure
- Personal trips map
- Removing `/explore?myTrips=1` (can stay until Phase 2)

---

## Phase 2 — Trips hub redesign (next)

**Outcome:** `/trips` is the **home for your outings** — upcoming plans, history, saves, and **your** map — without sending users to the public Explore map.

### Current pain (as-built)

- **Three layers of navigation:** `segment` (upcoming | past | wishlist) + `tab` (joined | hosted) + `sub` (attended, etc.).
- **Map** icon opens **Explore** with `myTrips=1` — same map chrome as discovery; easy to confuse with “browse the UAE.”
- **Wishlist** is a third top segment beside Past, while **Hosted** hides under Upcoming + tab.
- **Search + FAB + hub cards** compete for attention on Upcoming.

### Target information architecture

#### Primary chrome — horizontal segments (scroll if needed)

Recommended **left-to-right** order (product language: “what’s next” first):

| Segment | Purpose |
|---------|---------|
| **Upcoming** | Joined + pending; host upcoming if applicable; **member goal strip** at top |
| **Completed** | History — sub-filters below (not a third top tab for wishlist alone) |
| **Wishlist** | Saved plans / places (or nested under Completed as “Saved” — decide in design spike) |

User suggestion: **Upcoming on top**, segments in a **horizontally scrollable** row (RTL locale can mirror visually; default LTR scroll).

#### Completed — secondary filters (chips or sub-tabs)

| Filter | Meaning |
|--------|---------|
| **Joined** | Checked-in or attended as participant |
| **Hosted** | Outings you led (host role) |
| **Self** | Define in spike: solo check-ins, personal outings without host, or “created by me” — align with data model before build |

Avoid duplicating the same lists under both `segment=past` and `sub=`.

#### My map (not Explore)

- **Entry:** “View on map” from Trips chrome (toggle list/map or dedicated segment).
- **Scope:** **This user only** — pins derived from:
  - **Completed** outings (joined/hosted per active filter), and
  - **Wishlist** saves (per product rules).
- **Not** global Explore: no community discovery layers, no demand pins, no full venue catalog.
- **Visual reference:** **Nomadtable-style** personal travel map — clean basemap, owned pins, light clustering, tap → trip/place detail.
- **Route (proposal):** `/trips/map` or `/trips?view=map` with optional `filter=joined|hosted|wishlist` — **do not** use `/explore?myTrips=1` as the canonical Trips map after Phase 2.

#### Member goal on Trips

- **Primary** surface for setting/editing goal and seeing pace vs **achieve-by** date.
- Profile keeps read-only or compact mirror.

### URL migration (Phase 2)

| Legacy | Target |
|--------|--------|
| `/trips?segment=upcoming&tab=joined` | `/trips` or `/trips?segment=upcoming` |
| `/trips?segment=past&tab=joined&sub=attended` | `/trips?segment=completed&role=joined` |
| `/trips?segment=upcoming&tab=hosted` | `/trips?segment=upcoming&role=hosted` |
| `/trips?segment=wishlist` | `/trips?segment=wishlist` (unchanged or under saved) |
| `/explore?myTrips=1&list=1` | Redirect to `/trips/map` (after map ships) |

Keep redirects in `App.tsx` for old query combos through 2026-Q4.

### Phase 2 workstreams (estimate order)

1. **IA + URL contract** — one doc section in `NAVIGATION.md`; kill redundant `tab`/`sub` in UI.
2. **Upcoming list** — single joined/hosted switch inside Upcoming only; goal strip component (shared with Profile).
3. **Completed** — joined / hosted / self lists + empty states.
4. **Wishlist** — list parity with today; decide top-level vs nested.
5. **API / payload** — “my trips map” GeoJSON or pin list (may extend existing my-trips explore payload, but **rendered only on Trips map**).
6. **Trips map screen** — new map component (Nomadtable-inspired UX); no Explore FAB/filters.
7. **Remove / redirect** Explore my-trips entry from Trips header.
8. **QA** — bottom tab “My trips” still `/trips`; deep links from notifications.

### Out of scope (both phases)

- Trip photo albums / per-trip galleries (`consumer-mobile-ia.md` already excludes).
- Replacing Explore map for discovery.

### Open questions (resolve before Phase 2 build)

1. **Self** — exact definition and backend filter.
2. **Wishlist** — top segment vs under “Saved” inside Completed.
3. **Map pins** — activities only vs wishlist venue pins vs both; clustering rules.
4. **Nomadtable** — reference interaction only (pan/zoom, pin card) vs shared component/library.

---

## Sequencing checklist

- [x] **Phase 1** — Profile hero + launcher + goal summary; docs updated.
- [ ] **Phase 1** — User test on device (launcher + goal).
- [x] **Phase 1** — Member goal on Trips → Upcoming (shared `useMemberGoal` + `ProfileGoalCard`).
- [x] **Phase 2** — URL contract (`segment` + `role`; `past` → `completed`).
- [x] **Phase 2** — Trips lists refactor (scroll segments, role chips, hub without duplicate past tab).
- [ ] **Personal journey map** — see [`trips-personal-map-spec.md`](./trips-personal-map-spec.md) (build order: now → next → later; `/trips/map` stub today).
- [ ] **Phase 2** — Self tab data + redirect cleanup for legacy `tab=` links site-wide.

---

## North star check

Trips Phase 2 should answer: **“What am I doing outside, with whom, and where have I been?”** — not **“show me the whole UAE map again.”** Profile Phase 1 should answer: **“Who am I and where do I go next in the app?”** without re-listing tab destinations.
