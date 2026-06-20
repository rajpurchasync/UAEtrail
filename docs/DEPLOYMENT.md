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
│  api  (Express + Prisma)     │  :4000
└──────┬───────────┬───────────┘
       │           │
       ▼           ▼
   postgres      minio        redis (reserved)
    :5432        :9000          :6379
```

## Services

| Container | Image | Purpose |
|-----------|-------|---------|
| `frontend` | nginx:1.25‑alpine | Serves the Vite SPA, reverse-proxies `/api/*` to the API |
| `api` | node:20‑alpine (custom) | Express + Prisma backend |
| `postgres` | postgres:16‑alpine | Primary database |
| `minio` | minio/minio:latest | S3‑compatible media storage |
| `redis` | redis:7‑alpine | Reserved for future caching / rate‑limiting |

All defined in `docker-compose.yml`.

---

## Prerequisites

- Docker Engine ≥ 24 and Docker Compose v2
- A domain name (for HTTPS)
- SSH access to the VPS

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
POSTGRES_PASSWORD=YourStr0ngDbP@ss!
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>
S3_ACCESS_KEY_ID=minio-admin-user
S3_SECRET_ACCESS_KEY=minio-admin-s3cr3t!
```

> **Note**: `docker-compose.yml` will refuse to start if required secrets are missing — this is intentional.

---

## 2 — Build and Start

```bash
docker compose up -d --build
```

This builds both `api` and `frontend` images and starts all services. Health checks ensure services start in the correct order:
- `postgres` must be ready before `api` starts
- `minio` must be ready before `api` starts
- `api` must pass `/health` before `frontend` starts

---

## 3 — Run Migrations and Seed

```bash
# Apply all pending migrations (production-safe, no prompts)
docker compose exec api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

# Seed initial data (admin user, sample locations, etc.)
docker compose exec api npm --workspace @uaetrail/api run prisma:seed
```

> **First admin credentials** (from seed): `admin@uaetrails.app` / `Admin@12345`
> **Change this password immediately** after first login.

---

## 4 — Enable HTTPS (Recommended)

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

# Apply any new migrations
docker compose exec api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

---

## Backup Strategy

### PostgreSQL backup
```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" uaetrail > "uaetrail_backup_$(date +%F).sql"
```

### PostgreSQL restore
```bash
cat uaetrail_backup.sql | docker compose exec -T postgres psql -U "$POSTGRES_USER" uaetrail
```

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

# Prisma Studio (dev only — do NOT expose in production)
docker compose exec api npx prisma studio --schema apps/api/prisma/schema.prisma

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
| postgres | 5432 | 5432 | `POSTGRES_PORT` |
| minio API | 9000 | 9000 | `MINIO_API_PORT` |
| minio console | 9001 | 9001 | `MINIO_CONSOLE_PORT` |
| redis | 6379 | 6379 | `REDIS_PORT` |

> In production, only expose ports **80** and **443** to the public internet. Keep all other ports behind the firewall.
