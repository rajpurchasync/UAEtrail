# Dev Run

### Node.js (required)

- **Pin:** `.nvmrc` → **24.22.0** (Node 24 LTS “Krypton”; CI uses the same).
- **Check:** `npm run verify:engines` (also runs at the start of `verify:system:quick`).
- **Upgrade:** `nvm install` && `nvm use` (or install from [nodejs.org](https://nodejs.org/) LTS). Repo minimum is `package.json` → `engines.node` (currently `>=24.22.0`). Bump npm if needed: `npm install -g npm@11.16.0`.
"dev run" means:

- Run from VS Code (tasks/workspace run) with hot reload for both frontend and API.
- Use cloud test database env: `RUN_ENV=test` and `MONGODB_URI_TEST` from root `.env`.
- Avoid observability stack containers in this mode (Grafana, Prometheus, Loki, Promtail, exporters) unless explicitly requested.
- Open the app in the VS Code integrated browser during dev run for live agent-side monitoring checks.

Use full run-project scripts only when explicitly requested.

### Demo data (`SEED_DATA`)

- Seed **does not** run on every dev start. Use `SEED_DATA=true` (or `FORCE_SEED=1`) when you need demo users, map pins, and host fixtures — see `README.md` and `docs/DEPLOYMENT.md`.
- **Demo login** (`POST /auth/demo-login`) is off in `NODE_ENV=production`. In development it only accepts loopback TCP peers unless you set `ALLOW_DEMO_LOGIN=true` (e.g. API in Docker, browser on host).
- **Demo / seed passwords:** set `DEMO_ACCOUNT_PASSWORD` in root `.env` before `SEED_DATA=true npm run seed` or demo-login user creation (no plaintext passwords in source). API tests use a fixed in-memory password automatically.
- **Prometheus `/metrics`:** requires `METRICS_TOKEN` bearer auth except in `NODE_ENV=test` or local dev loopback peers (same trust model as demo login).
- **Async side effects** (rewards, emails, group-chat roster, notifications): failures log with `logContext` via `scheduleSideEffect` / `scheduleNotification` — check API warn logs if something did not fire. Optional durable side effects: `SIDE_EFFECT_OUTBOX=1` (notifications + async map cache bust; drain every 30s via `SIDE_EFFECT_OUTBOX_DRAIN_INTERVAL_MS`). Staging experiments until MIG-OUTBOX completes.
- **`npm run seed` without `SEED_DATA`:** still **upserts curated areas** and **backfills `place.areaId`** on catalog rows (safe on existing DBs).
- After pulling member/host changes, restart the API once so Mongo migrations run (`tenant_memberships` owner backfill, `publishingPurpose` on tenants).
- Buddy **Organize** requires **signup profile complete** (`PATCH /me/profile/signup-details`); `GET /me/status` exposes `profileComplete` and `publish.canPublish`. Publish/create on `POST /operator/activities` enforces the same server-side.
- **`npm run dev:local`:** prints a reminder to run `SEED_DATA=true npm run seed` when the map has no pins (see [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md)).
- Set `QUERY_TIMING=1` to log store queries slower than 25ms (see `apps/api/src/lib/query-timing.ts`).

### Auth & session baseline (do not regress)

1. Refresh token is httpOnly cookie; access refresh uses `POST /auth/refresh` with `credentials: include`.
2. Session in `localStorage` key `uaetrail_session` (not `sessionStorage`).
3. API client: one shared in-flight refresh on `401`, then retry once (`src/api/client.ts`).
4. Role switch is session-level: `POST /me/role/switch` (`visitor` ↔ `original`) — same account identity.
5. Team/group memberships support `isActive` disable (not only hard delete).
6. Social post/reply/review bodies are sanitized before persistence.

During dev run, quickly verify:

- Sign-in → protected route → refresh after token expiry.
- `/me/role/switch` preserves account identity.
- Group/team member disable surfaces `isActive` correctly.

Explore FAB changes: [`CREATE_FLOW.md`](./CREATE_FLOW.md) + `src/explore/composeFlowCatalog.ts`. Automated guards: `npm run verify:system:quick` and `npm run test:explore-alignment`.

**Release verification (S10 hygiene, Oct 2026):** On the release commit run **`npm run verify:system`** (includes `test:explore-alignment`). Day-to-day: **`npm run verify:system:quick`**. Staging manual pass: **`BASE_URL=https://staging-host npm run s10f:qa-checklist`** (detail §8 routes + notification edge cases). Map bbox promote (**S10e**): `npm run s10e:staging-checklist` → [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md) + [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md) — flags only after staging p95 gate. **Local ratio spot-check** (API must be up): `EXPLORE_MAP_BBOX=1 npm run dev:api` then **`npm run s10e:local-ratio`**. Tracker: [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.1.

**Unpushed release stack (local `main`, Oct 2026):** `git log origin/main..HEAD --oneline` — themes in order (newest first): **C18** explore shell (`useExploreMapCatalog`, browse URL sync/hydrate/apply-handlers, selection sub-hooks; `exploreBrowseUrlHydrate.test.ts`); **S10** hygiene (S10a–b mount-fetch, S10c API batching, S10d explore runtime); **S10e/f** ops scripts (`s10e:staging-checklist`, `s10e:local-ratio`, consumer-detail QA routes). Engineering closed — remaining gates are **staging S10e** (flags + p95) and **S10f** manual matrix. Do not push until you explicitly want `origin/main` updated.

Seeking storage (activity-canonical Find): [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md). Local readiness: `npm run seeking:storage-status` (stub write should be **off** by default); gate before deploy: `npm run seeking:deploy-gate`. If backfill skips coord-less intents, use `cancel-coordless-participant-intents` (see runbook).

**Local smoke — Find / looking for (manual, after `dev:local`):**

1. Signed-in → Explore → **Find** (FAB) → publish a pin with location.
2. Map/list: pin opens **same peek/card UX** as other activities (not a separate “demand” screen).
3. **People** panel → **Available** tab: **Looking for company** row opens explore pin URL (`pin=activity:…` when backfilled).
4. Plan → **Schedule** → **Seeking**: your post appears; **Needs you** is only for host coordination (not Find).
5. API contracts (Mongo test DB): `npm run test:seeking-local` (stub default off, store + **POST /me/seeking-posts**, explore map `activity` + `activityMode: seeking`).

**G-manage (Needs you, not Find):** joiner requests on a hosted activity → host sees `host_join_queue` on `GET /me/coordination-attention` → approve via host console or Plan manage flow. API slice: `tests/g-manage-coordination-join-approve.test.ts` (included in `verify:system:quick`).
