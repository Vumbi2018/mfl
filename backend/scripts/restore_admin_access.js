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

async function fixAdmin() {
    try {
        console.log("Fixing Admin Access...");

        // 1. Force is_national = true for the main admin
        await pool.query('UPDATE users SET is_national = true WHERE id = 1');

        // 2. Ensure role 5 (from verify output) is 'SYSTEM_ADMIN' or similar powerful role
        // Check what role 5 is
        const roleRes = await pool.query('SELECT * FROM roles WHERE id = 5');
        console.log("Role 5 is:", roleRes.rows[0]);

        console.log("Admin fixed. is_national set to TRUE.");

    } catch (err) {
        console.error("Fix failed:", err);
    } finally {
        pool.end();
    }
}

fixAdmin();
