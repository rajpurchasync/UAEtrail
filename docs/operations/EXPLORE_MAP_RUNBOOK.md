# Explore map — operations runbook

How `/explore` stays in sync with MongoDB: venue catalog, cache, and local env.

**Refactor (Oct 2026):** S8 discovery implementation is closed — vNext bbox + FE flags are shipped behind env vars. **Production default** still uses full-region `GET /explore/map` until § [vNext bbox fetch — staging promotion](#vnext-bbox-fetch--staging-promotion-r5) passes. Plan: [`system-refactor-plan.md`](../experiment/system-refactor-plan.md).

## When the map updates

`GET /api/v1/explore/map` is cached in memory (~60s) and Redis (`explore:map:payload`, 60s TTL). Any write that changes pins or cards must call **`invalidateExploreMapCache()`**.

Per-request **`viewerAccess`** on activity/demand rows is applied **after** the cache read (`explore-map-viewer-access.ts`) from the optional auth token — it is not stored in Redis.

### Automatic invalidation (code paths)

| Data | Trigger |
|------|---------|
| **Places** (`locations`) | `writeLocationToMongo`, `deleteLocationFromMongo` (admin, host submit, member contribute, catalog import). Map payload includes **hiking + camping** venues only (not event-type location rows). |
| **Activities** | Publish / cancel / update while `PUBLISHED` (`activities-store`) |
| **Seeking activities** | Activity create/update (`activityMode: seeking`) + intent alias writes (`participant-intents-store` when stub write enabled) |
| **Shops** | Shop tenant `writeTenantToMongo`, shop profile sync routes, admin shop tenant status |
| **Admin** | Place create/patch/delete (also covered by location writers) |

After deploy or bulk DB edits, restart API or run import script (which invalidates at the end).

## Venue catalog (curated trails & camps)

**Source:** `apps/api/data/uae-outdoor-venue-catalog.json`  
**Detail:** [`apps/api/data/README.md`](../../apps/api/data/README.md)

### Apply catalog to a database

```bash
npm --workspace @uaetrail/api run import-venue-catalog
```

- Upserts all catalog rows by stable `id`
- Deactivates `externalSource: 'osm'` locations unless `--keep-osm`
- Skips overwriting admin-edited rows (`catalog-admin-edited` tag)
- Invalidates explore map cache when not `--dry-run`

**When to run:** new environment, after editing the JSON, or after restoring a DB from backup without catalog rows.

### Fix pins without editing JSON

1. Platform admin → `/admin/places`
2. Edit → map pin, name, region, description
3. Save (cache invalidates; row tagged for import merge rules)

## Environment (CORS & links)

| Variable | Purpose |
|----------|---------|
| `EXPLORE_MAP_VNEXT=1` | Enables `GET /explore/map?bbox=west,south,east,north` subset + `cursor` / `limit` / `area` (default off; full-region response unchanged) |
| `EXPLORE_MAP_DEMAND_PINS` | **Deprecated** — must stay unset/off; map never emits `demand:` pins (seeking = `activity:`). Reserved for migration archaeology only. |
| `VITE_EXPLORE_MAP_VNEXT=1` | Explore map uses viewport bbox fetch (requires API flag); `/list` still loads full map |
| `APP_BASE_URL` | Primary frontend origin (default dev: `http://localhost:5175`) |
| `APP_BASE_URLS` | Extra allowed CORS origins (comma-separated) |

Vite dev server uses port **5175** (see root `README.md`). API default `APP_BASE_URL` matches 5175; set production URLs in deployment secrets.

## vNext bbox fetch — staging promotion (R5)

Enable **both** flags in a staging environment before considering production default:

1. API: `EXPLORE_MAP_VNEXT=1`
2. FE build: `VITE_EXPLORE_MAP_VNEXT=1`

**Smoke (staging):**

- Open `/explore`, pan/zoom — network shows `GET /explore/map?bbox=…` (not only full map).
- Join an open-RSVP activity from map peek — slot count updates without full map reload when FE vNext is on.
- Open `/list` — still uses full map fetch (no bbox scope).

**Watch:** p95 payload size and request rate per session; compare to full `GET /explore/map` baseline. Roll back by unsetting flags (wire falls back to full-region response).

**p95 uncompressed size ratio (promotion gate — [`explore-map-vnext-spec.md`](../experiment/explore-map-vnext-spec.md) §8):**

1. Staging API with `EXPLORE_MAP_VNEXT=1`. Record full map body size:  
   `GET /api/v1/explore/map` → note response byte length (gzip off in dev, or decompress in prod sampling).
2. Record a **representative viewport** bbox (e.g. Dubai `bbox=54.9,24.9,55.5,25.5`):  
   `GET /api/v1/explore/map?bbox=54.9,24.9,55.5,25.5&limit=200`.
3. Target: bbox JSON **&lt; 40%** of full map at comparable catalog size (pin count in bbox vs full is expected to be smaller — compare like-for-like sessions, not single bbox vs entire UAE).
4. Automated regression: `npm run test:explore-alignment` (API `explore-map-vnext.test.ts`, seeking projection, FE map guards).

## Smoke checks (browse + map layers)

Automated: `npm run test:explore-alignment` (includes `apps/api/tests/explore-map-layers.test.ts` and explore FE guards).  
Manual: signed-in browse on `/explore` — Activities vs Places pills, map pan/zoom, pin sheet open/join CTA.
