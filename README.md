# UAE Trails

Monorepo web platform for UAE hiking/camping with:
- Express + Prisma backend (`apps/api`)
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

3. Run database migration and seed:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Start frontend + API:
```bash
npm run dev:all
```

Frontend runs on `http://localhost:5175`.  
API runs on `http://localhost:4000`.

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

## API Docs
- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/openapi.json`
