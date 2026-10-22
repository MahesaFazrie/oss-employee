# Deployment Guide — One Stop Service (OSS)

Panduan deployment resmi aplikasi **One Stop Service** menggunakan **Vercel** untuk Frontend (Next.js) dan Cloud Hosting / PaaS untuk Backend (Laravel API + PostgreSQL).

---

## 1. Arsitektur Deployment

```
[ Pengguna / Browser ]
         │
         ├── HTTPS ──► [ Frontend: Next.js di VERCEL ]
         │             • Global Edge CDN
         │             • CI/CD Otomatis via GitHub
         │             • Domain: https://oss-employee.vercel.app
         │
         └── API ────► [ Backend: Laravel API ] (Railway / Render / VPS)
                       │
                       └──► [ Database: PostgreSQL ] (Neon / Supabase / Cloud DB)
                       │
                       └──► [ Storage: Private Storage ] (Bukti Transfer & Logbook)
```

---

## 2. Environment Variables Reference

### Frontend Variables (Vercel)

| Variable | Wajib | Contoh Nilai | Deskripsi |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Ya** | `https://api-oss.yourdomain.com/api` | Base URL endpoint REST API backend produksi |

> **Catatan Penting**: Variabel dengan prefix `NEXT_PUBLIC_` akan diekspos ke browser client-side. Pastikan URL menggunakan protokol aman **`https://`**.

---

### Backend Variables (Laravel API)

| Variable | Wajib | Contoh Nilai | Deskripsi |
| :--- | :---: | :--- | :--- |
| `APP_NAME` | Ya | `One Stop Service` | Nama aplikasi |
| `APP_ENV` | Ya | `production` | Environment mode (`production`) |
| `APP_KEY` | Ya | `base64:...` | Application key (`php artisan key:generate`) |
| `APP_DEBUG` | Ya | `false` | Wajib `false` untuk keamanan di production |
| `APP_URL` | Ya | `https://api-oss.yourdomain.com` | Base URL domain backend |
| `DB_CONNECTION` | Ya | `pgsql` | Driver database PostgreSQL |
| `DB_HOST` | Ya | `aws-0-ap-southeast-1.pooler.supabase.com` | Host database cloud |
| `DB_PORT` | Ya | `5432` | Port database PostgreSQL |
| `DB_DATABASE` | Ya | `postgres` | Nama database |
| `DB_USERNAME` | Ya | `postgres.yourproject` | Username database |
| `DB_PASSWORD` | Ya | `[SECRET_PASSWORD]` | Password database |
| `SANCTUM_STATEFUL_DOMAINS`| Ya | `oss-employee.vercel.app` | Domain frontend Vercel |
| `SESSION_DOMAIN` | Tidak | `.yourdomain.com` | Domain cookie (jika custom domain) |

---

## 3. Langkah-Langkah Deployment Frontend ke Vercel

### Prasyarat
1. Akun **[Vercel](https://vercel.com)** (dapat login menggunakan akun GitHub).
2. Repository GitHub proyek `oss-employee` sudah terhubung.
3. Backend API sudah aktif dan memiliki URL publik HTTPS.

---

### Langkah 1: Hubungkan Repository ke Vercel

1. Buka dashboard Vercel di **[vercel.com/dashboard](https://vercel.com/dashboard)**.
2. Klik tombol **"Add New..."** &rarr; pilih **"Project"**.
3. Cari dan pilih repository **`oss-employee`**, lalu klik **"Import"**.

---

### Langkah 2: Konfigurasi Project Settings (PENTING!)

Karena proyek ini berstruktur monorepo (folder `frontend/` dan `backend/` terpisah), Anda **wajib mengatur Root Directory**:

1. Pada bagian **Root Directory**, klik **Edit** dan pilih folder:
   ```
   frontend
   ```
2. Pastikan **Framework Preset** terdeteksi otomatis sebagai:
   ```
   Next.js
   ```
3. Konfigurasi build (biarkan default):
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

---

### Langkah 3: Tambahkan Environment Variable di Vercel

Pada bagian **Environment Variables** di halaman setup Vercel:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Masukkan URL backend publik Anda (misal: `https://api-oss.railway.app/api`) |

Klik tombol **"Add"**.

---

### Langkah 4: Deploy!

1. Klik tombol **"Deploy"**.
2. Vercel akan otomatis mengunduh dependency, menjalankan TypeScript check, dan mem-build Next.js.
3. Dalam 1–2 menit, Vercel akan memberikan domain publik gratis, misalnya:
   ```
   https://oss-employee-mahesa.vercel.app
   ```

---

## 4. Konfigurasi Backend untuk Sinkronisasi dengan Vercel

Agar frontend Vercel dapat berkomunikasi lancar dengan backend tanpa terkena blokir browser, lakukan konfigurasi berikut pada Backend:

### A. Konfigurasi CORS (Cross-Origin Resource Sharing)

Periksa file `backend/config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Daftarkan domain Vercel Anda di sini
    'allowed_origins' => [
        'http://localhost:3000',
        'https://*.vercel.app',
        'https://oss-employee.vercel.app', // ganti dengan domain production Anda
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.vercel\.app$#', // Mengizinkan semua preview branch Vercel
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

### B. Konfigurasi Database Migration & Seeder di Backend

Jalankan perintah berikut di lingkungan backend produksi Anda:

```bash
# 1. Jalankan migrasi seluruh tabel (Sprint 0–6)
php artisan migrate --force

# 2. Jalankan seeder role, permission, dan default user
php artisan db:seed --class=RolePermissionSeeder --force
php artisan db:seed --class=UserSeeder --force

# 3. Optimalkan performa cache route & config di production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 5. Fitur Otomatis Vercel (CI/CD)

Dengan men-deploy ke Vercel:

1. **Automatic Production Deployment**:
   - Setiap kali branch `main` atau `develop` di-push ke GitHub, Vercel akan otomatis men-deploy versi terbaru tanpa perlu intervensi manual.
2. **Preview Deployment untuk Setiap Pull Request**:
   - Saat Anda membuat PR dari branch `Mahesa-Dev`, Vercel akan membuat URL preview khusus (misal: `https://oss-employee-git-mahesa-dev.vercel.app`) untuk keperluan pengujian dan review sebelum merge.
3. **Gratis SSL/HTTPS**:
   - Sertifikat SSL otomatis aktif dan diperbarui tanpa biaya.
4. **Custom Domain**:
   - Jika Anda memiliki domain sendiri (misal: `oss.sanbersy.com`), cukup tambahkan di menu **Settings &rarr; Domains** pada Vercel.

---

## 6. Checklist Verifikasi Pasca-Deploy (Smoke Test)

Setelah deployment di Vercel selesai, lakukan pengecekan berikut:

- [ ] Buka URL Vercel di browser (pastikan favicon dan halaman login tampil).
- [ ] Lakukan **Login** dengan akun:
  - Direktur: `direktur@oss.com` / `password123`
  - Karyawan: `karyawan@oss.com` / `password123`
- [ ] Pastikan tidak ada pesan error CORS di Console browser (`F12 &rarr; Console`).
- [ ] Buka **Dashboard**: pastikan data jam kerja, timer, dan status payroll tampil.
- [ ] Cek **Notifikasi**: klik ikon lonceng, pastikan popover membuka daftar notifikasi.
- [ ] Cek **Audit Log**: pastikan tabel audit log tampil untuk akun Direktur/Superadmin.
- [ ] Coba mode responsif di HP (pastikan hamburger menu drawer berfungsi mulus).

---

## 7. Troubleshooting Umum

| Kendala / Error | Penyebab | Solusi |
| :--- | :--- | :--- |
| **404 Not Found saat akses Vercel** | Root directory belum diset ke `frontend` | Buka Vercel Dashboard &rarr; **Settings** &rarr; **General** &rarr; ubah **Root Directory** menjadi `frontend` &rarr; Redeploy. |
| **CORS Error (`Access-Control-Allow-Origin`)** | Domain Vercel belum didaftarkan di `cors.php` backend | Tambahkan domain Vercel ke `allowed_origins` di `backend/config/cors.php`. |
| **Mixed Content Warning (Blocked)** | Backend menggunakan `http://` sedangkan Vercel `https://` | Pastikan URL backend API sudah HTTPS. Browser memblokir request HTTP dari situs HTTPS. |
| **401 Unauthorized / Token Expired** | Waktu server backend dan client tidak sinkron | Pastikan NTP / timezone pada server backend dikonfigurasi dengan benar (`Asia/Jakarta`). |
| **File Upload Bukti Bayar Gagal** | Limit ukuran upload di server backend | Pastikan `upload_max_filesize = 10M` dan `post_max_size = 10M` di `php.ini` backend. |

---

## 8. Kontak PIC

| Modul | PIC | Tanggung Jawab |
| :--- | :--- | :--- |
| **Frontend (Next.js & Vercel)** | Mahesa Fazrie | UI/UX, Vercel Build, State Management, API Integration |
| **Backend (Laravel API & DB)** | Hafizh Andika | REST API, Database Migration, Security, Server Host |
