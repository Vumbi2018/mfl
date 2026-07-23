// ORIGINAL CODE COMMENTED OUT TO PRESERVE COMPATIBILITY
// const { appendTenantFilter } = require('../utils/tenant');

// REPLACEMENT: Added missing imports for pool and bcryptjs to prevent ReferenceError crashes in user management
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { appendTenantFilter } = require('../utils/tenant');

exports.getUsers = async (req, res) => {
    try {
        const params = [];
        const conditions = [];
        
        // Tenant filter
        appendTenantFilter(conditions, params, req.tenantCode, 'u');
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Fetch users with role name and aggregated jurisdictions
        const userQuery = `
            SELECT u.id, u.username, u.email, u.active, u.created_at, u.role_id, 
                   u.first_name, u.last_name, u.phone_number, u.facility_id, u.is_national,
                   u.tenant_code,
                   r.name as role,
                   f.name as facility_name,
                   COALESCE(
                       json_agg(DISTINCT jsonb_build_object(
                           'id', up.permission_id,
                           'slug', p_direct.slug,
                           'is_granted', up.is_granted
                       )) FILTER (WHERE up.id IS NOT NULL),
                       '[]'
                   ) as direct_permissions,
                   COALESCE(
                       json_agg(DISTINCT jsonb_build_object(
                           'id', uj.id,
                           'region_id', uj.region_id,
                           'province_id', uj.province_id,
                           'district_id', uj.district_id,
                           'region_name', reg.name,
                           'province_name', prov.name,
                           'district_name', dist.name
                       )) FILTER (WHERE uj.id IS NOT NULL), 
                       '[]'
                   ) as jurisdictions
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN facilities f ON u.facility_id = f.id
            LEFT JOIN user_jurisdictions uj ON u.id = uj.user_id
            LEFT JOIN regions reg ON uj.region_id = reg.id
            LEFT JOIN provinces prov ON uj.province_id = prov.id
            LEFT JOIN districts dist ON uj.district_id = dist.id
            LEFT JOIN user_permissions up ON u.id = up.user_id
            LEFT JOIN permissions p_direct ON up.permission_id = p_direct.id
            ${whereClause}
            GROUP BY u.id, r.name, f.name
            ORDER BY u.id DESC
            LIMIT 100
        `;
        const userResult = await pool.query(userQuery, params);
        const users = userResult.rows;

        // Fetch permissions for each role
        const permQuery = `
            SELECT rp.role_id, p.slug, p.description 
            FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id
        `;
        const permResult = await pool.query(permQuery);

        const rolePermMap = {};
        permResult.rows.forEach(row => {
            if (!rolePermMap[row.role_id]) rolePermMap[row.role_id] = [];
            rolePermMap[row.role_id].push({ slug: row.slug, description: row.description });
        });

        // Attach permissions
        const usersWithPerms = users.map(user => ({
            ...user,
            permissions: rolePermMap[user.role_id] || []
        }));

        res.status(200).json(usersWithPerms);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching users");
    }
};

const AuditService = require('../services/audit.service');

// ...

exports.createUser = async (req, res) => {
    const client = await pool.connect();
    try {
        // ... (existing destructuring)
        const {
            username, email, password, role_id,
            first_name, last_name, phone_number, facility_id, is_national,
            jurisdictions, // Array of locations
            permissions // Array of { permission_id, is_granted }
        } = req.body;

        if (!email || !password || !role_id) {
            return res.status(400).json({ error: "Email, Password, and Role are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query('BEGIN');

        const insertUserText = `
            INSERT INTO users (
                username, email, password_hash, role_id, 
                first_name, last_name, phone_number, facility_id, is_national, active, tenant_code
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, username, email, role_id, created_at, tenant_code
        `;

        const userValues = [
            username || email.split('@')[0],
            email,
            hashedPassword,
            role_id,
            first_name || null,
            last_name || null,
            phone_number || null,
            facility_id || null,
            is_national || false,
            req.body.active !== false, // Default true
            req.tenantCode
        ];

        const result = await client.query(insertUserText, userValues);
        const newUser = result.rows[0];

        // Insert Jurisdictions
        if (jurisdictions && Array.isArray(jurisdictions) && jurisdictions.length > 0 && !is_national) {
            for (const jur of jurisdictions) {
                await client.query(`
                    INSERT INTO user_jurisdictions (user_id, region_id, province_id, district_id)
                    VALUES ($1, $2, $3, $4)
                `, [newUser.id, jur.region_id || null, jur.province_id || null, jur.district_id || null]);
            }
        }

        // Insert Direct Permissions
        if (permissions && Array.isArray(permissions) && permissions.length > 0) {
            for (const perm of permissions) {
                await client.query(`
                    INSERT INTO user_permissions (user_id, permission_id, is_granted)
                    VALUES ($1, $2, $3)
                `, [newUser.id, perm.permission_id, perm.is_granted]);
            }
        }

        await client.query('COMMIT');

        // Audit Log (Post-Commit)
        await AuditService.log({
            userId: req.user ? req.user.id : null, // The admin who created this user
            action: 'CREATE',
            entityType: 'USERS',
            entityId: newUser.id,
            changes: { ...newUser, password_hash: 'REDACTED' },
            details: { jurisdictions: jurisdictions?.length || 0, permissions: permissions?.length || 0 },
            req
        });

        res.status(201).json(newUser);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.updateUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const updates = req.body;

        // Allowed fields
        const allowed = [
            'username', 'email', 'role_id', 'active',
            'first_name', 'last_name', 'phone_number', 'facility_id', 'is_national'
        ];

        // Separate jurisdictions and permissions
        const { jurisdictions, permissions } = updates;

        const filled = Object.keys(updates).filter(k => allowed.includes(k));

        if (filled.length === 0 && !updates.password && !jurisdictions && !permissions) {
            return res.status(400).json({ error: "No fields to update" });
        }

        await client.query('BEGIN');

        // Handle password separately
        if (updates.password) {
            const hashedPassword = await bcrypt.hash(updates.password, 10);
            await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, id]);
        }

        if (filled.length > 0) {
            const setClause = filled.map((k, i) => `${k} = $${i + 2}`).join(', ');
            const values = [id, ...filled.map(k => updates[k])];
            await client.query(`UPDATE users SET ${setClause} WHERE id = $1 AND tenant_code = '${req.tenantCode}'`, values);
        }

        // Handle Jurisdictions (Replace all)
        if (typeof jurisdictions !== 'undefined') {
            // Delete existing
            await client.query('DELETE FROM user_jurisdictions WHERE user_id = $1', [id]);

            // Insert new if not national and array exists
            if (updates.is_national !== true && Array.isArray(jurisdictions) && jurisdictions.length > 0) {
                for (const jur of jurisdictions) {
                    await client.query(`
                        INSERT INTO user_jurisdictions (user_id, region_id, province_id, district_id)
                        VALUES ($1, $2, $3, $4)
                    `, [id, jur.region_id || null, jur.province_id || null, jur.district_id || null]);
                }
            }
        }

        // Handle Permissions (Replace all)
        if (typeof permissions !== 'undefined') {
            await client.query('DELETE FROM user_permissions WHERE user_id = $1', [id]);
            if (Array.isArray(permissions) && permissions.length > 0) {
                for (const perm of permissions) {
                    await client.query(`
                        INSERT INTO user_permissions (user_id, permission_id, is_granted)
                        VALUES ($1, $2, $3)
                    `, [id, perm.permission_id, perm.is_granted]);
                }
            }
        }

        await client.query('COMMIT');

        // Return updated user (basic)
        const updatedUser = await client.query('SELECT id, username, email, role_id, active FROM users WHERE id = $1', [id]);
        res.status(200).json(updatedUser.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(200).json({ message: "User deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
