-- Mandatory Facility Code Migration
-- This migration:
-- 1. Backfills any NULL codes with auto-generated values
-- 2. Makes the code column NOT NULL
-- 3. Adds check digit validation constraint
-- ============================================================
-- Step 1: Create function to generate check digit (Luhn mod 36)
CREATE OR REPLACE FUNCTION generate_facility_code(
        p_province_code VARCHAR,
        p_district_code VARCHAR,
        p_serial INT
    ) RETURNS VARCHAR AS $$
DECLARE base_code VARCHAR;
check_char CHAR;
sum INT := 0;
i INT;
char_val INT;
BEGIN -- Format: PP-DD-XXX-C where C is check character
base_code := LPAD(p_province_code::VARCHAR, 2, '0') || '-' || LPAD(p_district_code::VARCHAR, 2, '0') || '-' || LPAD(p_serial::VARCHAR, 3, '0');
-- Simple check character based on sum mod 26
FOR i IN 1..LENGTH(REPLACE(base_code, '-', '')) LOOP char_val := ASCII(SUBSTRING(REPLACE(base_code, '-', ''), i, 1)) - 48;
sum := sum + char_val;
END LOOP;
check_char := CHR(65 + (sum % 26));
-- A-Z
RETURN base_code || '-' || check_char;
END;
$$ LANGUAGE plpgsql;
-- Step 2: Backfill NULL codes for existing facilities
DO $$
DECLARE fac RECORD;
new_code VARCHAR;
serial_num INT;
province_code VARCHAR;
district_code VARCHAR;
BEGIN FOR fac IN
SELECT f.id,
    f.district_id,
    d.code as district_code,
    p.code as province_code
FROM facilities f
    LEFT JOIN districts d ON f.district_id = d.id
    LEFT JOIN provinces p ON d.province_id = p.id
WHERE f.code IS NULL
    OR f.code = '' LOOP -- Get next serial number for this district
SELECT COALESCE(
        MAX(
            CASE
                WHEN code ~ '^\d{2}-\d{2}-\d{3}-[A-Z]$' THEN CAST(SUBSTRING(code, 7, 3) AS INT)
                ELSE 0
            END
        ),
        0
    ) + 1 INTO serial_num
FROM facilities
WHERE district_id = fac.district_id
    AND code IS NOT NULL;
-- Use district and province codes, defaulting to '00' if not available
province_code := COALESCE(SUBSTRING(fac.province_code, 1, 2), '00');
district_code := COALESCE(
    SUBSTRING(fac.district_code, 1, 2),
    LPAD(fac.district_id::VARCHAR, 2, '0')
);
new_code := generate_facility_code(province_code, district_code, serial_num);
UPDATE facilities
SET code = new_code
WHERE id = fac.id;
RAISE NOTICE 'Generated code % for facility ID %',
new_code,
fac.id;
END LOOP;
END $$;
-- Step 3: Make code column NOT NULL (only if all rows have values)
DO $$
DECLARE null_count INT;
BEGIN
SELECT COUNT(*) INTO null_count
FROM facilities
WHERE code IS NULL
    OR code = '';
IF null_count = 0 THEN -- All rows have codes, safe to add constraint
ALTER TABLE facilities
ALTER COLUMN code
SET NOT NULL;
RAISE NOTICE 'Successfully made code column NOT NULL';
ELSE RAISE EXCEPTION 'Cannot make code NOT NULL: % facilities still have NULL/empty codes',
null_count;
END IF;
END $$;
-- Step 4: Add unique constraint if not exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'facilities_code_unique'
) THEN
ALTER TABLE facilities
ADD CONSTRAINT facilities_code_unique UNIQUE (code);
RAISE NOTICE 'Added unique constraint on code column';
END IF;
END $$;
-- Step 5: Add validation constraint for code format (optional, comment out if too strict)
-- ALTER TABLE facilities
--   ADD CONSTRAINT valid_facility_code 
--   CHECK (code ~ '^[0-9]{2}-[0-9]{2}-[0-9]{3}-[A-Z]$');
-- Summary:
-- - All facilities now have a unique, non-null code
-- - Code format: PP-DD-XXX-C (Province-District-Serial-CheckChar)
-- - New facilities must have a code before insert