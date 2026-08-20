# Data Migration and Bootstrap

## Environment Variables

All required variables are documented in `.env.example` at the project root.
Copy it to `.env` and fill in production values before starting Docker.

### Required backend variables
- `RUN_ENV` (`test`, `staging`, or `production`; `local` maps to `test`)
- `MONGODB_URI_TEST` for test/local
- `MONGODB_URI_STAGING` for staging
- `MONGODB_URI_PROD` for production
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_BASE_URL`
- `APP_BASE_URLS` (comma-separated, recommended for multi-origin CORS)
- `API_BASE_URL`

### Required media variables
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

### Optional media variables
- `S3_ENDPOINT` (defaults to `http://minio:9000` in Docker)
- `S3_REGION` (defaults to `us-east-1`)
- `S3_BUCKET` (legacy default `uaetrail-assets`)
- `S3_PUBLIC_BUCKET` (defaults to `uaetrail-public`)
- `S3_PRIVATE_BUCKET` (defaults to `uaetrail-private`; used for `avatar`, `waiver`, `private_photo`)
- `S3_FORCE_PATH_STYLE` (defaults to `true` for MinIO)

## Local Development — Bootstrap Order

1. `npm install`
2. Copy and configure env: `cp .env.example .env`
3. `run-project.bat` on Windows, `./run-project.sh` on Linux/RHEL, or `./run-project-mac.sh` on macOS

Launcher seed behavior:
- Skips seeding unless `SEED_DATA=true` (or `FORCE_SEED=1` / `RUN_PROJECT_FORCE_SEED=1`).
- Never seeds in production.
- When marker data already exists, seed is skipped unless one of the flags above is set.

### Query timing (development)

Set `QUERY_TIMING=1` to log store queries slower than 25ms to stdout.

## 2026-08 Persisted Baseline

Cross-platform performance/auth/access carry-forward is tracked in `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`.

Migration/infrastructure invariants from this workstream:

- Preserve startup index provisioning for favorites/social collections (including partial unique favorites indexes).
- Preserve cookie-refresh + bearer-access token model; avoid reverting to body refresh-token usage in production.
- Preserve role-switch identity continuity (`/me/role/switch`) and `isActive` membership toggles for team/group records.

## Production (Docker) — Bootstrap Order

1. `cp .env.production.example .env` — fill in secrets, including `RUN_ENV=production` and `MONGODB_URI_PROD`
2. `./run-project.sh`
3. Do **not** run demo seed in production (`NODE_ENV=production` blocks it). Provision the first admin through your controlled onboarding process.

## First Admin Bootstrap

In development/test, seed with explicit opt-in:

```bash
SEED_DATA=true npm run seed
```

This creates:
- Email: `admin@uaetrails.app`
- Password: `Admin@12345`

**Change this password immediately** after first login.

In production, demo seed is disabled. Create admin accounts through your operational process.

## Public Pages

All public pages (Home, Discovery, Calendar, TripDetail) fetch from the API by default.
The previous `VITE_USE_API_*` feature flags have been removed — API-first is the only mode.
