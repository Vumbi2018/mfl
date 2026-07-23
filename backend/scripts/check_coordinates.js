const pool = require('../db');

async function checkCoordinates() {
  try {
    console.log('🔍 Inspecting GPS Coordinates per Tenant...');

    const zambiaGps = await pool.query(
      `SELECT COUNT(*) FROM facilities WHERE tenant_code = 'zambia' AND latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    console.log(`📊 Zambia facilities WITH GPS coordinates: ${zambiaGps.rows[0].count} / 2827`);

    const zambiaNoGps = await pool.query(
      `SELECT COUNT(*) FROM facilities WHERE tenant_code = 'zambia' AND (latitude IS NULL OR longitude IS NULL)`
    );
    console.log(`📊 Zambia facilities WITHOUT GPS coordinates: ${zambiaNoGps.rows[0].count} / 2827`);

    const pngGps = await pool.query(
      `SELECT COUNT(*) FROM facilities WHERE tenant_code = 'png' AND latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    console.log(`📊 PNG facilities WITH GPS coordinates: ${pngGps.rows[0].count} / 4829`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error checking GPS coordinates:', err);
    process.exit(1);
  }
}

checkCoordinates();
