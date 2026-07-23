const pool = require('../db');

async function checkCoords() {
    try {
        const res = await pool.query("SELECT count(*) FROM facilities WHERE tenant_code = 'zambia' AND latitude IS NOT NULL AND longitude IS NOT NULL");
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCoords();
