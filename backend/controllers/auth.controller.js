const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const AuditService = require('../services/audit.service');

// ORIGINAL MOCK REGISTER ENDPOINT COMMENTED OUT:
// exports.register = async (req, res) => {
//     // Mock registration for now
//     res.status(201).send("User registered successfully");
// };

// REPLACEMENT: Fully functional self-registration endpoint with security and database storage
exports.register = async (req, res) => {
    try {
        const { username, email, password, role_id, first_name, last_name, phone_number, tenant_code } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required" });
        }

        // Check duplicate email or username
        const userExists = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase(), username.toLowerCase()]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "Username or email already exists" });
        }

        // Secure password hashing
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Fallback to role ID 3 (VIEWER) if not specified or invalid
        const finalRoleId = role_id || 3;
        const finalTenantCode = tenant_code || req.tenantCode || 'zambia';

        const insertQuery = `
            INSERT INTO users (username, email, password_hash, role_id, first_name, last_name, phone_number, tenant_code, active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING id, username, email, role_id, created_at, tenant_code
        `;

        const result = await pool.query(insertQuery, [
            username.toLowerCase(),
            email.toLowerCase(),
            hashedPassword,
            finalRoleId,
            first_name || null,
            last_name || null,
            phone_number || null,
            finalTenantCode
        ]);

        const newUser = result.rows[0];

        // Audit Log registration activity
        await AuditService.log({
            userId: newUser.id,
            action: 'REGISTER',
            entityType: 'USERS',
            entityId: newUser.id,
            changes: { id: newUser.id, username: newUser.username, email: newUser.email },
            details: { message: "User self-registration successful" },
            req
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: newUser
        });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Error registering user" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!(email && password)) {
            return res.status(400).send("All input is required");
        }

        // Hardcoded permanent super user
        if (email.toLowerCase() === 'superadmin@health.gov' && password === 'superadmin123') {
            const token = jwt.sign(
                { id: 9999, user_id: 9999, email: email, role: 'NATIONAL_ADMIN', tenant_code: 'zambia', permissions: ['edit_facility', 'view_audit_logs', 'manage_users', 'approve_changes'] },
                process.env.JWT_SECRET || 'supersecretkey_change_this',
                { expiresIn: "24h" }
            );
            return res.status(200).json({
                id: 9999,
                email: email,
                username: 'SuperAdmin',
                first_name: 'System',
                last_name: 'Administrator',
                role_id: 1,
                role_name: 'NATIONAL_ADMIN',
                tenant_code: 'zambia',
                token: token,
                permissions: ['edit_facility', 'view_audit_logs', 'manage_users', 'approve_changes'],
                jurisdictions: []
            });
        }

        const userRes = await pool.query(
            'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE email = $1 OR username = $1',
            [email]
        );
        const user = userRes.rows[0];

        if (user && (await bcrypt.compare(password, user.password_hash))) {
            // Fetch Permissions
            const permQuery = `
                SELECT DISTINCT p.slug 
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role_id = $1
                UNION
                SELECT p.slug
                FROM user_permissions up
                JOIN permissions p ON up.permission_id = p.id
                WHERE up.user_id = $2 AND up.is_granted = TRUE
            `;
            const perms = await pool.query(permQuery, [user.role_id, user.id]);
            user.permissions = perms.rows.map(r => r.slug);

            // Fetch Jurisdictions
            const jurQuery = `
                SELECT region_id, province_id, district_id FROM user_jurisdictions WHERE user_id = $1
            `;
            const jurs = await pool.query(jurQuery, [user.id]);
            user.jurisdictions = jurs.rows;

            // ORIGINAL JWT SIGN PAYLOAD COMMENTED OUT:
            // const token = jwt.sign(
            //     { user_id: user.id, email: email, role: user.role_name, tenant_code: user.tenant_code, permissions: user.permissions },
            //     process.env.JWT_SECRET || 'supersecretkey_change_this',
            //     { expiresIn: "24h" }
            // );

            // REPLACEMENT: Included both id and user_id for perfect backward compatibility and middleware support
            const token = jwt.sign(
                { id: user.id, user_id: user.id, email: email, role: user.role_name, tenant_code: user.tenant_code, permissions: user.permissions },
                process.env.JWT_SECRET || 'supersecretkey_change_this',
                { expiresIn: "24h" }
            );
            
            user.token = token;
            delete user.password_hash; // Security
            return res.status(200).json(user);
        }

        return res.status(400).send("Invalid Credentials");

    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

/**
 * Get list of active tenants
 */
exports.getTenants = async (req, res) => {
    try {
        const result = await pool.query('SELECT name, code, logo_url FROM tenants WHERE active = TRUE ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tenants:', err);
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
};
