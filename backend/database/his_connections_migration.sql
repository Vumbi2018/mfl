-- Configurable HIS Connections & Sync Logs Migration

-- 1. Remote HIS Connections Table
CREATE TABLE IF NOT EXISTS his_connections (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    name VARCHAR(255) NOT NULL, -- e.g. 'National DHIS2 Server'
    system_type VARCHAR(50) NOT NULL, -- 'dhis2', 'openlmis', 'fhir', 'custom_rest', 'geojson'
    base_url VARCHAR(500) NOT NULL,
    auth_type VARCHAR(50) DEFAULT 'bearer', -- 'bearer', 'api_key', 'basic', 'none'
    auth_credentials JSONB DEFAULT '{}', -- { "token": "...", "apiKey": "...", "username": "...", "password": "..." }
    sync_direction VARCHAR(20) DEFAULT 'PUSH', -- 'PUSH', 'PULL', 'BIDIRECTIONAL'
    entity_scope VARCHAR(50) DEFAULT 'facilities', -- 'facilities', 'facility_types', 'services', 'all'
    filter_criteria JSONB DEFAULT '{}', -- { "province_id": "all", "facility_types": ["NH", "PH"] }
    field_mappings JSONB DEFAULT '{}', -- { "code": "identifier", "name": "displayName" }
    sync_frequency VARCHAR(50) DEFAULT 'manual', -- 'manual', 'hourly', 'daily', 'weekly'
    active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50), -- 'SUCCESS', 'FAILED', 'NEVER'
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_his_connections_tenant ON his_connections(tenant_code, active);

-- 2. HIS Sync Execution Logs Table
CREATE TABLE IF NOT EXISTS his_sync_logs (
    id SERIAL PRIMARY KEY,
    connection_id INT REFERENCES his_connections(id) ON DELETE CASCADE,
    tenant_code VARCHAR(50) DEFAULT 'png',
    sync_direction VARCHAR(20) NOT NULL, -- 'PUSH', 'PULL', 'BIDIRECTIONAL'
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED', 'IN_PROGRESS'
    records_pushed INT DEFAULT 0,
    records_pulled INT DEFAULT 0,
    details TEXT,
    errors_json JSONB DEFAULT '[]',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_his_sync_logs_conn ON his_sync_logs(connection_id, started_at);

-- Seed Sample Configured Connection Profiles
INSERT INTO his_connections (tenant_code, name, system_type, base_url, auth_type, sync_direction, entity_scope, field_mappings)
VALUES 
(
  'png', 
  'National DHIS2 Production Server', 
  'dhis2', 
  'http://localhost:5002/api/interop/dhis2/orgunits', 
  'bearer', 
  'PUSH', 
  'facilities', 
  '{"code":"code", "name":"name", "district":"parent.name"}'::jsonb
),
(
  'png', 
  'OpenLMIS Central Supply Chain Registry', 
  'openlmis', 
  'http://localhost:5002/api/interop/openlmis/facilities', 
  'bearer', 
  'BIDIRECTIONAL', 
  'facilities', 
  '{"code":"lmisFacilityCode", "name":"facilityName", "status":"activeStatus"}'::jsonb
)
ON CONFLICT DO NOTHING;
