#!/usr/bin/env bash
#
# Back up the production database to a compressed, optionally encrypted file.
#
# Run from cron on the application host, for example:
#   17 2 * * *  cd /srv/bpkihs-alumni && ./scripts/backup-db.sh >> /var/log/bpkihs-backup.log 2>&1
#
# Required:
#   DATABASE_URL              the production connection string (never printed)
#
# Optional:
#   BACKUP_DIR                where files are written (default ./backups)
#   BACKUP_KEEP_DAYS          delete files older than this many days (default 14)
#   BACKUP_ENCRYPTION_KEY     if set, encrypt with AES-256 via openssl
#   PG_DUMP_BIN               pg_dump binary (default pg_dump)
#
# The dump contains personal data. The directory is created owner-only, but it is still the
# operator's job to copy the files off the host and store them encrypted at rest.
set -euo pipefail

umask 077

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
PG_DUMP_BIN="${PG_DUMP_BIN:-pg_dump}"

if ! [[ "$BACKUP_KEEP_DAYS" =~ ^[0-9]+$ ]]; then
  echo "BACKUP_KEEP_DAYS must be a whole number of days" >&2
  exit 1
fi
if ! command -v "$PG_DUMP_BIN" >/dev/null 2>&1; then
  echo "pg_dump not found. Install the Postgres 16 client or set PG_DUMP_BIN." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
plain="$BACKUP_DIR/bpkihs-${timestamp}.sql.gz"
partial="${plain}.partial"

cleanup() {
  rm -f "$partial" "${partial}.enc"
}
trap cleanup EXIT

# Plain SQL is readable by psql and survives a pg_dump version mismatch on restore.
"$PG_DUMP_BIN" --no-owner --no-privileges "$DATABASE_URL" | gzip -9 > "$partial"

if ! gzip -t "$partial" >/dev/null 2>&1; then
  echo "backup failed: the compressed dump is not valid" >&2
  exit 1
fi

if [[ ! -s "$partial" ]]; then
  echo "backup failed: the dump is empty" >&2
  exit 1
fi

if [[ -n "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo "BACKUP_ENCRYPTION_KEY is set but openssl is not installed" >&2
    exit 1
  fi
  # Encrypt to the partial name first, so a failure leaves nothing that looks like a
  # complete backup and the cleanup trap can remove it.
  partial_encrypted="${partial}.enc"
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 \
    -in "$partial" -out "$partial_encrypted" -pass env:BACKUP_ENCRYPTION_KEY
  mv "$partial_encrypted" "$plain.enc"
  chmod 600 "$plain.enc"
  destination="$plain.enc"
else
  mv "$partial" "$plain"
  chmod 600 "$plain"
  destination="$plain"
fi

# Retention only touches this script's own files, never anything else in the directory.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'bpkihs-*.sql.gz*' \
  -mtime +"$BACKUP_KEEP_DAYS" -delete

echo "backup written: $destination ($(wc -c < "$destination") bytes)"
