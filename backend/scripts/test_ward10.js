const axios = require('axios');

async function testWard10() {
  try {
    const res = await axios.get('http://localhost:5002/api/facilities?ward_id=10', {
      headers: { 'x-tenant-code': 'zambia' }
    });
    console.log('HTTP Status:', res.status);
    const data = res.data?.data || res.data;
    console.log(`Facilities count for ward_id=10: ${data.length}`);
    if (data.length > 0) {
      console.log('Sample facility in ward 10:', data[0].name, 'Ward:', data[0].ward);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testWard10();
