# One Stop Service

Website internal perusahaan konsultan untuk mengelola **logbook kerja berbasis timer**, **rekap bulanan**, **pengajuan payroll**, **verifikasi**, dan **approval**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js + TailwindCSS |
| Backend | Laravel 11 (PHP 8.2) |
| Database | PostgreSQL 16 |
| Auth | Laravel Sanctum |
| Orchestration | Docker Compose |

## Project Structure

```
one-stop-service/
├── frontend/            # Next.js application
├── backend/             # Laravel API
├── docker/              # Docker configurations
│   ├── nginx/           # Nginx reverse proxy config
│   └── scripts/         # Helper scripts (entrypoint, etc.)
├── docs/                # Project documentation
├── .env.example         # Environment variable template
├── docker-compose.yml   # Docker Compose orchestration
├── AGENTS.md            # AI agent & development guidelines
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Git

### Quick Start

```bash
# 1. Clone repository
git clone <repo-url> one-stop-service
cd one-stop-service

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose up -d

# 4. Run migrations & seed
docker compose exec backend php artisan migrate --seed

# 5. Access the application
# Backend API: http://localhost:8080/api/health
# Frontend:    http://localhost:3000 (when available)
```

### Local Development (without Docker)

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code, protected |
| `develop` | Integration branch for features |
| `feature/*` | New features (branch from `develop`) |
| `fix/*` | Bug fixes (branch from `develop`) |

### Workflow

1. Create feature branch from `develop`: `git checkout -b feature/OSS-XXX-description develop`
2. Commit with conventional format: `feat(scope): description`
3. Open PR to `develop`
4. After review & merge, `develop` → `main` for release

## Roles

| Role | Description |
|------|-------------|
| Superadmin | Full system access, manage users & roles |
| Direktur | Approve payroll, view reports |
| Karyawan | Manage own logbook, submit payroll |

## Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Business Requirements](docs/BRD.md)
- [Development Guidelines](AGENTS.md)
