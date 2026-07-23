const axios = require('axios');

async function testWardCascadeApi() {
  try {
    console.log('🔍 Testing GET /api/facilities/locations for Zambia...');
    const locRes = await axios.get('http://localhost:5002/api/facilities/locations', {
      headers: { 'x-tenant-code': 'zambia' }
    });

    console.log(`✅ Locations response HTTP ${locRes.status}. Total Provinces: ${locRes.data?.length}`);
    if (locRes.data?.length > 0) {
      const p1 = locRes.data[0];
      console.log(`  Province 1: ${p1.name}, Total Districts: ${p1.districts?.length}`);
      if (p1.districts?.length > 0) {
        const d1 = p1.districts[0];
        console.log(`    District 1: ${d1.name}, Total Wards: ${d1.wards?.length}`);
        if (d1.wards?.length > 0) {
          const w1 = d1.wards[0];
          console.log(`      Ward 1: ${w1.name} (id: ${w1.id})`);

          // Test filter facilities by ward_id
          const facRes = await axios.get(`http://localhost:5002/api/facilities?ward_id=${w1.id}`, {
            headers: { 'x-tenant-code': 'zambia' }
          });
          const list = Array.isArray(facRes.data) ? facRes.data : (facRes.data?.data || []);
          console.log(`✅ Filter by ward_id HTTP ${facRes.status}: Facilities in ward ${w1.name} = ${list.length}`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ API Test Error:', err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }
}

testWardCascadeApi();
