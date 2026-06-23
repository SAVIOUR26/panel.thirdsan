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
git clone https://github.com/Saviour26/thirdsan-panel
cd thirdsan-panel

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

Deployment is automatic via GitHub Actions on every push to `main`.

### Required GitHub Secrets

| Secret | Value |
|---|---|
| `VPS_HOST` | `82.208.22.164` |
| `VPS_SSH_KEY` | Private SSH key for `deploy` user |

### Manual Deploy

```bash
# On VPS as deploy user
cd /opt/thirdsan/panel
git pull origin main
composer install --no-dev
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
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
