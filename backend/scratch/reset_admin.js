const bcrypt = require('bcryptjs');
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

async function resetPassword() {
    try {
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        
        const res = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE email = 'admin@ccets.pg' RETURNING username",
            [hash]
        );
        
        if (res.rowCount > 0) {
            console.log(`Password reset successfully for user: ${res.rows[0].username}`);
        } else {
            console.log('User admin@ccets.pg not found');
        }
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await pool.end();
    }
}

resetPassword();
