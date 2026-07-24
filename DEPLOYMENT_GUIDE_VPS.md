# Hostinger VPS Deployment Guide - Zambia MFL

This guide deploys and updates the Zambia Master Facility List at `mfl.lamtoninvestments.com` on the Hostinger VPS at `72.60.233.213`.

The VPS may host other applications. Keep MFL isolated by using its own folder, Docker Compose project, host port, Docker volumes, and Nginx server block.

## Production Shape

- Domain: `mfl.lamtoninvestments.com`
- DNS A record: `mfl -> 72.60.233.213`
- App folder: `/opt/mfl` recommended
- Host port: `127.0.0.1:8180`
- Public entry: host Nginx reverse proxy
- Database: Docker volume managed by the MFL compose project
- GitHub repo: `https://github.com/LawrenceMukombo/mfl`

## Commands That Must Not Be Used For Normal Updates

These can wipe production data or affect other apps:

```bash
docker compose down -v
docker volume rm
rm -rf /var/lib/docker/volumes
rm -rf /opt
rm -rf /root
```

## First-Time Setup

SSH to the VPS:

```bash
ssh root@72.60.233.213
```

Install prerequisites if they are missing:

```bash
apt update
apt install -y git nginx certbot python3-certbot-nginx docker.io docker-compose-plugin
systemctl enable --now docker
systemctl enable --now nginx
```

Create the isolated app folder:

```bash
mkdir -p /opt/mfl
cd /opt/mfl
```

Clone the repo if `/opt/mfl` is empty:

```bash
git clone https://github.com/LawrenceMukombo/mfl.git .
```

Create the production `.env` file:

```bash
cp .env.production.example .env
nano .env
```

Set real production values:

```env
MFL_HTTP_PORT=8180
DB_NAME=mfl_db
DB_USER=mfl
DB_PASSWORD=CHANGE_TO_A_LONG_RANDOM_DATABASE_PASSWORD
JWT_SECRET=CHANGE_TO_A_RANDOM_SECRET_OF_AT_LEAST_64_CHARACTERS
DEFAULT_TENANT_CODE=zambia
ADMIN_NOTIFICATION_EMAIL=
ADMIN_USERNAME=admin
ADMIN_EMAIL=YOUR_REAL_ADMIN_EMAIL
ADMIN_PASSWORD=CHANGE_TO_A_LONG_RANDOM_ADMIN_PASSWORD
```

Start the stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=80 backend
```

## Nginx Reverse Proxy

Create the MFL server block:

```bash
nano /etc/nginx/sites-available/mfl.conf
```

Use this configuration:

```nginx
server {
    listen 80;
    server_name mfl.lamtoninvestments.com;

    location / {
        proxy_pass http://127.0.0.1:8180;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable only this site file:

```bash
ln -s /etc/nginx/sites-available/mfl.conf /etc/nginx/sites-enabled/mfl.conf
nginx -t
systemctl reload nginx
```

Add HTTPS:

```bash
certbot --nginx -d mfl.lamtoninvestments.com
```

## Non-Destructive Update Procedure

Use this whenever new code is pushed to GitHub:

```bash
cd /opt/mfl
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=80 backend
```

This rebuilds containers but keeps Docker volumes intact.

## Backup Before Risky Changes

Create a database backup before migrations or major data work:

```bash
cd /opt/mfl
mkdir -p backups
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" > backups/mfl_$(date +%Y%m%d_%H%M%S).sql
```

Verify the backup file is not empty:

```bash
ls -lh backups
```

## Health Checks

After deployment, verify:

```bash
curl -I http://127.0.0.1:8180
curl -I https://mfl.lamtoninvestments.com
```

In the browser, check:

- Login works.
- Facilities Registry loads.
- Facilities Map loads.
- Reference Data shows facility types, provinces, districts, roles, permissions, and groups.
- System Configuration shows general, branding, geospatial, hierarchy, and security settings.

## Rollback

If a deployment fails but the previous containers still exist, inspect logs first:

```bash
cd /opt/mfl
docker compose -f docker-compose.prod.yml logs --tail=200
```

Then check Git history and return to a known good commit without touching volumes:

```bash
git log --oneline -5
git checkout <known-good-commit>
docker compose -f docker-compose.prod.yml up -d --build
```

After rollback, return to `main` only when the issue is fixed:

```bash
git switch main
git pull origin main
```