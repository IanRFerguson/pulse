#!/bin/bash
set -euo pipefail

BACKUP_FILE="./backup.dump"

cleanup() {
    rm -f "$BACKUP_FILE"
}
trap cleanup EXIT

echo "Dumping remote database..."
pg_dump \
    -h "$DB_HOST" \
    -U "$DB_USERNAME" \
    -d "$DB_NAME" \
    -Fc \
    -f "$BACKUP_FILE"

echo "Dropping and recreating local database..."
psql -h localhost -U "$LOCAL_DB_USERNAME" -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$LOCAL_DB_NAME' AND pid <> pg_backend_pid();"
dropdb -h localhost -U "$LOCAL_DB_USERNAME" "$LOCAL_DB_NAME"
createdb -h localhost -U "$LOCAL_DB_USERNAME" "$LOCAL_DB_NAME"

echo "Restoring to local database..."
pg_restore \
    -h localhost \
    -U "$LOCAL_DB_USERNAME" \
    -d "$LOCAL_DB_NAME" \
    --no-owner \
    --no-privileges \
    "$BACKUP_FILE" || {
    rc=$?
    # pg_restore exits 1 for warnings (non-fatal), 3 for errors
    [[ $rc -eq 1 ]] && echo "pg_restore completed with warnings." || exit $rc
}

echo "Done."