# Project Handoff - Zambia MFL

## Repository

- GitHub: `https://github.com/Vumbi2018/mfl`
- Main branch: `main`
- Production domain: `mfl.lamtoninvestiments.com`
- Default tenant: `zambia`

## Current Operating Assumptions

- GitHub contains source code, deployment files, docs, migrations, and sanitized snapshots.
- Production PostgreSQL data lives on the VPS and must be protected separately from Git.
- `C:\mfl` is a local working folder but is not currently a Git repository.
- The canonical Codex/GitHub workspace is `C:\Users\Mukombo\Documents\Codex\2026-07-16\se\mfl_remote_latest`.

## Local Credentials

Development login:

```text
Username: admin
Password: admin@12345
```

Production must use a strong password from the VPS `.env` file.

## Production Secrets

Required production `.env` values:

```env
MFL_HTTP_PORT=8180
DB_NAME=mfl_db
DB_USER=mfl
DB_PASSWORD=CHANGE_TO_A_LONG_RANDOM_DATABASE_PASSWORD
JWT_SECRET=CHANGE_TO_A_RANDOM_SECRET_OF_AT_LEAST_64_CHARACTERS
DEFAULT_TENANT_CODE=zambia
ADMIN_USERNAME=admin
ADMIN_EMAIL=YOUR_REAL_ADMIN_EMAIL
ADMIN_PASSWORD=CHANGE_TO_A_LONG_RANDOM_ADMIN_PASSWORD
```

Never commit real `.env` values.

## Deployment Handoff

Use [DEPLOYMENT_GUIDE_VPS.md](../DEPLOYMENT_GUIDE_VPS.md) for first-time setup and updates.

Minimum update command:

```bash
cd /opt/mfl
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

## Verification Handoff

After any deployment, verify:

- App loads at `https://mfl.lamtoninvestiments.com`.
- Login works.
- Facilities Registry shows data.
- Facilities Map is not blank when coordinate data exists.
- Reference Data shows Zambia tables without Regions.
- System Configuration shows populated settings.
- Existing VPS apps still respond.

## Next Engineering Priorities

1. Synchronize or replace `C:\mfl` with the GitHub repo so it is not an older unmanaged copy.
2. Finish duplicate-removal tooling with a dry run and audit report.
3. Add smoke tests for login, settings, reference data, registry, and map.
4. Add production backup and restore scripts.
5. Remove any remaining hardcoded country assumptions from UI and backend code.