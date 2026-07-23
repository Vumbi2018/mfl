const pool = require('../db');

async function findWardWithFacilities() {
  try {
    const res = await pool.query(`
      SELECT f.ward_id, w.name as ward_name, d.name as district_name, p.name as province_name, COUNT(f.id) as facility_count
      FROM facilities f
      JOIN wards w ON f.ward_id = w.id
      JOIN districts d ON w.district_id = d.id
      JOIN provinces p ON d.province_id = p.id
      WHERE f.tenant_code = 'zambia'
      GROUP BY f.ward_id, w.name, d.name, p.name
      LIMIT 5;
    `);

    console.log('Sample Wards with linked facilities:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findWardWithFacilities();
