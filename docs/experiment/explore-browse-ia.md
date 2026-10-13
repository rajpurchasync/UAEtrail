# Explore browse — information architecture (aligned)

**Branch:** `main` · **Status:** Map pills + search scopes implemented — see **[`explore-browse-taxonomy.md`](./explore-browse-taxonomy.md)**

**Related:** [`explore-browse-taxonomy.md`](./explore-browse-taxonomy.md) · [`explore-ux-spec.md`](./explore-ux-spec.md) · [`../CREATE_FLOW.md`](../CREATE_FLOW.md) · [`../NAVIGATION.md`](../NAVIGATION.md)

### Agreed map + search (summary)

| Map pills | Search scope rows |
|-----------|-------------------|
| **Trips** — all hosted `activity` pins | **Trips** |
| **Looking for** — `demand` | *(map only in v1)* |
| **Spots** — `venue` catalog | **Spots** |
| **Shops** — `shop` pins | **Shops** |
| — | **Facilities** *(later)* |

Hosted hikes/camps/carpools/events are **not** separate map pills; they all sit under **Trips**.

---

## User mental model (two pin kinds, one map)

Everything on explore can have a **location pin**. Two **kinds** of thing differ by time and behaviour — not by whether they are “hiking”:

| Pin kind (UX) | What it is | Always on map? | Examples |
|---------------|------------|----------------|----------|
| **Plans** | Time-bound — someone **organized** a trip or is **looking for** company | Only while published / active | Hosted hike Saturday, demand “hiking buddies Hatta”, rideshare Marina → Jais |
| **Places** | **Fixed** catalog — visit anytime | Yes (approved catalog) | Trail, camp spot, outdoor venue, shop |

**Plans** = consumer word for the whole time-bound layer (**Organize + Demand** in architecture).  
Do **not** confuse with backend **`outingCategory: events`** (marathon / group run category) or URL `/venue/` place pages.

**Places** = trails, camps, shops, and other catalog pins (**venue** + **shop** `source`).

Both kinds can be tagged with the **same topic** (hiking, camping, …) for filters and top-bar wayfinding.

---

## Shared topic axis (applies to Plans and Places)

Top bar (map **and** list) — **what outdoor context** (UI routing, not a single DB table):

| Top (UI) | Plans (examples) | Places (examples) |
|----------|------------------|-------------------|
| **Hiking** | Organized hike, demand for hiking crew | Trail, hiking spot |
| **Camping** | Camp trip, demand for camp mates | Camp spot |
| **Rideshare** | Rideshare offer / ride demand | (usually none) |
| **Shops** | — | Gear shop pin |
| **Activity** (emoji / shortcut) | Runs, climbs, workshops, social outings | Rare; routes to general-activities browse + FAB |
| **Search** | Text / area | Same |

Backend projection uses **`outingCategory`** on plans and **venue/shop kind** on places — browse maps top chip → filter predicate on `ExploreMapItemDTO`.

---

## Second row — what type of pin (within topic)

Sub-pills refine **Plans vs Places** (and organize vs demand) without merging lifecycles:

| Sub-pill (UX) | Shows pin kind | Architecture |
|---------------|----------------|--------------|
| **Trips** | Hosted / organized plans | `source: activity` (Organize) |
| **Looking for** | Seeking crew / ride / group | `source: demand` (Demand) |
| **Places** | Fixed catalog locations | `source: venue` (and similar catalog) |
| **Shops** | Shop pins | `source: shop` |

**Rules**

- Sub-pills are **filters**, not FAB flows. Create still uses Organize · Find · Add.
- **Context-sensitive UI:** e.g. under **Rideshare** top, hide or de-emphasize **Places** when empty.
- Default per top chip should avoid an empty or overcrowded map (product choice per QA).

**Optional single-select vs multi-select:** default one sub-pill or “all plan types” for Plans; document in UX spec when implementing.

---

## Third row — when / where (refine, not primary)

- **When:** calendar presets on Plans (not primary navigation).
- **Where:** map pan, search, region — applies to both kinds.

Intent order: **topic (top) → pin kind (sub) → when / where**.

---

## What we stop doing in UX (conflict removal)

| Old / conflicting | Aligned |
|-------------------|---------|
| Tab name **Activities** = only plans; **Places** hidden on map | **Plans** and **Places** both on map; sub-pills separate them |
| Pills only outing-type (Hiking, Camping…) with no Places path | Top = topic; sub = Trips / Looking for / Places / Shops |
| **Events** meaning three different things | UX **Plans** = time-bound layer; **events** category = marathon-style outing only in copy when needed |
| List sheet different chrome than map | **Same** top + sub on map and list |

Backend **unchanged:** separate collections, endpoints, wizards (`composeFlowCatalog.ts`, `CREATE_FLOW.md`).

---

## Browse projection (implementation sketch)

No new entity — **Layer A discovery** only (browse filters; see `exploreBrowseTaxonomy.ts`).

**Map (shipped):** `matchesUnifiedExploreMapItem` in `exploreMapPinModel.ts` — URL `filter` + `pinKind` + `date` + `regions`.

```text
visiblePins = all ExploreMapItemDTO in bbox
  WHERE matchesTopic(topChip, item)      // hiking | camping | rideshare | shops | activity…
  AND matchesPinKind(subPills, item)   // trips | looking | places | shops | all
  AND matchesWhen(datePreset, item)    // plans only
  AND matchesQuery(q, item)
```

`matchesTopic` for a **Place** uses venue kind / tags; for a **Plan** uses `outingCategory` (+ `outingTopic` when top = Activity).

---

## Open product choices (before build)

1. Default sub-pills when user taps **Hiking** (all four vs Trips+Looking only).
2. Label **Plans** vs **Outings** vs **On the map** in consumer copy.
3. Whether **Shops** on top bar jumps to Shops sub-pill only or topic-filtered shops under Hiking/Camping.
4. URL params: e.g. `topic=hiking&kind=trips|looking|places|shops` replacing split `panel=venues` vs activities-only pills.

---

## Exit criteria

- Map and list share one chrome; user can reach **Places** without opening list-only tabs.
- Organize / Demand / Add lifecycles and APIs unchanged.
- Docs and `exploreCopy` use **Plans** / **Places** for pin kind; **outingCategory** stays in API/types only.

---

## Search — “What are you looking for?”

Open text search; while typing, show **scope rows with match counts**: **Trips**, **Spots**, **Shops**, and **Facilities** (later). No “Find a venue / Find a trip” menu. **Looking for** is a **map pill**, not a search scope row in v1.

Map and list share the same `q` and optional `searchScope` URL state. See [`explore-browse-taxonomy.md`](./explore-browse-taxonomy.md).

---

## Venue detail — one page for “facts on the ground”

Each **venue** (admin- or member-contributed, approved) is a **listing** with curated fields, e.g.:

- Access, difficulty, season, photos  
- **Facilities:** toilet (trailhead / none on route), water, shade, signal  
- **Nearby:** fuel, shop, services — distance and short note (“~10 km, ADNOC …”) + **Open in Maps**  
- Reviews / tips (when available)

This page is the **source of truth** for “can I do this comfortably?” — not the activity card alone.

**Examples:** toilet at trailhead, fuel within driving distance, gear shop nearby — editorial or tagged, not a full POI engine on day one.

---

## Venues vs activities (how they connect in UX)

| | **Venue** | **Activity** (hosted trip) |
|---|-----------|----------------------------|
| **What** | Fixed place on the catalog | Scheduled outing (host, date, join rules) |
| **URL** | `/trail/…`, `/camp/…`, `/venue/…` (place) | `/activity/…` |
| **Toilet / fuel / shop** | Shown on **venue detail** | Shown by **linking to the same venue** when the host picked a registry place |

**Hiking and camping trips** often **select a location** at publish (registry place or anchor). In UX:

- User opens a **hosted hike** → sees when, host, join CTA.  
- **“At: Wadi Shawka Loop”** (or map pin) → opens **venue detail** for toilets, fuel, shops, access.  
- Same venue page whether they arrived from **Find a venue** search or from a **trip** card.

Demand (“looking for”) may use area + pin without a full venue row; when a `locationId` / place exists, link the same way.

**Principle:** Do not duplicate facility copy on every activity; **point activities at venues** whenever organize flow attached a catalog place.

---

## Search + map together (user stories)

1. **Venue:** Search → Find a venue → “hiking wadi toilet” / region → place detail → directions → optionally **Find buddies** filtered near this place or same topic.  
2. **Buddies:** Search → Find buddies → Hiking + this weekend → trip or demand → join; tap **place** for practical info before driving.  
3. **Host:** Organize hiking → pick **venue** from registry → publish; joiners get trip + linked venue facts automatically.

---

## Content ops (admin)

Places need a **minimum field set** for search and detail to work (name, geo, type, facilities block, nearby services note). See future **`explore-place-listing-v1.md`** when defined; until then, treat long description in admin as interim with a structured checklist in the admin UI as the goal.

**Interim structured tags (shipped):** on place `tags`, use `facility:…` and `nearby:…` — rendered under **Facilities & nearby** on place detail (not shown as generic tags).

**UI (shipped on `main`):** **Search** icon → menu (**Find a venue** / **Find a trip**) on map and list; activity detail **At this venue** link when `locationId` is set.
