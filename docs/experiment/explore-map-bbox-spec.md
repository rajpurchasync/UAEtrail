# Explore map read model bbox (R5)

**Status:** Design spec — **no default behavior change** until `EXPLORE_MAP_BBOX=1` (API) and matching FE flag.  
**Maps to:** `SYSTEM_COHERENCE` **C19** · refactor plan **R5** · audit §2.2.  
**Tier-1 unchanged:** `GET /explore/map` without new query params remains the **full-region** contract until promotion.

---

## 1. Problem

Today:

| Layer | Behavior | Pain |
|-------|----------|------|
| API | One cached payload (`explore:map:payload:v2`, ~60s) built from ~250 activities + ~1200 venues + shops | Stampede on cold cache; p95 JSON size grows with catalog |
| DTO | `ExploreMapItemDTO[]` often embeds full `ActivityDTO` | Mobile download + parse cost; list/peek only need card fields |
| FE | Single React Query key `['explore','map']`; filter in browser | Members download entire UAE inventory per session |
| Personalization | `enrichExploreMapPayloadViewerAccess` per request **after** shared blob | Correct for cache hit rate; cannot shrink base without split |

**Non-goal:** Replace Mongo or split microservices. **Goal:** Same product semantics with **bounded payloads** and **clear cache tiers**.

---

## 2. Target architecture (two-tier read)

```text
                    ┌─────────────────────────────┐
                    │  explore-map-base.ts        │
                    │  (shared, cacheable, slim)  │
                    └──────────────┬──────────────┘
                                   │ items[] + version + regionMeta
                    ┌──────────────▼──────────────┐
                    │  explore-map-enrich.ts      │
                    │  (per-viewer, no Redis)     │
                    │  viewerAccess, peek L1      │
                    └──────────────┬──────────────┘
                                   │
              GET /explore/map     │     GET /explore/map?bbox=&cursor=
              (legacy default)     │     (vNext, flagged)
```

| Tier | Cache | Contents |
|------|-------|----------|
| **Base** | Redis + memory; key includes `v3` + optional `region` slug | Slim map items: pin coords, ids, `DiscoveryCardProjection`-shaped fields, **no** full `activity` blob |
| **Enrich** | None (compute per request) | `viewerAccess`, `mapPeekActions`, `mapPeekStrips`, buddy masks — same as today’s post-cache pass |

**Rule:** Enrich input is always **base items** + batched stores (unchanged batching in `explore-map-viewer-access.ts`).

---

## 3. HTTP contract (additive)

### 3.1 Default (unchanged)

`GET /api/explore/map` → `{ data: { items: ExploreMapItemDTO[], … } }`  
Stays until bbox promotion; may internally call base+enrich when refactored (R5.2).

### 3.2 bbox subset query (flagged)

`GET /api/explore/map?bbox=west,south,east,north&limit=200&cursor=…`

| Param | Required | Notes |
|-------|----------|-------|
| `bbox` | When flag on | WGS84 degrees; clamp to UAE focus bbox (`uae-bbox.ts`) |
| `limit` | No | Default 150, max 300 |
| `cursor` | No | Opaque; stable sort key (`publishedAt` + `id`) |

Response (additive envelope):

```ts
{
  data: {
    items: ExploreMapCardDTO[];  // slim — see §4
    nextCursor: string | null;
    region: { slug: string | null; bbox: BBox };
    cacheGeneration: number;     // matches memory generation for enrich reuse
  }
}
```

**Feature flag:** `EXPLORE_MAP_BBOX=1` (API env). When off, `bbox`/`cursor` → **400** or ignored (pick one at implementation; prefer 400 in staging).

### 3.3 Area lens

Existing `area=` filter on explore URL becomes a **server-side** pre-filter when bbox is on (intersect item `areaId` / point-in-polygon), not only client filter.

---

## 4. Slim DTO (`ExploreMapCardDTO`)

Phase with **R1 `DiscoveryCardProjection`** — map wire should not require FE `buildExploreCardModel` for list/peek.

| Field group | Keep on wire | Drop from map wire (fetch on peek open) |
|-------------|--------------|----------------------------------------|
| Identity | `id`, `source`, `activityMode`, `participantIntentId?` | — |
| Pin | `latitude`, `longitude`, `toLatitude?`, `toLongitude?` | — |
| Card | `title`, `subtitle`, `path`, presentation chips, `wireActions` ids | Long `requirements[]`, full `activity` |
| Join peek | `joinMode` summary, `slotsAvailable`, host display name/avatar | Full participant roster |
| Linked | `linkedRideshareActivities?` (ids + titles only) | Nested `ActivityDTO` |

**Peek open:** `tryOpenActivityPinDeepLink` / `GET /activities/:id` remains authoritative for join state (already true for off-map pins).

**Version:** Add `mapWireVersion: 2` comment in shared-types when slim shape ships; clients gate on optional field.

---

## 5. Caching keys

| Key | Scope | TTL |
|-----|-------|-----|
| `explore:map:base:v3:{region}` | Full region base (default `uae`) | 60s (same as today) |
| `explore:map:base:v3:{region}:{bboxHash}` | Optional tile cache (later) | 30–60s |
| `explore:map:payload:v2` | **Legacy** full payload | Retire after bbox promotion |

**Invalidation:** Keep `invalidateExploreMapCache()` — must delete **all** `explore:map:base:v3:*` prefixes (Redis `SCAN` + `DEL` or version bump).

---

## 6. Frontend (R5.4 + R8)

| Concern | Today | bbox |
|---------|-------|-------|
| Query key | `exploreMapQueryKey = ['explore','map']` | `['explore','map', { bbox, area, cursor }]` serialized |
| Fetch | Once per session | Debounced bbox on viewport settle; prefetch adjacent bbox optional |
| List/browse | Client filter on full `items` | Same items array type; smaller payload |
| Freshness on join | `reloadExploreMap()` invalidates all | Prefer **patch** join counts on cached slice (`setQueryData`) + targeted invalidation |

**Flag:** `VITE_EXPLORE_MAP_BBOX=1` — when off, FE keeps current hook.

---

## 7. Implementation phases (tie to refactor plan)

| Phase | Deliverable | Risk |
|-------|-------------|------|
| **R5.1** | This spec | — |
| **R5.2** | Extract `explore-map-base.ts` + `explore-map-enrich.ts`; legacy route calls both | Low if output byte-identical |
| **R5.3** | `bbox` + cursor behind flag; contract tests | Medium |
| **R5.4** | FE viewport query + optimistic join patch | Medium |
| **Promote** | Default bbox=UAE full; deprecate fat embed | High — needs metrics |

---

## 8. Metrics & exit (R5 exit criteria)

Before promotion:

- p95 **uncompressed** JSON for bbox query &lt; 40% of full map at equal pin count (staging).
- No regression: `explore-map-seeking-projection.test.ts`, `test:explore-alignment`, `memberSurfacesAcceptance` G-seek.
- Cold-cache rebuild QPS bounded (single-flight lock on base build — optional follow-up).

---

## 9. Related code (today)

| Piece | Path |
|-------|------|
| Map build (base) | `apps/api/src/lib/explore-map-base.ts` |
| Map cache shell | `apps/api/src/lib/explore-map.ts` |
| Cache | `apps/api/src/lib/explore-map-cache.ts` |
| Viewer enrich | `apps/api/src/lib/explore-map-viewer-access.ts` |
| Card VM (FE) | `src/discovery/discoveryCardViewModel.ts`, `packages/shared-types/.../discovery-card-projection.ts` |
| FE fetch | `src/hooks/useExploreMap.ts` |
| Runbook | `docs/operations/EXPLORE_MAP_RUNBOOK.md` |

---

## 10. Out of scope (vNext)

- WebSocket live pin updates
- Separate catalog APIs per category (`/trails`, `/shops`)
- Programme / campaign entities (**R7**)
- Replacing `participant_intents` storage (**R4** read cleanup only)
