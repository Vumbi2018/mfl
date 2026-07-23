const { Pool } = require('pg');
const dotenv = require('dotenv');
const pool = require('../db');

// Advanced RBAC: Check Permission via Roles (Direct & Group)
exports.checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized - No User Logic" });
        }

        const userId = req.user.id;

        try {
            // 1. Check Direct User Permission Override (Optimized)
            const directPerm = await pool.query(
                `SELECT is_granted FROM user_permissions 
                 WHERE user_id = $1 
                 AND permission_id = (SELECT id FROM permissions WHERE slug = $2)`,
                [userId, requiredPermission]
            );

            if (directPerm.rows.length > 0) {
                return directPerm.rows[0].is_granted
                    ? next()
                    : res.status(403).json({ error: "Permission explicitly denied" });
            }

            // 2. Check Roles (Direct + Group Inherited)
            // Query: Does the user have ANY role (via user_roles OR user_groups->group_roles)
            // that maps to the required permission?
            const accessQuery = `
                WITH UserRoles AS (
                    -- Direct Roles
                    SELECT role_id FROM user_roles WHERE user_id = $1
                    UNION
                    -- Group Roles
                    SELECT gr.role_id 
                    FROM user_groups ug
                    JOIN group_roles gr ON ug.group_id = gr.group_id
                    WHERE ug.user_id = $1
                    UNION
                    -- Legacy Single Role (Backwards Compatibility)
                    SELECT role_id FROM users WHERE id = $1 AND role_id IS NOT NULL
                )
                SELECT 1 
                FROM UserRoles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE p.slug = $2
                LIMIT 1;
            `;

            const result = await pool.query(accessQuery, [userId, requiredPermission]);

            if (result.rows.length > 0) {
                return next();
            }

            // Fallback: Is National Admin? (Often implies superuser, but better to be explicit in role usage)
            // If strictly granular, we don't hardcode this, but let's check for safety if they are 'NATIONAL_ADMIN'
            const legacyCheck = await pool.query(`
                SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1
            `, [userId]);

            if (legacyCheck.rows.length > 0 && legacyCheck.rows[0].name === 'NATIONAL_ADMIN') {
                // Double check if National Admin has ALL permissions? Or just let it pass?
                // Let's stick to strict RBAC unless it's a super-admin flag.
                // Ideally NATIONAL_ADMIN role *should* have the permissions mapped.
            }

            return res.status(403).json({ error: "Access denied" });

        } catch (err) {
            console.error("RBAC Check Error:", err);
            res.status(500).json({ error: "Internal Server Error during Access Check" });
        }
    };
};

// Advanced LBAC: Get Scope Filters (Direct + Group Jurisdictions)
exports.getScopeFilters = async (userId) => {
    try {
        // Check National Access first
        const userRes = await pool.query(`
            SELECT u.is_national, r.name as role_name 
            FROM users u LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1
        `, [userId]);

        if (userRes.rows.length === 0) return null;
        const user = userRes.rows[0];

        // If explicitly national or National Admin legacy role
        if (user.is_national || user.role_name === 'NATIONAL_ADMIN') {
            return { isNational: true, regions: [], provinces: [], districts: [] };
        }

        const scope = {
            isNational: false,
            regions: [],
            provinces: [],
            districts: []
        };

        // Fetch Direct Jurisdictions
        const jurQuery = `
            SELECT region_id, province_id, district_id FROM user_jurisdictions WHERE user_id = $1
            UNION
            SELECT gj.region_id, gj.province_id, gj.district_id 
            FROM user_groups ug
            JOIN group_jurisdictions gj ON ug.group_id = gj.group_id
            WHERE ug.user_id = $1
        `;

        const jurRes = await pool.query(jurQuery, [userId]);

        jurRes.rows.forEach(row => {
            if (row.region_id) scope.regions.push(row.region_id);
            if (row.province_id) scope.provinces.push(row.province_id);
            if (row.district_id) scope.districts.push(row.district_id);
        });

        // Deduplicate
        scope.regions = [...new Set(scope.regions)];
        scope.provinces = [...new Set(scope.provinces)];
        scope.districts = [...new Set(scope.districts)];

        return scope;

    } catch (err) {
        console.error("Scope Filter Error:", err);
        return { isNational: false, regions: [], provinces: [], districts: [] }; // Fail closed
    }
};
