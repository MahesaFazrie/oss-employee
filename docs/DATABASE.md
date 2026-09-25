# Database Schema — One Stop Service

## Overview

Database menggunakan **PostgreSQL 16** dengan Eloquent ORM dari Laravel.

## Entity Relationship

```
┌──────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│    users     │       │   role_permission    │       │   permissions    │
├──────────────┤       ├─────────────────────┤       ├──────────────────┤
│ id           │       │ role_id (FK)        │       │ id               │
│ name         │       │ permission_id (FK)  │       │ name             │
│ email        │  1..* ├─────────────────────┘  *..1 │ guard_name       │
│ password     │──────▶│         roles        │◀──────│ description      │
│ role_id (FK) │       ├─────────────────────┤       │ created_at       │
│ created_at   │       │ id                  │       │ updated_at       │
│ updated_at   │       │ name                │       └──────────────────┘
└──────────────┘       │ guard_name          │
                       │ created_at          │
                       │ updated_at          │
                       └─────────────────────┘
```

## Tables

### `users`

Tabel user bawaan Laravel, ditambah kolom `role_id`.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | bigint (PK) | No | Auto increment |
| name | varchar(255) | No | Nama lengkap user |
| email | varchar(255) | No | Email (unique) |
| email_verified_at | timestamp | Yes | Waktu verifikasi email |
| password | varchar(255) | No | Hashed password |
| role_id | bigint (FK) | Yes | Foreign key ke `roles.id` |
| remember_token | varchar(100) | Yes | Token "remember me" |
| created_at | timestamp | Yes | Waktu dibuat |
| updated_at | timestamp | Yes | Waktu diupdate |

### `roles`

Daftar role dalam sistem. Bersifat dinamis (bisa ditambah/diubah via admin).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | No | Auto | Auto increment |
| name | varchar(255) | No | - | Nama role (unique), e.g. `superadmin` |
| guard_name | varchar(255) | No | `web` | Guard name untuk multi-auth |
| created_at | timestamp | Yes | - | Waktu dibuat |
| updated_at | timestamp | Yes | - | Waktu diupdate |

**Seed Data:**

| id | name | guard_name |
|----|------|------------|
| 1 | superadmin | web |
| 2 | direktur | web |
| 3 | karyawan | web |

### `permissions`

Daftar permission granular. Bersifat dinamis.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint (PK) | No | Auto | Auto increment |
| name | varchar(255) | No | - | Nama permission (unique), e.g. `manage-users` |
| guard_name | varchar(255) | No | `web` | Guard name |
| description | text | Yes | - | Deskripsi permission |
| created_at | timestamp | Yes | - | Waktu dibuat |
| updated_at | timestamp | Yes | - | Waktu diupdate |

**Seed Data:**

| name | description |
|------|-------------|
| manage-users | Kelola data user |
| manage-roles | Kelola roles & permissions |
| view-logbook | Lihat logbook |
| manage-logbook | Kelola logbook sendiri |
| view-all-logbook | Lihat semua logbook karyawan |
| manage-payroll | Kelola pengajuan payroll |
| approve-payroll | Approve/reject payroll |
| view-reports | Lihat laporan & rekap |
| manage-settings | Kelola pengaturan sistem |

### `role_permission` (Pivot)

Relasi many-to-many antara `roles` dan `permissions`.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| role_id | bigint (FK) | No | Foreign key ke `roles.id` |
| permission_id | bigint (FK) | No | Foreign key ke `permissions.id` |

**Primary Key:** Composite (`role_id`, `permission_id`)

## Migration Order

1. `create_roles_table`
2. `create_permissions_table`
3. `create_role_permission_table`
4. `add_role_id_to_users_table`

## Notes

- RBAC bersifat **table-driven** (dinamis), bukan hardcode di logic.
- Permission di-assign ke Role, bukan langsung ke User.
- User punya satu Role (one-to-many).
- Role punya banyak Permission (many-to-many).
- Semua perubahan role/permission dilakukan via migration atau admin panel, bukan hardcode.
