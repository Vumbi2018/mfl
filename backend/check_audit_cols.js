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

async function run() {
    try {
        console.log("Checking audit_logs columns...");
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'audit_logs'
            ORDER BY column_name;
        `);
        console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
