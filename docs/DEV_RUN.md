# Dev Run

"dev run" means:

- Run from VS Code (tasks/workspace run) with hot reload for both frontend and API.
- Use cloud test database env: `RUN_ENV=test` and `MONGODB_URI_TEST` from root `.env`.
- Avoid observability/performance monitoring stack containers in this mode (Grafana, Prometheus, Loki, Promtail, exporters).
- Open the app in the VS Code integrated browser during dev run for live agent-side monitoring checks.

Use full run-project scripts only when explicitly requested.

Persisted baseline for this workflow: `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`.

During dev run, quickly verify:

- Sign-in -> protected route -> refresh behavior after token expiry remains seamless.
- `/me/role/switch` preserves account identity and can restore original role.
- Group/team member disable operations surface `isActive` state correctly.
