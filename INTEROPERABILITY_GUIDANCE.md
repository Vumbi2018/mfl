# Interoperability Hub & HIS Integration Guidance

**Reference Standard**: GHFD SubWG RMR Toolkit Version 1.0 (Requirement **RMR NF16**) & OpenHIE Architecture  
**Platform**: National Health Facility Registry Service (HFRS)  

---

## 1. Overview & OpenHIE Architecture

The **Health Facility Registry Service (HFRS)** functions as the single authoritative source of truth for health facility data within the National Digital Health Enterprise.

Following OpenHIE architecture recommendations, the HFRS exposes standardized RESTful API Connectors to allow seamless interoperability with:
- **Routine Health Management Information Systems (HMIS)** e.g., **DHIS2**
- **Electronic Logistics Management Systems (eLMIS)** e.g., **OpenLMIS / mSupply**
- **Electronic National Health Information Systems (eNHIS / EMRs)**
- **Geographic Information Systems (GIS)** e.g., **ArcGIS, QGIS, Leaflet**

```
                  +--------------------------------+
                  |  Health Facility Registry      |
                  |  Service (HFRS Master List)    |
                  +---------------+----------------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| HL7 FHIR mCSD    |     | DHIS2 OrgUnits   |     | OpenLMIS Supply  |
| Connector        |     | Connector        |     | Chain Connector  |
| /api/interop/fhir|     | /api/interop/dhis2|    |/api/interop/openl|
+------------------+     +------------------+     +------------------+
```

---

## 2. Standardized API Connectors Reference

### Connector 1: HL7 FHIR R4 & mCSD Location API
- **Endpoint**: `GET /api/interop/fhir/Location`
- **Specification**: HL7 FHIR R4 `Location` resource bundle aligned with the **Mobile Care Services Discovery (mMCSD)** profile.
- **Payload Format**: `application/fhir+json`
- **Use Case**: Interoperability with FHIR-compliant EMRs, Client Registries, and Shared Health Records.

#### Example cURL:
```bash
curl -X GET "http://localhost:5002/api/interop/fhir/Location" \
     -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

### Connector 2: DHIS2 Organization Units Connector
- **Endpoint**: `GET /api/interop/dhis2/orgunits`
- **Specification**: Compatible with DHIS2 Web API `/api/organisationUnits.json` ingestion endpoint.
- **Payload Structure**:
```json
{
  "pager": { "page": 1, "total": 150 },
  "organisationUnits": [
    {
      "id": "HFRS_NH001",
      "code": "NH001",
      "name": "Lusaka General Hospital",
      "openingDate": "1998-05-12",
      "parent": { "id": "DIST_LUSAKA", "name": "Lusaka District" }
    }
  ]
}
```
- **Use Case**: Automated hierarchy and org unit sync directly into DHIS2 instances.

---

### Connector 3: OpenLMIS / mSupply Supply Chain Connector
- **Endpoint**: `GET /api/interop/openlmis/facilities`
- **Specification**: Supply chain and cold chain facility inventory payload format.
- **Attributes**: Facility code, operational status, ownership, bed counts, ICU capacity, contact details.
- **Use Case**: Vaccine distribution planning, stock management, and cold chain appliance asset tracking.

---

### Connector 4: GeoJSON Spatial Data Connector
- **Endpoint**: `GET /api/interop/geojson/facilities`
- **Specification**: OGC GeoJSON `FeatureCollection` with WGS84 point coordinates (`[longitude, latitude]`).
- **Use Case**: Direct import into QGIS, ArcGIS, Mapbox, and spatial analysis tools.

---

## 3. Security & Authentication Guidance

1. **JWT Bearer Authentication**:
   - Provide standard HTTP header: `Authorization: Bearer <JWT_TOKEN>`.
2. **API Keys for M2M Systems**:
   - Machine-to-machine background synchronization can use API keys generated in the Interoperability Hub.
3. **CORS & Multi-Tenancy**:
   - All connectors respect the `x-tenant-code` header to enforce strict multi-tenant isolation.

---

*Document approved for national digital health enterprise integrations.*
