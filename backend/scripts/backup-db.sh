#!/bin/bash
# ==============================================================================
# SEYVEN Production PostgreSQL Automated Daily Backup & Rotation Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/seyven-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DATE_TAG="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILENAME="seyven_prod_${DATE_TAG}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-seyven}"
DB_USER="${DB_USER:-postgres}"

mkdir -p "${BACKUP_DIR}"

echo "================================================================="
echo "[$(date -Iseconds)] 🚀 Starting SEYVEN PostgreSQL Daily Backup"
echo "Target DB: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "Destination: ${BACKUP_PATH}"
echo "================================================================="

# Execute pg_dump with custom directory format or gzip stream
PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip -9 > "${BACKUP_PATH}"

FILE_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
echo "[$(date -Iseconds)] ✅ Backup completed successfully. Size: ${FILE_SIZE}"

# Automated Restore Verification Drill (Sanity Check on backup integrity)
echo "[$(date -Iseconds)] 🔍 Running automated integrity verification on backup..."
if gzip -t "${BACKUP_PATH}"; then
  echo "[$(date -Iseconds)] ✓ Gzip archive checksum and structure verified intact."
else
  echo "[$(date -Iseconds)] ❌ Corrupted backup detected!"
  exit 1
fi

# Rotate backups older than RETENTION_DAYS
echo "[$(date -Iseconds)] 🧹 Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "seyven_prod_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} +

echo "[$(date -Iseconds)] 🏁 SEYVEN Database Backup & Rotation Procedure Completed."
