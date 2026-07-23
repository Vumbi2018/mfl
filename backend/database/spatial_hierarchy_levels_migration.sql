-- 4-Level Administrative Hierarchy & PostGIS Geometry Migration

-- 1. Ensure Level 1: Regions / Country
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Ensure Level 2: Provinces
CREATE TABLE IF NOT EXISTS provinces (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    region_id INT REFERENCES regions(id) ON DELETE SET NULL,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Ensure Level 3: Districts
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    province_id INT REFERENCES provinces(id) ON DELETE CASCADE,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Ensure Level 4: Wards / Local Level Governments (LLGs) / Sub-Districts
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) REFERENCES tenants(code) DEFAULT 'png',
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    district_id INT REFERENCES districts(id) ON DELETE CASCADE,
    province_id INT REFERENCES provinces(id) ON DELETE SET NULL,
    population INT DEFAULT 0,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add ward_id to facilities table if not exists
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS ward_id INT REFERENCES wards(id) ON DELETE SET NULL;

-- 6. Spatial GIST Indexes for 4-Level Hierarchy
CREATE INDEX IF NOT EXISTS idx_regions_geom ON regions USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_provinces_geom ON provinces USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_districts_geom ON districts USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_wards_geom ON wards USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_facilities_ward ON facilities(ward_id);

-- 7. Seed Sample Wards if empty
INSERT INTO wards (tenant_code, name, code, district_id)
SELECT 'png', 'Ward 1 Central', 'W01', d.id
FROM districts d LIMIT 1
ON CONFLICT DO NOTHING;
