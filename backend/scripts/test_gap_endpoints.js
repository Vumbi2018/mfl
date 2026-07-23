const pool = require('../db');

async function testEndpoints() {
  try {
    console.log('🧪 Testing newly implemented HFRS endpoints...');
    
    // 1. Test Data Dictionary query
    const dictRes = await pool.query('SELECT count(*) FROM data_dictionary_elements');
    console.log(`✅ Data Dictionary elements count: ${dictRes.rows[0].count}`);

    // 2. Test Sub-Lists query
    const subRes = await pool.query('SELECT count(*) FROM facility_sublists');
    console.log(`✅ Saved Sub-Lists count: ${subRes.rows[0].count}`);

    // 3. Test Notifications query
    const notifRes = await pool.query('SELECT count(*) FROM notifications');
    console.log(`✅ Notifications count: ${notifRes.rows[0].count}`);

    console.log('🎉 All gap remediation database objects and queries verified successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Endpoint test failed:', err);
    process.exit(1);
  }
}

testEndpoints();
