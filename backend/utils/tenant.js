/**
 * Utility to help with tenant-aware queries
 */

/**
 * Appends tenant filtering to a WHERE clause array
 * @param {string[]} conditions - Array of existing conditions
 * @param {any[]} params - Array of query parameters
 * @param {string} tenantCode - The current tenant code
 * @param {string} alias - Table alias (default 'f')
 * @returns {number} The next parameter index
 */
const appendTenantFilter = (conditions, params, tenantCode, alias = 'f') => {
    params.push(tenantCode);
    const paramIndex = params.length;
    const prefix = alias ? `${alias}.` : '';
    conditions.push(`${prefix}tenant_code = $${paramIndex}`);
    return paramIndex + 1;
};


module.exports = {
    appendTenantFilter
};
