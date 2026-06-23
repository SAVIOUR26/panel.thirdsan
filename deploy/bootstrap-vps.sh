#!/usr/bin/env bash
# One-time provisioning of the Thirdsan Panel on a fresh Ubuntu 24.04 VPS.
# Run manually as root/sudo on the VPS — NOT executed by CI.
#
#   sudo bash bootstrap-vps.sh
#
# After this completes, ongoing deploys are handled by
# .github/workflows/deploy.yml via the deploy/deploy.sh script over SSH.

set -euo pipefail

REPO_URL="https://github.com/Saviour26/thirdsan-panel.git"
DEPLOY_PATH="/opt/thirdsan/panel"
DEPLOY_USER="deploy"
DOMAIN="panel.thirdsan.com"

echo "==> Installing PHP 8.2, php-fpm and required extensions"
apt-get update -y
apt-get install -y software-properties-common ca-certificates lsb-release apt-transport-https
add-apt-repository -y ppa:ondrej/php
apt-get update -y
apt-get install -y \
    php8.2 php8.2-fpm php8.2-cli php8.2-common \
    php8.2-mbstring php8.2-xml php8.2-bcmath php8.2-curl \
    php8.2-sqlite3 php8.2-zip php8.2-gd \
    git unzip curl nginx

echo "==> Installing Composer"
if ! command -v composer >/dev/null 2>&1; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

echo "==> Installing Node.js 20"
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "==> Creating deploy user"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
fi
usermod -aG "$DEPLOY_USER" www-data

echo "==> Cloning repository to ${DEPLOY_PATH}"
mkdir -p "$(dirname "$DEPLOY_PATH")"
if [ ! -d "$DEPLOY_PATH/.git" ]; then
    git clone "$REPO_URL" "$DEPLOY_PATH"
else
    echo "Repo already present, skipping clone."
fi

chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$DEPLOY_PATH"

echo "==> Allowing ${DEPLOY_USER} to reload php-fpm/nginx without a password"
cat > /etc/sudoers.d/thirdsan-deploy <<EOF
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /bin/systemctl reload php8.2-fpm, /bin/systemctl reload nginx
EOF
chmod 440 /etc/sudoers.d/thirdsan-deploy

echo "==> Installing nginx site"
cp "$DEPLOY_PATH/deploy/nginx-panel.conf" "/etc/nginx/sites-available/${DOMAIN}.conf"
ln -sf "/etc/nginx/sites-available/${DOMAIN}.conf" "/etc/nginx/sites-enabled/${DOMAIN}.conf"
nginx -t
systemctl reload nginx

echo "==> Running first application deploy"
sudo -u "$DEPLOY_USER" -H bash "$DEPLOY_PATH/deploy/deploy.sh"

echo "==> Bootstrap complete. Issue an SSL cert with: certbot --nginx -d ${DOMAIN}"
