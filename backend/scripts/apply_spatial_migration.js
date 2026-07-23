const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function applySpatialMigration() {
  try {
    console.log('🔄 Applying 4-Level Spatial Administrative Hierarchy Migration...');
    const sqlPath = path.join(__dirname, '../database/spatial_hierarchy_levels_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ 4-Level Spatial Administrative Hierarchy Migration applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error applying spatial migration:', err);
    process.exit(1);
  }
}

applySpatialMigration();
