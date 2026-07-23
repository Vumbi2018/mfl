const pool = require('../db');

async function checkWardsAndFacilities() {
  try {
    const wardCount = await pool.query('SELECT count(*) FROM wards');
    console.log(`Wards total count: ${wardCount.rows[0].count}`);

    const wardsSample = await pool.query('SELECT id, name, code, district_id FROM wards LIMIT 5');
    console.log('Sample wards:', wardsSample.rows);

    const facWardCount = await pool.query('SELECT count(*) FROM facilities WHERE ward_id IS NOT NULL');
    console.log(`Facilities with ward_id set: ${facWardCount.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error('Error checking wards:', err);
    process.exit(1);
  }
}

checkWardsAndFacilities();
