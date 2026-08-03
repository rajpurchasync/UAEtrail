#!/bin/sh
set -e

echo "[entrypoint] Starting API..."
exec npm --workspace @uaetrail/api run start
