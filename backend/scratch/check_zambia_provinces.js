const pool = require('../db');

async function checkProvinces() {
    try {
        const res = await pool.query("SELECT id, name, code, (geom IS NOT NULL) as has_geom FROM provinces WHERE tenant_code = 'zambia'");
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProvinces();
