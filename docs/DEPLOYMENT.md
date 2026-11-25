# Deployment (Single VPS/RHEL + Docker)

## Architecture

```
Internet
  │
  ▼  :80 / :443
┌──────────────────────────────┐
│  frontend  (nginx)           │  serves SPA + proxies /api → api:4000
│  ┌────────────────────────┐  │
│  │ Vite static build      │  │
│  └────────────────────────┘  │
└──────────┬───────────────────┘
           │ /api/*
           ▼
┌──────────────────────────────┐
│  api  (Express + MongoDB)    │  :4000 internal only
└──────┬───────────┬───────────┘
       │           │
       ▼           ▼
    Atlas       minio        redis
  managed DB    :9000        :6379
```

## Services

| Container | Image | Purpose |
|-----------|-------|---------|
| `frontend` | nginx:1.25‑alpine | Serves the Vite SPA, reverse-proxies `/api/*` to the API; **301** stale consumer bookmarks via `nginx/snippets/inbound-bookmark-redirects.conf` (plan/history, explore entry, `/crews`, submissions, `/chat`, Pro entry, settings/notifications, badges, wishlist — see [`NAVIGATION.md`](./NAVIGATION.md) § Stale URLs) |
| `api` | node:24‑alpine (custom) | Express + MongoDB backend |
| `minio` | minio/minio:latest | S3‑compatible media storage |
| `redis` | redis:7‑alpine | Rate limits and SSE tickets |

All defined in `docker-compose.yml`.

### Vercel (SPA + upstream API proxy)

Vercel is supported for the **Vite frontend** plus lightweight **serverless proxies** under `api/` (same paths nginx forwards today: `/api/*`, `/health`, `/og/*`, `/sitemap-activities.xml`). The Express API, MongoDB, Redis, and MinIO still run on your VPS/Docker stack (or another host) — Vercel does not replace that backend.

1. `npx vercel login` and `npx vercel link` (repo root).
2. **Project env (Vercel dashboard):**
   - `UAETRAIL_API_ORIGIN` — public origin of the running API stack **without** a trailing slash (e.g. `https://app.example.com`). Proxies preserve `/api` and cookies when the browser uses `VITE_API_BASE_URL=/api`.
   - Build: `VITE_API_BASE_URL=/api`, `VITE_SITE_ORIGIN=https://<your-vercel-domain>`, plus optional `VITE_GOOGLE_CLIENT_ID`, `VITE_RUN_ENV`.
3. On the **API server**, add each Vercel preview/production URL to `APP_BASE_URLS` (CORS + auth cookies).
4. Deploy: `npx vercel --prod` (build runs on Vercel; config in `vercel.json`).

**Chat SSE:** Browsers should open **`/api/chat/stream` on the same origin that terminates at the Express API** (nginx `app.example.com` or direct API host). Do not rely on the Vercel serverless proxy alone for long-lived SSE — see [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.9.

Local CLI builds on Windows may fail with symlink `EPERM`; use remote Git deploy or run the CLI from WSL/macOS if that happens.

---

## Prerequisites

- Docker Engine ≥ 24 and Docker Compose v2
- Node.js 24.22+ and npm 11.16+ on the host (used by `run-project.sh` / `run-project-mac.sh` / `run-project.bat`; see `.nvmrc`)
- A domain name (for HTTPS)
- SSH access to the VPS
- MongoDB Atlas URIs for test, staging, and production

## Auth & env (production)

- Env template: `.env.production.example` — validate with `npm run validate:env:prod` on the server.
- Bootstrap order and first admin: see former `MIGRATION.md` content in **§ First admin** below; local dev: [`DEV_RUN.md`](./DEV_RUN.md).
- Keep refresh cookie + `credentials: include` end-to-end; set `APP_BASE_URL` / `APP_BASE_URLS` to real origins.
- Optional observability (Grafana/Loki/Prometheus): configs under repo `monitoring/` — not started by default dev launchers.

---

## 1 — Prepare Environment

```bash
# Clone or copy the project to the server
git clone <repo-url> uaetrail && cd uaetrail

# Create .env from the production template
cp .env.production.example .env
```

Edit `.env` and fill in **all REQUIRED values**:

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Example .env values (DO NOT use these in production):
RUN_ENV=production
MONGODB_URI_PROD=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/uaetrail_prod?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>
S3_ACCESS_KEY_ID=minio-admin-user
S3_SECRET_ACCESS_KEY=minio-admin-s3cr3t!
APP_BASE_URL=https://app.example.com
APP_BASE_URLS=https://app.example.com,https://www.example.com
API_BASE_URL=https://app.example.com
VITE_SITE_ORIGIN=https://app.example.com
```

> **Note**: `docker-compose.yml` will refuse to start if required secrets are missing — this is intentional.

Production startup resolves MongoDB automatically from `RUN_ENV`:
- `RUN_ENV=test` (or `local`) uses `MONGODB_URI_TEST`
- `RUN_ENV=staging` uses `MONGODB_URI_STAGING`
- `RUN_ENV=production` uses `MONGODB_URI_PROD`

---

## 2 — Build and Start

```bash
./run-project.sh
```

This validates env selection, builds both images, and starts the stack. Demo seeding runs only when `SEED_DATA=true` (or `FORCE_SEED=1` / `RUN_PROJECT_FORCE_SEED=1`) and never in production. On Windows workstations, use `run-project.bat` instead. On macOS, use `./run-project-mac.sh`.

Health checks ensure services start in the correct order:
- `minio` must be ready before `api` starts
- `api` must pass `/health` before `frontend` starts

---

## 3 — Seed Initial Data

Demo seeding is **disabled by default** to avoid overwriting existing data on restart.

```bash
# First-time dev/test seed (or intentional reseed)
SEED_DATA=true docker compose exec -T api npm --workspace @uaetrail/api run seed
```

Aliases: `FORCE_SEED=1` or `RUN_PROJECT_FORCE_SEED=1`.

> **Dev seed:** set `DEMO_ACCOUNT_PASSWORD` in `.env` before seeding; first admin email is `admin@uaetrails.app` (shared demo password — see `DEV_RUN.md`). **Change it immediately** after first login.

**Production:** the seed script never runs demo data when `NODE_ENV=production`. Create admin users through your normal signup/admin provisioning flow instead.

> Running seed without `SEED_DATA=true` skips when marker data already exists. With `SEED_DATA=true`, existing demo records may be updated/overwritten.

---

## 4 — Enable HTTPS (Recommended)

### Quick path (Docker)

```bash
# 1. Obtain certs (Let's Encrypt or your CA)
sudo certbot certonly --standalone -d uaetrail.com -d www.uaetrail.com
cp /etc/letsencrypt/live/uaetrail.com/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/uaetrail.com/privkey.pem nginx/certs/

# 2. Enable HTTPS server block
cp nginx/ssl-server.conf.example nginx/conf.d/ssl.conf
# Edit server_name if your domain differs

# 3. In docker-compose.yml, uncomment the ssl.conf volume mount under frontend

# 4. Rebuild and restart
docker compose up -d --build frontend
```

The example config in `nginx/ssl-server.conf.example` includes HSTS, shared security headers, and HTTP→HTTPS redirect.

### Production environment checklist

Set these in `.env` before going live:

| Variable | Required | Purpose |
|----------|----------|---------|
| `RUN_ENV` | Yes | Set to `production` on the server |
| `MONGODB_URI_PROD` | Yes | Production Atlas connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Yes | Auth tokens |
| `APP_BASE_URL` | Yes | `https://uaetrail.com` |
| `APP_BASE_URLS` | Yes | Comma-separated allowed origins |
| `API_BASE_URL` | Yes | Public app origin used in OpenAPI docs, usually same as `APP_BASE_URL` |
| `VITE_SITE_ORIGIN` | Yes | SEO / Open Graph (Docker build arg) |
| `GOOGLE_CLIENT_ID` | Recommended | API Google token verification |
| `VITE_GOOGLE_CLIENT_ID` | Recommended | Frontend Google button |
| `SMTP_URL` or `SENDGRID_API_KEY` | Yes (prod) | Verification & password reset emails |
| `EMAIL_FROM` | Yes (prod) | Sender address |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Optional | Web push notifications |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | If shop live | Payments |

### Option A: Certbot (Let's Encrypt)

```bash
# On the host (not in Docker)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certs into the nginx mount
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/certs/
```

Then uncomment the HTTPS server block in `nginx/default.conf`, update `server_name`, and restart:

```bash
docker compose restart frontend
```

### Option B: Bring your own certs

Place `fullchain.pem` and `privkey.pem` in `nginx/certs/` and uncomment the HTTPS block.

---

## 5 — Verify

```bash
# Health check
curl http://localhost/health
# → { "status": "ok" }

# Frontend loads
curl -s http://localhost | head -5
# → <!doctype html>...

# API responds through the frontend proxy
curl http://localhost/api/locations
```

---

## Updating

```bash
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

After deploy, the API runs **versioned Mongo migrations** once per environment (`runMongoMigrations` in `apps/api/src/lib/mongo-migrations.ts`, tracked in `schema_meta.migrations`). GW-7 **`2025112502`** — stale inbound paths via `canonicalizeInboundProductPath`. MIG-DESTINATION-GEO **`2025112507`** — Mongo `areas` → `destinations`, catalog `destinationId` / `placeHubLabel`, unset legacy `areaId` / `areaLabel` / `parentPlaceId` / `catalogAreaId` (`runDestinationGeoMigrations`). Stale `/area/*` hubs are not rewritten at deploy or in-app — use `/destination/:slug` (no nginx `/area` redirect). Indexes are still ensured at API startup separately.

---

## Backup Strategy

MongoDB runs in Atlas for supported deployments. Use Atlas automated backups or `mongodump` against `MONGODB_URI_PROD`.

### MinIO backup
```bash
# Install mc (MinIO client) on the host
mc alias set local http://localhost:9000 "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY"
mc mirror local/uaetrail-assets ./minio-backup/
```

Or use Docker volume snapshots for the `uaetrail_minio` volume.

---

## Useful Commands

```bash
# View logs
docker compose logs -f api
docker compose logs -f frontend

# Shell into API container
docker compose exec api sh

# MongoDB shell (dev/troubleshooting)
docker compose exec mongo mongosh uaetrail

# Stop everything
docker compose down

# Stop and remove volumes (DESTROYS DATA)
docker compose down -v
```

---

## First admin (dev/staging only)

```bash
SEED_DATA=true npm run seed
```

Creates `admin@uaetrails.app` using `DEMO_ACCOUNT_PASSWORD` from `.env` — change immediately. Production blocks demo seed (`NODE_ENV=production`).

---

## Ports Reference

| Service | Internal | Default Host Port | Env Var |
|---------|----------|-------------------|---------|
| frontend (HTTP) | 80 | 80 | `FRONTEND_PORT` |
| frontend (HTTPS) | 443 | 443 | `FRONTEND_SSL_PORT` |
| api | 4000 | 4000 | `API_PORT` |
| mongo | 27017 | 27017 | `MONGO_PORT` |
| minio API | 9000 | 9000 | `MINIO_API_PORT` |
| minio console | 9001 | 9001 | `MINIO_CONSOLE_PORT` |
| redis | 6379 | 6379 | `REDIS_PORT` |

> In production, only expose ports **80** and **443** to the public internet. Keep all other ports behind the firewall.
