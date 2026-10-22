#!/bin/bash
set -e

echo "==> Menyiapkan Backend Laravel di Render..."

# Pastikan folder storage & cache writable
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Jalankan migrasi database otomatis ke PostgreSQL
echo "==> Menjalankan database migrations..."
php artisan migrate --force || true

# Jalankan seeder akun otomatis jika belum ada (idempotent / aman)
echo "==> Menjalankan seeder role & user default..."
php artisan db:seed --class=RolePermissionSeeder --force || true
php artisan db:seed --class=UserSeeder --force || true

# Optimasi konfigurasi & routing Laravel untuk production
echo "==> Mengoptimalkan cache konfigurasi & route..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "==> Memulai Apache Web Server pada port $PORT..."
exec apache2-foreground
