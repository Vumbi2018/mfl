const pool = require('../db');

async function checkOrphans() {
    try {
        const res = await pool.query(`
            SELECT count(*) 
            FROM districts d
            WHERE d.tenant_code = 'zambia' 
            AND d.province_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM provinces p WHERE p.id = d.province_id)
        `);
        console.log("Orphaned districts:", res.rows[0].count);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOrphans();
