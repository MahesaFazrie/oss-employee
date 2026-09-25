# Business Requirements Document — One Stop Service

## 1. Overview

**One Stop Service** adalah website internal perusahaan konsultan yang bertujuan menyediakan platform terpadu untuk:

1. **Logbook Kerja** — Pencatatan aktivitas kerja harian berbasis timer
2. **Rekap Bulanan** — Rangkuman otomatis jam kerja per bulan
3. **Pengajuan Payroll** — Submit dan tracking pengajuan gaji
4. **Verifikasi** — Review dan verifikasi data kerja
5. **Approval** — Persetujuan payroll oleh manajemen

## 2. User Roles

### Superadmin
- Mengelola seluruh data user dan sistem
- Manage roles & permissions
- Akses penuh ke seluruh fitur

### Direktur
- Melihat laporan dan rekap seluruh karyawan
- Approve/reject pengajuan payroll
- Dashboard overview

### Karyawan
- Mengelola logbook kerja pribadi (start/stop timer)
- Melihat rekap bulanan pribadi
- Mengajukan payroll
- Tracking status pengajuan

## 3. Feature Modules

### 3.1 Logbook (Timer-based)
- Start/stop timer untuk mencatat durasi kerja
- Input deskripsi aktivitas, project, dan kategori
- Edit/delete entry (sebelum di-submit)
- Riwayat logbook harian & mingguan

### 3.2 Rekap Bulanan
- Otomatis generate rekap dari logbook entries
- Total jam kerja per bulan
- Breakdown per project/kategori
- Export laporan (PDF/Excel) — *future sprint*

### 3.3 Pengajuan Payroll
- Karyawan submit payroll berdasarkan rekap bulanan
- Attach supporting documents — *future sprint*
- Status tracking: Draft → Submitted → Verified → Approved → Paid

### 3.4 Verifikasi
- Review logbook entries oleh atasan/admin
- Flag entries yang perlu koreksi
- Batch verification

### 3.5 Approval
- Direktur review dan approve/reject payroll
- Multi-level approval — *future sprint*
- Approval history & audit trail

## 4. Sprint Planning

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 0 | Project setup, backend base, RBAC | 🔄 In Progress |
| Sprint 1 | Authentication (Sanctum), User CRUD | ⏳ Planned |
| Sprint 2 | Logbook (Timer) feature | ⏳ Planned |
| Sprint 3 | Rekap Bulanan | ⏳ Planned |
| Sprint 4 | Payroll submission & approval | ⏳ Planned |
| Sprint 5 | Reporting & export | ⏳ Planned |

## 5. Non-Functional Requirements

- **Authentication**: Laravel Sanctum (SPA-based)
- **Authorization**: RBAC table-driven (bukan hardcode)
- **API Format**: Consistent JSON response format
- **Database**: PostgreSQL
- **Deployment**: Docker Compose
- **Testing**: PHPUnit (backend), Jest (frontend)
