# Deployment (Single VPS + Docker)

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
│  api  (Express + MongoDB)    │  :4000
└──────┬───────────┬───────────┘
       │           │
       ▼           ▼
     mongo       minio        redis (reserved)
    :27017       :9000          :6379
```

## Services

| Container | Image | Purpose |
|-----------|-------|---------|
| `frontend` | nginx:1.25‑alpine | Serves the Vite SPA, reverse-proxies `/api/*` to the API |
| `api` | node:20‑alpine (custom) | Express + MongoDB backend |
| `mongo` | mongo:7 | Primary database |
| `minio` | minio/minio:latest | S3‑compatible media storage |
| `redis` | redis:7‑alpine | Reserved for future caching / rate‑limiting |

All defined in `docker-compose.yml`.

---

## Prerequisites

- Docker Engine ≥ 24 and Docker Compose v2
- A domain name (for HTTPS)
- SSH access to the VPS
- MongoDB URI (use the bundled `mongo` service, or MongoDB Atlas)

---

## 1 — Prepare Environment

```bash
# Clone or copy the project to the server
git clone <repo-url> uaetrail && cd uaetrail

# Create .env from the template
cp .env.example .env
```

Edit `.env` and fill in **all REQUIRED values**:

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Example .env values (DO NOT use these in production):
MONGODB_URI=mongodb://mongo:27017/uaetrail
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>
S3_ACCESS_KEY_ID=minio-admin-user
S3_SECRET_ACCESS_KEY=minio-admin-s3cr3t!
```

> **Note**: `docker-compose.yml` will refuse to start if required secrets are missing — this is intentional.

For MongoDB Atlas, set `MONGODB_URI` to your Atlas connection string and remove the `mongo` service dependency from `docker-compose.yml` if you prefer a managed database.

---

## 2 — Build and Start

```bash
docker compose up -d --build
```

This builds both `api` and `frontend` images and starts all services. Health checks ensure services start in the correct order:
- `mongo` must be ready before `api` starts
- `minio` must be ready before `api` starts
- `api` must pass `/health` before `frontend` starts

---

## 3 — Seed Initial Data

```bash
# Seed admin user and (in non-production) demo data
docker compose exec api npm --workspace @uaetrail/api run seed
```

> **First admin credentials** (dev seed): `admin@uaetrails.app` / `Admin@12345`
> **Change this password immediately** after first login.

In production, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env` before running seed. Demo data is skipped when `NODE_ENV=production`.

> Do **not** run seed with default passwords in production unless you override them via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

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
| `MONGODB_URI` | Yes | Database connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Yes | Auth tokens |
| `APP_BASE_URL` | Yes | `https://uaetrail.ae` |
| `APP_BASE_URLS` | Yes | Comma-separated allowed origins |
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

# API responds
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

### MongoDB backup (local container)
```bash
docker compose exec mongo mongodump --archive=/data/db/backup.archive --db uaetrail
docker compose cp mongo:/data/db/backup.archive ./uaetrail_backup_$(date +%F).archive
```

### MongoDB restore
```bash
docker compose cp ./uaetrail_backup.archive mongo:/data/db/backup.archive
docker compose exec mongo mongorestore --archive=/data/db/backup.archive --drop
```

For MongoDB Atlas, use Atlas automated backups or `mongodump` against your Atlas URI.

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
