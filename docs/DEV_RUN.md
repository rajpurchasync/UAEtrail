# Dev Run

"dev run" means:

- Run from VS Code (tasks/workspace run) with hot reload for both frontend and API.
- Use cloud test database env: `RUN_ENV=test` and `MONGODB_URI_TEST` from root `.env`.
- Avoid observability/performance monitoring stack containers in this mode (Grafana, Prometheus, Loki, Promtail, exporters).
- Open the app in the VS Code integrated browser during dev run for live agent-side monitoring checks.

Use full run-project scripts only when explicitly requested.

### Demo data (`SEED_DATA`)

- Seed **does not** run on every dev start. Use `SEED_DATA=true` (or `FORCE_SEED=1`) when you need demo users, map pins, and host fixtures — see `README.md` and `docs/DEPLOYMENT.md`.
- After pulling member/host changes, restart the API once so Mongo migrations run (`tenant_memberships` owner backfill, `publishingPurpose` on tenants).
- Buddy **Organize** requires **signup profile complete** (`PATCH /me/profile/signup-details`); `GET /me/host-status` exposes `canPublish`. Publish/create on `/host/activities` enforces the same server-side.
- **`npm run dev:local`:** prints a reminder to run `SEED_DATA=true npm run seed` when the map has no pins (see [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md)).

Persisted baseline for this workflow: `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`.

During dev run, quickly verify:

- Sign-in -> protected route -> refresh behavior after token expiry remains seamless.
- `/me/role/switch` preserves account identity and can restore original role.
- Group/team member disable operations surface `isActive` state correctly.
