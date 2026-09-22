# UAE Trail — System Architecture

**Product north star:** [`NORTHSTAR.md`](./NORTHSTAR.md) — who we serve, what problem we solve, and how surfaces should feel. Implementation follows that doc; this file describes system shape.

## Overview

Monorepo with three layers:

| Layer | Path | Role |
|-------|------|------|
| Frontend | `src/` | React SPA (Vite), mobile-first IA |
| API | `apps/api/` | Express + MongoDB |
| Shared contracts | `packages/shared-types/` | DTOs consumed by both sides |

**Domain glossary:** see [`docs/DOMAIN.md`](./DOMAIN.md) for Place, Activity, Organisation, Person and legacy naming map.

## Backend (`apps/api`)

```
HTTP → routes/ (thin controllers)
     → services/ (domain logic: join-request, notifications, review-prompt)
     → lib/ (infra: mongo, jwt, s3, push, stripe, datetime)
     → domain/ (pure rules: capacity)
```

**Route map**

- `/auth` — JWT + refresh
- `/` (userRouter) — public discovery, join requests, `/me/*`, `/explore/map`
- `/host` — tenant-scoped activities, check-in, approvals (legacy alias `/organizer`)
- `/admin` — platform ops
- `/shop` — shop profiles, featured picks, merchant CRUD (Stripe checkout retained but disabled in product)
- `/social` — posts, reviews
- `/chat`, `/media`

**Key flows**

1. **Join / waitlist** — `POST /events/:id/requests` creates `PENDING` or `WAITLISTED`. Slot opens → oldest waitlisted promoted to `PENDING` + notification.
2. **Post-event review** — host check-in triggers `REVIEW_PROMPT` notification if user has not reviewed the location.
3. **Explore map** — unified `/explore/map` payload: activities, location venues, shop partners (physical + online), participant demand.
4. **Shop** — affiliate-style public pages at `/shop/:id` with outbound links; physical shops get map pins, online partners are list-only.
5. **Host profiles** — guides and agencies host trips (`/operator/:slug`); they do **not** appear as explore map pins.
6. **Push** — Web Push (VAPID) via `PushSubscription` model; optional when keys configured.

## Domain model (consumer-facing)

See [`DOMAIN.md`](./DOMAIN.md) for the full glossary. Summary:

| Concept | Storage | Public URL | On explore map? |
|---------|---------|------------|-----------------|
| Place (trail/camp/event venue) | `locations` | `/trail`, `/camp`, `/event` | Yes (venue pins) |
| Activity (scheduled trip) | `activities` | `/activity/:id` | Yes |
| Demand (participant intent) | `participant_intents` | via explore card | Yes |
| Shop (organisation) | `tenants` (SHOP) + `merchant_profiles` | `/shop/:id` | Physical only |
| Guide / agency (organisation) | `tenants` (guide/agency) | `/operator/:slug` | No |

Shop identity is split between **tenant** (become-host signup: website, optional pin) and **merchant profile** (ShopManage: contact, featured picks). Saving in ShopManage syncs both and invalidates the explore map cache.

## Frontend (`src`)

```
pages/          Route-level views (lazy-loaded in App.tsx)
components/     layout/, ui/, seo/, explore/, host/, shop/
api/            client.ts → services.ts → public.ts mappers
config/         platform.ts, regions.ts, exploreTheme.ts
context/        AuthContext
utils/          authRouting, exploreRouting, shopPaths
```

**Mobile IA:** Explore (map + lists) → Profile; signed-in default landing is `/explore`. Guest marketing is `/` only — see [`LANDING.md`](./LANDING.md) and [`NORTHSTAR.md`](./NORTHSTAR.md).

**SEO:** `PageMeta` updates title/description/canonical per route; static `robots.txt` + `sitemap.xml` in `public/`.

**Loading:** Route-level `Suspense` + `PageSkeleton` / `CardGridSkeleton` on data-heavy pages.

## API contract conventions

- List endpoints: `{ data, pagination: { page, pageSize, total, totalPages } }`
- Errors: `{ error: { code, message } }` via `ApiError`
- Auth: `Authorization: Bearer` + `x-tenant-id` for host routes
- Dates: stored UTC; returned as local `date` + `time` per tenant `countryCode`

## Cross-Platform Session + Access Addendum (2026-08)

See `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md` for the persisted baseline from branch `performance_crossPlatform_bugfix`.

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

## Future (not in scope)

- OpenAPI-generated client
- Merge location detail pages (`TrailDetail` / `CampDetail` / `EventDetail`) internally
- SSR/SSG for SEO-critical pages
- FCM native apps (web push covers PWA today)
