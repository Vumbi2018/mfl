const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function applyConnectionsMigration() {
  try {
    console.log('🔄 Applying Remote HIS Connections & Sync Logs Migration...');
    const sqlPath = path.join(__dirname, '../database/his_connections_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Remote HIS Connections & Sync Logs Migration applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error applying connections migration:', err);
    process.exit(1);
  }
}

applyConnectionsMigration();
