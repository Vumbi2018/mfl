const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend directory
// Script is in /scripts, so .env is in ../.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function setup() {
    const client = await pool.connect();
    try {
        console.log("Setting up Advanced RBAC & LBAC Schema...");

        await client.query('BEGIN');

        // 1. Groups Table (Organization Units / Teams)
        await client.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                code VARCHAR(50) UNIQUE, 
                description TEXT,
                parent_id INTEGER REFERENCES groups(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. User <-> Groups (Membership)
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_groups (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, group_id)
            );
        `);

        // 3. Group <-> Roles (Functional Authorities)
        await client.query(`
            CREATE TABLE IF NOT EXISTS group_roles (
                group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (group_id, role_id)
            );
        `);

        // 4. User <-> Roles (Direct Functional Authorities - Overrides/Additions to Group roles)
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, role_id)
            );
        `);

        // 5. Group <-> Jurisdictions (LBAC for Groups)
        // If a user belongs to this group, they inherit these locations.
        await client.query(`
            CREATE TABLE IF NOT EXISTS group_jurisdictions (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
                region_id INTEGER REFERENCES regions(id),
                province_id INTEGER REFERENCES provinces(id),
                district_id INTEGER REFERENCES districts(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. Migrate existing single-role users to user_roles table
        console.log("Migrating legacy single-role entries...");
        const users = await client.query("SELECT id, role_id FROM users WHERE role_id IS NOT NULL");
        for (const user of users.rows) {
            await client.query(`
                INSERT INTO user_roles (user_id, role_id) 
                VALUES ($1, $2) 
                ON CONFLICT (user_id, role_id) DO NOTHING
            `, [user.id, user.role_id]);
        }

        // 7. Seed Data
        console.log("Seeding initial Group data...");

        // Example Group: National Monitoring Team
        const groupRes = await client.query(`
            INSERT INTO groups (name, code, description)
            VALUES ('National Monitoring Team', 'NAT_MON', 'Responsible for national level data quality monitoring')
            ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
            RETURNING id;
        `);
        const natGroupId = groupRes.rows[0].id;

        // Assign 'PUBLIC_VIEWER' and maybe a new 'DATA_QUALITY_ANALYST' role if we had one.
        // For now, let's assign NATIONAL_ADMIN role to this group for testing.
        const roleRes = await client.query("SELECT id FROM roles WHERE name = 'NATIONAL_ADMIN'");
        if (roleRes.rows.length > 0) {
            await client.query(`
                INSERT INTO group_roles (group_id, role_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [natGroupId, roleRes.rows[0].id]);
        }

        await client.query('COMMIT');
        console.log("Advanced RBAC/LBAC Setup Complete.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Setup failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
