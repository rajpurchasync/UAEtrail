# UAE Trail — System Architecture

**Product north star:** [`NORTHSTAR.md`](./NORTHSTAR.md) — who we serve, what problem we solve, and how surfaces should feel. **Whole-system map (capabilities, contexts, debt):** [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md). **Create / FAB:** [`CREATE_FLOW.md`](./CREATE_FLOW.md). This file describes deployment shape and layer diagram; use **SYSTEM_COHERENCE** for bounded contexts and consolidation order.

## Overview

Monorepo with three layers:

| Layer | Path | Role |
|-------|------|------|
| Frontend | `src/` | React SPA (Vite), mobile-first IA |
| API | `apps/api/` | Express + MongoDB |
| Shared contracts | `packages/shared-types/` | DTOs consumed by both sides |

**Documentation map:** [`DOCS_INDEX.md`](./DOCS_INDEX.md) · [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md). **Domain glossary:** [`DOMAIN.md`](./DOMAIN.md) (Place, Activity, Organisation). **Member / host tiers / roles:** [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) — single map for users, `HostStatusDTO`, and routes.

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
- `/` (userRouter) — public catalog (`/places`, `/activities`, `/explore/map`, **`/reviews`**), `/me/*` (profile, seeking-posts, groups, buddies, wishlist)
- `/publishing` — tenant-scoped activities, check-in, join queue (`x-organisation-id`; no `/host` or `/operator` API)
- `/admin` — platform ops (thin `admin.ts` → `routes/admin/registerAdmin*`; user management at `/admin/users`, staff grant at `/admin/platform-admins` for master admin)
- `/shop` — shop profiles, featured picks, merchant CRUD (Stripe checkout retained but disabled in product)
- `/safety` — member content reports (`POST /safety/reports`)
- `/chat`, `/media`

**Key flows**

1. **Join / waitlist** — `POST /activities/:id/requests` creates `PENDING` or `WAITLISTED`. Find crew uses `POST /me/seeking-posts/:id/requests` (same `activity_requests` row when `activityId` is set). Slot opens → waitlist promotion + notification.
2. **Post-event review** — host check-in triggers `REVIEW_PROMPT` notification if user has not reviewed the location.
3. **Explore map** — unified `/explore/map` payload (`source`: **activity** · **place** · **facility** · **shop**; `agency` wire-compat). **Area** is an admin-curated name (`areaId` on rows) — not a pin. Country / state / region come from map geography. Seeking outings are **activities**, not a separate demand source.
4. **Shop** — affiliate-style public pages at `/shop/:id` with outbound links; physical shops get map pins, online partners are list-only.
5. **Publishing profiles** — individuals publish as members (`/member/:userId`); agencies use `/agency/:slug`. They do **not** appear as explore map pins.
6. **Push** — Web Push (VAPID) via `PushSubscription` model; optional when keys configured.
7. **Communication** — Direct chat (`/chat`, SSE to client) and group/crew walls (`/me/groups/:id/wall` on `social_groups`). Activity crew: one group per activity, roster sync on join approve. Inbox previews on `GET /me/groups`. See [`COMMUNICATION.md`](./COMMUNICATION.md) and [`TRIPS_HOST_MANAGE.md`](./TRIPS_HOST_MANAGE.md).

## Domain model (consumer-facing)

See [`DOMAIN.md`](./DOMAIN.md) for the full glossary. Summary:

| Concept | Storage | Public URL | On explore map? |
|---------|---------|------------|-----------------|
| Place (trail/camp/spot) | `locations` (HTTP `/places`) | `/trail`, `/camp`, `/venue` | Yes (`source: place`) |
| Facility (amenity) | `facilities` | `/facility/:id` | Yes (`source: facility` — coords for navigation) |
| Area (admin-curated name) | `areas` | `/area/:slug` | **No** — filter `?area=` and hub page; country/state/region from geography |
| Activity (hosted + seeking) | `activities` | `/activity/:id` | Yes (`source: activity`) |
| Shop (organisation) | `tenants` (SHOP) + `merchant_profiles` | `/shop/:id` | Physical only (`source: shop`) |
| Individual Pro | `tenants` (professional) + member | `/member/:userId` | No |
| Agency (organisation) | `tenants` (agency) | `/agency/:slug` | No |

Shop identity is split between **tenant** (Pro Membership / shop application: website, optional pin) and **merchant profile** (`/organisation/manage?kind=shop`: contact, featured picks). Saving there syncs both and invalidates the explore map cache.

## Frontend (`src`)

```
pages/          Route-level views (lazy-loaded in App.tsx)
components/     layout/, ui/, seo/, explore/, host/, participant-intent/, shop/
api/            client.ts → domains/* → services.ts (`api` facade) — see `src/api/index.ts`
config/         platform.ts, regions.ts, exploreTheme.ts
context/        AuthContext
utils/          authRouting, shopPaths — explore URL builders live in `src/explore/routing.ts` (`routingCatalog`)
```

**Mobile IA:** Bottom tabs **Explore · My Plans · Chat** (`/explore`, `/plan`, `/chat`); Profile via header avatar. Signed-in default landing is `/explore`. Guest marketing is `/` only — see [`NAVIGATION.md`](./NAVIGATION.md), [`LANDING.md`](./LANDING.md), [`NORTHSTAR.md`](./NORTHSTAR.md). Plan manage surfaces link to Chat for crew threads — not embedded chat on `/plan`.

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
- Frontend session persistence is localStorage-based (`uaetrail_session`) and retries one authenticated request after refresh.
- Role switch (`POST /me/role/switch`) changes session role without changing account identity.
- Team/group access state is modeled with `isActive` flags, not only membership deletion.
- Social post/reply/review text is sanitized before write.

## Deployment notes

- Ensure `MONGODB_URI` is set and MongoDB is reachable before API start
- Demo seed only when `SEED_DATA=true` (or `FORCE_SEED=1` / `RUN_PROJECT_FORCE_SEED=1`); never in production
- Optional env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Frontend build: `npm run build` → serve via nginx (`nginx/default.conf`)

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
| 3 | [`experiment/`](./experiment/) | Flow QA; defer to `CREATE_FLOW.md` / `MEMBER_MODEL.md` |
| 4 | [`archive/README.md`](./archive/README.md) | Removed snapshots — git history only |

Checks: `npm run verify:docs` · `npm run verify:host-member`

## Future (not in scope)

- OpenAPI-generated client
- Drop legacy `TrailDetail` / `CampDetail` / `EventDetail` shims after `App.tsx` lazy-loads `*PlaceDetailPage` directly (kind templates live under `src/pages/place/`)
- SSR/SSG for SEO-critical pages
- FCM native apps (web push covers PWA today)
