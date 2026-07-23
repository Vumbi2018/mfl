// ORIGINAL CODE COMMENTED OUT TO PRESERVE COMPATIBILITY
// const { Pool } = require('pg');
// const dotenv = require('dotenv');
// 
// dotenv.config();
// 
// const pool = new Pool({
//     user: process.env.DB_USER || 'postgres',
//     host: process.env.DB_HOST || 'localhost',
//     database: process.env.DB_NAME || 'mfl_db',
//     password: process.env.DB_PASSWORD || 'password',
//     port: process.env.DB_PORT || 5432,
// });

// REPLACEMENT: Use standardized central pool configuration to support production environment settings
const pool = require('../db');

const { appendTenantFilter } = require('../utils/tenant');

const ALLOWED_TABLES = [
    'facility_types',
    'regions',
    'provinces',
    'districts',
    'roles',
    'permissions',
    'groups',
    'group_jurisdictions',
    'group_roles',
    'role_permissions',
    'user_groups',
    'tickets',
    'user_jurisdictions',
    'user_permissions',
    'user_roles',
    'users',
    'tenants',
    'tenant_settings',
    'audit_logs',
    'workflow_logs',
    'facility_versions',
    'facility_sublists',
    'data_dictionary_elements',
    'notifications',
    'archived_facilities',
    'hfml_releases',
    'api_keys',
    'interop_logs',
    'his_connections',
    'his_sync_logs',
    'wards',
    'service_types',
    'llgs',
    'facilities',
    'facility_services',
    'facility_identifiers',
    'verification_cycles',
    'facility_verifications',
    'health_offices'
];

exports.getTables = async (req, res) => {
    res.status(200).json(ALLOWED_TABLES);
};

exports.getTableData = async (req, res) => {
    const { tableName } = req.params;
    if (!ALLOWED_TABLES.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
    }

    try {
        const params = [];
        const conditions = [];
        
        // Tenant filter (Check if table has tenant_code column)
        const colCheck = await pool.query(
            "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'tenant_code'",
            [tableName]
        );
        
        if (colCheck.rows.length > 0) {
            if (tableName === 'facility_types') {
                params.push(req.tenantCode);
                conditions.push(`(tenant_code = $${params.length} OR tenant_code IS NULL OR tenant_code = 'png' OR tenant_code = 'global')`);
            } else {
                appendTenantFilter(conditions, params, req.tenantCode, '');
            }
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await pool.query(`SELECT * FROM ${tableName} ${whereClause} ORDER BY id ASC LIMIT 1000`, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(`Error fetching data for ${tableName}:`, err);
        res.status(500).json({ error: err.message || "Database error" });
    }

};

exports.createTableRow = async (req, res) => {
    const { tableName } = req.params;
    const data = req.body;

    if (!ALLOWED_TABLES.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
    }

    try {
        const columns = Object.keys(data).filter(key => key !== 'id');
        
        // Add tenant_code if applicable
        const colCheck = await pool.query(
            "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'tenant_code'",
            [tableName]
        );
        
        if (colCheck.rows.length > 0 && !columns.includes('tenant_code')) {
            columns.push('tenant_code');
            data['tenant_code'] = req.tenantCode;
        }

        const values = columns.map(col => data[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
            INSERT INTO ${tableName} (${columns.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `;

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(`Error creating row in ${tableName}:`, err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateTableRow = async (req, res) => {
    const { tableName, id } = req.params;
    const updates = req.body;

    if (!ALLOWED_TABLES.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
    }

    try {
        const columns = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at' && key !== 'tenant_code');

        if (columns.length === 0) return res.status(400).json({ error: "No fields to update" });

        const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
        const values = [id, ...columns.map(col => updates[col])];

        // Tenant filter
        const colCheck = await pool.query(
            "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'tenant_code'",
            [tableName]
        );
        
        let tenantClause = "";
        if (colCheck.rows.length > 0) {
            values.push(req.tenantCode);
            tenantClause = `AND tenant_code = $${values.length}`;
        }

        const query = `
            UPDATE ${tableName}
            SET ${setClause}
            WHERE id = $1 ${tenantClause}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`Error updating row in ${tableName}:`, err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTableRow = async (req, res) => {
    const { tableName, id } = req.params;

    if (!ALLOWED_TABLES.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
    }

    try {
        const colCheck = await pool.query(
            "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'tenant_code'",
            [tableName]
        );
        
        let tenantClause = "";
        const params = [id];
        if (colCheck.rows.length > 0) {
            params.push(req.tenantCode);
            tenantClause = `AND tenant_code = $2`;
        }

        await pool.query(`DELETE FROM ${tableName} WHERE id = $1 ${tenantClause}`, params);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        console.error(`Error deleting row in ${tableName}:`, err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================
// ROLE PERMISSIONS MANAGEMENT
// ============================================

// Get all role permissions as a map { roleId: [permissionSlugs] }
exports.getAllRolePermissions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rp.role_id, p.slug 
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            ORDER BY rp.role_id
        `);

        // Build a map of roleId -> [slugs]
        const rolePermMap = {};
        result.rows.forEach(row => {
            if (!rolePermMap[row.role_id]) {
                rolePermMap[row.role_id] = [];
            }
            rolePermMap[row.role_id].push(row.slug);
        });

        res.status(200).json(rolePermMap);
    } catch (err) {
        console.error("Error fetching role permissions:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get permissions for a specific role
exports.getRolePermissions = async (req, res) => {
    const { roleId } = req.params;

    try {
        const result = await pool.query(`
            SELECT p.slug 
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = $1
        `, [roleId]);

        const slugs = result.rows.map(r => r.slug);
        res.status(200).json(slugs);
    } catch (err) {
        console.error(`Error fetching permissions for role ${roleId}:`, err);
        res.status(500).json({ error: err.message });
    }
};

// Set permissions for a role (replaces all existing)
exports.setRolePermissions = async (req, res) => {
    const { roleId } = req.params;
    const { permissions } = req.body; // Array of permission slugs

    if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: "permissions must be an array of slugs" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Delete existing permissions for this role
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

        // Insert new permissions
        if (permissions.length > 0) {
            for (const slug of permissions) {
                // Get permission ID by slug
                const permRes = await client.query(
                    'SELECT id FROM permissions WHERE slug = $1',
                    [slug]
                );

                if (permRes.rows.length > 0) {
                    await client.query(
                        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [roleId, permRes.rows[0].id]
                    );
                }
            }
        }

        await client.query('COMMIT');

        // Return updated permissions
        const result = await pool.query(`
            SELECT p.slug 
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = $1
        `, [roleId]);

        res.status(200).json({
            message: "Permissions updated",
            permissions: result.rows.map(r => r.slug)
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error setting permissions for role ${roleId}:`, err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// ============================================
// GROUPS MANAGEMENT
// ============================================

exports.getGroupsWithCounts = async (req, res) => {
    try {
        const query = `
            SELECT g.*, COUNT(ug.user_id)::int as member_count
            FROM groups g
            LEFT JOIN user_groups ug ON g.id = ug.group_id
            GROUP BY g.id
            ORDER BY g.name ASC
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error fetching groups with counts:", err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================
// CSV UPLOAD
// ============================================

exports.uploadCSV = async (req, res) => {
    const { tableName } = req.params;
    if (!ALLOWED_TABLES.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
    }

    if (!req.file) {
        return res.status(400).json({ error: "No CSV file provided" });
    }

    const fs = require('fs');
    const csv = require('csv-parser');
    const results = [];

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });

        // Cleanup
        try { fs.unlinkSync(req.file.path); } catch(e){}

        if (results.length === 0) {
            return res.status(400).json({ error: "CSV file is empty" });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Get valid columns to prevent SQL injection
            const colResult = await client.query(
                "SELECT column_name FROM information_schema.columns WHERE table_name = $1",
                [tableName]
            );
            const validColumns = colResult.rows.map(r => r.column_name);

            let insertedCount = 0;
            let updatedCount = 0;
            
            for (const row of results) {
                const keys = [];
                const values = [];
                const placeholders = [];
                
                Object.keys(row).forEach(key => {
                    const trimmedKey = key.trim();
                    if (validColumns.includes(trimmedKey)) {
                        keys.push(trimmedKey);
                        let val = row[key];
                        if (val === '') val = null; // Convert empty strings to null
                        values.push(val);
                        placeholders.push(`$${values.length}`);
                    }
                });

                if (keys.length > 0) {
                    if (keys.includes('id') && row['id']) {
                        const idIndex = keys.indexOf('id');
                        const idVal = values[idIndex];
                        const existsRes = await client.query(`SELECT 1 FROM ${tableName} WHERE id = $1`, [idVal]);
                        
                        if (existsRes.rows.length > 0) {
                            const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
                            await client.query(`UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length + 1}`, [...values, idVal]);
                            updatedCount++;
                        } else {
                            await client.query(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
                            insertedCount++;
                        }
                    } else {
                        // For generic inserts without ID
                        await client.query(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
                        insertedCount++;
                    }
                }
            }
            
            await client.query('COMMIT');
            res.status(200).json({ message: "CSV uploaded successfully", inserted: insertedCount, updated: updatedCount });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`Error uploading CSV for ${tableName}:`, error);
        res.status(500).json({ error: error.message || "Error processing CSV file" });
    }
};
