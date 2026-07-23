const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function run() {
    try {
        console.log("Fetching NATIONAL_ADMIN role id...");
        const res = await pool.query("SELECT id FROM roles WHERE name = 'NATIONAL_ADMIN'");
        if (res.rows.length === 0) {
            console.error("Role NATIONAL_ADMIN not found!");
            return;
        }
        const roleId = res.rows[0].id;
        console.log(`Found ID: ${roleId}. Updating users...`);

        const updateRes = await pool.query("UPDATE users SET role_id = $1", [roleId]);
        console.log(`Updated ${updateRes.rowCount} users.`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
