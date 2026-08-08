# UAE Trail — System Architecture

## Overview

Monorepo with three layers:

| Layer | Path | Role |
|-------|------|------|
| Frontend | `src/` | React SPA (Vite), mobile-first IA |
| API | `apps/api/` | Express + MongoDB |
| Shared contracts | `packages/shared-types/` | DTOs consumed by both sides |

## Backend (`apps/api`)

```
HTTP → routes/ (thin controllers)
     → services/ (domain logic: join-request, notifications, review-prompt)
     → lib/ (infra: mongo, jwt, s3, push, stripe, datetime)
     → domain/ (pure rules: capacity)
```

**Route map**

- `/auth` — JWT + refresh
- `/` (userRouter) — public discovery, join requests, `/me/*`
- `/organizer` — tenant-scoped events, check-in, approvals
- `/admin` — platform ops
- `/shop` — products, Stripe checkout, merchant CRUD
- `/social` — posts, reviews, favorites
- `/chat`, `/media`

**Key flows**

1. **Join / waitlist** — `POST /events/:id/requests` creates `PENDING` or `WAITLISTED`. Slot opens → oldest waitlisted promoted to `PENDING` + notification.
2. **Post-event review** — organizer check-in triggers `REVIEW_PROMPT` notification if user has not reviewed the location.
3. **Shop** — affiliate `externalUrl` OR Stripe Checkout (`POST /shop/checkout` + webhook).
4. **Push** — Web Push (VAPID) via `PushSubscription` model; optional when keys configured.

## Frontend (`src`)

```
pages/          Route-level views (lazy-loaded in App.tsx)
components/     layout/, ui/, seo/
api/            client.ts → services.ts → public.ts mappers
config/         platform.ts, regions.ts
context/        AuthContext
utils/          authRouting, push
```

**Mobile IA:** Explore → Trips → Community → Shop → Profile (`BottomNav`)

**SEO:** `PageMeta` updates title/description/canonical per route; static `robots.txt` + `sitemap.xml` in `public/`.

**Loading:** Route-level `Suspense` + `PageSkeleton` / `CardGridSkeleton` on data-heavy pages.

## API contract conventions

- List endpoints: `{ data, pagination: { page, pageSize, total, totalPages } }`
- Errors: `{ error: { code, message } }` via `ApiError`
- Auth: `Authorization: Bearer` + `x-tenant-id` for organizer routes
- Dates: stored UTC; returned as local `date` + `time` per tenant `countryCode`

## Cross-Platform Session + Access Addendum (2026-08)

See `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md` for the persisted baseline from branch `performance_crossPlatform_bugfix`.

Architecture-level invariants:

- Refresh token transport is cookie-based (`httpOnly`) and access token refresh occurs via `POST /auth/refresh` with credentials.
- Frontend session persistence is localStorage-based (`uaetrail_session`) and retries one authenticated request after refresh.
- Role switch (`POST /me/role/switch`) changes session role without changing account identity.
- Team/group access state is modeled with `isActive` flags, not only membership deletion.
- Social post/reply/review text is sanitized before write.

Performance carry-forward:

- Mongo indexes for favorites and social collections are part of startup index provisioning and must remain compatible with existing names/partials.
- Store-level batching for social list/detail reads should be preserved to avoid N+1 read regressions.

## Deployment notes

- Ensure `MONGODB_URI` is set and MongoDB is reachable before API start
- Run `npm run seed` on first deploy (or set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in production)
- Optional env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Frontend build: `npm run build` → serve via nginx (`nginx/default.conf`)

## Testing

```bash
npm run test:api   # vitest in apps/api
```

Unit tests cover capacity, JWT, datetime (GCC), and waitlist logic.

## Future (not in scope)

- OpenAPI-generated client
- `features/` folder split on frontend
- SSR/SSG for SEO-critical pages
- FCM native apps (web push covers PWA today)
