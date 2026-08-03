# Data Migration and Bootstrap

## Environment Variables

All required variables are documented in `.env.example` at the project root.
Copy it to `.env` and fill in production values before starting Docker.

### Required backend variables
- `MONGODB_URI` (local MongoDB service in docker-compose or Atlas URI)
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
2. Start MongoDB locally with `docker compose up mongo minio redis` or use Atlas
3. Copy and configure env: `cp apps/api/.env.example apps/api/.env`
4. `npm run seed`
5. `npm run build:api`
6. `npm run build`

### Query timing (development)

Set `QUERY_TIMING=1` to log store queries slower than 25ms to stdout.

## Production (Docker) — Bootstrap Order

1. `cp .env.example .env` — fill in secrets (including `MONGODB_URI`)
2. `docker compose up -d --build`
3. Seed initial data (admin user, sample locations, etc.):
   ```bash
   docker compose exec api npm --workspace @uaetrail/api run seed
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
