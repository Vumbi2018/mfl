const axios = require('axios');

async function debugApiFacilities() {
  try {
    console.log('🔍 Querying live backend server endpoints on http://localhost:5002...');

    // 1. Test GET /api/facilities with x-tenant-code: zambia
    try {
      const res1 = await axios.get('http://localhost:5002/api/facilities', {
        headers: { 'x-tenant-code': 'zambia' }
      });
      console.log(`✅ GET /api/facilities (x-tenant-code: zambia) HTTP ${res1.status}:`, res1.data.data?.length || res1.data?.length || res1.data);
    } catch (e1) {
      console.error(`❌ GET /api/facilities (zambia) failed:`, e1.response?.status, e1.response?.data || e1.message);
    }

    // 2. Test GET /api/facilities/public with x-tenant-code: zambia
    try {
      const res2 = await axios.get('http://localhost:5002/api/facilities/public', {
        headers: { 'x-tenant-code': 'zambia' }
      });
      console.log(`✅ GET /api/facilities/public (x-tenant-code: zambia) HTTP ${res2.status}: Array length = ${res2.data?.length}`);
    } catch (e2) {
      console.error(`❌ GET /api/facilities/public (zambia) failed:`, e2.response?.status, e2.response?.data || e2.message);
    }

    // 3. Test GET /api/facilities/public with x-tenant-code: png
    try {
      const res3 = await axios.get('http://localhost:5002/api/facilities/public', {
        headers: { 'x-tenant-code': 'png' }
      });
      console.log(`✅ GET /api/facilities/public (x-tenant-code: png) HTTP ${res3.status}: Array length = ${res3.data?.length}`);
    } catch (e3) {
      console.error(`❌ GET /api/facilities/public (png) failed:`, e3.response?.status, e3.response?.data || e3.message);
    }

    // 4. Test GET /api/facilities/locations with x-tenant-code: zambia
    try {
      const res4 = await axios.get('http://localhost:5002/api/facilities/locations', {
        headers: { 'x-tenant-code': 'zambia' }
      });
      console.log(`✅ GET /api/facilities/locations (x-tenant-code: zambia) HTTP ${res4.status}: Array length = ${res4.data?.length}`, res4.data.slice(0, 2));
    } catch (e4) {
      console.error(`❌ GET /api/facilities/locations (zambia) failed:`, e4.response?.status, e4.response?.data || e4.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ General error debugging API:', err);
    process.exit(1);
  }
}

debugApiFacilities();
