const pool = require('../db');

class AuditService {
    /**
     * Log a system action
     * @param {Object} params
     * @param {number} params.userId - ID of user performing action
     * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, LOGIN, LOGIN_FAIL)
     * @param {string} params.entityType - Table or Entity name (USERS, FACILITIES)
     * @param {number|string} params.entityId - ID of affected entity
     * @param {Object} params.changes - JSON object representing changes (diff)
     * @param {Object} params.details - JSON object for extra metadata
     * @param {Object} req - Express Request object (optional, for IP/Agent extraction)
     */
    static async log({ userId, action, entityType, entityId, changes = {}, details = {}, req = null }) {
        try {
            let ipAddress = null;
            let userAgent = null;

            if (req) {
                ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                userAgent = req.headers['user-agent'];
            }

            // Normalize textual defaults
            const safeChanges = JSON.stringify(changes);
            const safeDetails = JSON.stringify(details);

            const query = `
                INSERT INTO audit_logs 
                (user_id, action, entity_type, entity_id, changes, details, ip_address, user_agent, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `;

            await pool.query(query, [
                userId,
                action,
                entityType,
                entityId,
                safeChanges,
                safeDetails,
                ipAddress,
                userAgent
            ]);

            // Also log to console for dev visibility
            console.log(`[AUDIT] ${action} on ${entityType}:${entityId} by User:${userId}`);

        } catch (err) {
            console.error("CRITICAL: Failed to write audit log", err);
            // We don't throw here to avoid failing the main business transaction, 
            // unless strict auditing is required.
        }
    }
}

module.exports = AuditService;
