const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkData() {
    try {
        console.log("--- DATA INTEGRITY CHECK ---");

        const facilities = await pool.query('SELECT COUNT(*) FROM facilities');
        console.log(`Facilities Count: ${facilities.rows[0].count}`);

        const users = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`Users Count: ${users.rows[0].count}`);

        const admin = await pool.query('SELECT id, username, is_national, role_id FROM users WHERE id = 1');
        console.log("Admin User State:", admin.rows[0]);

        console.log("----------------------------");

    } catch (err) {
        console.error("Check failed:", err);
    } finally {
        pool.end();
    }
}

checkData();
