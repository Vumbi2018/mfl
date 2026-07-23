const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function applyInteropMigration() {
  try {
    console.log('🔄 Applying Interoperability & Version Management Migration...');
    const sqlPath = path.join(__dirname, '../database/interop_version_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Interoperability & Version Management Migration applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error applying interop migration:', err);
    process.exit(1);
  }
}

applyInteropMigration();
