# performance_crossPlatform_bugfix (persisted baseline)

Last updated: 2026-08-08

This document persists the branch/workstream baseline for `performance_crossPlatform_bugfix` (also requested as `performance_corssPlatform_bugfix`).

## Scope

- Cross-platform auth/session reliability (web + mobile webview behavior).
- API and data-path performance improvements for social and account-adjacent flows.
- Access-management hardening for organizer teams and family/friends groups.
- Frontend route and UX updates that remove role/session regressions.

## Must-Keep Invariants

1. Auth refresh token is cookie-based and access token refresh uses `POST /auth/refresh` with `credentials: include`.
2. Frontend persists session via `localStorage` key `uaetrail_session` (legacy `sessionStorage` removed).
3. Any authenticated API call must gracefully recover from one `401` by a single shared refresh attempt, then retry once.
4. Role switch is session-level behavior; privileged users can switch to visitor mode and restore original role, while keeping same account identity.
5. Team/group access supports active-state toggling (`isActive`) rather than only hard delete.
6. Social/community text entry is sanitized before persistence.

## API and Data Baseline

### Auth and account behavior

- Register/login/refresh return access token, while refresh token stays in httpOnly cookie.
- Demo account login is restricted to localhost/test contexts.
- Role switching endpoint: `POST /api/v1/me/role/switch` with targets `visitor` or `original`.

### Group and access-management baseline

- Organizer team memberships expose `isActive` and can be disabled.
- User groups (`/me/groups`) support:
  - create group,
  - invite by email + token,
  - accept invite,
  - deactivate member,
  - remove member,
  - kid member creation,
  - group wall posts.

### Social/community baseline

- Content moderation sanitize step is applied to post/reply/review bodies.
- Post/reply like counts and reply previews are built in batched store reads to reduce repeated query overhead.

### Indexing/performance baseline

- Mongo indexes include partial unique favorites indexes (`userId_locationId_unique`, `userId_eventId_unique`, `userId_productId_unique`) and social collections tuned for list/detail read paths.
- Keep `QUERY_TIMING` instrumentation available for slow-query diagnostics in development.

## Frontend Baseline

- `src/api/client.ts`:
  - single in-flight refresh promise for concurrent `401` collapse,
  - localStorage session persistence,
  - download flows retry once after refresh.
- `src/App.tsx`:
  - auth return-context restore after sign-in/sign-up,
  - role-aware consumer-route guard,
  - routes include `groups` and `security-privacy`.

## Regression Tests to Keep

- `apps/api/tests/auth.test.ts` includes role-switch identity preservation checks.
- `apps/api/tests/access-management.test.ts` validates disable/remove behavior for organizer team and family groups.

## Agent Handoff Checklist

When editing auth/session/social/access code, future agents must validate:

1. Login, refresh, logout, and protected route restore still work across desktop/mobile browser contexts.
2. `POST /me/role/switch` does not create a new user identity and restores original role cleanly.
3. Team/group member disable operations keep records and expose `isActive` accurately.
4. Social post/reply/review saves remain sanitized.
5. Existing index names for favorites stay stable (avoid reintroducing legacy index names).
6. API requests still use one refresh attempt per token-expiry burst.
