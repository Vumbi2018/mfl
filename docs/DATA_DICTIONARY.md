# MFL Data Dictionary
## Papua New Guinea Master Facility List - Field Definitions

This document defines all data fields used in the PNG Master Facility List, aligned with WHO recommendations for health facility registries.

---

## Core Identification Fields

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `id` | Integer | Auto | System-generated primary key | Sequential integer |
| `code` | VARCHAR(20) | **Yes** | Unique MFL identifier | Format: `PP-DD-XXX-C` (Province-District-Serial-Check) |
| `name` | VARCHAR(255) | **Yes** | Official facility name | Free text |
| `local_name` | VARCHAR(255) | No | Local/common name if different | Free text |
| `official_name` | VARCHAR(255) | No | Full official name | Free text |
| `alternate_names` | TEXT[] | No | Array of other known names/aliases | Array of strings |

---

## Classification Fields

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `type` | VARCHAR(20) | **Yes** | Facility type code | See [Facility Types](#facility-types) |
| `ownership` | VARCHAR(50) | **Yes** | Ownership category | `government`, `church`, `private`, `ngo`, `joint` |
| `operational_status` | VARCHAR(50) | **Yes** | Current operational state | `operational`, `under_construction`, `temporarily_closed`, `permanently_closed`, `planned` |

### Facility Types

| Code | Name | Level | Can Admit |
|------|------|-------|-----------|
| NH | National Hospital | 1 | Yes |
| PH | Provincial Hospital | 2 | Yes |
| DH | District Hospital | 3 | Yes |
| RH | Rural Hospital | 3 | Yes |
| HC | Health Centre | 4 | Yes |
| SHC | Sub-Health Centre | 4 | No |
| UHC | Urban Health Centre | 4 | No |
| AP | Aid Post | 5 | No |
| MCH | MCH Clinic | 4 | No |
| PRI | Private Clinic | 4 | No |
| NGO | NGO Clinic | 4 | No |
| CHU | Church Health Facility | 4 | Yes |

---

## Geographic Location Fields

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `latitude` | FLOAT | **Recommended** | GPS latitude (WGS84) | -12.0 to 0.0 (for PNG) |
| `longitude` | FLOAT | **Recommended** | GPS longitude (WGS84) | 140.0 to 160.0 (for PNG) |
| `region_id` | Integer | No | Reference to regions table | Valid region ID |
| `province_id` | Integer | **Yes** | Reference to provinces table | Valid province ID |
| `district_id` | Integer | **Yes** | Reference to districts table | Valid district ID |
| `llg_id` | Integer | Recommended | Reference to LLGs table | Valid LLG ID |
| `address` | TEXT | No | Physical address | Free text |
| `village` | VARCHAR(100) | No | Nearest village/settlement | Free text |
| `gps_collection_method` | VARCHAR(50) | No | How GPS was collected | `field_gps`, `google_maps`, `administrative` |
| `gps_accuracy_meters` | FLOAT | No | GPS accuracy in meters | Positive number |

---

## Dates and Timeline

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `date_established` | DATE | Recommended | When facility opened | Valid date |
| `date_closed` | DATE | Conditional | When facility closed | Valid date (required if status is closed) |
| `created_at` | TIMESTAMP | Auto | Record creation timestamp | Auto-generated |
| `updated_at` | TIMESTAMP | Auto | Last modification timestamp | Auto-generated |

---

## Capacity Fields

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `total_beds` | Integer | Recommended | Total bed capacity | 0 or positive integer |
| `icu_beds` | Integer | No | ICU bed count | 0 or positive integer |
| `emergency_beds` | Integer | No | Emergency/casualty beds | 0 or positive integer |
| `maternity_beds` | Integer | No | Maternity ward beds | 0 or positive integer |
| `operating_theaters` | Integer | No | Number of operating theaters | 0 or positive integer |
| `outpatient_rooms` | Integer | No | Outpatient consultation rooms | 0 or positive integer |
| `consultation_rooms` | Integer | No | General consultation rooms | 0 or positive integer |

---

## Services (WHO Essential Health Services)

Services are captured in the `services` JSONB field as an array of service codes aligned with WHO Essential Health Services packages.

### Service Categories

| Category | WHO Package | Description |
|----------|-------------|-------------|
| Maternal Health | RMNCAH | ANC, Delivery, Postnatal, Family Planning |
| Child Health | RMNCAH | Immunization, IMCI, Nutrition |
| Communicable Diseases | CD | TB, Malaria, HIV/AIDS, STI |
| Non-Communicable Diseases | NCD | Diabetes, Hypertension, Cancer, Mental Health |
| Emergency Services | SURG | Emergency/Casualty, Trauma |
| Surgical Services | SURG | Minor/Major Surgery, Orthopedics |
| Diagnostic Services | DIAG | Laboratory, Radiology, Ultrasound |
| Support Services | SUPP | Pharmacy, Blood Bank, Ambulance, Dental |

### Service Codes

| Code | Service Name | Category |
|------|--------------|----------|
| ANC | Antenatal Care | Maternal Health |
| DEL_NORM | Normal Delivery | Maternal Health |
| DEL_COMP | Complicated Delivery | Maternal Health |
| EMOC | Emergency Obstetric Care | Maternal Health |
| CEMOC | Comprehensive EmOC | Maternal Health |
| PNC | Postnatal Care | Maternal Health |
| FP | Family Planning | Maternal Health |
| EPI | Immunization (EPI) | Child Health |
| IMCI | IMCI | Child Health |
| NUT | Nutrition Services | Child Health |
| GMP | Growth Monitoring | Child Health |
| TB_DX | TB Diagnosis | Communicable Diseases |
| TB_TX | TB Treatment (DOTS) | Communicable Diseases |
| MAL_DX | Malaria Diagnosis | Communicable Diseases |
| MAL_TX | Malaria Treatment | Communicable Diseases |
| HIV_VCT | HIV Testing | Communicable Diseases |
| HIV_ART | HIV ART | Communicable Diseases |
| NCD_SCREEN | NCD Screening | Non-Communicable Diseases |
| NCD_MGMT | NCD Management | Non-Communicable Diseases |
| MENTAL | Mental Health | Non-Communicable Diseases |
| EMERG | Emergency Services | Emergency Services |
| SURG_MINOR | Minor Surgery | Surgical Services |
| SURG_MAJOR | Major Surgery | Surgical Services |
| LAB_BASIC | Basic Laboratory | Diagnostic Services |
| LAB_ADV | Advanced Laboratory | Diagnostic Services |
| XRAY | X-Ray | Diagnostic Services |
| ULTRASOUND | Ultrasound | Diagnostic Services |
| PHARM | Pharmacy | Support Services |
| BLOOD | Blood Bank | Support Services |
| AMB | Ambulance | Support Services |
| DENTAL | Dental Services | Support Services |

---

## Staff Counts (JSONB)

The `staff_counts` field stores staffing data as a JSON object:

```json
{
  "doctors": 5,
  "nurses": 20,
  "midwives": 8,
  "chw": 15,
  "lab_technicians": 3,
  "pharmacists": 2,
  "admin_staff": 10
}
```

---

## Contact Information

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `emergency_contact` | VARCHAR(50) | Recommended | Emergency phone number | Phone format |
| `general_contact` | VARCHAR(50) | Recommended | Main phone number | Phone format |
| `contact_email` | VARCHAR(100) | No | Email address | Valid email format |
| `website` | VARCHAR(255) | No | Website URL | Valid URL |
| `weekday_hours` | VARCHAR(100) | No | Weekday operating hours | e.g., "8:00 AM - 6:00 PM" |
| `weekend_hours` | VARCHAR(100) | No | Weekend operating hours | e.g., "9:00 AM - 5:00 PM" |

---

## Workflow and Status

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `workflow_status` | VARCHAR(50) | **Yes** | Approval workflow state | See [Workflow States](#workflow-states) |
| `created_by` | Integer | Auto | User who created record | Valid user ID |
| `updated_by` | Integer | Auto | User who last updated | Valid user ID |

### Workflow States

| State | Description | Next States |
|-------|-------------|-------------|
| DRAFT | Initial data entry | DISTRICT_REVIEW |
| DISTRICT_REVIEW | Pending DHO review | PROVINCE_REVIEW, REQUIRES_CLARIFICATION, REJECTED |
| PROVINCE_REVIEW | Pending PHA review | NATIONAL_REVIEW, REQUIRES_CLARIFICATION, REJECTED |
| NATIONAL_REVIEW | Pending NDoH approval | APPROVED, REQUIRES_CLARIFICATION, REJECTED |
| APPROVED | Published to registry | DRAFT (for edits) |
| REQUIRES_CLARIFICATION | Returned for info | DISTRICT_REVIEW |
| REJECTED | Denied with reason | DRAFT |

---

## Data Quality & Verification

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `last_verified_date` | DATE | Recommended | Last verification date | Valid date |
| `verification_method` | VARCHAR(50) | No | How verification was done | `field_visit`, `phone_call`, `desk_review`, `self_report` |
| `verified_by` | Integer | No | User who verified | Valid user ID |
| `quality_score` | Integer | No | Data completeness score | 0-100 |
| `quality_issues` | JSONB | No | List of data issues | JSON array |

---

## External Identifiers

External system cross-references are stored in the `facility_identifiers` table:

| Field | Data Type | Description |
|-------|-----------|-------------|
| `system_name` | VARCHAR(100) | External system name |
| `identifier` | VARCHAR(100) | ID in that system |
| `is_primary` | BOOLEAN | Is this the primary ID? |
| `valid_from` | DATE | When this ID became valid |
| `valid_to` | DATE | When this ID was superseded |

### Common External Systems

| System | Description |
|--------|-------------|
| eNHIS | PNG Electronic National Health Information System |
| DHIS2 | District Health Information System 2 |
| mSupply | Pharmaceutical supply chain system |
| VR | Vaccine Registry |
| HRIS | Human Resource Information System |

---

## Registration & Licensing

| Field | Data Type | Required | Description | Valid Values |
|-------|-----------|----------|-------------|--------------|
| `registration_number` | VARCHAR(100) | Recommended | Official registration number | Free text |
| `license_number` | VARCHAR(100) | No | Operating license number | Free text |
| `license_expiry` | DATE | No | License expiration date | Valid date |

---

## Notes

1. **Required fields** must have a value before a facility can be submitted for approval.
2. **Recommended fields** are strongly encouraged for data quality but not mandatory.
3. **Conditional fields** are required only under specific circumstances.
4. All dates should be in ISO 8601 format (YYYY-MM-DD).
5. GPS coordinates must be in WGS84 (EPSG:4326) projection.
6. Service codes are case-sensitive and must match the defined taxonomy.
