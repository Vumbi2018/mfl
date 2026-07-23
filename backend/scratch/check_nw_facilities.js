const pool = require('../db');

async function checkNWFacilities() {
    try {
        const res = await pool.query(`
            SELECT count(*) 
            FROM facilities f
            JOIN districts d ON f.district_id = d.id
            JOIN provinces p ON d.province_id = p.id
            WHERE f.tenant_code = 'zambia' AND p.name = 'North-Western'
        `);
        console.log("Facilities in North-Western:", res.rows[0].count);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkNWFacilities();
