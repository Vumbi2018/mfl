const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkDistinct() {
    try {
        const types = await pool.query('SELECT DISTINCT type FROM facilities ORDER BY type');
        const statuses = await pool.query('SELECT DISTINCT operational_status FROM facilities ORDER BY operational_status');

        console.log(`\n--- FACILITY TYPES ---`);
        types.rows.forEach(r => console.log(r.type));

        console.log(`\n--- OPERATIONAL STATUSES ---`);
        statuses.rows.forEach(r => console.log(r.operational_status));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkDistinct();
