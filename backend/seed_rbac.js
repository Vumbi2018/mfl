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

const ROLES = [
    { name: 'NATIONAL_ADMIN', description: 'Full access to all data across the nation.' },
    { name: 'PROVINCIAL_ADMIN', description: 'Access restricted to assigned province.' },
    { name: 'DISTRICT_ADMIN', description: 'Access restricted to assigned district.' },
    { name: 'FACILITY_OFFICER', description: 'Access restricted to assigned facility.' },
    { name: 'PUBLIC_VIEWER', description: 'Read-only access to public data.' }
];

const PERMISSIONS = [
    { slug: 'view_national', description: 'View national level aggregates and data.' },
    { slug: 'view_province', description: 'View provincial level aggregates and data.' },
    { slug: 'view_district', description: 'View district level aggregates and data.' },
    { slug: 'manage_users', description: 'Create, update, and delete users within scope.' },
    { slug: 'manage_facilities', description: 'Create and update facility details.' },
    { slug: 'approve_facilities', description: 'Approve facility workflow requests.' },
    { slug: 'delete_facilities', description: 'Soft or hard delete facilities.' },
    { slug: 'view_audit_logs', description: 'View system audit logs.' },
    { slug: 'manage_reference_data', description: 'Manage system reference tables (Facility Types, etc).' }
];

const ROLE_PERMISSIONS = {
    'NATIONAL_ADMIN': ['view_national', 'view_province', 'view_district', 'manage_users', 'manage_facilities', 'approve_facilities', 'delete_facilities', 'view_audit_logs', 'manage_reference_data'],
    'PROVINCIAL_ADMIN': ['view_province', 'view_district', 'manage_users', 'manage_facilities', 'approve_facilities', 'view_audit_logs'],
    'DISTRICT_ADMIN': ['view_district', 'manage_users', 'manage_facilities', 'approve_facilities'],
    'FACILITY_OFFICER': ['manage_facilities'],
    'PUBLIC_VIEWER': []
};

async function seed() {
    try {
        console.log('Seeding RBAC...');

        // 1. Roles
        for (const role of ROLES) {
            await pool.query(`
                INSERT INTO roles (name, description) 
                VALUES ($1, $2) 
                ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
            `, [role.name, role.description]);
        }
        console.log('Roles seeded.');

        // 2. Permissions
        for (const perm of PERMISSIONS) {
            await pool.query(`
                INSERT INTO permissions (slug, description) 
                VALUES ($1, $2) 
                ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
            `, [perm.slug, perm.description]);
        }
        console.log('Permissions seeded.');

        // 3. Role Permissions
        // Clear existing to ensure clean slate or just append? 
        // Better to clear and re-link to match the source of truth here.
        await pool.query('TRUNCATE role_permissions');

        for (const [roleName, slugs] of Object.entries(ROLE_PERMISSIONS)) {
            const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
            if (roleRes.rows.length === 0) continue;
            const roleId = roleRes.rows[0].id;

            for (const slug of slugs) {
                const permRes = await pool.query('SELECT id FROM permissions WHERE slug = $1', [slug]);
                if (permRes.rows.length === 0) continue;
                const permId = permRes.rows[0].id;

                await pool.query(`
                    INSERT INTO role_permissions (role_id, permission_id) 
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [roleId, permId]);
            }
        }
        console.log('Role Permissions seeded.');

        // 4. Update Schema (Add region/province to users) - Check if exists first
        console.log('Checking User Schema...');
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='province_id') THEN 
                    ALTER TABLE users ADD COLUMN province_id INT REFERENCES provinces(id); 
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='region_id') THEN 
                    ALTER TABLE users ADD COLUMN region_id INT REFERENCES regions(id); 
                END IF;
            END $$;
        `);
        console.log('User schema updated (if needed).');

    } catch (err) {
        console.error('Error seeding RBAC:', err);
    } finally {
        await pool.end();
    }
}

seed();
