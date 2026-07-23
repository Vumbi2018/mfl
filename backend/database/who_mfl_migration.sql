-- WHO MFL Compliance Migration Script
-- Based on WHO "Creating a Master Health Facility List" guidelines
-- Run this against the mfl_db database
-- ============================================================
-- 1. DATA QUALITY & VERIFICATION FIELDS (CRITICAL)
-- ============================================================
-- Add verification tracking fields
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS date_closed DATE;
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS last_verified_date DATE;
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50);
-- 'field_visit', 'phone', 'desk_review'
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS verified_by INT REFERENCES users(id);
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS gps_collection_method VARCHAR(50);
-- 'field_gps', 'google_maps', 'administrative'
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS gps_accuracy_meters FLOAT;
-- Add name variants for matching/deduplication
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS official_name VARCHAR(255);
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS local_name VARCHAR(255);
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS alternate_names TEXT [];
-- Add data quality scoring
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS quality_score INT;
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS quality_issues JSONB DEFAULT '[]';
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS quality_score_updated_at TIMESTAMP;
-- ============================================================
-- 2. FACILITY TYPE TAXONOMY (HIGH PRIORITY)
-- ============================================================
CREATE TABLE IF NOT EXISTS facility_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INT,
    -- 1=National, 2=Provincial, 3=District, 4=Sub-District, 5=Community
    typical_beds_min INT,
    typical_beds_max INT,
    can_admit BOOLEAN DEFAULT FALSE,
    parent_id INT REFERENCES facility_types(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
-- Seed with PNG Health System Levels (per WHO Essential Services Package)
INSERT INTO facility_types (code, name, level, can_admit, description)
VALUES (
        'NH',
        'National Hospital',
        1,
        TRUE,
        'National referral hospitals providing tertiary care'
    ),
    (
        'PH',
        'Provincial Hospital',
        2,
        TRUE,
        'Provincial level hospitals providing secondary care'
    ),
    (
        'DH',
        'District Hospital',
        3,
        TRUE,
        'District hospitals providing basic surgical and inpatient care'
    ),
    (
        'RH',
        'Rural Hospital',
        3,
        TRUE,
        'Rural hospitals in remote areas'
    ),
    (
        'HC',
        'Health Centre',
        4,
        TRUE,
        'Health centres with limited inpatient capacity'
    ),
    (
        'SHC',
        'Sub-Health Centre',
        4,
        FALSE,
        'Sub-health centres providing outpatient services'
    ),
    (
        'UHC',
        'Urban Health Centre',
        4,
        FALSE,
        'Urban health centres and clinics'
    ),
    (
        'AP',
        'Aid Post',
        5,
        FALSE,
        'Community-level aid posts'
    ),
    (
        'MCH',
        'MCH Clinic',
        4,
        FALSE,
        'Maternal and Child Health clinics'
    ),
    (
        'PRI',
        'Private Clinic',
        4,
        FALSE,
        'Private medical clinics'
    ),
    (
        'NGO',
        'NGO Clinic',
        4,
        FALSE,
        'NGO-operated health facilities'
    ),
    (
        'CHU',
        'Church Health Facility',
        4,
        TRUE,
        'Church-operated health facilities'
    ) ON CONFLICT (code) DO NOTHING;
-- ============================================================
-- 3. SERVICE TAXONOMY (CRITICAL)
-- ============================================================
CREATE TABLE IF NOT EXISTS service_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requires_certification BOOLEAN DEFAULT FALSE,
    parent_id INT REFERENCES service_types(id),
    who_service_package VARCHAR(50),
    -- Maps to WHO Essential Package
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
-- Seed with PNG-relevant health services (aligned with WHO Essential Health Services)
INSERT INTO service_types (code, category, name, who_service_package)
VALUES -- Maternal Health
    (
        'ANC',
        'Maternal Health',
        'Antenatal Care',
        'RMNCAH'
    ),
    (
        'DEL_NORM',
        'Maternal Health',
        'Normal Delivery',
        'RMNCAH'
    ),
    (
        'DEL_COMP',
        'Maternal Health',
        'Complicated Delivery',
        'RMNCAH'
    ),
    (
        'EMOC',
        'Maternal Health',
        'Emergency Obstetric Care',
        'RMNCAH'
    ),
    (
        'CEMOC',
        'Maternal Health',
        'Comprehensive Emergency Obstetric Care',
        'RMNCAH'
    ),
    (
        'PNC',
        'Maternal Health',
        'Postnatal Care',
        'RMNCAH'
    ),
    (
        'FP',
        'Maternal Health',
        'Family Planning',
        'RMNCAH'
    ),
    -- Child Health
    (
        'EPI',
        'Child Health',
        'Immunization (EPI)',
        'RMNCAH'
    ),
    (
        'IMCI',
        'Child Health',
        'Integrated Management of Childhood Illness',
        'RMNCAH'
    ),
    (
        'NUT',
        'Child Health',
        'Nutrition Services',
        'RMNCAH'
    ),
    (
        'GMP',
        'Child Health',
        'Growth Monitoring & Promotion',
        'RMNCAH'
    ),
    -- Communicable Diseases
    (
        'TB_DX',
        'Communicable Diseases',
        'TB Diagnosis',
        'CD'
    ),
    (
        'TB_TX',
        'Communicable Diseases',
        'TB Treatment (DOTS)',
        'CD'
    ),
    (
        'TB_MDR',
        'Communicable Diseases',
        'MDR-TB Treatment',
        'CD'
    ),
    (
        'MAL_DX',
        'Communicable Diseases',
        'Malaria Diagnosis (RDT/Microscopy)',
        'CD'
    ),
    (
        'MAL_TX',
        'Communicable Diseases',
        'Malaria Treatment',
        'CD'
    ),
    (
        'HIV_VCT',
        'Communicable Diseases',
        'HIV Voluntary Counseling & Testing',
        'CD'
    ),
    (
        'HIV_ART',
        'Communicable Diseases',
        'HIV Antiretroviral Therapy',
        'CD'
    ),
    (
        'HIV_PMTCT',
        'Communicable Diseases',
        'HIV Prevention of Mother-to-Child Transmission',
        'CD'
    ),
    (
        'STI',
        'Communicable Diseases',
        'STI Diagnosis & Treatment',
        'CD'
    ),
    (
        'LEPROSY',
        'Communicable Diseases',
        'Leprosy Diagnosis & Treatment',
        'CD'
    ),
    -- Non-Communicable Diseases
    (
        'NCD_SCREEN',
        'Non-Communicable Diseases',
        'NCD Screening (Diabetes, Hypertension)',
        'NCD'
    ),
    (
        'NCD_MGMT',
        'Non-Communicable Diseases',
        'NCD Management',
        'NCD'
    ),
    (
        'MENTAL',
        'Non-Communicable Diseases',
        'Mental Health Services',
        'NCD'
    ),
    (
        'CANCER_SCREEN',
        'Non-Communicable Diseases',
        'Cancer Screening',
        'NCD'
    ),
    -- Emergency & Surgical
    (
        'EMERG',
        'Emergency Services',
        'Emergency/Casualty Services',
        'SURG'
    ),
    (
        'TRAUMA',
        'Emergency Services',
        'Trauma Care',
        'SURG'
    ),
    (
        'SURG_MINOR',
        'Surgical Services',
        'Minor Surgery',
        'SURG'
    ),
    (
        'SURG_MAJOR',
        'Surgical Services',
        'Major Surgery',
        'SURG'
    ),
    (
        'ORTHO',
        'Surgical Services',
        'Orthopedic Services',
        'SURG'
    ),
    (
        'OPHTH',
        'Surgical Services',
        'Ophthalmology/Eye Care',
        'SURG'
    ),
    -- Diagnostic Services
    (
        'LAB_BASIC',
        'Diagnostic Services',
        'Basic Laboratory',
        'DIAG'
    ),
    (
        'LAB_ADV',
        'Diagnostic Services',
        'Advanced Laboratory',
        'DIAG'
    ),
    (
        'XRAY',
        'Diagnostic Services',
        'X-Ray Services',
        'DIAG'
    ),
    (
        'ULTRASOUND',
        'Diagnostic Services',
        'Ultrasound Services',
        'DIAG'
    ),
    ('CT', 'Diagnostic Services', 'CT Scan', 'DIAG'),
    -- Support Services
    (
        'PHARM',
        'Support Services',
        'Pharmacy/Drug Dispensing',
        'SUPP'
    ),
    (
        'BLOOD',
        'Support Services',
        'Blood Bank/Transfusion',
        'SUPP'
    ),
    (
        'PHYSIO',
        'Support Services',
        'Physiotherapy',
        'SUPP'
    ),
    (
        'DENTAL',
        'Support Services',
        'Dental Services',
        'SUPP'
    ),
    (
        'AMB',
        'Support Services',
        'Ambulance Services',
        'SUPP'
    ) ON CONFLICT (code) DO NOTHING;
-- Junction table for facility-service relationships
CREATE TABLE IF NOT EXISTS facility_services (
    id SERIAL PRIMARY KEY,
    facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
    service_type_id INT REFERENCES service_types(id) ON DELETE CASCADE,
    available BOOLEAN DEFAULT TRUE,
    availability_notes TEXT,
    certification_date DATE,
    last_verified DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, service_type_id)
);
-- ============================================================
-- 4. EXTERNAL IDENTIFIER CROSS-REFERENCE (HIGH PRIORITY)
-- ============================================================
CREATE TABLE IF NOT EXISTS facility_identifiers (
    id SERIAL PRIMARY KEY,
    facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
    system_name VARCHAR(100) NOT NULL,
    -- e.g., 'eNHIS', 'DHIS2', 'VR', 'mSupply'
    identifier VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    valid_from DATE,
    valid_to DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, system_name, identifier)
);
-- Index for quick lookups by external ID
CREATE INDEX IF NOT EXISTS idx_facility_identifiers_lookup ON facility_identifiers(system_name, identifier);
-- ============================================================
-- 5. LLG HIERARCHY LEVEL (MEDIUM PRIORITY)
-- ============================================================
CREATE TABLE IF NOT EXISTS llgs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    district_id INT REFERENCES districts(id) ON DELETE CASCADE,
    geom GEOMETRY(MultiPolygon, 4326),
    population INT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, district_id)
);
-- Add LLG reference to facilities (optional link)
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS llg_id INT REFERENCES llgs(id);
-- ============================================================
-- 6. VERIFICATION CYCLES (HIGH PRIORITY)
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_cycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    frequency_months INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    scope VARCHAR(50),
    -- 'national', 'region', 'province', 'district'
    scope_id INT,
    -- ID of region/province/district if scoped
    status VARCHAR(50) DEFAULT 'scheduled',
    -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS facility_verifications (
    id SERIAL PRIMARY KEY,
    facility_id INT REFERENCES facilities(id) ON DELETE CASCADE,
    cycle_id INT REFERENCES verification_cycles(id),
    verified_by INT REFERENCES users(id),
    verification_date DATE NOT NULL,
    method VARCHAR(50) NOT NULL,
    -- 'field_visit', 'phone_call', 'desk_review', 'self_report'
    status VARCHAR(50) NOT NULL,
    -- 'verified', 'discrepancy_found', 'not_reachable', 'closed'
    gps_updated BOOLEAN DEFAULT FALSE,
    services_updated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    issues_found JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);
-- Index for verification reporting
CREATE INDEX IF NOT EXISTS idx_facility_verifications_date ON facility_verifications(verification_date);
-- ============================================================
-- 7. UPDATE WORKFLOW STATES FOR MULTI-TIER APPROVAL
-- ============================================================
-- The workflow_status field already exists. These are the new valid states.
-- We'll update the constraint comment for documentation:
COMMENT ON COLUMN facilities.workflow_status IS 'Valid states: DRAFT, DISTRICT_REVIEW, PROVINCE_REVIEW, NATIONAL_REVIEW, APPROVED, REQUIRES_CLARIFICATION, REJECTED';
-- ============================================================
-- 8. DATA QUALITY INDEXES
-- ============================================================
-- Index for finding facilities needing verification
CREATE INDEX IF NOT EXISTS idx_facilities_verification_needed ON facilities(last_verified_date);

-- Index for quality score filtering
CREATE INDEX IF NOT EXISTS idx_facilities_quality_score ON facilities(quality_score)
WHERE quality_score IS NOT NULL;
-- ============================================================
-- 9. MIGRATE EXISTING SERVICES JSONB TO NEW TABLE
-- ============================================================
-- This function migrates existing JSONB services to the new normalized table
-- Run this AFTER seeding service_types
DO $$
DECLARE fac RECORD;
svc TEXT;
svc_id INT;
BEGIN FOR fac IN
SELECT id,
    services
FROM facilities
WHERE services IS NOT NULL
    AND services != '[]'::jsonb LOOP FOR svc IN
SELECT jsonb_array_elements_text(fac.services) LOOP -- Try to match service string to service_type code
SELECT id INTO svc_id
FROM service_types
WHERE LOWER(code) = LOWER(svc)
    OR LOWER(name) ILIKE '%' || LOWER(svc) || '%'
LIMIT 1;
IF svc_id IS NOT NULL THEN
INSERT INTO facility_services (facility_id, service_type_id, available)
VALUES (fac.id, svc_id, TRUE) ON CONFLICT (facility_id, service_type_id) DO NOTHING;
END IF;
END LOOP;
END LOOP;
END $$;
-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Summary of changes:
-- 1. Added verification tracking fields to facilities
-- 2. Created facility_types reference table with PNG health system levels
-- 3. Created service_types table with WHO-aligned service taxonomy
-- 4. Created facility_services junction table
-- 5. Created facility_identifiers for external system cross-reference
-- 6. Created llgs table for LLG administrative level
-- 7. Created verification_cycles and facility_verifications tables
-- 8. Added performance indexes for data quality queries
-- 9. Migration script for existing JSONB services data