#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

echo "[entrypoint] Starting API..."
exec npm --workspace @uaetrail/api run start
