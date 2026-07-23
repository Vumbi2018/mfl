const pool = require('../db');

async function testPublicFacilities() {
  try {
    console.log('🔍 Testing public facilities endpoint queries for both tenants...');
    
    // PNG facilities
    const pngRes = await pool.query(
      `SELECT f.id, f.name, f.type, f.operational_status, f.latitude, f.longitude, d.name as district, p.name as province
       FROM facilities f
       LEFT JOIN districts d ON f.district_id = d.id
       LEFT JOIN provinces p ON d.province_id = p.id
       WHERE f.tenant_code = 'png' LIMIT 5`
    );
    console.log(`✅ PNG Facilities Count in DB:`, (await pool.query("SELECT COUNT(*) FROM facilities WHERE tenant_code='png'")).rows[0].count);
    console.log(`Sample PNG facility:`, pngRes.rows[0]);

    // Zambia facilities
    const zambiaRes = await pool.query(
      `SELECT f.id, f.name, f.type, f.operational_status, f.latitude, f.longitude, d.name as district, p.name as province
       FROM facilities f
       LEFT JOIN districts d ON f.district_id = d.id
       LEFT JOIN provinces p ON d.province_id = p.id
       WHERE f.tenant_code = 'zambia' LIMIT 5`
    );
    console.log(`✅ Zambia Facilities Count in DB:`, (await pool.query("SELECT COUNT(*) FROM facilities WHERE tenant_code='zambia'")).rows[0].count);
    console.log(`Sample Zambia facility:`, zambiaRes.rows[0]);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error testing public facilities:', err);
    process.exit(1);
  }
}

testPublicFacilities();
