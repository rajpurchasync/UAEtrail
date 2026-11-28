# Dev Run

### Node.js (required)

- **Pin:** `.nvmrc` → **24.22.0** (Node 24 LTS “Krypton”; CI uses the same).
- **Check:** `npm run verify:engines` (also runs at the start of `verify:system:quick`).
- **Upgrade:** `nvm install` && `nvm use` (or install from [nodejs.org](https://nodejs.org/) LTS). Repo minimum is `package.json` → `engines.node` (currently `>=24.22.0`). Bump npm if needed: `npm install -g npm@11.16.0`.
"dev run" means:

- Run from VS Code (tasks/workspace run) with hot reload for both frontend and API.
- **Local DB (recommended):** `npm run db:local:up` → `npm run db:local:migrate` → `npm run db:seed:dev` (set `DEMO_ACCOUNT_PASSWORD` in `.env`) → `npm run dev:local`. Docker Mongo (`local-mongo` profile); `dev:local` forces `MONGODB_URI` to `LOCAL_MONGODB_URI`.
- **Cloud test DB:** `npm run dev:all` with `RUN_ENV=test` and reachable `MONGODB_URI_TEST` / `MONGODB_URI` in root `.env` (Atlas IP allowlist).
- Avoid observability stack containers in this mode (Grafana, Prometheus, Loki, Promtail, exporters) unless explicitly requested.
- Open the app in the VS Code integrated browser during dev run for live agent-side monitoring checks.

Use full run-project scripts only when explicitly requested.

### Phone on Wi‑Fi (dev) vs PWA install

- **Browse / test UI:** scan the terminal QR or open `http://192.168.x.x:5175` from `npm run dev` (`host: true`). Same Wi‑Fi as the laptop; allow port **5175** in Windows Firewall if needed. Optional override: `DEV_MOBILE_URL=http://192.168.x.x:5175/` when auto-detect picks the wrong NIC.
- **Install app (Chrome / Edge on Android):** **not** on plain `http://192.168…` — only **`https://`** counts as a secure context (localhost is special on the laptop, not on the phone). Use **https://uaetrail.com** on the phone for real install testing after deploy.
- **Install while hitting local code:** expose dev over HTTPS, e.g. `cloudflared tunnel --url http://127.0.0.1:5175` and open the `https://*.trycloudflare.com` link on the phone (accept any cert warnings once). Production-like install still means **https://uaetrail.com**.

### Demo data (`SEED_DATA`)

- Seed **does not** run on every dev start. Use `SEED_DATA=true` (or `FORCE_SEED=1`) when you need demo users, map pins, and host fixtures — see `README.md` and `docs/DEPLOYMENT.md`.
- **Demo login** (`POST /auth/demo-login`) is off in `NODE_ENV=production`. In development it only accepts loopback TCP peers unless you set `ALLOW_DEMO_LOGIN=true` (e.g. API in Docker, browser on host).
- **Demo / seed passwords:** set `DEMO_ACCOUNT_PASSWORD` in root `.env` before `SEED_DATA=true npm run seed` or demo-login user creation (no plaintext passwords in source). API tests use a fixed in-memory password automatically.
- **Prometheus `/metrics`:** requires `METRICS_TOKEN` bearer auth except in `NODE_ENV=test` or local dev loopback peers (same trust model as demo login).
- **Async side effects** (notifications, explore map cache bust): **production** uses the durable outbox automatically (`NODE_ENV=production`). Local/staging: set `SIDE_EFFECT_OUTBOX=1` to match prod (drain every 30s via `SIDE_EFFECT_OUTBOX_DRAIN_INTERVAL_MS`). Without the flag, dev uses fire-and-forget + warn logs — see `scheduleSideEffect` in `apps/api/src/lib/schedule-side-effect.ts`.
- **`npm run seed` without `SEED_DATA`:** still **upserts curated areas** and **backfills `place.areaId`** on catalog rows (safe on existing DBs).
- **Seed/backfill CLI audit:** one-shot API scripts (`npm run seed`, `seed-dev-qa`, `mongo:sync`, backfills, …) append a JSON line to `apps/api/logs/seed-script-runs.jsonl` (`script`, `ok`, `durationMs`, `exitCode`). Override path with `SEED_SCRIPT_AUDIT_LOG`. Scripts exit after teardown (Mongo + Redis) so terminals do not hang.
- **Explore map guest cap:** signed-out map preview is **3 outings + 3 places** in **production** only. Local dev serves the full catalog (set `EXPLORE_MAP_GUEST_CATALOG_CAP=1` to rehearse guest preview). Signed-in members always get the full payload. QA seed adds **20 outings** (mix of hike/camp/**event**/rideshare) — only rows with `activityType: event` count as **Events** on the map filter, not all 20.
- After pulling member/host changes, restart the API once so Mongo migrations run (`tenant_memberships` owner backfill, `publishingPurpose` on tenants).
- Buddy **Host** requires **signup profile complete** (`PATCH /me/profile/signup-details`); `GET /me/status` exposes `profileComplete` and `publish.canPublish`. Publish/create on `POST /workspace/activities` enforces the same server-side.
- **`npm run dev:local`:** prints a reminder to run `SEED_DATA=true npm run seed` when the map has no pins (see [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md)).
- Set `QUERY_TIMING=1` to log store queries slower than 25ms (see `apps/api/src/lib/query-timing.ts`).

### Auth & session baseline (do not regress)

1. Refresh token is httpOnly cookie; access token is **in-memory**; full reload rehydrates via `POST /auth/refresh` (`bootstrapSessionFromRefresh` in `src/api/client.ts`) with `credentials: include`.
2. Non-secret signed-in hint: `localStorage` key `uaetrail_user` (profile card). **Do not** persist bearer tokens in `localStorage`.
3. API client: one shared in-flight refresh on `401`, then retry once (`src/api/client.ts`).
4. Role switch is session-level: `POST /me/role/switch` (`visitor` ↔ `original`) — same account identity.
5. Team/group memberships support `isActive` disable (not only hard delete).
6. Social post/reply/review bodies are sanitized before persistence.

During dev run, quickly verify:

- Sign-in → protected route → refresh after token expiry.
- `/me/role/switch` preserves account identity.
- Group/team member disable surfaces `isActive` correctly.

Explore FAB changes: [`CREATE_FLOW.md`](./CREATE_FLOW.md) + `src/explore/composeFlowCatalog.ts`. Automated guards: `npm run verify:system:quick` and `npm run test:explore-alignment`.

**Release verification (S10 hygiene, Oct 2026):** On the release commit run **`npm run verify:system`** (includes `test:explore-alignment`). Day-to-day: **`npm run verify:system:quick`**. Staging manual pass: **`npm run s10f:ops:checklist`**, then **`BASE_URL=https://staging-host npm run s10f:ops:print-routes`** (detail §8 routes + notification edge cases). Map bbox promote (**S10e**): `npm run s10e:staging-checklist` → [`PRE_DEPLOY_CHECKLIST.md`](./PRE_DEPLOY_CHECKLIST.md) + [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md) — flags only after staging p95 gate. **Local ratio spot-check** (API must be up): `EXPLORE_MAP_BBOX=1 npm run dev:api` then **`npm run s10e:local-ratio`**. Tracker: [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.1.

**Find crew storage:** Product = **`member_availability`** (`intent:*` compose · `PUT /me/availability`). Retired seeking-as-activity: [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md). Local: `npm run seeking:storage-status`; deploy gate: `npm run seeking:deploy-gate`; dev DB purge: `npm run purge:seeking-legacy` (optional `--dry-run` via workspace script).

**Local smoke — Find crew (manual, after `dev:local`):**

1. Signed-in → Explore → FAB **Find crew** → fixed window or **Available** (intent open).
2. Map: pin id `availability:{userId}:{slotId}`; peek → profile + message (not activity join).
3. **People** / **Crews** browse: availability rows deep-link to same pin.
4. Plan calendar: availability markers — not retired “seeking activity” rows.
5. API: `npm run test:seeking-local` (backfill residue guards, retired route contracts, availability map projection).

**G-manage (Needs you, not Find):** joiner requests on a hosted activity → host sees `host_join_queue` on `GET /me/coordination-attention` → approve via publishing workspace or Plan manage flow. API slice: `tests/g-manage-coordination-join-approve.test.ts` (included in `verify:system:quick`).
