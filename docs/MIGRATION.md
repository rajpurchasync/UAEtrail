# Data Migration and Bootstrap

## Environment Variables

Required backend variables:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_BASE_URL`
- `APP_BASE_URLS` (comma-separated, recommended for local multi-port dev)
- `API_BASE_URL`

Optional media variables:
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`

## Migration Order

1. `npm install`
2. `npm run prisma:generate`
3. `npm run prisma:migrate`
4. `npm run prisma:seed`
5. `npm run build:api`
6. `npm run build`

## First Admin Bootstrap

Seed creates:
- Email: `admin@uaetrails.app`
- Password: `Admin@12345`

Change this password immediately after first login.

## Public Page Incremental Migration

Frontend feature flags:
- `VITE_USE_API_HOME`
- `VITE_USE_API_DISCOVERY`
- `VITE_USE_API_CALENDAR`
- `VITE_USE_API_TRIP_DETAIL`

Set flags to `false` to fall back to static mock data for the corresponding page.
