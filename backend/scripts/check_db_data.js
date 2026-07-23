const pool = require('../db');

async function checkDatabaseData() {
  try {
    console.log('🔍 Checking PostgreSQL Database Data Safety...');
    
    // Facilities count
    const facRes = await pool.query('SELECT count(*) FROM facilities');
    console.log(`📊 Total Facilities in DB: ${facRes.rows[0].count}`);

    // Facilities per tenant_code
    const tenantFacRes = await pool.query('SELECT tenant_code, count(*) FROM facilities GROUP BY tenant_code');
    console.log('📊 Facilities per tenant_code:', tenantFacRes.rows);

    // Provinces count & breakdown
    const provRes = await pool.query('SELECT tenant_code, count(*) FROM provinces GROUP BY tenant_code');
    console.log('📊 Provinces per tenant_code:', provRes.rows);

    // Districts count & breakdown
    const distRes = await pool.query('SELECT tenant_code, count(*) FROM districts GROUP BY tenant_code');
    console.log('📊 Districts per tenant_code:', distRes.rows);

    // Tenants table
    const tenantRes = await pool.query('SELECT * FROM tenants');
    console.log('📊 Tenants in database:', tenantRes.rows);

    // Users table count
    const userRes = await pool.query('SELECT count(*) FROM users');
    console.log(`📊 Total Users in DB: ${userRes.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error checking database data:', err);
    process.exit(1);
  }
}

checkDatabaseData();
