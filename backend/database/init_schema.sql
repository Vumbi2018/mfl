-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
-- 1. HIERARCHY
-- Regions
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);
-- Provinces
CREATE TABLE IF NOT EXISTS provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE,
    region_id INT REFERENCES regions(id) ON DELETE CASCADE,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);
-- Districts
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    province_id INT REFERENCES provinces(id) ON DELETE CASCADE,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, province_id)
);
-- 2. RBAC
-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    -- e.g., 'ADMIN', 'APPROVER', 'VIEWER'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    -- e.g., 'facility.create', 'facility.approve'
    description TEXT
);
-- Role_Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    district_id INT REFERENCES districts(id),
    -- Optional: Limit user key data entry to district
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
-- 3. CORE FACILITY DATA
-- Facilities
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    -- Matched to 'normalized' column in CSV
    code VARCHAR(50) UNIQUE,
    -- Matched to 'eNHIS_cod' in CSV
    type VARCHAR(100),
    -- Matched to 'hf_type'
    operational_status VARCHAR(100),
    -- Matched to 'operational_status'
    agency_name VARCHAR(255),
    -- Matched to 'agency_na'
    district_id INT REFERENCES districts(id),
    -- Geography
    geom GEOMETRY(POINT, 4326),
    latitude FLOAT,
    longitude FLOAT,
    -- Identification & Metadata
    ownership VARCHAR(100),
    -- inferred from agency_name or explicit
    date_established DATE,
    registration_number VARCHAR(100),
    license_number VARCHAR(100),
    description TEXT,
    -- Contact & Location Details
    street_address TEXT,
    postal_code VARCHAR(20),
    city VARCHAR(100),
    contact_phone VARCHAR(50),
    -- General/Emergency combined or JSON
    contact_email VARCHAR(100),
    website VARCHAR(255),
    -- Capacity & Services (Structured where critical, JSONB for extensibility)
    -- Capacity & Services
    total_beds INT DEFAULT 0,
    icu_beds INT DEFAULT 0,
    emergency_beds INT DEFAULT 0,
    operating_theaters INT DEFAULT 0,
    outpatient_rooms INT DEFAULT 0,
    consultation_rooms INT DEFAULT 0,
    services JSONB DEFAULT '[]',
    -- List of available services
    -- Operating Hours
    weekday_hours VARCHAR(100),
    weekend_hours VARCHAR(100),
    -- Specific Contacts
    emergency_contact VARCHAR(50),
    general_contact VARCHAR(50),
    -- Staff Counts
    doctors INT DEFAULT 0,
    nurses INT DEFAULT 0,
    specialists INT DEFAULT 0,
    technicians INT DEFAULT 0,
    pharmacists INT DEFAULT 0,
    admin_staff INT DEFAULT 0,
    -- Equipment Counts
    ct_scanners INT DEFAULT 0,
    mri_machines INT DEFAULT 0,
    xray_machines INT DEFAULT 0,
    ultrasound_machines INT DEFAULT 0,
    ventilators INT DEFAULT 0,
    dialysis_machines INT DEFAULT 0,
    basic_ambulances INT DEFAULT 0,
    advanced_ambulances INT DEFAULT 0,
    air_ambulances INT DEFAULT 0,
    equipment_notes TEXT,
    -- Location Details (Extra)
    elevation FLOAT,
    accuracy FLOAT,
    staff_counts JSONB DEFAULT '{}',
    -- kept for extension
    equipment_counts JSONB DEFAULT '{}',
    -- kept for extension
    -- Extended properties (images, etc)
    common_props JSONB DEFAULT '{}',
    -- Workflow & Versioning
    workflow_status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
    -- 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'
    current_version INT DEFAULT 1,
    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INT REFERENCES users(id),
    updated_by INT REFERENCES users(id)
);
-- 4. WORKFLOW & AUDIT
-- Facility Versions (History)
CREATE TABLE IF NOT EXISTS facility_versions (
    id SERIAL PRIMARY KEY,
    facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
    version_number INT,
    data_snapshot JSONB,
    -- Full copy of the facility record at this version
    changed_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
-- General Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50),
    -- 'FACILITY', 'USER', etc.
    entity_id INT,
    action VARCHAR(50),
    -- 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
    changed_by INT REFERENCES users(id),
    changes JSONB,
    -- { "field": {"old": "a", "new": "b"} }
    timestamp TIMESTAMP DEFAULT NOW()
);
-- Workflow Logs (Comments and Sign-offs)
CREATE TABLE IF NOT EXISTS workflow_logs (
    id SERIAL PRIMARY KEY,
    facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
    status_from VARCHAR(50),
    status_to VARCHAR(50),
    actor_id INT REFERENCES users(id),
    comments TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
-- Indicies for spatial performance
CREATE INDEX IF NOT EXISTS idx_facilities_geom ON facilities USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_districts_geom ON districts USING GIST (geom);