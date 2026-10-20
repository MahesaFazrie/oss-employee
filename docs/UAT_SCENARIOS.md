# UAT Scenarios — One Stop Service

## Overview

Dokumen ini berisi daftar skenario User Acceptance Testing (UAT) berdasarkan seluruh User Story dari Sprint 1–5. Setiap skenario mencakup langkah-langkah end-to-end dan kriteria pass/fail.

**Format severity bug:**
- 🔴 **Critical** — Fitur utama tidak bisa digunakan, data loss
- 🟠 **High** — Fitur utama terganggu, ada workaround
- 🟡 **Medium** — Fitur minor terganggu
- 🟢 **Low** — Cosmetic / UX improvement

---

## Sprint 1 — Authentication & User Management

### UAT-001: Registrasi User Baru
| Step | Action | Expected |
|------|--------|----------|
| 1 | POST `/api/register` dengan data valid | 201, user status `pending` |
| 2 | Coba login dengan akun pending | 403, "Akun belum diaktifkan" |
| 3 | Superadmin approve user via `/api/admin/users/{id}/approve` | Status berubah ke `active` |
| 4 | Login ulang | 200, dapat token |

### UAT-002: Login & Logout
| Step | Action | Expected |
|------|--------|----------|
| 1 | POST `/api/login` dengan email & password benar | 200, token dikembalikan |
| 2 | GET `/api/me` dengan token | 200, data profil |
| 3 | POST `/api/logout` | 200, token dihapus |
| 4 | GET `/api/me` dengan token yang sudah logout | 401 |

### UAT-003: Forgot & Reset Password
| Step | Action | Expected |
|------|--------|----------|
| 1 | POST `/api/forgot-password` dengan email valid | 200, token generated |
| 2 | POST `/api/reset-password` dengan token valid | 200, password berubah |
| 3 | Login dengan password baru | 200 |

### UAT-004: User Rejection
| Step | Action | Expected |
|------|--------|----------|
| 1 | Register user baru | Status `pending` |
| 2 | Superadmin reject user | Status `rejected` |
| 3 | Coba login | 403 |

---

## Sprint 1 — RBAC & Permission

### UAT-005: Role & Permission Management
| Step | Action | Expected |
|------|--------|----------|
| 1 | Superadmin GET `/api/admin/roles` | 200, list roles |
| 2 | Superadmin create role baru | 201 |
| 3 | Sync permissions ke role | 200 |
| 4 | Karyawan coba akses `/api/admin/roles` | 403 |

### UAT-006: Permission Enforcement
| Step | Action | Expected |
|------|--------|----------|
| 1 | Karyawan akses endpoint logbook | 200 (punya permission) |
| 2 | Karyawan akses endpoint director | 403 (tidak punya permission) |
| 3 | Direktur akses endpoint director | 200 |
| 4 | Direktur akses endpoint admin/users | 403 |

---

## Sprint 2 — Timer & Logbook

### UAT-007: Timer Workflow
| Step | Action | Expected |
|------|--------|----------|
| 1 | POST `/api/timer/start` | 200, timer running |
| 2 | GET `/api/timer/active` | 200, timer data |
| 3 | POST `/api/timer/start` lagi (double start) | 409 |
| 4 | POST `/api/timer/stop` | 200, timer stopped |
| 5 | Cek durasi masuk akal | elapsed > 0 |

### UAT-008: Logbook CRUD
| Step | Action | Expected |
|------|--------|----------|
| 1 | POST `/api/logbooks` dengan manual duration | 201, logbook created |
| 2 | GET `/api/logbooks` | 200, list logbook |
| 3 | GET `/api/logbooks/{id}` | 200, detail |
| 4 | PUT `/api/logbooks/{id}` | 200, updated |

### UAT-009: Logbook dengan Timer
| Step | Action | Expected |
|------|--------|----------|
| 1 | Start timer → Stop timer | Timer stopped |
| 2 | Create logbook dengan `work_timer_id` | 201, durasi dari timer |
| 3 | Coba pakai timer yang sama lagi | 422, timer sudah dipakai |

### UAT-010: Monthly Recap
| Step | Action | Expected |
|------|--------|----------|
| 1 | GET `/api/recap/monthly?month=10&year=2026` | 200, data recap |
| 2 | GET `/api/recap/monthly/export` | 200, file Excel |

---

## Sprint 3 — Payroll Submission

### UAT-011: Payroll Draft & Submit
| Step | Action | Expected |
|------|--------|----------|
| 1 | POST `/api/payroll/draft` (bulan 10, 2026) | 201, status `draft` |
| 2 | POST `/api/payroll/draft` (bulan sama) | 409, duplikat |
| 3 | GET `/api/payroll/draft/preview` | 200, preview data |
| 4 | POST `/api/payroll/{id}/submit` | 200, status `submitted`, snapshot dibuat |
| 5 | POST `/api/payroll/{id}/submit` lagi | 409, sudah submitted |

### UAT-012: Payroll Isolation
| Step | Action | Expected |
|------|--------|----------|
| 1 | Submit payroll → Edit logbook | Snapshot TIDAK berubah |
| 2 | User A coba lihat payroll User B | 404 |

---

## Sprint 4 — Logbook Review & Payroll Approval

### UAT-013: Logbook Review oleh Direktur
| Step | Action | Expected |
|------|--------|----------|
| 1 | Direktur GET `/api/director/logbooks` | 200, list logbook pending |
| 2 | POST `/api/director/logbooks/{id}/approve` | 200, status `approved` |
| 3 | Karyawan cek logbook → lihat status | `approved` |

### UAT-014: Logbook Revision Request
| Step | Action | Expected |
|------|--------|----------|
| 1 | Direktur POST revision request + comment | 200, status `revision_requested` |
| 2 | Karyawan cek logbook → lihat feedback | Comment visible |
| 3 | Karyawan edit logbook → status kembali pending | Bisa di-approve ulang |

### UAT-015: Payroll Approval Flow
| Step | Action | Expected |
|------|--------|----------|
| 1 | Direktur GET `/api/director/payrolls` | 200, list submitted |
| 2 | POST `/api/director/payrolls/{id}/approve` | 200, status `approved` |
| 3 | GET payroll history | History tercatat |

### UAT-016: Payroll Rejection & Resubmit
| Step | Action | Expected |
|------|--------|----------|
| 1 | Direktur reject payroll dengan notes | 200, status `rejected` |
| 2 | Direktur request revision | 200, status `revision_requested` |
| 3 | Karyawan resubmit | 200, status `submitted` |

---

## Sprint 5 — Payment, Dashboard, Notification, Audit

### UAT-017: Payment Proof Upload & Download
| Step | Action | Expected |
|------|--------|----------|
| 1 | Direktur upload PDF ke payroll approved | 201, file tersimpan |
| 2 | Direktur download file | 200, file terdownload |
| 3 | Karyawan (pemilik) download | 200 |
| 4 | Karyawan lain download | 403 |
| 5 | Upload file .exe | 422, ditolak |
| 6 | Upload file > 5MB | 422, ditolak |
| 7 | Akses file via URL publik langsung | 404/403 |

### UAT-018: Mark Processed
| Step | Action | Expected |
|------|--------|----------|
| 1 | Mark processed TANPA upload proof | 422 |
| 2 | Upload proof → Mark processed | 200, status `processed` |
| 3 | Cek history | Transisi tercatat |

### UAT-019: Employee Dashboard
| Step | Action | Expected |
|------|--------|----------|
| 1 | GET `/api/dashboard/employee` | 200, semua field ada |
| 2 | Start timer → cek dashboard | `active_timer` terisi |
| 3 | Ada logbook revision_requested | `logbooks_needing_revision` > 0 |

### UAT-020: Director Dashboard
| Step | Action | Expected |
|------|--------|----------|
| 1 | GET `/api/dashboard/director` | 200, semua field ada |
| 2 | Ada payroll submitted | `payrolls_pending_approval` > 0 |
| 3 | Karyawan coba akses | 403 |
| 4 | Cek monthly_work_hours | 6 bulan data |

### UAT-021: Notifications
| Step | Action | Expected |
|------|--------|----------|
| 1 | Direktur approve logbook | Karyawan dapat notifikasi |
| 2 | GET `/api/notifications` | 200, list notifikasi |
| 3 | POST `/api/notifications/{id}/read` | 200, read_at terisi |
| 4 | POST `/api/notifications/read-all` | Semua terbaca |

### UAT-022: Audit Log
| Step | Action | Expected |
|------|--------|----------|
| 1 | Approve payroll | Audit log tercatat otomatis |
| 2 | GET `/api/admin/audit-logs` (Superadmin) | 200, list logs |
| 3 | Filter by action | Hanya action tersebut |
| 4 | Karyawan coba akses | 403 |

---

## Bug Tracking

| ID | Severity | Description | Status | Fix Reference |
|----|----------|-------------|--------|---------------|
| | | | | |

> Isi tabel di atas selama sesi UAT berlangsung.

---

## Summary Checklist

- [ ] Semua UAT-001 sampai UAT-022 PASS
- [ ] Tidak ada bug severity 🔴 Critical yang belum di-fix
- [ ] Tidak ada bug severity 🟠 High yang belum di-fix
- [ ] Regression test ditulis untuk setiap bug yang di-fix
