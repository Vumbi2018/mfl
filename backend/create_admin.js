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

async function createAdmin() {
    try {
        const email = 'admin@health.gov';
        const rawPassword = 'admin@12345';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);
        const username = 'admin';

        // 1. Ensure 'Administrator' role exists
        let roleId;
        const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'Administrator'");
        if (roleRes.rows.length > 0) {
            roleId = roleRes.rows[0].id;
        } else {
            console.log("Creating Administrator role...");
            const insertRole = await pool.query("INSERT INTO roles (name, description) VALUES ('Administrator', 'Full System Access') RETURNING id");
            roleId = insertRole.rows[0].id;
        }

        // 2. Create/Update user
        // Check if user exists first
        const userRes = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        let query;
        if (userRes.rows.length > 0) {
             query = `
                UPDATE users SET 
                    password_hash = $3,
                    role_id = $4,
                    email = $2,
                    active = true
                WHERE username = $1
                RETURNING id, email, username;
            `;
        } else {
             query = `
                INSERT INTO users (username, email, password_hash, role_id, active)
                VALUES ($1, $2, $3, $4, true)
                RETURNING id, email, username;
            `;
        }

        const res = await pool.query(query, [username, email, hashedPassword, roleId]);
        console.log(`\n✅ Admin user created/updated successfully!`);
        console.log(`   Email: ${res.rows[0].email}`);
        console.log(`   Username: ${res.rows[0].username}`);
        console.log(`   Password: ${rawPassword}\n`);

    } catch (err) {
        console.error('Error creating admin user:', err);
    } finally {
        pool.end();
    }
}

createAdmin();
