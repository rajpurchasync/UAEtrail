# UAE Trail

Monorepo for **UAE Trail** — find people to get outside with in the UAE & GCC (hikes, camps, runs, group outings). Product concept: [`docs/NORTHSTAR.md`](docs/NORTHSTAR.md).

Monorepo stack:
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
API is available through the frontend proxy at `http://localhost:5175/api`.

Explore map ops (venue catalog import, cache, smoke checks): [`docs/operations/EXPLORE_MAP_RUNBOOK.md`](docs/operations/EXPLORE_MAP_RUNBOOK.md).

## Dev Run Convention

When someone says "dev run", use the VS Code hot-reload workflow with cloud test MongoDB and no observability stack containers.

- Run inside VS Code tasks/workspace (web + API with hot reload).
- Use `RUN_ENV=test` with `MONGODB_URI_TEST` from root `.env`.
- Do not start Grafana, Prometheus, Loki, or other monitoring containers unless explicitly requested.

## Auth & session baseline

See [`docs/DEV_RUN.md`](docs/DEV_RUN.md) (§ Auth & session baseline). System alignment: `npm run verify:system:quick`.

## Dependency Model

The launch scripts are the source of truth for local runtime prerequisites. They check versions first, install what they can, and fail with a clear message when an OS-level dependency still needs manual action.

| Platform | Auto-checked | Auto-installed or repaired | Version source |
|----------|--------------|----------------------------|----------------|
| Windows | Node.js >= 24.22.0 (see `.nvmrc`), npm >= 11.16.0, Docker Desktop >= 24, Docker Compose >= 2 | Node.js via official ZIP download if below minimum; Docker Desktop via `winget`; Docker service start attempt | `run-project.bat` + `scripts/run-project-preflight.mjs` (see `.nvmrc`) |
| Linux / RHEL | Node.js >= 24.22.0 (see `.nvmrc`), npm >= 11.16.0, Docker Engine >= 24, Docker Compose >= 2 | Node.js via official tarball if below minimum; Docker via `apt-get`, `dnf`, or `yum`; Docker service start attempt | `run-project.sh` + `scripts/run-project-preflight.mjs` |
| macOS | Node.js >= 24.22.0 (see `.nvmrc`), npm >= 11.16.0, Docker Desktop >= 24, Docker Compose >= 2 | Node.js via official tarball if below minimum; Docker Desktop via `brew install --cask docker`; Docker app launch attempt | `run-project-mac.sh` + `scripts/run-project-preflight.mjs` |

The workspace dependencies are also handled automatically: if `node_modules` is missing, the preflight runs `npm install`.

If a newer Node.js, Docker, or installer requirement is introduced later, update the launcher scripts and this table together so the README stays aligned with the actual bootstrap behavior.

## Documentation & deployment

| Guide | Purpose |
|-------|---------|
| [DOCS_INDEX.md](docs/DOCS_INDEX.md) | **Start here** — canonical vs experiment vs historical docs |
| [SYSTEM_COHERENCE.md](docs/SYSTEM_COHERENCE.md) | Whole product — capabilities, modules, API contexts, debt register |
| [DOCS_GOVERNANCE.md](docs/DOCS_GOVERNANCE.md) | How to keep docs aligned; `npm run verify:docs` |
| [NORTHSTAR.md](docs/NORTHSTAR.md) | Product concept, voice, surface jobs |
| [MEMBER_MODEL.md](docs/MEMBER_MODEL.md) | Member tiers, host/join naming, `GET /me/status`, buddy Host / publish |
| [SYSTEM_COHERENCE.md](docs/SYSTEM_COHERENCE.md) §8 | Platform program + coherence (PCOH) |
| [DOMAIN_CANONICALS.md](docs/DOMAIN_CANONICALS.md) | Entities, URL/API canon, `routingCatalog`, routing hygiene |
| [DOMAIN.md](docs/DOMAIN.md) | Full domain glossary (Place, Activity, Trips UI vs Activity) |
| [API_ROUTING.md](docs/API_ROUTING.md) | `/me/*` vs `/host/*` conventions |
| [DEV_RUN.md](docs/DEV_RUN.md) | VS Code hot-reload dev convention |
| [NAVIGATION.md](docs/NAVIGATION.md) | Routes, surfaces, auth redirects |
| [LANDING.md](docs/LANDING.md) | Guest-only marketing page (`/`) scope |
| [PRE_DEPLOY_CHECKLIST.md](docs/PRE_DEPLOY_CHECKLIST.md) | Go-live + release gates (`verify:system`) |
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

Set **`DEMO_ACCOUNT_PASSWORD`** in root `.env` before seeding (see `.env.example` and `docs/DEV_RUN.md`). All demo personas share that password — it is not stored in the repo.

After seeding with `SEED_DATA=true` (or `FORCE_SEED=1`), log in with:

| Persona | Email |
|---------|-------|
| Admin | `admin@uaetrails.app` |
| Participant | `visitor@uaetrails.app` |
| Individual host | `host@uaetrails.app` |
| Agency | `organizer@uaetrails.app` |
| Shop | `shop@uaetrails.app` |

Additional demo accounts: `guide@uaetrails.app`, `visitor2@uaetrails.app` (same shared password).

**Connections QA (buddies, follows, pending requests):** after demo users exist, run `cd apps/api && SEED_CONNECTIONS=true npm run seed` (included automatically on full `SEED_DATA=true` seed). Log in as `visitor@` and follow the playbook printed in the seed output. See `docs/NAVIGATION.md` § Connections QA.

## Feature Flags (Frontend)
Add in root `.env`:
```bash
VITE_API_BASE_URL=http://localhost:4000/api
VITE_USE_API_HOME=true
VITE_USE_API_DISCOVERY=true
VITE_USE_API_CALENDAR=true
VITE_USE_API_TRIP_DETAIL=true
```

Postgres is no longer used. MongoDB Atlas is the only supported database path for project startup. Use `RUN_ENV=test|staging|production` with `MONGODB_URI_TEST` (test DB), `MONGODB_URI_STAGING` (uaetrail_staging DB), and `MONGODB_URI_PROD` (production DB) in the root `.env`.

## API Docs
- Swagger UI: `http://localhost:5175/api/docs`
- OpenAPI JSON: `http://localhost:5175/api/openapi.json`
