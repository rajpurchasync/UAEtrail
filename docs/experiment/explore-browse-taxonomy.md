# Explore browse taxonomy (canonical)

**Branch:** `main` · **Status:** Agreed UX — implementation migrating from legacy topic pills

**Related:** [`explore-browse-ia.md`](./explore-browse-ia.md) · `src/explore/exploreBrowseTaxonomy.ts`

---

## One map, two layers of filtering

| Layer | Job | User mental model |
|-------|-----|-------------------|
| **Map filter pills** | Show/hide pin **categories** on the map (multi-select) | “What kinds of things do I want on the map right now?” |
| **Search** | Text + optional **scope** rows with match counts | “What am I looking for by name/area — and which bucket?” |

Topic axes (Hiking, Camping, …) are **not** primary map pills in this model. Outing type still exists on pins and in organize/demand flows; **Trips** rolls up all **hosted** activities regardless of hiking/camping/carpool/event.

---

## Map filter pills (four)

| Pill (UX) | Includes | Excludes | `ExploreMapItemDTO` rule (summary) |
|-----------|----------|----------|-------------------------------------|
| **Trips** | Hosted plans — hikes, camps, carpools, events, general activities | Demand (“looking for”), venues, shops | `source === 'activity'` |
| **Looking for** | Participant demand / buddy posts | Hosted trips, venues, shops | `source === 'demand'` |
| **Spots** | Catalog **venues** — trails, camps, outdoor places | Shops, activities, demand | `source === 'venue'` (and venue-like catalog; not `shop`) |
| **Shops** | Gear / shop pins | Venues, trips, demand | `source === 'shop'` (physical shop list semantics) |

**Multi-select:** empty selection = show all categories (same as today’s topic pills).

**URL (target):** `?topics=trips,looking,spots,shops` (comma-separated keys).

**URL:** legacy `topics=hiking,camping,activity,shop` is mapped to the new keys on read.

---

## Search scopes (type-ahead under “What are you looking for?”)

**Matching (client):** `exploreItemSearchHaystack` indexes title, subtitles, about/description, activity location fields (`locationName`, `region`, meeting/start/parking), host/tenant copy, venue `locationCard`, presentation lines, **category vocabulary** (hiking, camping, rideshare, trips/spots/shops, outing topic labels), and **UAE emirate aliases** (e.g. RAK ↔ Ras Al Khaimah). Map pins hide non-matches while `q` is set.

When the member types, show **indicative match counts** per scope (not pre-selected chips).

| Scope (UX) | What it searches | Status |
|------------|------------------|--------|
| **Trips** | Hosted activities only (same as **Trips** pill) | Ship now |
| **Spots** | Venues / catalog places (same as **Spots** pill) | Ship now |
| **Buddies** (`searchScope=people`) | **Member discovery** — same roster as Explore Social → Discover tab (`GET /me/member-discovery/roster`); not map pins | Ship now — opens `/list?listCat=people` (or explore list overlay); profile opens use discover quota. List/Social Discover segment pills: **Who's going** (on outings) · **Looking for** (demand posters) · **Followed** (`?buddies=looking\|followed`). |
| **Shops** | Shop pins | Ship now |
| **Agencies** | Operator / guide tenant brands on map | Ship now |
| **Facilities** | Toilets, water, fuel-at-trailhead, etc. | **Later** — venue tags (`facility:*`), place registry, or dedicated facility layer |

**Not a search scope row:** **Looking for** (demand posts) — map pill **Looking for** and Trips type filter only; do not conflate with **Buddies** / `people` scope.

**Open search (Enter, no scope row):** combined results across scopes that are shipped (Trips + Spots + Shops; + Facilities when live).

**URL (target):** `?q=…&searchScope=trips|spots|shops|facilities` (optional; omit = open search).

**URL:** legacy `searchFocus=venue|trip` maps to `spots` / `trips` on read.

---

## Naming alignment

| Avoid in consumer chrome | Use |
|--------------------------|-----|
| Places (ambiguous) | **Spots** (map + search) |
| Venues (search row) | **Spots** |
| Activities (tab/pill) | **Trips** (hosted only) |
| Find a venue / Find a trip | Removed — open search + scope rows |

Backend types stay unchanged: `activity`, `demand`, `venue`, `shop` on `ExploreMapItemDTO`.

---

## Implementation status

- **Shipped:** `exploreBrowseTaxonomy.ts`, map pills row, search scope hints, URL `searchScope` + legacy aliases.
- **Later:** Facilities search index; optional rename `ExploreMapTopicPillsRow` → `ExploreMapFilterPillsRow`.

---

## Product notes

- **Trips** ≠ **Looking for** on the map: do not merge demand into Trips pill or Trips search scope.
- **Spots** ≠ **Shops**: venues and shops are separate pills and search rows.
- **Facilities** may surface as Spots with `facility:` tags before a dedicated search index exists.
