const pool = require('../db');

async function finalAudit() {
    try {
        const res = await pool.query(`
            SELECT p.name as province, count(d.id) as district_count, 
                   count(d.geom) as districts_with_geom
            FROM provinces p
            LEFT JOIN districts d ON d.province_id = p.id
            WHERE p.tenant_code = 'zambia'
            GROUP BY p.name
            ORDER BY p.name
        `);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

finalAudit();
