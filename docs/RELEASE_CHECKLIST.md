# Release Checklist & Handover — One Stop Service

## Release Version: 1.0.0
## Target Date: _________

---

## 1. Test Status

### Automated Tests

- [x] `php artisan test` — Semua test hijau (0 failures)
- [x] Sprint 0–2 tests (Auth, RBAC, Timer, Logbook, Recap) — PASS
- [x] Sprint 3 tests (Payroll Submission) — PASS
- [x] Sprint 4 tests (Logbook Review, Payroll Approval) — PASS
- [x] Sprint 5 tests (Payment Proof, Dashboard, Notification, Audit Log) — PASS
- [x] Security tests (Authorization Matrix, File Upload Security) — PASS

### Test Summary

| Test File | Tests | Status |
|-----------|-------|--------|
| HealthEndpointTest | 3 | ✅ PASS |
| RegisterTest | 3 | ✅ PASS |
| LoginTest | 5 | ✅ PASS |
| MeTest | 2 | ✅ PASS |
| ForgotPasswordTest | 4 | ✅ PASS |
| RolePermissionTest | 7 | ✅ PASS |
| UserApprovalTest | 5 | ✅ PASS |
| PermissionMiddlewareTest | 2 | ✅ PASS |
| WorkTimerTest | 8 | ✅ PASS |
| LogbookTest | 8 | ✅ PASS |
| MonthlyRecapTest | 4 | ✅ PASS |
| PayrollSubmissionTest | 12 | ✅ PASS |
| LogbookReviewTest | 12 | ✅ PASS |
| PayrollReviewTest | 16 | ✅ PASS |
| PaymentProofTest | 13 | ✅ PASS |
| DashboardTest | 10 | ✅ PASS |
| NotificationTest | 7 | ✅ PASS |
| AuditLogTest | 9 | ✅ PASS |
| AuthorizationMatrixTest | 30 | ✅ PASS |
| FileUploadSecurityTest | 14 | ✅ PASS |
| ExampleTest (Feature & Unit) | 2 | ✅ PASS |
| **TOTAL** | **176** | **✅ ALL PASS (0 Failures)** |

---

## 2. Database & Migration

- [ ] Semua 21 migration file ada dan urut
- [ ] `php artisan migrate:status` — semua `Ran`
- [ ] Performance indexes (Sprint 6) sudah diterapkan
- [ ] `RolePermissionSeeder` sudah dijalankan (3 roles, 9 permissions)
- [ ] Backup database sudah dites (pg_dump berhasil)
- [ ] Restore database sudah dites (pg_restore berhasil)
- [ ] Script backup otomatis (`scripts/backup.sh`) sudah siap

---

## 3. Environment & Configuration

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` sudah di-generate
- [ ] `APP_URL` mengarah ke domain production
- [ ] `DB_PASSWORD` sudah diganti dari default
- [ ] `SANCTUM_STATEFUL_DOMAINS` diset ke domain frontend
- [ ] `LOG_LEVEL=warning` (bukan debug)
- [ ] Storage permission: `chmod -R 775 storage bootstrap/cache`

---

## 4. Security

- [ ] Semua endpoint terproteksi `auth:sanctum` (kecuali public routes)
- [ ] Authorization matrix test PASS — setiap role hanya bisa akses endpoint yang sesuai
- [ ] File upload: hanya PDF/JPG/JPEG/PNG, max 5MB
- [ ] File upload disimpan di private disk (bukan public)
- [ ] Download file lewat endpoint terautentikasi (bukan direct URL)
- [ ] Password tidak masuk audit log
- [ ] HTTPS aktif di production

---

## 5. Monitoring & Observability

- [ ] Health endpoint aktif: `GET /api/health`
- [ ] Laravel log berjalan: `storage/logs/laravel.log`
- [ ] Nginx access/error log aktif
- [ ] Audit log merekam aksi-aksi penting
- [ ] Notifikasi in-app berfungsi

---

## 6. Documentation

- [ ] `docs/API.md` — Format response, endpoint reference
- [ ] `docs/DATABASE.md` — Schema, migration order, performance indexes
- [ ] `docs/DEPLOYMENT.md` — Env vars, Docker, migration, backup/restore, troubleshooting
- [ ] `docs/UAT_SCENARIOS.md` — Daftar skenario UAT lengkap
- [ ] `README.md` — Overview project
- [ ] `AGENTS.md` — AI agent context (kalau ada)

---

## 7. UAT Status

- [ ] Semua 22 skenario UAT (UAT-001 s/d UAT-022) PASS
- [ ] Critical bugs = 0
- [ ] High bugs = 0 (atau ada workaround terdokumentasi)
- [ ] Regression test ditulis untuk setiap bug yang di-fix

---

## 8. Handover Document

### Project Structure

```
one-stop-service/
├── backend/                    # Laravel 12 + PHP 8.2
│   ├── app/
│   │   ├── Http/Controllers/   # 22 controllers
│   │   ├── Models/             # 12 models
│   │   ├── Services/           # PayrollStateMachine, PayrollSnapshotService, LogbookVerificationService
│   │   ├── Notifications/      # LogbookReviewedNotification, PayrollStatusNotification
│   │   ├── Observers/          # AuditLogObserver
│   │   ├── Exports/            # MonthlyRecapExport (Excel)
│   │   └── Traits/             # ApiResponseTrait
│   ├── database/migrations/    # 21 migration files
│   ├── routes/api.php          # ~130 lines, semua API routes
│   └── tests/                  # ~175+ automated tests
├── frontend/                   # Next.js (PIC: Mahesa)
├── docker/                     # Nginx, PHP-FPM configs
├── docs/                       # API, Database, Deployment, UAT docs
├── scripts/                    # backup.sh
└── docker-compose.yml
```

### Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Sanctum token-based (bukan SPA/cookie) | API backend murni, frontend terpisah |
| Status column VARCHAR (bukan ENUM) | Lebih fleksibel, mudah ditambah |
| State Machine pattern untuk payroll | Mencegah transisi status invalid |
| Laravel built-in Notification | User model sudah punya Notifiable trait |
| Model Observer untuk audit log | Otomatis dan konsisten di semua tempat |
| Storage disk `local` untuk payment proof | Default sudah private (`storage/app/private`) |

### Cara Deploy

Lihat: [`docs/DEPLOYMENT.md`](DEPLOYMENT.md)

### Cara Akses Log

```bash
# Laravel application log
docker compose exec backend tail -f storage/logs/laravel.log

# Nginx log
docker compose logs -f nginx

# Database audit log
# Via API: GET /api/admin/audit-logs (perlu auth + permission view-reports)
```

### Kontak PIC

| Module | PIC | Kontak |
|--------|-----|--------|
| Backend (Laravel, API, Database) | Hafizh Andika | Backend Developer |
| Frontend (Next.js, UI/UX) | Mahesa Fazrie | Frontend Developer |

---

## Sign-off

| Role | Nama | Tanggal | Tanda Tangan |
|------|------|---------|-------------|
| Backend Developer | Hafizh Andika | | |
| Frontend Developer | Mahesa Fazrie | | |
| Penguji UAT | | | |
