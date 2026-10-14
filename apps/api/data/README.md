# UAE outdoor venue catalog

Curated hiking and camping pins for the explore map (`Places` panel).

**Ops runbook (cache, env, smoke):** [`docs/operations/EXPLORE_MAP_RUNBOOK.md`](../../../docs/operations/EXPLORE_MAP_RUNBOOK.md)

## Edit the list

Update `uae-outdoor-venue-catalog.json`:

- `id` — stable Mongo `locations` document id (kebab-case)
- `name` / `nameAr` — English and Arabic labels
- `activityType` — `hiking` or `camping`
- `region` — emirate label used in filters (e.g. `RAK`, `Fujairah`, `Sharjah`, `Dubai`, `Al Ain`)
- `latitude` / `longitude` — trailhead or main pin
- `description` — short blurb (premium seed rows keep longer copy on re-import)

Optional rich fields (same as contribute / place detail): `difficulty`, `distance`, `duration`, `elevation`, `accessibility`, `childFriendly`, `maxGroupSize`, `campingType`, `surfaceType`, `accessibleBy`, `season`, `images`, `areaLabel`, `parkingLat` / `parkingLng`.

When those are omitted, **import** fills type-aware defaults (hike stats, camp surfaces, hero image, parking at the pin, curated `areaId` from id prefix rules).

## Apply to the database

```bash
npm --workspace @uaetrail/api run import-venue-catalog
```

This upserts all catalog rows, **fills missing** images/facts/area links on old rows, re-runs curated **areaId** backfill, preserves existing GPX/guides on known seed ids, and **deactivates legacy OSM imports**. Use `--keep-osm` to skip OSM deactivation, or `--dry-run` to print only.

Re-run after deploy when peek cards or place detail look sparse:

```bash
npm --workspace @uaetrail/api run import-venue-catalog
```

Rows tagged **`catalog-admin-edited`** (set when you save in **Admin → Places**) keep their name, map pin, region, and description — re-import will not overwrite those fixes.

## Fix inaccurate pins (recommended)

1. Sign in as platform admin → **`/admin/places`**
2. **Edit** the place → drag the map pin (**Map pin** picker) and update name, region, description, photos, difficulty, parking link, etc.
3. **Save** — the map cache refreshes and the place is marked admin-edited for future imports.

## Future: Google Places harvest

For one-off discovery, use Google Places API (Text Search) per emirate, human-review results, then add rows here. Do not scrape Google Maps UI.
