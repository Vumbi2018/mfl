const pool = require('../db');

async function checkGeom() {
    try {
        const res = await pool.query("SELECT tenant_code, count(*) FROM provinces WHERE geom IS NOT NULL GROUP BY tenant_code");
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkGeom();
