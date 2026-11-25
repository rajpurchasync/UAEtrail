# UAE Trail — System Architecture

**Product north star:** [`NORTHSTAR.md`](./NORTHSTAR.md) — who we serve, what problem we solve, and how surfaces should feel. **Whole-system map (capabilities, contexts, debt):** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md). **Create / FAB:** [`CREATE_FLOW.md`](./CREATE_FLOW.md). This file describes deployment shape and layer diagram; use **SYSTEM_COHERENCE** for bounded contexts and consolidation order.

## Overview

Monorepo with three layers:

| Layer | Path | Role |
|-------|------|------|
| Frontend | `src/` | React SPA (Vite), mobile-first IA |
| API | `apps/api/` | Express + MongoDB |
| Shared contracts | `packages/shared-types/` | DTOs consumed by both sides |

**Documentation map:** [`DOCS_INDEX.md`](./DOCS_INDEX.md) · [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md). **Generated module map:** `npm run context:map` → `scripts/dev/context-map.md` (from `bounded-context-manifest.json`). **Domain glossary:** [`DOMAIN.md`](./DOMAIN.md) (Place, Activity, Organisation). **Member / host tiers / roles:** [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) — single map for users, `HostStatusDTO`, and routes.

## Backend (`apps/api`)

```
HTTP → routes/ (thin controllers — surface split: registerPublic* / registerMe* / registerAdmin*)
     → services/ (domain logic: join-request, notifications, review-prompt)
     → lib/ (infra: mongo, jwt, s3, push, stripe, datetime)
     → domain/ (pure rules: capacity)
```

Catalog HTTP is **surface-first** (path + mount middleware), not **profile-first** (one route branching on `GET /me/status`). Detail: [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §5.1.

**Route map** — detail in [`API_ROUTING.md`](./API_ROUTING.md)

- `/auth` — JWT + refresh
- `/` (userRouter) — public catalog (`/places`, `/activities`, `/explore/map`, **`/reviews`**), `/me/*` (profile, **`/me/availability`**, groups, buddies, wishlist, member-discovery)
- `/publishing` — tenant-scoped activities, check-in, join queue (`x-organisation-id`; no `/host` or `/operator` API)
- `/admin` — platform ops (thin `admin.ts` → `routes/admin/registerAdmin*`; user management at `/admin/users`, staff grant at `/admin/platform-admins` for master admin)
- `/shop` — operator shop **profiles** (public read + merchant manage); no product catalog or shop checkout routes
- `/safety` — member content reports (`POST /safety/reports`)
- `/chat`, `/media`

**Key flows**

1. **Join / waitlist** — `POST /activities/:id/requests` (signed-in) creates `PENDING` or `WAITLISTED` on **`activity_requests`**. Slot opens → waitlist promotion + notification. **Find crew** is **`PUT /me/availability`** → map pins `source: availability` (not join on the pin). Legacy seeking HTTP retired — [`API_ROUTING.md`](./API_ROUTING.md).
2. **Post-event review** — host check-in triggers `REVIEW_PROMPT` notification if user has not reviewed the location.
3. **Explore map** — unified `/explore/map` payload (`source`: **activity** · **place** · **facility** · **shop** · **availability**; `agency` wire-compat). **Destination** is an admin-curated name (`destinationId` on catalog rows; legacy query `areaId` normalized at HTTP) — not a pin. Country / state / region come from map geography. Archived **`activityMode: seeking`** rows are not a product path (ops migrate to availability).
4. **Shop** — public profile at `/shop/:id` (about, contact, reviews, outbound website); operator tenants may have map pins; community gear shops from FAB Add resolve to the same public page model without a product grid.
5. **Publishing profiles** — individuals publish as members (`/member/:userId`); agencies use `/agency/:slug`. They do **not** appear as explore map pins.
6. **Push** — Web Push (VAPID) via `PushSubscription` model; optional when keys configured.
7. **Communication** — Direct chat (`/chat`, SSE to client) and group/crew walls (`/me/groups/:id/wall` on `social_groups`). Activity crew: one group per activity, roster sync on join approve. Inbox previews on `GET /me/groups`. See [`COMMUNICATION.md`](./COMMUNICATION.md) and [`COMMUNICATION.md`](./COMMUNICATION.md).

## Domain model (consumer-facing)

See [`DOMAIN.md`](./DOMAIN.md) for the full glossary. Summary:

| Concept | Storage | Public URL | On explore map? |
|---------|---------|------------|-----------------|
| Place (trail/camp/spot) | `locations` (HTTP `/places`) | `/trail`, `/camp`, `/venue` | Yes (`source: place`) |
| Facility (amenity) | `facilities` | `/facility/:id` | Yes (`source: facility` — coords for navigation) |
| Destination (curated hub) | `areas` | `/destination/:slug` | **No** — filter `?destination=` and hub page; country/state from **AdminGeo** (`geoRef`) |
| Activity (hosted outings) | `activities` | `/activity/:id` | Yes (`source: activity`) |
| Member availability (find crew) | `member_availability` | profile + map pin | Yes (`source: availability`) |
| Shop (organisation) | `tenants` (SHOP) + `merchant_profiles` | `/shop/:id` | Physical only (`source: shop`) |
| Individual Pro | `tenants` (professional) + member | `/member/:userId` | No |
| Agency (organisation) | `tenants` (agency) | `/agency/:slug` | No |

Shop identity is split between **tenant** (Pro Membership / shop application: website, optional pin) and **merchant profile** (`/organisation/manage?kind=shop`: contact, branding). Saving there syncs both and invalidates the explore map cache.

## Frontend (`src`)

```
pages/          Route-level views (lazy-loaded in App.tsx)
components/     layout/, ui/, seo/, explore/, shop/
discovery/      Card projections (list/map/browse) — import runtime via `src/explore/discoveryRuntime.ts`
list/           List/browse projections (full-screen + explore list handoff)
api/            client.ts → domains/* → services.ts (`api` facade) — see `src/api/index.ts`
config/         platform.ts, regions.ts, exploreTheme.ts
context/        AuthContext
utils/          authRouting, shopPaths — explore URL builders live in `src/explore/routing.ts` (`routingCatalog`)
```

**Mobile IA:** Bottom tabs **Trips · Venues · Crews · Chat · Plan** (`src/config/mobileFiveTabNav.ts`) — map-first **Trips** at `/explore`, list routes via `/list` and tab handoffs; Profile via header avatar. Signed-in default landing is **`/explore`**. Guest marketing is **`/`** only — see [`NAVIGATION.md`](./NAVIGATION.md), [`LANDING.md`](./LANDING.md), [`NORTHSTAR.md`](./NORTHSTAR.md). Plan surfaces link to Chat for crew threads — not embedded chat on `/plan`.

**SEO & agents:** `PageMeta` updates title/description/canonical per route; static `robots.txt`, `sitemap.xml`, `llms.txt`, and `/.well-known/agent.json` in `public/`. Public agent discovery: `GET /api/agent/manifest.json` and `GET /api/agent/discover` (see [`API_ROUTING.md`](./API_ROUTING.md)).

**Loading:** Route-level `Suspense` + `PageSkeleton` / `CardGridSkeleton` on data-heavy pages.

## API contract conventions

- List endpoints: `{ data, pagination: { page, pageSize, total, totalPages } }`
- Errors: `{ error: { code, message } }` via `ApiError`
- Auth: `Authorization: Bearer` + `x-organisation-id` for `/publishing/*` routes
- Dates: stored UTC; returned as local `date` + `time` per tenant `countryCode`

## Cross-Platform Session + Access Addendum (2026-08)

Auth/session invariants for dev and deploy: [`DEV_RUN.md`](./DEV_RUN.md) § Auth & session baseline.

Architecture-level invariants:

- Refresh token transport is cookie-based (`httpOnly`) and access token refresh occurs via `POST /auth/refresh` with credentials.
- Frontend access token is **in-memory only** (not `localStorage`); signed-in profile hint uses `uaetrail_user` (non-secret). Full page load rehydrates via refresh cookie (`bootstrapSessionFromRefresh`).
- Role switch (`POST /me/role/switch`) changes session role without changing account identity.
- Team/group access state is modeled with `isActive` flags, not only membership deletion.
- Social post/reply/review text is sanitized before write.
- Production async side effects (notifications, explore map cache bust) use the **side-effect outbox** (on by default when `NODE_ENV=production`).

**Platform north star (defaults, rejected rewrites, waves):** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) **§8.9**.

## Deployment notes

- Ensure `MONGODB_URI` is set and MongoDB is reachable before API start
- Demo seed only when `SEED_DATA=true` (or `FORCE_SEED=1` / `RUN_PROJECT_FORCE_SEED=1`); never in production
- Optional env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Production: `REDIS_URL` required; side-effect outbox on by default (`SIDE_EFFECT_OUTBOX=0` is rejected)
- Frontend build: `npm run build` → serve via nginx (`nginx/default.conf`) or Vercel static + API proxy (see `DEPLOYMENT.md`)
- Long-lived **chat SSE** should hit the **API origin**, not only the Vercel serverless proxy (§8.9)

## Allowed evolution (after §8.9 waves)

- **Wave 3:** OpenAPI spec generated from `*-route-schemas.ts`, then optional generated FE client
- **Optional SEO:** prerender or SSG for guest `/`, `/activity/:id`, and place detail — **not** for `/explore` map shell
- Drop legacy `TrailDetail` / `CampDetail` / `EventDetail` shims after `App.tsx` lazy-loads `*PlaceDetailPage` directly (kind templates live under `src/pages/place/`)
- FCM native apps when product requires it (web push covers PWA today)

## Out of scope (do not document as product roadmap)

See [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.9 — includes Next.js/Nest/microservice rewrites, Mongoose/Kafka, WebSockets for chat, and SSR for the explore map.

## Testing

```bash
npm run test:api   # vitest in apps/api
npm run test:frontend
```

Unit tests cover capacity, JWT, datetime (GCC), and waitlist logic.

## Documentation tiers

| Tier | Where | Rule |
|------|--------|------|
| 1 | [`DOCS_INDEX.md`](./DOCS_INDEX.md) § Tier 1 | Canonical — must match shipped behavior |
| 2 | Release, ops, rollout trackers | Must not contradict Tier 1 on semantics |
| 3 | [`DOCS_INDEX.md`](./DOCS_INDEX.md) → Tier-1 | Product + platform canon; `CREATE_FLOW.md` / `MEMBER_MODEL.md` for FAB |
| 4 | [`archive/README.md`](./archive/README.md) | Removed snapshots — git history only |

Checks: `npm run verify:docs` · `npm run verify:host-member`
