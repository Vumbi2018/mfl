# Deployment Guide

The authoritative production deployment guide is [DEPLOYMENT_GUIDE_VPS.md](DEPLOYMENT_GUIDE_VPS.md).

Use that guide for Hostinger VPS deployment of the Zambia MFL at:

```text
https://mfl.lamtoninvestiments.com
```

## Safe Update Summary

For normal production updates:

```bash
cd /opt/mfl
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=80 backend
```

Normal updates must not remove Docker volumes or delete other application folders.

Do not run:

```bash
docker compose down -v
docker volume rm
rm -rf /var/lib/docker/volumes
```