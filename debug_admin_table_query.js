const pool = require('./backend/db');
const { appendTenantFilter } = require('./backend/utils/tenant');

async function testTable(tableName, tenantCode = 'zambia') {
  try {
    const params = [];
    const conditions = [];
    
    const colCheck = await pool.query(
        "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'tenant_code'",
        [tableName]
    );
    
    if (colCheck.rows.length > 0) {
        appendTenantFilter(conditions, params, tenantCode, '');
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM ${tableName} ${whereClause} ORDER BY id ASC LIMIT 1000`;
    console.log(`Executing SQL for ${tableName}:`, sql, "Params:", params);
    
    const result = await pool.query(sql, params);
    console.log(`Success for ${tableName}: ${result.rows.length} rows`);
  } catch (err) {
    console.error(`ERROR for ${tableName}:`, err.message);
  }
}

async function run() {
  const tables = ['facility_types', 'regions', 'provinces', 'districts', 'roles', 'permissions', 'groups'];
  for (const t of tables) {
    await testTable(t);
  }
}

run();
