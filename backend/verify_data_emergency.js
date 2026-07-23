const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function verifyData() {
    try {
        console.log(`Connected to: ${process.env.DB_NAME} on ${process.env.DB_PORT}`);

        const tables = ['users', 'roles', 'permissions', 'groups', 'role_permissions', 'user_groups'];

        console.log("--- TABLE COUNTS ---");
        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${table}: ERROR - ${e.message}`);
            }
        }

    } catch (err) {
        console.error("Connection Error:", err);
    } finally {
        pool.end();
    }
}

verifyData();
