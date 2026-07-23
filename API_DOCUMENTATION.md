# National Health Facility Registry - External API Documentation

This API allows external applications to retrieve public health facility data from the National Health Facility Registry.

**Base URL**: `https://[your-domain]/api`

---

## Endpoints

### 1. Get All Facilities
Retrieves a complete list of all health facilities with their location and metadata.

- **URL**: `/facilities/public`
- **Method**: `GET`
- **Auth**: None (Public)
- **Response**: Array of Facility objects.

**Example Response**:
```json
[
  {
    "id": 4158,
    "name": "15 Mile",
    "type": "Aidpost",
    "operational_status": "Operational",
    "workflow_status": "APPROVED",
    "latitude": -5.1234,
    "longitude": 145.1234,
    "code": "19-01-001",
    "ownership": "Government",
    "district": "Port Moresby North West",
    "province": "National Capital District",
    "region": "Southern"
  },
  ...
]
```

### 2. Get Location Hierarchy
Retrieves the administrative hierarchy of the country (Region -> Province -> District). Useful for building filter dropdowns.

- **URL**: `/facilities/locations`
- **Method**: `GET`
- **Response**: Array of Region objects.

**Structure**:
```json
[
  {
    "id": 1,
    "name": "Southern",
    "provinces": [
       {
         "id": 10,
         "name": "National Capital District",
         "districts": [
            { "id": 101, "name": "Port Moresby North West" }
         ]
       }
    ]
  }
]
```

### 3. Get Facility Types
Retrieves a list of all unique facility types defined in the system.

- **URL**: `/facilities/types`
- **Method**: `GET`
- **Response**: Array of strings.

**Example**:
```json
["Aidpost", "Health Centre", "District Hospital", "General Hospital"]
```

---

## Integration Examples

### JavaScript (Fetch)
```javascript
async function fetchFacilities() {
  const response = await fetch('https://[your-domain]/api/facilities/public');
  const facilities = await response.json();
  console.log('Loaded facilities:', facilities);
}
```

### Python (Requests)
```python
import requests

response = requests.get('https://[your-domain]/api/facilities/public')
facilities = response.json()
print(f"Loaded {len(facilities)} facilities")
```
