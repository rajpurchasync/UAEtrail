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
- `S3_BUCKET` (defaults to `uaetrail-assets`)
- `S3_FORCE_PATH_STYLE` (defaults to `true` for MinIO)

## Local Development — Bootstrap Order

1. `npm install`
2. Copy and configure env: `cp .env.example .env`
3. `run-project.bat` on Windows, `./run-project.sh` on Linux/RHEL, or `./run-project-mac.sh` on macOS

### Query timing (development)

Set `QUERY_TIMING=1` to log store queries slower than 25ms to stdout.

## Production (Docker) — Bootstrap Order

1. `cp .env.production.example .env` — fill in secrets, including `RUN_ENV=production` and `MONGODB_URI_PROD`
2. `./run-project.sh`
3. Seed initial data (admin user, sample locations, etc.):
   ```bash
   docker compose exec -T api npm --workspace @uaetrail/api run seed
   ```

> In production, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env` before seeding.
> The seed script skips demo data when `NODE_ENV=production`.

## First Admin Bootstrap

In development, seed creates:
- Email: `admin@uaetrails.app`
- Password: `Admin@12345`

**Change this password immediately** after first login.

In production, only the admin account from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` is created.

## Public Pages

All public pages (Home, Discovery, Calendar, TripDetail) fetch from the API by default.
The previous `VITE_USE_API_*` feature flags have been removed — API-first is the only mode.
