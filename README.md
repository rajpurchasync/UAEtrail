# UAE Trails

Monorepo web platform for UAE hiking/camping with:
- Express backend with MongoDB-first auth/data plumbing (`apps/api`)
- React + Vite frontend (`src`)
- Shared DTO/types package (`packages/shared-types`)

## Quick Start

### Team / shared cloud database (recommended)

Everyone uses the **same MongoDB Atlas** database so seed data, users, and trips are shared.

1. Install dependencies:
```bash
npm install
```

2. Configure the root env with MongoDB Atlas and local secrets:
```bash
cp .env.example .env
```

3. Start the full workspace stack:
```bash
run-project.bat       # Windows cmd / PowerShell
./run-project.sh      # Linux / RHEL
./run-project-mac.sh  # macOS
```
Use database name **`uaetrail`** (same as production for now).

### Seed behavior (launcher + seed script)

Launchers and `npm run seed` share the same rules:

- **Production** (`NODE_ENV=production`) never seeds data.
- **Existing seed marker data** (demo admin, seed event, or seed location) is preserved unless you explicitly opt in to reseed.
- To seed on first run or intentionally reseed in dev/test, set one of:
  - `SEED_DATA=true`
  - `FORCE_SEED=1`
  - `RUN_PROJECT_FORCE_SEED=1`

Without one of those flags, restarts skip seeding so existing records are not overwritten.

Frontend runs on `http://localhost:5175`.
API is available through the frontend proxy at `http://localhost:5175/api/v1`.

## Dev Run Convention

When someone says "dev run", use the VS Code hot-reload workflow with cloud test MongoDB and no observability stack containers.

- Run inside VS Code tasks/workspace (web + API with hot reload).
- Use `RUN_ENV=test` with `MONGODB_URI_TEST` from root `.env`.
- Do not start Grafana, Prometheus, Loki, or other monitoring containers unless explicitly requested.

## performance_crossPlatform_bugfix Baseline

Canonical persisted instructions for this workstream are in:

- `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`

Future agents/workspaces should treat that file as the source of truth for auth/session, access management, and social/performance guardrails introduced on the `performance_crossPlatform_bugfix` branch.

## Dependency Model

The launch scripts are the source of truth for local runtime prerequisites. They check versions first, install what they can, and fail with a clear message when an OS-level dependency still needs manual action.

| Platform | Auto-checked | Auto-installed or repaired | Version source |
|----------|--------------|----------------------------|----------------|
| Windows | Node.js >= 20.19.0, npm, Docker Desktop >= 24, Docker Compose >= 2 | Node.js via official ZIP download if below minimum; Docker Desktop via `winget`; Docker service start attempt | `run-project.bat` + `scripts/run-project-preflight.mjs` |
| Linux / RHEL | Node.js >= 20.19.0, npm, Docker Engine >= 24, Docker Compose >= 2 | Node.js via official tarball if below minimum; Docker via `apt-get`, `dnf`, or `yum`; Docker service start attempt | `run-project.sh` + `scripts/run-project-preflight.mjs` |
| macOS | Node.js >= 20.19.0, npm, Docker Desktop >= 24, Docker Compose >= 2 | Node.js via official tarball if below minimum; Docker Desktop via `brew install --cask docker`; Docker app launch attempt | `run-project-mac.sh` + `scripts/run-project-preflight.mjs` |

The workspace dependencies are also handled automatically: if `node_modules` is missing, the preflight runs `npm install`.

If a newer Node.js, Docker, or installer requirement is introduced later, update the launcher scripts and this table together so the README stays aligned with the actual bootstrap behavior.

## Mobile & store deployment

See **[docs/MOBILE_DEPLOYMENT_PLAN.md](docs/MOBILE_DEPLOYMENT_PLAN.md)** for the full checklist.

| Guide | Purpose |
|-------|---------|
| [DEV_RUN.md](docs/DEV_RUN.md) | VS Code hot-reload dev convention |
| [RELEASE_READINESS.md](docs/RELEASE_READINESS.md) | QA gates, UAT scripts, go/no-go |
| [PRE_DEPLOY_CHECKLIST.md](docs/PRE_DEPLOY_CHECKLIST.md) | Go-live on VPS |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker + HTTPS |
| [ANDROID_RELEASE.md](docs/ANDROID_RELEASE.md) | Play Store AAB |
| [IOS_RELEASE.md](docs/IOS_RELEASE.md) | TestFlight / App Store |
| [PLAY_STORE_LISTING.md](docs/PLAY_STORE_LISTING.md) | Store copy & screenshots |
| [MODERATION.md](docs/MODERATION.md) | UGC reports workflow |

```bash
npm run validate:env:prod    # after filling .env on server
npm run icons:generate
npm run cap:sync
npm run cap:android
```

## Seed Accounts (shared Atlas `uaetrail` DB)

After seeding with `SEED_DATA=true` (or `FORCE_SEED=1`), the team can log in with:
- Admin: `admin@uaetrails.app` / `Admin@12345`
- Organizer: `organizer@uaetrails.app` / `Organizer@12345`
- Guide: `guide@uaetrails.app` / `Guide@12345`
- Visitor: `visitor@uaetrails.app` / `Visitor@12345`

## Feature Flags (Frontend)
Add in root `.env`:
```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_USE_API_HOME=true
VITE_USE_API_DISCOVERY=true
VITE_USE_API_CALENDAR=true
VITE_USE_API_TRIP_DETAIL=true
```

Postgres is no longer used. MongoDB Atlas is the only supported database path for project startup. Use `RUN_ENV=test|staging|production` with `MONGODB_URI_TEST` (test DB), `MONGODB_URI_STAGING` (uaetrail_staging DB), and `MONGODB_URI_PROD` (production DB) in the root `.env`.

## API Docs
- Swagger UI: `http://localhost:5175/api/docs`
- OpenAPI JSON: `http://localhost:5175/api/openapi.json`
