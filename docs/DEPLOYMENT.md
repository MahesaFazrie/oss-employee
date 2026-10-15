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
