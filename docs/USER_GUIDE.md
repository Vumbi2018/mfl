# User Guide - Zambia Master Facility List

## Introduction

The Zambia Master Facility List is used to view, manage, verify, and analyze health facility records across Zambia.

## Getting Started

1. Open the MFL portal.
2. Sign in with your assigned username and password.
3. Use the sidebar to move between registry, map, editor, workflow, analytics, user management, reference data, audit logs, and system configuration.

Local development login:

```text
Username: admin
Password: admin@12345
```

Production administrators should replace this with a strong production password.

## Facilities Registry

Use Facilities Registry to browse facility records.

Common tasks:

- Search by facility name or code.
- Filter by province, district, facility type, ownership, or operational status.
- Open a facility profile for detailed review.
- Export data when permissions allow.

## Facilities Map

Use Facilities Map to review facility distribution and coordinates.

- Zoom and pan across Zambia.
- Click a facility marker to see summary information.
- If a facility is missing from the map, check whether latitude and longitude are present and valid.

## Facility Editor

Users with edit permission can create or update facility records.

Before saving changes:

- Check for duplicates by name, code, province, district, and location.
- Confirm province and district are correct.
- Confirm coordinates fall within the declared district when coordinates are available.
- Add clear comments for workflow reviewers where needed.

## Workflow Console

Use Workflow Console to review submitted facility changes.

Typical decisions:

- Approve when the record is valid.
- Return for clarification when data is incomplete.
- Reject only when the proposed record should not enter the registry.

## Reference Data

Administrators use Reference Data to manage controlled lists such as facility types, provinces, districts, roles, permissions, and groups.

For Zambia, Regions should not be used unless the system is explicitly reconfigured for another tenant.

## System Configuration

Administrators use System Configuration to manage:

- General system name and tenant labels.
- Branding colors and logo.
- Geospatial defaults.
- Hierarchy labels and region usage.
- Security settings.

## Support

For account access, data corrections, or system issues, contact the system administrator or health information systems support team.