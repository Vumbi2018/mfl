-- Multi-Tenant Migration Script
-- This script transforms the MFL into a multi-tenant platform

-- 1. Create Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add Zambia Tenant
INSERT INTO tenants (name, code) VALUES ('Zambia', 'zambia') ON CONFLICT (code) DO NOTHING;
INSERT INTO tenants (name, code) VALUES ('Papua New Guinea', 'png') ON CONFLICT (code) DO NOTHING;

-- 3. Add tenant_code to existing tables
DO $$
DECLARE
    t_name TEXT;
    tables_to_update TEXT[] := ARRAY[
        'regions', 'provinces', 'districts',
        'facilities', 'facility_types',
        'users', 'audit_logs', 'workflow_logs', 
        'facility_versions'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_to_update
    LOOP
        -- Check if column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = t_name AND column_name = 'tenant_code'
        ) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT ''png''', t_name);
            RAISE NOTICE 'Added tenant_code to table %', t_name;
        END IF;
    END LOOP;
END $$;

-- 4. Update UNIQUE constraints to include tenant_code
-- Regions
ALTER TABLE regions DROP CONSTRAINT IF EXISTS regions_name_key;
ALTER TABLE regions ADD CONSTRAINT regions_tenant_name_key UNIQUE (tenant_code, name);
ALTER TABLE regions DROP CONSTRAINT IF EXISTS regions_code_key;
ALTER TABLE regions ADD CONSTRAINT regions_tenant_code_key UNIQUE (tenant_code, code);

-- Provinces
ALTER TABLE provinces DROP CONSTRAINT IF EXISTS provinces_name_key;
ALTER TABLE provinces ADD CONSTRAINT provinces_tenant_name_key UNIQUE (tenant_code, name);
ALTER TABLE provinces DROP CONSTRAINT IF EXISTS provinces_code_key;
ALTER TABLE provinces ADD CONSTRAINT provinces_tenant_code_key UNIQUE (tenant_code, code);

-- Districts
ALTER TABLE districts DROP CONSTRAINT IF EXISTS districts_name_province_id_key;
ALTER TABLE districts ADD CONSTRAINT districts_tenant_name_province_key UNIQUE (tenant_code, name, province_id);
ALTER TABLE districts DROP CONSTRAINT IF EXISTS districts_code_key;
ALTER TABLE districts ADD CONSTRAINT districts_tenant_code_key UNIQUE (tenant_code, code);

-- Facilities
ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_code_unique;
ALTER TABLE facilities ADD CONSTRAINT facilities_tenant_code_unique UNIQUE (tenant_code, code);

-- Facility Types
-- ALTER TABLE facility_types DROP CONSTRAINT IF EXISTS facility_types_code_key;
-- ALTER TABLE facility_types ADD CONSTRAINT facility_types_tenant_code_key UNIQUE (tenant_code, code);

-- 5. Tenant-specific Settings
CREATE TABLE IF NOT EXISTS tenant_settings (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code),
    key VARCHAR(100) NOT NULL,
    value TEXT,
    category VARCHAR(50),
    label VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_code, key)
);

-- Migrate global settings to tenant settings for 'png'
-- (Skipped because system_settings doesn't exist in the dump)

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_facilities_tenant ON facilities(tenant_code);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_code);
