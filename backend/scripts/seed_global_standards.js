const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function seedGlobals() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log("Seeding Global Standard RBAC Data...");

        // 1. Standard Permissions (NIST/ISO aligned vocabulary)
        // Format: resource:action
        const PERMISSIONS = [
            // User Management
            { slug: 'users:read', description: 'View user profiles and lists' },
            { slug: 'users:create', description: 'Create new user accounts' },
            { slug: 'users:update', description: 'Modify existing user details' },
            { slug: 'users:delete', description: 'Remove or suspend users' },
            { slug: 'users:assign_role', description: 'Assign roles to users' },

            // Facility Registry
            { slug: 'facilities:read', description: 'View facility data' },
            { slug: 'facilities:create', description: 'Register new facilities' },
            { slug: 'facilities:update', description: 'Update facility records' },
            { slug: 'facilities:delete', description: 'Delete facility records' },
            { slug: 'facilities:validate', description: 'Approve pending facility updates' },

            // Groups/Teams
            { slug: 'groups:read', description: 'View organizational groups' },
            { slug: 'groups:manage', description: 'Create and manage groups' },

            // System
            { slug: 'system:config', description: 'Manage system configuration' },
            { slug: 'audit:read', description: 'View audit logs' },
            { slug: 'reports:view', description: 'View analytical reports' }
        ];

        for (const p of PERMISSIONS) {
            await client.query(`
                INSERT INTO permissions (slug, description) 
                VALUES ($1, $2)
                ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
            `, [p.slug, p.description]);
        }
        console.log(`Seeded ${PERMISSIONS.length} Permissions.`);

        // 2. Standard Roles
        const ROLES = [
            { name: 'SUPER_ADMIN', description: 'Full system access' },
            { name: 'SYSTEM_ADMIN', description: 'Technical system management' },
            { name: 'OPS_MANAGER', description: 'Operational management of facilities and users' },
            { name: 'DATA_CLERK', description: 'Data entry and updates' },
            { name: 'AUDITOR', description: 'Read-only access to audit logs' },
            { name: 'VIEWER', description: 'Read-only access to public data' }
        ];

        // Role Mappings (Standard)
        const ROLE_PERM_MAP = {
            'SUPER_ADMIN': PERMISSIONS.map(p => p.slug), // All
            'SYSTEM_ADMIN': ['users:read', 'users:assign_role', 'groups:manage', 'system:config', 'audit:read'],
            'OPS_MANAGER': ['facilities:read', 'facilities:create', 'facilities:update', 'facilities:validate', 'users:read', 'reports:view'],
            'DATA_CLERK': ['facilities:read', 'facilities:update', 'reports:view'],
            'AUDITOR': ['audit:read', 'reports:view'],
            'VIEWER': ['facilities:read']
        };

        for (const r of ROLES) {
            // Create Role
            const roleRes = await client.query(`
                INSERT INTO roles (name, description) 
                VALUES ($1, $2)
                ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
                RETURNING id
            `, [r.name, r.description]);

            const roleId = roleRes.rows[0].id;
            const targetSlugs = ROLE_PERM_MAP[r.name] || [];

            // Assign Permissions
            if (targetSlugs.length > 0) {
                // Get IDs for slugs
                const permIdsRes = await client.query(`SELECT id FROM permissions WHERE slug = ANY($1)`, [targetSlugs]);
                for (const row of permIdsRes.rows) {
                    await client.query(`
                        INSERT INTO role_permissions (role_id, permission_id) 
                        VALUES ($1, $2)
                        ON CONFLICT DO NOTHING
                     `, [roleId, row.id]);
                }
            }
        }
        console.log(`Seeded ${ROLES.length} Roles.`);

        // 3. Standard Groups
        const GROUPS = [
            { name: 'Executive Leadership', code: 'EXEC', desc: 'Top level decision makers' },
            { name: 'National Operations', code: 'NAT_OPS', desc: 'Central operations team' },
            { name: 'Regional Team: Highlands', code: 'REG_HIGH', desc: 'Highlands region coordination' },
            { name: 'Regional Team: Coastal', code: 'REG_COAST', desc: 'Coastal region coordination' },
            { name: 'IT Support', code: 'IT_SUP', desc: 'Technical support staff' }
        ];

        for (const g of GROUPS) {
            await client.query(`
                INSERT INTO groups (name, code, description) 
                VALUES ($1, $2, $3)
                ON CONFLICT (name) DO NOTHING
            `, [g.name, g.code, g.desc]);
        }
        console.log(`Seeded ${GROUPS.length} Groups.`);

        await client.query('COMMIT');
        console.log("Global Standard Seeding Complete.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Seeding Failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

seedGlobals();
