const pool = require('./backend/db');

async function test() {
  try {
    console.log("Testing facility_types query...");
    const res1 = await pool.query(`
      SELECT id, code, name, description, level, can_admit, typical_beds_min, typical_beds_max
      FROM facility_types
      WHERE active = true
      ORDER BY level, name
    `);
    console.log("facility_types success:", res1.rows.length);
  } catch (e) {
    console.error("facility_types ERROR:", e.message);
  }

  try {
    console.log("Testing service_types query...");
    const res2 = await pool.query(`
      SELECT id, code, category, name, description, who_service_package, requires_certification
      FROM service_types
      WHERE active = true
      ORDER BY category, name
    `);
    console.log("service_types success:", res2.rows.length);
  } catch (e) {
    console.error("service_types ERROR:", e.message);
  }
}

test();
