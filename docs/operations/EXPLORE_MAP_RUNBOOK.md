# Explore map — operations runbook

How `/explore` stays in sync with MongoDB: venue catalog, cache, and local env.

**Refactor (Oct 2026):** S8 discovery implementation is closed — bbox-scoped fetch + FE flags ship behind env vars. **Production default** still uses full-region `GET /explore/map` until [bbox staging promotion](#bbox-map-fetch--staging-promotion-r5) passes. Tracker: [`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md) §8.6 **MIG-EXPLORE-READ** · archive: [`system-refactor-plan-2026-10.md`](../archive/system-refactor-plan-2026-10.md).

## When the map updates

`GET /api/explore/map` is cached in memory (~60s) and Redis (`explore:map:payload`, 60s TTL). Any write that changes pins or cards must call **`invalidateExploreMapCache()`**.

Per-request **`viewerAccess`** on activity/demand rows is applied **after** the cache read (`explore-map-viewer-access.ts`) from the optional auth token — it is not stored in Redis.

### Automatic invalidation (code paths)

| Data | Trigger |
|------|---------|
| **Places** (`locations`) | `writeLocationToMongo`, `deleteLocationFromMongo` (admin, member place submit, catalog import). Map: trails, camps, outdoor spots, community shops (peek). |
| **Facilities** (`facilities`) | `createFacilityRecord`, admin facility CRUD, `seed:catalog-facilities`. Map amenity pins (`facility:*`); member `POST /me/facilities` does **not** insert `locations`. |
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

### Demo facility pins (CPC map amenities)

```bash
npm --workspace @uaetrail/api run seed:catalog-facilities
```

Upserts linked amenities (Hatta dam, wadi hub, hill camp, Shawka, Jais, Al Qudra) into `facilities`, ensures curated **areas**, creates missing parent **place** stubs, and invalidates explore map cache. Safe to re-run.

### Fix pins without editing JSON

1. Platform admin → `/admin/places`
2. Edit → map pin, name, region, description
3. Save (cache invalidates; row tagged for import merge rules)

## Environment (CORS & links)

| Variable | Purpose |
|----------|---------|
| `EXPLORE_MAP_BBOX=1` | Enables `GET /explore/map?bbox=west,south,east,north` subset + `cursor` / `limit` / `area` (default off; full-region response unchanged) |
| `EXPLORE_MAP_DEMAND_PINS` | **Deprecated** — must stay unset/off; map never emits `demand:` pins (seeking = `activity:`). Reserved for migration archaeology only. |
| `VITE_EXPLORE_MAP_BBOX=1` | Explore map uses viewport bbox fetch (requires API flag); `/list` still loads full map |
| `EXPLORE_MAP_DISCOVERY_PROJECTION=1` | Each map item includes `discoveryCard` (L1 read model; not cached in Redis) |
| `VITE_EXPLORE_MAP_DISCOVERY_PROJECTION=1` | Peek/list use server `discoveryCard` when present (requires API flag) |
| `APP_BASE_URL` | Primary frontend origin (default dev: `http://localhost:5175`) |
| `APP_BASE_URLS` | Extra allowed CORS origins (comma-separated) |

Vite dev server uses port **5175** (see root `README.md`). API default `APP_BASE_URL` matches 5175; set production URLs in deployment secrets.

## Bbox map fetch — staging promotion (R5)

Enable **both** flags in a staging environment before considering production default:

1. API: `EXPLORE_MAP_BBOX=1`
2. FE build: `VITE_EXPLORE_MAP_BBOX=1`

**Smoke (staging):**

- Open `/explore`, pan/zoom — network shows `GET /explore/map?bbox=…` (not only full map).
- Join an open-RSVP activity from map peek — slot count updates without full map reload when FE bbox is on.
- Open `/list` — still uses full map fetch (no bbox scope).

**Watch:** p95 payload size and request rate per session; compare to full `GET /explore/map` baseline. Roll back by unsetting flags (wire falls back to full-region response).

**p95 uncompressed size ratio (promotion gate — [`explore-map-bbox-spec.md`](../experiment/explore-map-bbox-spec.md) §8):**

1. Staging API with `EXPLORE_MAP_BBOX=1`. Record full map body size:  
   `GET /api/explore/map` → note response byte length (gzip off in dev, or decompress in prod sampling).
2. Record a **representative viewport** bbox (e.g. Dubai `bbox=54.9,24.9,55.5,25.5`):  
   `GET /api/explore/map?bbox=54.9,24.9,55.5,25.5&limit=200`.
3. Target: bbox JSON **&lt; 40%** of full map at comparable catalog size (pin count in bbox vs full is expected to be smaller — compare like-for-like sessions, not single bbox vs entire UAE).
4. Automated regression: `npm run test:explore-alignment` (API `explore-map-bbox.test.ts`, seeking projection, FE map guards).

## Smoke checks (browse + map layers)

Automated: `npm run test:explore-alignment` (includes `apps/api/tests/explore-map-layers.test.ts` and explore FE guards).  
Manual: signed-in browse on `/explore` — Activities vs Places pills, map pan/zoom, pin sheet open/join CTA.
