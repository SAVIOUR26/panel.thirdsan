#!/usr/bin/env bash
# Deploys the current git ref to the running VPS. Invoked by:
#   - deploy/bootstrap-vps.sh on first provisioning
#   - .github/workflows/deploy.yml over SSH on every push to main
#
# Required environment (set as GitHub Secrets / exported before calling):
#   PANEL_ADMIN_EMAIL, PANEL_ADMIN_NAME, PANEL_ADMIN_PASSWORD

set -euo pipefail

DEPLOY_PATH="/opt/thirdsan/panel"
cd "$DEPLOY_PATH"

echo "==> Pulling latest code"
git fetch origin main
git reset --hard origin/main

echo "==> Installing PHP dependencies"
composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Installing & building frontend"
npm ci
npm run build

echo "==> Configuring environment"
if [ ! -f .env ]; then
    cp .env.example .env
    sed -i "s#^DB_DATABASE=.*#DB_DATABASE=${DEPLOY_PATH}/database/panel.sqlite#" .env
fi
touch database/panel.sqlite

if ! grep -q '^APP_KEY=base64' .env; then
    php artisan key:generate --force
fi

echo "==> Running migrations"
php artisan migrate --force

echo "==> Ensuring admin user exists"
php artisan panel:create-admin \
    --email="${PANEL_ADMIN_EMAIL:?PANEL_ADMIN_EMAIL not set}" \
    --name="${PANEL_ADMIN_NAME:?PANEL_ADMIN_NAME not set}" \
    --password="${PANEL_ADMIN_PASSWORD:?PANEL_ADMIN_PASSWORD not set}"

echo "==> Caching configuration"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Fixing permissions"
chmod -R 775 storage bootstrap/cache
find storage bootstrap/cache -type d -exec chmod g+s {} \;
chmod 664 database/panel.sqlite
chmod 775 database

echo "==> Reloading services"
sudo systemctl reload php8.4-fpm
sudo systemctl reload nginx

echo "==> Deploy complete"
