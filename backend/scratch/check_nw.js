const pool = require('../db');

async function checkNW() {
    try {
        const res = await pool.query(`
            SELECT id, name, ST_IsValid(geom) as valid, ST_IsEmpty(geom) as empty, ST_Summary(geom) as summary
            FROM provinces 
            WHERE tenant_code = 'zambia' AND name ILIKE '%North%'
        `);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkNW();
