const { Pool } = require('pg');
const dotenv = require('dotenv');
// Do NOT import server or other local modules that might trigger side effects

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
        console.log("--- DB DIAGNOSTIC START ---");

        // 1. Count Facilities
        const res = await pool.query('SELECT COUNT(*) FROM facilities');
        console.log("Total Facilities in DB:", res.rows[0].count);

        // 2. Sample Facilities (Check status)
        const sample = await pool.query('SELECT id, name, operational_status FROM facilities LIMIT 5');
        console.log("Sample Facilities:", sample.rows);

        // 3. Check Admin User
        const admin = await pool.query('SELECT id, username, is_national FROM users WHERE id = 1');
        console.log("Admin User:", admin.rows[0]);

        console.log("--- DB DIAGNOSTIC END ---");
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        pool.end();
    }
}

run();
