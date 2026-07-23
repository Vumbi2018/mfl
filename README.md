# Zambia Master Facility List (MFL)

The Zambia Master Facility List is a national health facility registry for managing facility identity, location, ownership, services, administrative hierarchy, verification, approvals, reference data, maps, users, roles, audit logs, and analytics.

This repository is the source code and deployment package for the MFL application intended for `mfl.lamtoninvestiments.com`.

## Project Documents

- [Project Plan](PROJECT.md): scope, roadmap, backlog, environments, and handoff rules.
- [Hostinger VPS Deployment Guide](DEPLOYMENT_GUIDE_VPS.md): non-destructive deployment and update commands for the shared VPS.
- [User Guide](docs/USER_GUIDE.md): end-user workflows.
- [Technical Guide](docs/TECHNICAL_GUIDE.md): architecture, schema, APIs, and developer setup.
- [SOP](docs/SOP.md): administrative operating procedures.

## Current Zambia Configuration

- Active tenant: `zambia`
- Administrative hierarchy: Province -> District
- Regions: disabled unless explicitly enabled for another tenant
- Facility source: imported VaxPlan facility records and sanitized database snapshots
- Production domain: `mfl.lamtoninvestiments.com`
- Production VPS IP: `72.60.233.213`

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 13+ with PostGIS when running outside Docker
- npm

### Install Dependencies

```bash
npm install
cd backend
npm install
```

### Environment

Create local `.env` files from the examples and set real local values. Never commit plaintext secrets.

Important variables:

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

### Run Locally

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

Local URLs:

- Frontend: `http://localhost:5174`
- Backend API: `http://localhost:5003/api`

Local admin account:

```text
Username: admin
Password: admin@12345
```

## Production Update Rule

Normal production updates must not remove database volumes or other VPS applications.

Use:

```bash
cd /opt/mfl
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Do not use `docker compose down -v`, `docker volume rm`, or broad delete commands during normal updates.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Leaflet
- Backend: Node.js, Express
- Database: PostgreSQL with PostGIS
- Deployment: Docker Compose behind host Nginx