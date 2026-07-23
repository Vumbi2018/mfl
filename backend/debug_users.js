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

async function debugUsers() {
    try {
        console.log("Checking Users Table...");
        const countRes = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`Total Users: ${countRes.rows[0].count}`);

        const sampleRes = await pool.query('SELECT id, username, role_id, is_national FROM users LIMIT 5');
        console.log("Sample Users:", sampleRes.rows);

        console.log("Checking User Role Management Query...");
        const query = `
            SELECT u.id, u.username, r.name as role
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LIMIT 5
        `;
        const joinRes = await pool.query(query);
        console.log("Join Result:", joinRes.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

debugUsers();
