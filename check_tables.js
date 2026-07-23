const pool = require('./backend/db');

async function inspect() {
  try {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'facility_types'
    `);
    console.log("facility_types columns:", cols.rows);

    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("All tables:", tables.rows.map(r => r.table_name));
  } catch (e) {
    console.error("Inspect error:", e);
  }
}

inspect();
