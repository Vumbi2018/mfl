const pool = require('../db');

async function checkMissingDistricts() {
    try {
        const res = await pool.query(`
            SELECT id, name, code, province_id
            FROM districts 
            WHERE tenant_code = 'zambia' AND geom IS NULL
        `);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMissingDistricts();
