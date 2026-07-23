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

async function listUsers() {
    try {
        const res = await pool.query(`
            SELECT u.id, u.email, u.name, r.name as role 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.id
        `);
        console.log('\n--- REGISTERED USERS ---');
        console.table(res.rows);
        console.log('------------------------\n');
    } catch (err) {
        console.error('Error fetching users:', err.message);
    } finally {
        pool.end();
    }
}

listUsers();
