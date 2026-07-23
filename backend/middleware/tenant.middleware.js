const pool = require('../db');

/**
 * Middleware to extract and validate tenant context
 */
const tenantMiddleware = async (req, res, next) => {
    // 1. Try to get tenant from header (useful for public endpoints or initial setup)
    let tenantCode = req.headers['x-tenant-code'];

    // 2. If not in header, and user is authenticated, use user's tenant
    if (!tenantCode && req.user && req.user.tenant_code) {
        tenantCode = req.user.tenant_code;
    }

    // 3. Fallback to 'png' if nothing provided (or you could require it)
    if (!tenantCode) {
        tenantCode = 'zambia'; 
    }

    try {
        // Validate tenant exists
        const result = await pool.query('SELECT code FROM tenants WHERE code = $1 AND active = TRUE', [tenantCode]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Tenant '${tenantCode}' not found or inactive` });
        }

        // Attach to request
        req.tenantCode = tenantCode;
        next();
    } catch (err) {
        console.error('Tenant middleware error:', err);
        res.status(500).json({ error: 'Internal server error during tenant validation' });
    }
};

module.exports = tenantMiddleware;
