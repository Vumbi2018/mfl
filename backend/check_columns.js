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

async function check() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'user_jurisdictions';
        `);

        if (res.rows.length > 0) {
            console.log("SUCCESS: user_jurisdictions table exists.");
        } else {
            console.log("FAILURE: user_jurisdictions table MISSING.");
        }

        const res2 = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        const cols = res2.rows.map(r => r.column_name);
        console.log("Columns:", JSON.stringify(cols));
        const requiredColumns = [
            'username', 'email', 'password_hash', 'role_id',
            'first_name', 'last_name', 'phone_number', 'facility_id', 'is_national'
        ];

        const missing = requiredColumns.filter(col => !cols.includes(col));

        if (missing.length === 0) {
            console.log("SUCCESS: All required columns exist:", requiredColumns.join(', '));
        } else {
            console.log("FAILURE: Missing columns:", missing.join(', '));
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

check();
