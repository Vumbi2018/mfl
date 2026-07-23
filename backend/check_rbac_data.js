const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkData() {
    try {
        console.log("Checking Roles:");
        const roles = await pool.query('SELECT * FROM roles');
        console.table(roles.rows);

        console.log("\nChecking Permissions:");
        const perms = await pool.query('SELECT * FROM permissions');
        console.table(perms.rows);

        console.log("\nChecking Role_Permissions:");
        const rp = await pool.query('SELECT * FROM role_permissions');
        console.table(rp.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

checkData();
