const pool = require('../db');

async function checkFacilityNames() {
    try {
        const res = await pool.query(`
            SELECT f.name, p.name as province_name, d.name as district_name
            FROM facilities f
            JOIN districts d ON f.district_id = d.id
            JOIN provinces p ON d.province_id = p.id
            WHERE f.tenant_code = 'zambia'
            LIMIT 10
        `);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkFacilityNames();
