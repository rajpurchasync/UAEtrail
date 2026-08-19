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
| `frontend` | nginx:1.25‑alpine | Serves the Vite SPA, reverse-proxies `/api/*` to the API |
| `api` | node:20‑alpine (custom) | Express + MongoDB backend |
| `minio` | minio/minio:latest | S3‑compatible media storage |
| `redis` | redis:7‑alpine | Rate limits and SSE tickets |

All defined in `docker-compose.yml`.

---

## Prerequisites

- Docker Engine ≥ 24 and Docker Compose v2
- Node.js 20.19+ on the host (used by `run-project.sh` / `run-project-mac.sh` / `run-project.bat`)
- A domain name (for HTTPS)
- SSH access to the VPS
- MongoDB Atlas URIs for test, staging, and production

## performance_crossPlatform_bugfix Persisted Notes

Reference: `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`

Deployment-critical carry-forward:

- Keep refresh token cookie flow enabled end-to-end (frontend requests must continue using `credentials: include`).
- Ensure `APP_BASE_URL` and `APP_BASE_URLS` are correct for production origin(s), otherwise refresh and auth flows may fail cross-platform.
- Do not regress frontend session persistence assumptions (`uaetrail_session` in localStorage).

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

> **First admin credentials** (dev seed): `admin@uaetrails.app` / `Admin@12345`
> **Change this password immediately** after first login.

**Production:** the seed script never runs demo data when `NODE_ENV=production`. Create admin users through your normal signup/admin provisioning flow instead.

> Running seed without `SEED_DATA=true` skips when marker data already exists. With `SEED_DATA=true`, existing demo records may be updated/overwritten.

---

## 4 — Enable HTTPS (Recommended)

### Quick path (Docker)

```bash
# 1. Obtain certs (Let's Encrypt or your CA)
sudo certbot certonly --standalone -d uaetrail.ae -d www.uaetrail.ae
cp /etc/letsencrypt/live/uaetrail.ae/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/uaetrail.ae/privkey.pem nginx/certs/

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
| `APP_BASE_URL` | Yes | `https://uaetrail.ae` |
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
curl http://localhost/api/v1/locations
```

---

## Updating

```bash
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

No database migrations are required — schema is managed via MongoDB indexes created at API startup.

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
