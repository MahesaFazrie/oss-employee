#!/bin/bash
# ═══════════════════════════════════════════
# One Stop Service — Database Backup Script
# ═══════════════════════════════════════════
# Usage: bash scripts/backup.sh
# Cron:  0 2 * * * cd /path/to/one-stop-service && bash scripts/backup.sh >> logs/backup.log 2>&1

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="oss_backup_${TIMESTAMP}.dump"

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting database backup..."

docker compose exec -T postgres pg_dump -U postgres -d one_stop_service -F c > "${BACKUP_DIR}/${FILENAME}"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup saved: ${BACKUP_DIR}/${FILENAME} ($(du -h ${BACKUP_DIR}/${FILENAME} | cut -f1))"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

# Hapus backup lebih dari 30 hari
DELETED=$(find $BACKUP_DIR -name "oss_backup_*.dump" -mtime +30 -delete -print | wc -l)
echo "[$(date)] Cleaned up ${DELETED} old backup(s)."
