# Zambia Master Facility List Project

## Project Summary

The Zambia Master Facility List (MFL) is the authoritative health facility registry for Zambia. It provides a single operational source of truth for facility identity, location, ownership, facility type, operational status, administrative hierarchy, verification state, users, roles, reference data, audit logs, analytics, and map-based review.

The project is intended for production deployment at:

- Domain: `mfl.lamtoninvestiments.com`
- VPS IP: `72.60.233.213`
- GitHub repository: `https://github.com/Vumbi2018/mfl`
- Default tenant: `zambia`

## Product Scope

The managed project covers:

- Zambia facility registry using imported VaxPlan facility records.
- Province and district based administrative hierarchy. Zambia does not use regions in the active hierarchy.
- Reference data management for facility types, provinces, districts, roles, permissions, and groups.
- System configuration for branding, geospatial defaults, security settings, and hierarchy labels.
- Facilities map and geospatial review.
- Facility editor and workflow console.
- User and role management with JWT authentication.
- Audit logs and analytics dashboards.
- Docker-based production deployment suitable for a shared Hostinger VPS.

## Out Of Scope For The Current Release

- Replacing or interrupting other applications on the VPS.
- Wiping or recreating production database volumes during normal updates.
- Committing plaintext production secrets.
- Using hardcoded country data where tenant settings or reference tables should be used.

## Environments

### Local Development

- Frontend: `http://localhost:5174`
- Backend API: `http://localhost:5003/api`
- Database: local PostgreSQL
- Default tenant: `zambia`

Local admin account:

```text
Username: admin
Password: admin@12345
```

### Production

- Public URL: `https://mfl.lamtoninvestiments.com`
- Reverse proxy: host Nginx routes the subdomain to the MFL container port.
- Application port on host: `8180` unless changed with `MFL_HTTP_PORT`.
- Database must use a persistent Docker volume and must not be removed during updates.

## Roadmap

### Phase 1: Stabilize Core Registry

- Confirm VaxPlan facility import completeness.
- Remove duplicate facility records using a documented matching rule.
- Ensure every facility has stable code, name, type, ownership, province, district, status, and coordinates where available.
- Confirm Facilities Registry and Facilities Map read from the same source of truth.

### Phase 2: Configurable Zambia Reference Data

- Keep Zambia hierarchy set to Province -> District.
- Disable Regions unless a future tenant explicitly enables them.
- Replace remaining hardcoded labels and country assumptions with tenant settings.
- Ensure Reference Data and System Configuration pages are populated from database records.

### Phase 3: Security And Administration

- Require production `JWT_SECRET`, database password, and admin password through `.env`.
- Keep secrets out of GitHub.
- Confirm roles and permissions match operational responsibilities.
- Add audit visibility for reference data and facility edits.

### Phase 4: Hostinger VPS Production Launch

- Deploy with Docker Compose into an isolated `/opt/mfl` or `/root/mfl` folder.
- Preserve other VPS apps by binding MFL only to `127.0.0.1:8180`.
- Configure host Nginx for `mfl.lamtoninvestiments.com`.
- Add HTTPS with Certbot.
- Confirm backups before and after deployment.

### Phase 5: Operations And Handoff

- Document daily checks, backup/restore, update steps, and rollback.
- Maintain a changelog of production deployments.
- Keep GitHub `main` as the source for deployable code.

## Backlog

### Priority 1

- Verify `C:\mfl` is synchronized with `Vumbi2018/mfl`.
- Keep country-specific documentation aligned to Zambia and tenant configuration.
- Add production-safe deployment guide for Hostinger VPS.
- Confirm local and production environment variables are documented.
- Confirm System Configuration and Reference Data screens render data.

### Priority 2

- Add a repeatable duplicate-removal script with dry-run output.
- Add import validation for VaxPlan facility records.
- Add automated smoke checks for login, settings, reference data, facility list, and map endpoints.
- Add production backup and restore scripts.

### Priority 3

- Add CI build checks on GitHub.
- Add release notes for each VPS deployment.
- Add role-specific user guides for administrators, approvers, and data clerks.

## Handoff Rules

- GitHub is the source of code truth.
- PostgreSQL data is operational data and should not be replaced by Git pulls.
- Database snapshots in the repo must be sanitized.
- Production secrets belong only in server-side `.env` files.
- The MFL app must remain isolated from other VPS applications by folder, compose project, network, port, and Nginx server block.