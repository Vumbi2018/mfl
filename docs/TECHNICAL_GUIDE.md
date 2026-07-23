# Technical Guide - Zambia Master Facility List

## System Overview

The Zambia Master Facility List (MFL) is a multi-tenant health facility registry configured for Zambia. It stores facility identity, geographic hierarchy, facility type, ownership, operational status, verification status, audit history, reference data, users, roles, permissions, analytics, and map-ready coordinates.

The active Zambia hierarchy is Province -> District. Regions are not part of the Zambia operating model and should remain disabled unless another tenant explicitly enables them through configuration.

## Architecture

- Frontend: React, Vite, Tailwind CSS, Leaflet
- Backend: Node.js, Express
- Database: PostgreSQL with PostGIS
- Deployment: Docker Compose behind host Nginx
- Default tenant: `zambia`

## Key Runtime URLs

Local development:

- Frontend: `http://localhost:5174`
- Backend API: `http://localhost:5003/api`

Production:

- App: `https://mfl.lamtoninvestiments.com`
- Host port: `127.0.0.1:8180`

## Important Tables

| Table | Purpose |
| --- | --- |
| `facilities` | Master record for each health facility |
| `facility_types` | Reference data for facility classification |
| `provinces` | Zambia province reference data |
| `districts` | Zambia district reference data |
| `tenant_settings` | Configurable labels, branding, geospatial, security, and hierarchy settings |
| `users` | User accounts |
| `roles` | Role definitions |
| `permissions` | Permission definitions |
| `groups` | User grouping / RBAC support |
| `audit_logs` | System activity and data-change history |

## Data Principles

- Git stores code, migrations, docs, and sanitized database snapshots.
- PostgreSQL stores operational data and must not be overwritten by normal code deployments.
- Production secrets stay in `.env` on the server and must not be committed.
- VaxPlan facility records are the current source used to populate the Zambia registry.
- Duplicate removal must be repeatable and auditable, preferably with a dry-run report before deletion or merging.

## Configuration Principles

- Country-specific behavior should come from `tenant_settings` and reference tables.
- Zambia should use `use_regions=false`.
- Labels such as Province and District should be configurable.
- Frontend API location should come from `VITE_API_URL` at build/dev time.
- Production frontend should call `/api` through Nginx/container routing.

## Main API Areas

| Area | Example Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/login` |
| Facilities | `GET /api/facilities`, `POST /api/facilities`, `PUT /api/facilities/:id` |
| Reference data | `GET /api/admin/tables`, `GET /api/admin/tables/:tableName` |
| Settings | `GET /api/settings`, `PUT /api/settings` |
| Users and roles | user, role, permission endpoints |
| Audit | audit log endpoints |
| Analytics | analytics dashboard endpoints |

## Local Setup

Install dependencies:

```bash
npm install
cd backend
npm install
```

Configure environment variables. Important local values:

```env
VITE_API_URL=http://localhost:5003/api
VITE_DEFAULT_TENANT_CODE=zambia
PORT=5003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mfl_db
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
DEFAULT_TENANT_CODE=zambia
```

Run backend:

```bash
cd backend
npm start
```

Run frontend:

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

Build frontend:

```bash
npm run build
```

## Production Deployment

Use [DEPLOYMENT_GUIDE_VPS.md](../DEPLOYMENT_GUIDE_VPS.md). Normal updates must use:

```bash
cd /opt/mfl
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Do not remove Docker volumes during normal updates.

## Verification Checklist

After code or deployment changes, verify:

- Login succeeds.
- Facilities Registry loads records.
- Facilities Map renders markers or a clear empty-state if coordinates are missing.
- Reference Data shows facility types, provinces, districts, roles, permissions, and groups.
- System Configuration shows general, branding, geospatial, hierarchy, and security settings.
- `regions` does not appear for Zambia unless `use_regions=true` is explicitly configured.
- Build completes with `npm run build`.