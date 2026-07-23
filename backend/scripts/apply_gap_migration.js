const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function applyGapMigration() {
  try {
    console.log('🔄 Applying HFRS Gap Remediation Migration...');
    const sqlPath = path.join(__dirname, '../database/gap_remediation_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ HFRS Gap Remediation Migration applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error applying migration:', err);
    process.exit(1);
  }
}

applyGapMigration();
