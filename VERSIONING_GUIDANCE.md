# Health Facility Master List (HFML) Versioning & Release Guidance

**Reference Standard**: GHFD SubWG RMR Toolkit Version 1.0 (Requirement **RMR F22**)  
**Platform**: National Health Facility Registry Service (HFRS)  

---

## 1. Executive Overview

Version management is a critical requirement of an enterprise Health Facility Registry Service. A version control system for the Master Health Facility List (HFML) ensures that public health decision-makers, external Health Information Systems (HIS), and analytical tools can:
- Reference an **authoritative, point-in-time snapshot** of health facility infrastructure.
- Track historical changes, additions, closures, and attribute modifications over time.
- Perform audit trace checks and rollbacks without compromising historical dataset integrity.

---

## 2. HFML Semantic Versioning Standard

The HFRS platform adopts **Semantic Versioning for Master Lists (`MAJOR.MINOR.PATCH`)**:

| Version Segment | Triggers & Rules | Example Release |
|---|---|---|
| **MAJOR (`vX.0.0`)** | Significant administrative boundary revisions, national health system structural taxonomy changes, or major data dictionary updates. | `v1.0.0`, `v2.0.0` |
| **MINOR (`v1.X.0`)** | Bulk facility onboarding exercises, annual/semi-annual official HFML curation approvals, or newly verified facility additions. | `v1.1.0`, `v1.2.0` |
| **PATCH (`v1.1.X`)** | Routine data quality corrections (e.g. fixing typos in facility names, updating phone numbers, or correcting GPS coordinates). | `v1.1.1`, `v1.1.2` |

---

## 3. Version Release Workflow & Governance

1. **Draft Curation Stage**:
   - Facility change requests are collected and reviewed via the multi-tier workflow engine (`DRAFT` $\rightarrow$ `DISTRICT_REVIEW` $\rightarrow$ `PROVINCE_REVIEW` $\rightarrow$ `NATIONAL_REVIEW`).
2. **Release Snapshot & Sealing**:
   - Upon National Steering Committee approval, the Registry Administrator uses the **Version Management Console** (`/version-management`) to generate a new HFML release snapshot.
   - The platform serializes the complete dataset state into an immutable JSON snapshot (`hfml_releases` table).
3. **Publication & Interoperability Broadcaster**:
   - The new version tag (e.g. `v1.2.0`) is published to all API connectors (HL7 FHIR, DHIS2, OpenLMIS).
   - External HIS consumers automatically ingest the updated authoritative snapshot.

---

## 4. Version Comparison & Audit Trace (Diffing)

The platform provides side-by-side **Version Comparison**:
- **Added Facilities**: Facilities present in the new version but absent in the baseline.
- **Removed / Closed Facilities**: Decommissioned or archived facilities.
- **Modified Facilities**: Facilities where signature domain attributes (name, type, status, coordinates) changed between releases.

---

*Document approved for national health registry operations.*
