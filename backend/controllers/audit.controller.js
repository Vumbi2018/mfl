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

exports.getAuditLogs = async (req, res) => {
    try {
        const { facility_id, limit = 50 } = req.query;
        let query = `
            SELECT a.*, to_char(a.timestamp, 'YYYY-MM-DD HH24:MI') as date 
            FROM audit_logs a 
        `;
        const params = [];

        if (facility_id) {
            // Note: entity_type stored as plural 'FACILITIES' in some logs, singular 'FACILITY' in others?
            // Controller uses 'FACILITIES'
            query += ` WHERE (entity_type = 'FACILITY' OR entity_type = 'FACILITIES') AND entity_id = $1 `;
            params.push(facility_id);
        }

        query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching audit logs");
    }
};

exports.logAction = async (facility_id, user_name, action, field, old_value, new_value, status) => {
    try {
        // Construct details JSON if not provided
        const details = {
            field: field,
            oldValue: old_value,
            newValue: new_value,
            status: status
        };

        await pool.query(
            `INSERT INTO audit_logs (entity_type, entity_id, user_id, action, details, timestamp) 
             VALUES ($1, $2, (SELECT id FROM users WHERE username = $3), $4, $5, NOW())`,
            ['FACILITIES', facility_id, user_name, action, JSON.stringify(details)]
        );
    } catch (err) {
        console.error("Failed to log action:", err);
    }
};
