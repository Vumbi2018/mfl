# Enterprise Interoperability Connectors & HIS Integration Guidance Handbook

**Reference Standard**: GHFD SubWG RMR Toolkit Version 1.0 (Requirement **RMR NF16**) & OpenHIE Architectural Framework  
**Evaluated Platform**: National Health Facility Registry Service (HFRS - `c:\mfl`)  
**Target Audience**: Systems Integrators, Digital Health Architects, Ministry of Health IT Teams, EMR/HMIS Developers  

---

## Table of Contents
1. [Executive Summary & Architectural Standards](#1-executive-summary--architectural-standards)
2. [Connector 1: HL7 FHIR R4 & mCSD Location API Connector](#2-connector-1-hl7-fhir-r4--mcsd-location-api-connector)
3. [Connector 2: DHIS2 Organization Units Connector](#3-connector-2-dhis2-organization-units-connector)
4. [Connector 3: OpenLMIS / mSupply Supply Chain Connector](#4-connector-3-openlmis--msupply-supply-chain-connector)
5. [Connector 4: GeoJSON Spatial Data Connector](#5-connector-4-geojson-spatial-data-connector)
6. [Configuring Custom Connections (PUSH, PULL, Bidirectional Data Sync)](#6-configuring-custom-connections-push-pull-bidirectional-data-sync)
7. [Security, Authentication, Error Handling & Audit Logging](#7-security-authentication-error-handling--audit-logging)

---

## 1. Executive Summary & Architectural Standards

The **National Health Facility Registry Service (HFRS)** serves as the authoritative central registry for health facility master lists (HFML). In digital health enterprise architectures, point-of-care systems (EMRs), logistical systems (eLMIS), and reporting applications (HMIS) require continuous synchronization with the HFRS to ensure consistent facility identifiers, administrative hierarchies, and operational metadata.

```
                                +-----------------------------------+
                                |   Health Facility Registry (HFRS) |
                                |   Authoritative HFML Master List  |
                                +-----------------+-----------------+
                                                  |
           +--------------------------------------+--------------------------------------+
           |                                      |                                      |
           v                                      v                                      v
 +-------------------+                  +-------------------+                  +-------------------+
 |   HL7 FHIR mCSD   |                  |    DHIS2 HMIS     |                  |  OpenLMIS eLMIS   |
 |   /api/interop/fhir|                 |  /api/interop/dhis2|                 |/api/interop/openlm|
 +-------------------+                  +-------------------+                  +-------------------+
```

### Key Integration Principles
- **Single Source of Truth**: The HFRS curates official facility codes (`FAC_CODE`), official names, and geographic coordinates.
- **Standards Compliance**: Native support for HL7 FHIR R4 (mCSD profile), DHIS2 Web API payload structures, and OGC GeoJSON.
- **Configurable Data Direction**: Support for **PUSH** (HFRS $\rightarrow$ Remote HIS), **PULL** (Remote HIS $\rightarrow$ HFRS), and **BIDIRECTIONAL** synchronization with conflict resolution.

---

## 2. Connector 1: HL7 FHIR R4 & mCSD Location API Connector

### 2.1 Overview & Profile Specification
The **HL7 FHIR R4 Location Connector** implements the OpenHIE **Mobile Care Services Discovery (mCSD)** Location profile. It allows external FHIR client applications to query, discover, and resolve health facilities as standard `Location` resources.

- **Endpoint**: `GET /api/interop/fhir/Location`
- **Resource Type**: `Bundle` (type: `searchset`) containing `Location` resources.
- **Content-Type**: `application/fhir+json`

### 2.2 Field Mapping Table

| HFRS Master Field | FHIR Location Path | Type | Description |
|---|---|---|---|
| `facilities.id` | `Location.id` | `string` | Internal database surrogate key. |
| `facilities.code` | `Location.identifier[0].value` | `string` | Official national health facility code. |
| `facilities.name` | `Location.name` | `string` | Official facility name. |
| `facilities.operational_status` | `Location.status` | `code` | `active` if operational, `inactive` if closed. |
| `facilities.type` | `Location.type[0].coding[0].display` | `string` | Facility taxonomy level (e.g. National Hospital). |
| `facilities.longitude` | `Location.position.longitude` | `decimal` | WGS84 Longitude coordinate. |
| `facilities.latitude` | `Location.position.latitude` | `decimal` | WGS84 Latitude coordinate. |
| `facilities.ownership` | `Location.managingOrganization.display` | `string` | Managing authority / owner entity. |
| `districts.name` | `Location.partOf.display` | `string` | Parent administrative hierarchy unit. |

### 2.3 Example FHIR Response Payload
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "timestamp": "2026-07-22T18:00:00.000Z",
  "entry": [
    {
      "fullUrl": "http://localhost:5002/api/interop/fhir/Location/101",
      "resource": {
        "resourceType": "Location",
        "id": "101",
        "identifier": [
          { "system": "urn:ietf:rfc:3986", "value": "NH001" },
          { "system": "http://hfrs.health.gov/identifiers", "value": "101" }
        ],
        "status": "active",
        "name": "Lusaka National Referral Hospital",
        "type": [
          {
            "coding": [
              { "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode", "code": "OF", "display": "National Hospital" }
            ]
          }
        ],
        "position": {
          "longitude": 28.2814,
          "latitude": -15.4166,
          "altitude": 1280
        },
        "managingOrganization": { "display": "Ministry of Health" },
        "partOf": { "display": "Lusaka District, Lusaka Province" }
      }
    }
  ]
}
```

---

## 3. Connector 2: DHIS2 Organization Units Connector

### 3.1 Overview & Integration Strategy
The **DHIS2 Organization Units Connector** formats facility metadata into native DHIS2 `organisationUnits.json` structures. This enables one-click or automated background synchronization of health facilities directly into DHIS2 instances without manual CSV manipulation.

- **Endpoint**: `GET /api/interop/dhis2/orgunits`
- **Target Application**: DHIS2 Web API (`/api/organisationUnits.json` or `/api/metadata.json`).

### 3.2 Field Mapping Table

| HFRS Master Field | DHIS2 OrgUnit Field | Formatting / Rules |
|---|---|---|
| `facilities.code` | `id` & `code` | Formatted as `HFRS_<code >` for guaranteed unique UID matching in DHIS2. |
| `facilities.name` | `name` & `shortName` | Short name truncated to maximum 50 characters per DHIS2 requirement. |
| `facilities.date_established` | `openingDate` | Formatted as `YYYY-MM-DD` (defaults to `2000-01-01` if missing). |
| `districts.code` / `districts.name` | `parent.id` & `parent.name` | Links facility to parent administrative district org unit. |

### 3.3 Example DHIS2 Response Payload
```json
{
  "pager": {
    "page": 1,
    "total": 1,
    "pageSize": 1
  },
  "organisationUnits": [
    {
      "id": "HFRS_NH001",
      "code": "NH001",
      "name": "Lusaka National Referral Hospital",
      "shortName": "Lusaka National Referral Hospital",
      "openingDate": "1998-05-12",
      "parent": {
        "id": "DIST_LUSAKA",
        "name": "Lusaka District"
      }
    }
  ]
}
```

### 3.4 Step-by-Step DHIS2 Import Setup
1. Log in to your DHIS2 instance as Administrator.
2. Navigate to **Apps** $\rightarrow$ **Import/Export App** $\rightarrow$ **Metadata Import**.
3. Set **Format**: `JSON`, **Dry Run**: `Yes` (to validate first).
4. Fetch JSON payload from HFRS endpoint: `GET http://localhost:5002/api/interop/dhis2/orgunits`.
5. Upload payload file into DHIS2 or configure automated push via HFRS Remote HIS Connection Manager.

---

## 4. Connector 3: OpenLMIS / mSupply Supply Chain Connector

### 4.1 Overview & Logistics Features
The **OpenLMIS Supply Chain Connector** delivers facility capacity, bed availability, service offerings, and contact details tailored for electronic Logistics Management Information Systems (eLMIS) and Cold Chain Appliance Asset management.

- **Endpoint**: `GET /api/interop/openlmis/facilities`
- **Key Attributes**: Bed capacities (Total & ICU), operational status, managing authority, phone, email, and service availability.

### 4.2 Payload Example
```json
{
  "system": "OpenLMIS/mSupply Integration Endpoint",
  "count": 1,
  "facilities": [
    {
      "lmisFacilityCode": "NH001",
      "facilityName": "Lusaka National Referral Hospital",
      "facilityType": "National Hospital",
      "activeStatus": "ACTIVE",
      "managingAuthority": "Ministry of Health",
      "district": "Lusaka District",
      "province": "Lusaka Province",
      "capacity": {
        "totalBeds": 450,
        "icuBeds": 35
      },
      "contactPhone": "+260211000000",
      "contactEmail": "info@lusakahospital.gov"
    }
  ]
}
```

---

## 5. Connector 4: GeoJSON Spatial Data Connector

### 5.1 Overview & GIS Specifications
The **GeoJSON Spatial Data Connector** outputs point spatial geometries for all georeferenced health facilities following OGC GeoJSON specs.

- **Endpoint**: `GET /api/interop/geojson/facilities`
- **CRS**: WGS84 (EPSG:4326), `[longitude, latitude]` order.
- **Use Case**: Direct mapping in QGIS, ArcGIS Online, Mapbox, and Leaflet JS.

---

## 6. Configuring Custom Connections (PUSH, PULL, Bidirectional Data Sync)

The HFRS **Interoperability Hub UI** (`/interoperability-hub`) features a visual **Connections Manager** allowing administrators to establish and configure live data sync pipelines to external applications.

### 6.1 Step-by-Step Connection Setup Guide
1. Open HFRS and navigate to **Interoperability Hub** (`/interoperability-hub`) $\rightarrow$ **Connections Manager** tab.
2. Click **+ Create Remote HIS Connection**.
3. Fill in configuration fields:
   - **Application Name**: e.g., `National DHIS2 Server`
   - **System Type**: Select `dhis2`, `openlmis`, `fhir`, `geojson`, or `custom_rest`.
   - **Target Base URL**: e.g., `https://dhis2.health.gov/api/organisationUnits`
   - **Authentication Method**: `Bearer Token`, `API Key`, `Basic Auth`, or `None`.
   - **Sync Direction**:
     - `PUSH`: Broadcasts facility data from HFRS to target remote application.
     - `PULL`: Ingests facility data from remote application into HFRS database.
     - `BIDIRECTIONAL`: Synchronizes data in both directions with conflict resolution.
   - **Field Mappings (JSON)**: Map local HFRS keys to target JSON keys (e.g. `{"code":"identifier", "name":"displayName"}`).
4. Click **Save Connection Profile**.
5. Click **Run Sync Now** to execute live data transmission. View status, records processed, and error logs in real time.

---

## 7. Security, Authentication, Error Handling & Audit Logging

### 7.1 Security & Authentication
- **Token Security**: All requests require JWT Bearer Tokens or valid Machine-to-Machine API Keys (`x-api-key`).
- **Multi-Tenant Isolation**: The `x-tenant-code` header ensures complete data isolation between country instances.

### 7.2 Audit Trail & Metrics Logging
Every interop request and remote sync execution is automatically recorded in the `interop_logs` and `his_sync_logs` database tables, capturing:
- Connector Name & Target URL
- Request Method & Timestamp
- Records Pushed / Pulled
- HTTP Status Code & Response Time (ms)
- Error Traceback Stack (if failed)

---

*Handbook approved for national digital health enterprise integrations.*
