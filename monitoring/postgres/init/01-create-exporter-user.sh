#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres_exporter') THEN
    CREATE ROLE postgres_exporter WITH LOGIN PASSWORD '${POSTGRES_EXPORTER_PASSWORD}';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO postgres_exporter;
GRANT USAGE ON SCHEMA public TO postgres_exporter;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres_exporter;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO postgres_exporter;
GRANT pg_monitor TO postgres_exporter;
EOSQL
