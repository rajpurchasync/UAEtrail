# Dev Run

"dev run" means:

- Run from VS Code (tasks/workspace run) with hot reload for both frontend and API.
- Use cloud test database env: `RUN_ENV=test` and `MONGODB_URI_TEST` from root `.env`.
- Avoid observability stack containers in this mode (Grafana, Prometheus, Loki, Promtail, exporters) unless explicitly requested.
- Open the app in the VS Code integrated browser during dev run for live agent-side monitoring checks.

Use full run-project scripts only when explicitly requested.

### Demo data (`SEED_DATA`)

- Seed **does not** run on every dev start. Use `SEED_DATA=true` (or `FORCE_SEED=1`) when you need demo users, map pins, and host fixtures — see `README.md` and `docs/DEPLOYMENT.md`.
- After pulling member/host changes, restart the API once so Mongo migrations run (`tenant_memberships` owner backfill, `publishingPurpose` on tenants).
- Buddy **Organize** requires **signup profile complete** (`PATCH /me/profile/signup-details`); `GET /me/host-status` exposes `canPublish`. Publish/create on `/host/activities` enforces the same server-side.
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

Seeking storage (activity-canonical Find): [`operations/SEEKING_M2D_RUNBOOK.md`](./operations/SEEKING_M2D_RUNBOOK.md). Local readiness: `npm run seeking:m2d-status` (stub write should be **off** by default); gate before deploy: `npm run seeking:deploy-gate`. If backfill skips coord-less intents, use `cancel-coordless-participant-intents` (see runbook).

**Local smoke — Find / looking for (manual, after `dev:local`):**

1. Signed-in → Explore → **Find** (FAB) → publish a pin with location.
2. Map/list: pin opens **same peek/card UX** as other activities (not a separate “demand” screen).
3. **People** panel → **Available** tab: **Looking for company** row opens explore pin URL (`pin=activity:…` when backfilled).
4. Plan → **Schedule** → **Seeking**: your post appears; **Needs you** is only for host coordination (not Find).
5. API contracts (Mongo test DB): `npm run test:seeking-local` (stub default off, store + **POST /me/participant-intents**, explore map `activity` + `activityMode: seeking`).

**G-manage (Needs you, not Find):** joiner requests on a hosted activity → host sees `host_join_queue` on `GET /me/coordination-attention` → approve via host console or Plan manage flow. API slice: `tests/g-manage-coordination-join-approve.test.ts` (included in `verify:system:quick`).
