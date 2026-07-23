const pool = require('../db');

// Helper to log connector requests
const logConnectorRequest = async (connector, req, statusCode, recordCount, startTime) => {
  try {
    const responseTime = Date.now() - startTime;
    await pool.query(
      `INSERT INTO interop_logs (tenant_code, connector_name, system_name, endpoint, request_method, status_code, records_served, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.tenantCode || 'png', connector, req.headers['user-agent'] || 'External HIS', req.originalUrl, req.method, statusCode, recordCount, responseTime]
    );
  } catch (err) {
    console.error('Error logging interop request:', err);
  }
};

// 1. HL7 FHIR R4 Location Connector (mCSD Profile)
exports.getFHIRLocations = async (req, res) => {
  const startTime = Date.now();
  try {
    const tenantCode = req.tenantCode || 'png';
    const result = await pool.query(
      `SELECT f.*, p.name as province_name, d.name as district_name
       FROM facilities f
       LEFT JOIN districts d ON f.district_id = d.id
       LEFT JOIN provinces p ON d.province_id = p.id
       WHERE f.tenant_code = $1`,
      [tenantCode]
    );

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: result.rows.length,
      timestamp: new Date().toISOString(),
      entry: result.rows.map(f => ({
        fullUrl: `${req.protocol}://${req.get('host')}/api/interop/fhir/Location/${f.id}`,
        resource: {
          resourceType: 'Location',
          id: String(f.id),
          identifier: [
            { system: 'urn:ietf:rfc:3986', value: f.code },
            { system: 'http://hfrs.health.gov/identifiers', value: String(f.id) }
          ],
          status: f.operational_status?.toLowerCase().includes('open') ? 'active' : 'inactive',
          name: f.name,
          alias: f.alternate_names || [],
          mode: 'instance',
          type: [
            {
              coding: [
                { system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode', code: 'OF', display: f.type || 'Outpatient Facility' }
              ]
            }
          ],
          telecom: [
            { system: 'phone', value: f.contact_phone || f.general_contact || 'N/A' },
            { system: 'email', value: f.contact_email || 'N/A' }
          ],
          position: f.longitude && f.latitude ? {
            longitude: parseFloat(f.longitude),
            latitude: parseFloat(f.latitude),
            altitude: f.elevation || 0
          } : undefined,
          managingOrganization: {
            display: f.ownership || 'Ministry of Health'
          },
          partOf: f.district_name ? {
            display: `${f.district_name} District, ${f.province_name || ''}`
          } : undefined
        }
      }))
    };

    logConnectorRequest('fhir', req, 200, result.rows.length, startTime);
    res.status(200).json(bundle);
  } catch (err) {
    console.error('Error serving FHIR Location connector:', err);
    logConnectorRequest('fhir', req, 500, 0, startTime);
    res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
  }
};

// 2. DHIS2 Organization Units API Connector
exports.getDHIS2OrgUnits = async (req, res) => {
  const startTime = Date.now();
  try {
    const tenantCode = req.tenantCode || 'png';

    const facRes = await pool.query(
      `SELECT f.id, f.code, f.name, f.date_established, d.name as district_name, d.code as district_code, p.name as province_name
       FROM facilities f
       LEFT JOIN districts d ON f.district_id = d.id
       LEFT JOIN provinces p ON d.province_id = p.id
       WHERE f.tenant_code = $1`,
      [tenantCode]
    );

    const orgUnits = facRes.rows.map(f => ({
      id: `HFRS_${f.code || f.id}`,
      code: f.code,
      name: f.name,
      shortName: f.name.length > 50 ? f.name.substring(0, 47) + '...' : f.name,
      openingDate: f.date_established || '2000-01-01',
      parent: {
        id: `DIST_${f.district_code || f.district_name}`,
        name: f.district_name
      }
    }));

    const responsePayload = {
      pager: {
        page: 1,
        total: orgUnits.length,
        pageSize: orgUnits.length
      },
      organisationUnits: orgUnits
    };

    logConnectorRequest('dhis2', req, 200, orgUnits.length, startTime);
    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Error serving DHIS2 OrgUnits connector:', err);
    logConnectorRequest('dhis2', req, 500, 0, startTime);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

// 3. OpenLMIS / mSupply Supply Chain Connector
exports.getOpenLMISFacilities = async (req, res) => {
  const startTime = Date.now();
  try {
    const tenantCode = req.tenantCode || 'png';

    const result = await pool.query(
      `SELECT f.id, f.code, f.name, f.type, f.operational_status, f.ownership, f.contact_phone, f.contact_email,
              f.total_beds, f.icu_beds, f.weekday_hours, d.name as district_name, p.name as province_name
       FROM facilities f
       LEFT JOIN districts d ON f.district_id = d.id
       LEFT JOIN provinces p ON d.province_id = p.id
       WHERE f.tenant_code = $1`,
      [tenantCode]
    );

    const facilities = result.rows.map(f => ({
      lmisFacilityCode: f.code,
      facilityName: f.name,
      facilityType: f.type,
      activeStatus: f.operational_status?.toLowerCase().includes('open') ? 'ACTIVE' : 'INACTIVE',
      managingAuthority: f.ownership,
      district: f.district_name,
      province: f.province_name,
      capacity: {
        totalBeds: f.total_beds || 0,
        icuBeds: f.icu_beds || 0
      },
      contactPhone: f.contact_phone,
      contactEmail: f.contact_email
    }));

    logConnectorRequest('openlmis', req, 200, facilities.length, startTime);
    res.status(200).json({
      system: 'OpenLMIS/mSupply Integration Endpoint',
      count: facilities.length,
      facilities
    });
  } catch (err) {
    console.error('Error serving OpenLMIS connector:', err);
    logConnectorRequest('openlmis', req, 500, 0, startTime);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

// 4. GeoJSON Spatial Data Connector
exports.getGeoJSONFacilities = async (req, res) => {
  const startTime = Date.now();
  try {
    const tenantCode = req.tenantCode || 'png';

    const result = await pool.query(
      `SELECT f.id, f.code, f.name, f.type, f.operational_status, f.ownership, f.latitude, f.longitude,
              d.name as district_name, p.name as province_name
       FROM facilities f
       LEFT JOIN districts d ON f.district_id = d.id
       LEFT JOIN provinces p ON d.province_id = p.id
       WHERE f.tenant_code = $1 AND f.latitude IS NOT NULL AND f.longitude IS NOT NULL`,
      [tenantCode]
    );

    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map(f => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(f.longitude), parseFloat(f.latitude)]
        },
        properties: {
          id: f.id,
          code: f.code,
          name: f.name,
          type: f.type,
          status: f.operational_status,
          ownership: f.ownership,
          district: f.district_name,
          province: f.province_name
        }
      }))
    };

    logConnectorRequest('geojson', req, 200, result.rows.length, startTime);
    res.status(200).json(geojson);
  } catch (err) {
    console.error('Error serving GeoJSON connector:', err);
    logConnectorRequest('geojson', req, 500, 0, startTime);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

// GET /api/interop/metrics - Get connector usage statistics
exports.getInteropMetrics = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';

    const logsRes = await pool.query(
      `SELECT connector_name, COUNT(*) as total_requests, SUM(records_served) as total_records, AVG(response_time_ms) as avg_latency
       FROM interop_logs
       WHERE tenant_code = $1
       GROUP BY connector_name`,
      [tenantCode]
    );

    const recentLogs = await pool.query(
      `SELECT * FROM interop_logs WHERE tenant_code = $1 ORDER BY timestamp DESC LIMIT 20`,
      [tenantCode]
    );

    res.status(200).json({
      success: true,
      connectors: logsRes.rows,
      recentLogs: recentLogs.rows
    });
  } catch (err) {
    console.error('Error fetching interop metrics:', err);
    res.status(500).json({ success: false, message: 'Server error fetching interop metrics.' });
  }
};
