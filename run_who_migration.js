const pool = require('./backend/db');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    console.log("Adding missing columns to facility_types...");
    await pool.query(`
      ALTER TABLE facility_types ADD COLUMN IF NOT EXISTS code VARCHAR(50);
      ALTER TABLE facility_types ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE facility_types ADD COLUMN IF NOT EXISTS level INT DEFAULT 4;
      ALTER TABLE facility_types ADD COLUMN IF NOT EXISTS typical_beds_min INT DEFAULT 0;
      ALTER TABLE facility_types ADD COLUMN IF NOT EXISTS typical_beds_max INT DEFAULT 0;
      ALTER TABLE facility_types ADD COLUMN IF NOT EXISTS can_admit BOOLEAN DEFAULT FALSE;
      ALTER TABLE facility_types ADD COLUMN IF NOT EXISTS parent_id INT;
      ALTER TABLE facility_types ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
    `);

    console.log("Populating null codes and cleaning up duplicates...");
    await pool.query(`
      UPDATE facility_types 
      SET code = UPPER(REPLACE(REPLACE(REPLACE(name, ' ', '_'), '-', '_'), '/', '_'))
      WHERE code IS NULL OR code = '';
    `);

    console.log("Creating service_types table if not exists...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_types (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        requires_certification BOOLEAN DEFAULT FALSE,
        parent_id INT REFERENCES service_types(id),
        who_service_package VARCHAR(50),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add unique constraint on code if missing
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'facility_types_code_key') THEN 
          ALTER TABLE facility_types ADD CONSTRAINT facility_types_code_key UNIQUE (code);
        END IF;
      END $$;
    `);

    // Remove any conflicting facility_types name constraint if exists
    await pool.query(`
      ALTER TABLE facility_types DROP CONSTRAINT IF EXISTS facility_types_name_key;
    `);

    console.log("Running who_mfl_migration.sql...");
    const sqlPath = path.join(__dirname, 'backend', 'database', 'who_mfl_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log("SUCCESS: WHO MFL Migration applied cleanly!");

    // Verify
    const test1 = await pool.query("SELECT count(*) FROM facility_types WHERE active = true");
    const test2 = await pool.query("SELECT count(*) FROM service_types WHERE active = true");
    console.log(`Verified facility_types count: ${test1.rows[0].count}`);
    console.log(`Verified service_types count: ${test2.rows[0].count}`);
  } catch (e) {
    console.error("Migration error:", e);
  } finally {
    process.exit();
  }
}

run();
