const pool = require('../db');

async function checkDistrictsMapping() {
    try {
        const res = await pool.query(`
            SELECT d.id, d.name, d.province_id, p.name as province_name 
            FROM districts d
            LEFT JOIN provinces p ON d.province_id = p.id
            WHERE d.tenant_code = 'zambia'
            LIMIT 20
        `);
        console.table(res.rows);
        
        const nullProv = await pool.query("SELECT count(*) FROM districts WHERE tenant_code = 'zambia' AND province_id IS NULL");
        console.log("Districts with NULL province_id:", nullProv.rows[0].count);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDistrictsMapping();
