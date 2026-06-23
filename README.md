# Thirdsan Server Panel

A professional server management panel built for Thirdsan Enterprises VPS infrastructure. Built with Laravel 11 + React, deployed on Contabo Cloud VPS 20 (Ubuntu 24.04).

## Features

- **Dashboard** — Real-time CPU, RAM, disk, uptime monitoring
- **Services** — Start, stop, restart Docker containers with live logs
- **Domains** — Add/remove Nginx virtual hosts with auto SSL
- **SSL Certificates** — View expiry dates, renew with one click
- **Deployments** — Deploy any Thirdsan product with history log
- **Logs** — Live tail Nginx, system, and container logs

## Tech Stack

- **Backend:** Laravel 11 (PHP 8.2) + Sanctum API auth
- **Frontend:** React 18 + React Router + TanStack Query + Recharts
- **Styling:** Custom CSS design system (no framework)
- **Database:** SQLite (lightweight, zero config)
- **CI/CD:** GitHub Actions → SSH deploy to VPS

## Live URL

```
https://panel.thirdsan.com
```

## VPS Details

```
Instance:  vmi3391950
IP:        82.208.22.164
Region:    EU (Germany)
Specs:     6 vCPU / 12GB RAM / 200GB SSD
OS:        Ubuntu 24.04 LTS
```

## Local Development

```bash
git clone https://github.com/Saviour26/panel.thirdsan
cd panel.thirdsan

# Backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate

# Frontend
npm install
npm run dev
```

## Deployment

### First-time VPS setup

Run once, as root, on a fresh Ubuntu 24.04 VPS:

```bash
ssh root@82.208.22.164
curl -fsSL https://raw.githubusercontent.com/Saviour26/panel.thirdsan/main/deploy/bootstrap-vps.sh -o bootstrap-vps.sh
bash bootstrap-vps.sh
```

This installs PHP 8.2 + php8.2-fpm, Composer, Node 20, clones the repo to
`/opt/thirdsan/panel`, installs the nginx vhost, and runs the first deploy.
Issue an SSL cert afterwards with `certbot --nginx -d panel.thirdsan.com`.

### Ongoing deploys

Every push to `main` runs `.github/workflows/deploy.yml`, which builds and
tests the app on the runner, then SSHes into the VPS and runs
`deploy/deploy.sh` (git pull, composer/npm install, migrate, cache, idempotent
admin user, permissions, reload php-fpm/nginx), followed by a health check
against `https://panel.thirdsan.com/up`.

### Required GitHub Secrets

| Secret | Value |
|---|---|
| `VPS_HOST` | `82.208.22.164` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Private SSH key for the `deploy` user |
| `PANEL_ADMIN_EMAIL` | `saviour@thirdsan.com` |
| `PANEL_ADMIN_NAME` | `Saviour` |
| `PANEL_ADMIN_PASSWORD` | Admin login password |

### Manual Deploy

```bash
# On VPS as deploy user
export PANEL_ADMIN_EMAIL=saviour@thirdsan.com PANEL_ADMIN_NAME=Saviour PANEL_ADMIN_PASSWORD=...
bash /opt/thirdsan/panel/deploy/deploy.sh
```

## Adding New Services

To add a new Thirdsan product to the panel, edit:

1. `app/Http/Controllers/ServiceController.php` — add to `$allowedServices`
2. `app/Http/Controllers/DeploymentController.php` — add to `$services`
3. `resources/js/pages/Deployments.jsx` — add to `SERVICES` array

## Architecture

```
Thirdsan Panel
├── Laravel API (auth + server commands)
├── React SPA (dashboard UI)
├── SQLite (sessions + deployment logs)
└── GitHub Actions (auto-deploy on push)
```

## Security

- All server commands use whitelisted service names only
- Non-root `deploy` user for GitHub Actions SSH
- Laravel Sanctum token authentication
- UFW firewall — only ports 80, 443, 22 open publicly

---

Built by Thirdsan Enterprises Ltd — Kampala, Uganda 🇺🇬
