const pool = require('../db');

async function checkDistricts() {
    try {
        const res = await pool.query("SELECT count(*), (geom IS NOT NULL) as has_geom FROM districts WHERE tenant_code = 'zambia' GROUP BY has_geom");
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDistricts();
