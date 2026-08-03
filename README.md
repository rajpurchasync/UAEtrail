# UAE Trails

Monorepo web platform for UAE hiking/camping with:
- Express backend with MongoDB-first auth/data plumbing (`apps/api`)
- React + Vite frontend (`src`)
- Shared DTO/types package (`packages/shared-types`)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure backend env:
```bash
cp apps/api/.env.example apps/api/.env
```

3. Start local services:
```bash
docker compose up -d mongo redis minio
```

4. Seed the database:
```bash
npm run seed
```

5. Start frontend + API:
```bash
npm run dev:all
```

Frontend runs on `http://localhost:5175`.  
API runs on `http://localhost:4000`.

## Mobile & store deployment

See **[docs/MOBILE_DEPLOYMENT_PLAN.md](docs/MOBILE_DEPLOYMENT_PLAN.md)** for the full checklist.

| Guide | Purpose |
|-------|---------|
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

## Seed Accounts
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

Postgres is no longer used — MongoDB is the only database. Ensure `MONGODB_URI` is set in `apps/api/.env` before starting the API.

## API Docs
- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/openapi.json`
