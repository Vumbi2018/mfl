const pool = require('../db');

async function checkNWBounds() {
    try {
        const res = await pool.query(`
            SELECT id, name, ST_XMin(geom) as xmin, ST_YMin(geom) as ymin, ST_XMax(geom) as xmax, ST_YMax(geom) as ymax
            FROM provinces 
            WHERE tenant_code = 'zambia' AND name = 'North-Western'
        `);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkNWBounds();
