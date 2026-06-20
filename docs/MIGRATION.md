# Data Migration and Bootstrap

## Environment Variables

All required variables are documented in `.env.example` at the project root.
Copy it to `.env` and fill in production values before starting Docker.

### Required backend variables
- `DATABASE_URL` (auto-composed in docker-compose from `POSTGRES_*` vars)
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

## Local Development — Migration Order

1. `npm install`
2. `npm run prisma:generate`
3. `npm run prisma:migrate` (interactive dev migration)
4. `npm run prisma:seed`
5. `npm run build:api`
6. `npm run build`

## Production (Docker) — Migration Order

1. `cp .env.example .env` — fill in secrets
2. `docker compose up -d --build`
3. `docker compose exec api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma`
4. `docker compose exec api npm --workspace @uaetrail/api run prisma:seed`

> Use `prisma migrate deploy` (not `prisma migrate dev`) in production.
> It applies pending migrations without prompts and never resets data.

## First Admin Bootstrap

Seed creates:
- Email: `admin@uaetrails.app`
- Password: `Admin@12345`

**Change this password immediately** after first login.

## Public Pages

All public pages (Home, Discovery, Calendar, TripDetail) now fetch from the API by default.
The previous `VITE_USE_API_*` feature flags have been removed — API-first is the only mode.
