-- Interoperability Hub & Version Management Database Migration

-- 1. HFML Releases & Version Snapshots Table (RMR F22)
CREATE TABLE IF NOT EXISTS hfml_releases (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    version_tag VARCHAR(50) NOT NULL, -- e.g. 'v1.0.0'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    facility_count INT DEFAULT 0,
    snapshot_json JSONB DEFAULT '[]',
    is_active_release BOOLEAN DEFAULT FALSE,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hfml_releases_tenant ON hfml_releases(tenant_code, version_tag);

-- 2. API Keys Table for Secure Machine-to-Machine Integration
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    key_name VARCHAR(100) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    allowed_connectors TEXT[] DEFAULT '{"fhir", "dhis2", "openlmis", "geojson"}',
    active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Interoperability Audit & Access Logs Table (RMR NF2, RMR NF16)
CREATE TABLE IF NOT EXISTS interop_logs (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) DEFAULT 'png',
    connector_name VARCHAR(50) NOT NULL, -- 'fhir', 'dhis2', 'openlmis', 'geojson'
    system_name VARCHAR(100) DEFAULT 'External HIS',
    endpoint VARCHAR(255) NOT NULL,
    request_method VARCHAR(10) DEFAULT 'GET',
    status_code INT DEFAULT 200,
    records_served INT DEFAULT 0,
    response_time_ms INT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interop_logs_connector ON interop_logs(connector_name, timestamp);

-- Seed Initial Release v1.0.0 Snapshot
INSERT INTO hfml_releases (tenant_code, version_tag, title, description, facility_count, is_active_release)
VALUES ('png', 'v1.0.0', 'Initial Baseline HFML Release', 'Official baseline Health Facility Master List release per WHO GHFD SubWG guidelines.', 0, TRUE)
ON CONFLICT DO NOTHING;
