# Deployment Guide — One Stop Service

## Environment Variables Convention

### Naming Rules

1. **UPPER_SNAKE_CASE** untuk semua environment variable.
2. **Prefix by service:**
   - `APP_*` — Laravel application settings
   - `DB_*` — Database connection
   - `NEXT_PUBLIC_*` — Frontend (exposed to browser)
   - `SANCTUM_*` — Authentication
   - `LOG_*` — Logging configuration
3. Setiap variable baru **wajib** ditambahkan ke `.env.example` dengan komentar.
4. Dokumentasikan variable baru di section "Variable Reference" di bawah.

### Variable Reference

#### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | Yes | One Stop Service | Nama aplikasi |
| `APP_ENV` | Yes | local | Environment: `local`, `staging`, `production` |
| `APP_KEY` | Yes | - | Encryption key (generate: `php artisan key:generate`) |
| `APP_DEBUG` | Yes | true | Debug mode (`true` / `false`) |
| `APP_URL` | Yes | http://localhost:8080 | Base URL aplikasi |
| `APP_PORT` | No | 8000 | Port untuk `php artisan serve` |

#### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_CONNECTION` | Yes | pgsql | Database driver (harus `pgsql`) |
| `DB_HOST` | Yes | postgres | Hostname DB (`postgres` di Docker, `localhost` di lokal) |
| `DB_PORT` | Yes | 5432 | Port PostgreSQL |
| `DB_DATABASE` | Yes | one_stop_service | Nama database |
| `DB_USERNAME` | Yes | postgres | Username database |
| `DB_PASSWORD` | Yes | secret | Password database |

#### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | http://localhost:8080/api | URL backend API |
| `FRONTEND_PORT` | No | 3000 | Port Next.js dev server |

#### Docker

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NGINX_PORT` | No | 8080 | Port Nginx (akses API dari host) |
| `POSTGRES_PORT` | No | 5432 | Port PostgreSQL (akses dari host) |

#### Auth

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SANCTUM_STATEFUL_DOMAINS` | Yes | localhost:3000 | Domain SPA |
| `SESSION_DOMAIN` | Yes | localhost | Session cookie domain |

---

## Deployment with Docker Compose

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2+

### Steps

```bash
# 1. Clone & enter project
git clone <repo-url> one-stop-service
cd one-stop-service

# 2. Setup environment
cp .env.example .env
# Edit .env with production values

# 3. Build & start services
docker compose up -d --build

# 4. Generate app key (first time only)
docker compose exec backend php artisan key:generate

# 5. Run migrations
docker compose exec backend php artisan migrate --seed

# 6. Verify
curl http://localhost:8080/api/health
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| nginx | 8080 | Reverse proxy, serves Laravel |
| backend | 9000 (internal) | PHP-FPM, Laravel application |
| postgres | 5432 | PostgreSQL database |

### Useful Commands

```bash
# View logs
docker compose logs -f backend

# Run artisan commands
docker compose exec backend php artisan <command>

# Access database
docker compose exec postgres psql -U postgres -d one_stop_service

# Restart specific service
docker compose restart backend

# Stop all services
docker compose down

# Stop & remove volumes (reset database)
docker compose down -v
```

---

## Deployment Checklist

### Pre-deployment

- [ ] `APP_ENV` set to `production`
- [ ] `APP_DEBUG` set to `false`
- [ ] `APP_KEY` generated and set
- [ ] `DB_PASSWORD` changed from default
- [ ] `APP_URL` set to production URL
- [ ] `SANCTUM_STATEFUL_DOMAINS` set to production frontend domain
- [ ] `SESSION_DOMAIN` set to production domain
- [ ] All tests passing (`php artisan test`)

### Post-deployment

- [ ] Health endpoint responds: `GET /api/health`
- [ ] Database connected (check health response)
- [ ] Migrations applied (`php artisan migrate:status`)
- [ ] Seeders executed (roles & permissions exist)
- [ ] HTTPS configured
- [ ] Logs are being written

---

## Database Migration — Production

### Menjalankan Migration

```bash
# Dari dalam container (flag --force wajib di production)
docker compose exec backend php artisan migrate --force
```

### Cek Status Migration

```bash
docker compose exec backend php artisan migrate:status
```

### Rollback Plan

Jika migration gagal atau menyebabkan error:

```bash
# Rollback 1 batch terakhir
docker compose exec backend php artisan migrate:rollback --step=1 --force

# Rollback batch tertentu
docker compose exec backend php artisan migrate:rollback --step=N --force
```

> **PENTING:** Selalu backup database **sebelum** menjalankan migration di production.

### Migration Order (Sprint 0–6)

| No | Migration File | Sprint |
|----|---------------|--------|
| 1 | `create_users_table` | 0 |
| 2 | `create_cache_table` | 0 |
| 3 | `create_roles_table` | 0 |
| 4 | `create_permissions_table` | 0 |
| 5 | `create_role_permission_table` | 0 |
| 6 | `add_role_id_to_users_table` | 0 |
| 7 | `add_status_to_users_table` | 1 |
| 8 | `create_personal_access_tokens_table` | 1 |
| 9 | `create_password_reset_tokens_table` | 1 |
| 10 | `create_work_timers_table` | 2 |
| 11 | `create_logbooks_table` | 2 |
| 12 | `create_payroll_submissions_table` | 3 |
| 13 | `create_payroll_snapshot_items_table` | 3 |
| 14 | `create_payroll_status_histories_table` | 3 |
| 15 | `create_logbook_comments_table` | 4 |
| 16 | `add_verification_status_to_logbooks_table` | 4 |
| 17 | `create_logbook_status_histories_table` | 4 |
| 18 | `create_payment_proofs_table` | 5 |
| 19 | `create_notifications_table` | 5 |
| 20 | `create_audit_logs_table` | 5 |
| 21 | `add_performance_indexes` | 6 |

---

## Database Backup

### Manual Backup (pg_dump)

```bash
# Dari host (PostgreSQL exposed ke port 5433)
pg_dump -h localhost -p 5433 -U oss_user -d oss_db -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Dari dalam container
docker compose exec postgres pg_dump -U postgres -d one_stop_service -F c -f /tmp/backup.dump
docker compose cp postgres:/tmp/backup.dump ./backups/
```

Parameter:
- `-F c` = format custom (compressed, mendukung `pg_restore`)
- `-F p` = format plain SQL (readable, bisa dijalankan dengan `psql`)

### Automated Backup Script

Simpan sebagai `scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="oss_backup_${TIMESTAMP}.dump"

mkdir -p $BACKUP_DIR

docker compose exec -T postgres pg_dump -U postgres -d one_stop_service -F c > "${BACKUP_DIR}/${FILENAME}"

echo "Backup saved: ${BACKUP_DIR}/${FILENAME}"

# Hapus backup lebih dari 30 hari
find $BACKUP_DIR -name "oss_backup_*.dump" -mtime +30 -delete
echo "Old backups cleaned up."
```

### Jadwal Backup (Cron)

```cron
# Backup harian jam 2 pagi
0 2 * * * cd /path/to/one-stop-service && bash scripts/backup.sh >> logs/backup.log 2>&1
```

---

## Database Restore

### Restore dari Custom Format (.dump)

```bash
# Drop & recreate database
docker compose exec postgres dropdb -U postgres one_stop_service --if-exists
docker compose exec postgres createdb -U postgres one_stop_service

# Restore
docker compose cp ./backups/oss_backup_YYYYMMDD.dump postgres:/tmp/restore.dump
docker compose exec postgres pg_restore -U postgres -d one_stop_service /tmp/restore.dump
```

### Restore dari Plain SQL (.sql)

```bash
docker compose cp ./backups/oss_backup.sql postgres:/tmp/restore.sql
docker compose exec postgres psql -U postgres -d one_stop_service -f /tmp/restore.sql
```

### Verifikasi Setelah Restore

```bash
# Cek jumlah tabel
docker compose exec postgres psql -U postgres -d one_stop_service -c "\dt"

# Cek jumlah user
docker compose exec postgres psql -U postgres -d one_stop_service -c "SELECT count(*) FROM users;"

# Test health endpoint
curl http://localhost:8088/api/health
```

---

## Update Deployment (Subsequent Releases)

```bash
# 1. Backup database terlebih dahulu
bash scripts/backup.sh

# 2. Pull latest code
git pull origin main

# 3. Install dependencies (--no-dev untuk production)
docker compose exec backend composer install --no-dev --optimize-autoloader

# 4. Run new migrations
docker compose exec backend php artisan migrate --force

# 5. Clear & rebuild cache
docker compose exec backend php artisan config:cache
docker compose exec backend php artisan route:cache

# 6. Verify
curl http://localhost:8088/api/health
```

---

## Monitoring & Logs

```bash
# Tail Laravel logs
docker compose exec backend tail -f storage/logs/laravel.log

# Tail Nginx access/error logs
docker compose logs -f nginx
```

---

## PIC (Person In Charge)

| Module | PIC | Role |
|--------|-----|------|
| Backend (Laravel, API, Database) | Hafizh Andika | Backend Developer |
| Frontend (Next.js, UI/UX) | Mahesa Fazrie | Frontend Developer |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Migration gagal | Rollback: `php artisan migrate:rollback --step=1 --force`, fix file |
| 502 Bad Gateway | Cek PHP-FPM: `docker compose logs backend` |
| Database connection refused | Cek container postgres: `docker compose ps` |
| Storage permission error | `docker compose exec backend chmod -R 775 storage bootstrap/cache` |
| Cache stale setelah deploy | `php artisan config:clear && php artisan route:clear && php artisan cache:clear` |

