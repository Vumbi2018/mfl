const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function seedAuth() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Roles
        const roles = ['ADMIN', 'APPROVER', 'VIEWER', 'FACILITY_OFFICER'];
        for (const r of roles) {
            await client.query('INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [r]);
        }

        // 2. Default Admin User
        const adminEmail = 'admin@admin.com';
        const adminPass = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPass, 10);

        // Get Admin Role ID
        const roleRes = await client.query("SELECT id FROM roles WHERE name = 'ADMIN'");
        const roleId = roleRes.rows[0].id;

        const userQuery = `
            INSERT INTO users (username, email, password_hash, role_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO NOTHING
        `;
        await client.query(userQuery, ['admin', adminEmail, hashedPassword, roleId]);

        console.log('Auth seeding completed. Admin: admin@admin.com / admin123');
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Auth seeding error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seedAuth();
