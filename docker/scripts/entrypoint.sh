#!/bin/bash
set -e

echo "🚀 Starting One Stop Service Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY_COUNT=0

until php artisan db:monitor --databases=pgsql > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Attempt $RETRY_COUNT/$MAX_RETRIES - PostgreSQL not ready, waiting..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ PostgreSQL did not become ready in time. Trying to continue anyway..."
fi

echo "✅ PostgreSQL is ready!"

# Run migrations
echo "📦 Running migrations..."
php artisan migrate --force

# Run seeders (only if roles table is empty)
ROLE_COUNT=$(php artisan tinker --execute="echo \App\Models\Role::count();" 2>/dev/null || echo "0")
if [ "$ROLE_COUNT" = "0" ]; then
    echo "🌱 Running seeders..."
    php artisan db:seed --force
else
    echo "✅ Seeders already applied (roles exist)."
fi

# Cache configuration for production
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ Caching configuration..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

echo "🎉 Backend is ready!"

# Start PHP-FPM
exec php-fpm
