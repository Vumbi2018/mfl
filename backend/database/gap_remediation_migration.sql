-- HFRS Toolkit Compliance Gap Remediation Migration
-- Evaluated against GHFD SubWG RMR HFRS Toolkit Version 1.0

-- 1. Facility Sub-Lists Table (RMR F13)
CREATE TABLE IF NOT EXISTS facility_sublists (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version_label VARCHAR(50) DEFAULT 'v1.0',
    facility_ids INT[] DEFAULT '{}',
    criteria_json JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facility_sublists_tenant ON facility_sublists(tenant_code);
CREATE INDEX IF NOT EXISTS idx_facility_sublists_creator ON facility_sublists(created_by);

-- 2. Data Dictionary Elements Metadata Table (RMR F4, RMR F5)
CREATE TABLE IF NOT EXISTS data_dictionary_elements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Signature Domain', 'Service Domain', 'Governance', 'Geospatial'
    data_type VARCHAR(50) NOT NULL, -- 'string', 'integer', 'boolean', 'date', 'geometry', 'json'
    description TEXT,
    criticality_level VARCHAR(50) DEFAULT 'Recommended', -- 'Required', 'Recommended', 'Optional'
    requirement_code VARCHAR(50), -- e.g. 'RMR F10'
    is_required BOOLEAN DEFAULT FALSE,
    is_unique BOOLEAN DEFAULT FALSE,
    is_sensitive BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Core Data Dictionary Elements
INSERT INTO data_dictionary_elements (code, name, category, data_type, description, criticality_level, requirement_code, is_required, is_unique)
VALUES 
('FAC_CODE', 'Facility Code', 'Signature Domain', 'string', 'Unique alphanumeric identifier for health facility', 'Required', 'RMR F10', TRUE, TRUE),
('FAC_NAME', 'Facility Official Name', 'Signature Domain', 'string', 'Official registered name of the health facility', 'Required', 'RMR F10', TRUE, FALSE),
('FAC_TYPE', 'Facility Type', 'Signature Domain', 'string', 'Classification of health facility level (e.g. National Hospital, Health Centre)', 'Required', 'RMR F10', TRUE, FALSE),
('OPER_STATUS', 'Operational Status', 'Signature Domain', 'string', 'Current operational status (Operational, Closed, Pending, Suspended)', 'Required', 'RMR F10', TRUE, FALSE),
('OWNERSHIP', 'Managing Authority / Ownership', 'Signature Domain', 'string', 'Entity operating facility (Government, Church, NGO, Private)', 'Required', 'RMR F10', TRUE, FALSE),
('LATITUDE', 'Geographic Latitude', 'Geospatial', 'float', 'WGS84 Latitude coordinate in decimal degrees', 'Required', 'RMR F10', TRUE, FALSE),
('LONGITUDE', 'Geographic Longitude', 'Geospatial', 'float', 'WGS84 Longitude coordinate in decimal degrees', 'Required', 'RMR F10', TRUE, FALSE),
('GPS_METHOD', 'GPS Collection Method', 'Geospatial', 'string', 'Method used for spatial data capture (field_gps, google_maps, administrative)', 'Recommended', 'RMR F10', FALSE, FALSE),
('TOTAL_BEDS', 'Total Inpatient Beds', 'Service Domain', 'integer', 'Total count of operational inpatient beds', 'Optional', 'RMR F11', FALSE, FALSE),
('ICU_BEDS', 'ICU Beds Count', 'Service Domain', 'integer', 'Count of intensive care unit beds', 'Optional', 'RMR F11', FALSE, FALSE),
('SERVICES_LIST', 'Services Offered Taxonomy', 'Service Domain', 'json', 'Array of WHO-aligned essential health services provided', 'Optional', 'RMR F11', FALSE, FALSE),
('WORKFLOW_STATUS', 'Workflow Approval State', 'Governance', 'string', 'Current state in multi-tier approval workflow', 'Required', 'RMR F21', TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;

-- 3. In-App Notifications Table (RMR F23)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'workflow'
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 4. Historical Data Archiving Function & Table (RMR NF3)
CREATE TABLE IF NOT EXISTS archived_facilities (
    id INT PRIMARY KEY,
    tenant_code VARCHAR(50),
    name VARCHAR(255),
    code VARCHAR(50),
    archived_at TIMESTAMP DEFAULT NOW(),
    archived_by INT REFERENCES users(id),
    facility_data JSONB
);

CREATE OR REPLACE FUNCTION archive_facility_record(p_facility_id INT, p_archived_by INT)
RETURNS BOOLEAN AS $$
DECLARE
    fac_record RECORD;
BEGIN
    SELECT * INTO fac_record FROM facilities WHERE id = p_facility_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    INSERT INTO archived_facilities (id, tenant_code, name, code, archived_by, facility_data)
    VALUES (fac_record.id, fac_record.tenant_code, fac_record.name, fac_record.code, p_archived_by, to_jsonb(fac_record))
    ON CONFLICT (id) DO UPDATE 
    SET archived_at = NOW(), archived_by = p_archived_by, facility_data = to_jsonb(fac_record);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
