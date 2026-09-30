# Explore map — operations runbook

How `/explore` stays in sync with MongoDB: venue catalog, cache, and local env.

## When the map updates

`GET /api/v1/explore/map` is cached in memory (~60s) and Redis (`explore:map:payload`, 60s TTL). Any write that changes pins or cards must call **`invalidateExploreMapCache()`**.

### Automatic invalidation (code paths)

| Data | Trigger |
|------|---------|
| **Places** (`locations`) | `writeLocationToMongo`, `deleteLocationFromMongo` (admin, host submit, member contribute, catalog import). Map payload includes **hiking + camping** venues only (not event-type location rows). |
| **Activities** | Publish / cancel / update while `PUBLISHED` (`activities-store`) |
| **Demand** | Participant intent create/update (`participant-intents-store`) |
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
| `APP_BASE_URL` | Primary frontend origin (default dev: `http://localhost:5175`) |
| `APP_BASE_URLS` | Extra allowed CORS origins (comma-separated) |

Vite dev server uses port **5175** (see root `README.md`). API default `APP_BASE_URL` matches 5175; set production URLs in deployment secrets.

## Smoke checks (E2 browse)

Automated API: `apps/api/tests/explore-map-layers.test.ts`  
Manual checklist: [`docs/experiment/E2_EXPLORE_BROWSE_SMOKE.md`](../experiment/E2_EXPLORE_BROWSE_SMOKE.md)
