const axios = require('axios');
const pool = require('../db');

async function debugLevel4GeoJson() {
  try {
    console.log('🔍 Debugging Level 4 Wards GeoJSON...');

    // DB query
    const dbRes = await pool.query(
      `SELECT count(*) FROM wards WHERE tenant_code = 'zambia' AND geom IS NOT NULL`
    );
    console.log(`📊 Wards with geom IS NOT NULL in DB (zambia): ${dbRes.rows[0].count}`);

    const nullGeomRes = await pool.query(
      `SELECT count(*) FROM wards WHERE tenant_code = 'zambia' AND geom IS NULL`
    );
    console.log(`📊 Wards with geom IS NULL in DB (zambia): ${nullGeomRes.rows[0].count}`);

    // Test API endpoint
    try {
      const apiRes = await axios.get('http://localhost:5002/api/spatial/level4', {
        headers: { 'x-tenant-code': 'zambia' }
      });
      console.log(`✅ GET /api/spatial/level4 HTTP ${apiRes.status}: Features count = ${apiRes.data?.features?.length}`);
      if (apiRes.data?.features?.length > 0) {
        console.log('Sample Level 4 feature:', JSON.stringify(apiRes.data.features[0], null, 2));
      }
    } catch (apiErr) {
      console.error('❌ API endpoint GET /api/spatial/level4 error:', apiErr.response?.status, apiErr.response?.data || apiErr.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error debugging level4 GeoJSON:', err);
    process.exit(1);
  }
}

debugLevel4GeoJson();
