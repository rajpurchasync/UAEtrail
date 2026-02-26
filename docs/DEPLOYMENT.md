# Deployment (Single VPS + Docker)

## Services

- `api` (Express + Prisma)
- `postgres`
- `redis`
- `minio` (S3-compatible media storage)

Defined in [`docker-compose.yml`](/c:/Users/rajdh/Desktop/Cursor/purchasync/uaetrail/docker-compose.yml).

## Server Steps

1. Copy project to server.
2. Create/secure production env values:
   - strong JWT secrets
   - production DB credentials
   - MinIO/S3 credentials
3. Build and start:
```bash
docker compose up -d --build
```
4. Run migrations from API container:
```bash
docker compose exec api npm --workspace @uaetrail/api run prisma:migrate
docker compose exec api npm --workspace @uaetrail/api run prisma:seed
```

## Backup Strategy

### PostgreSQL backup
```bash
docker compose exec postgres pg_dump -U postgres uaetrail > uaetrail_backup.sql
```

### PostgreSQL restore
```bash
cat uaetrail_backup.sql | docker compose exec -T postgres psql -U postgres uaetrail
```

### MinIO backup
Use `mc mirror` or volume-level snapshots for `uaetrail_minio` volume.
