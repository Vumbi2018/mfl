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

exports.getSummary = async (req, res) => {
    try {
        const tenant = req.tenantCode;
        const facilityCount = await pool.query('SELECT COUNT(*) FROM facilities WHERE tenant_code = $1', [tenant]);
        const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE active = true AND tenant_code = $1', [tenant]);
        const today = new Date().toISOString().split('T')[0];

        const approvedTodayCount = await pool.query(
            "SELECT COUNT(*) FROM facilities WHERE operational_status = 'Operational' AND DATE(updated_at) = $1 AND tenant_code = $2",
            [today, tenant]
        );

        // ORIGINAL CODE STATUS QUERIES COMMENTED OUT:
        // const pendingCount = await pool.query(
        //     "SELECT COUNT(*) FROM facilities WHERE operational_status != 'Operational' AND workflow_status NOT IN ('CLOSED', 'ESCALATED') AND tenant_code = $1",
        //     [tenant]
        // );
        // const inReviewCount = await pool.query("SELECT COUNT(*) FROM facilities WHERE workflow_status = 'IN_REVIEW' AND tenant_code = $1", [tenant]);
        // const escalatedCount = await pool.query("SELECT COUNT(*) FROM facilities WHERE workflow_status = 'ESCALATED' AND tenant_code = $1", [tenant]);

        // REPLACEMENT: Defensive query design supporting both Legacy and WHO-compliant status values
        const pendingCount = await pool.query(
            `SELECT COUNT(*) FROM facilities 
             WHERE operational_status != 'Operational' 
             AND workflow_status NOT IN ('CLOSED', 'ESCALATED', 'REQUIRES_CLARIFICATION', 'APPROVED') 
             AND tenant_code = $1`,
            [tenant]
        );

        const inReviewCount = await pool.query(
            `SELECT COUNT(*) FROM facilities 
             WHERE workflow_status IN ('IN_REVIEW', 'DISTRICT_REVIEW', 'PROVINCE_REVIEW', 'NATIONAL_REVIEW', 'PENDING_REVIEW', 'PENDING_APPROVAL') 
             AND tenant_code = $1`,
            [tenant]
        );

        const escalatedCount = await pool.query(
            `SELECT COUNT(*) FROM facilities 
             WHERE workflow_status IN ('ESCALATED', 'REQUIRES_CLARIFICATION') 
             AND tenant_code = $1`,
            [tenant]
        );


        res.status(200).json({
            totalFacilities: parseInt(facilityCount.rows[0].count),
            activeUsers: parseInt(userCount.rows[0].count),
            pendingApprovals: parseInt(pendingCount.rows[0].count),
            approvedToday: parseInt(approvedTodayCount.rows[0].count),
            inReview: parseInt(inReviewCount.rows[0].count),
            escalated: parseInt(escalatedCount.rows[0].count),
            avgProcessingTime: "4.2 days"
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching analytics");
    }
};

exports.getCoverage = async (req, res) => {
    try {
        const tenant = req.tenantCode;
        const query = `
            SELECT p.id, p.name, COUNT(f.id) as facility_count
            FROM provinces p
            LEFT JOIN districts d ON d.province_id = p.id AND d.tenant_code = $1
            LEFT JOIN facilities f ON f.district_id = d.id AND f.tenant_code = $1
            WHERE p.tenant_code = $1
            GROUP BY p.id, p.name
            ORDER BY facility_count DESC
        `;
        const result = await pool.query(query, [tenant]);

        const data = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            facilities: parseInt(row.facility_count),
            coverage: Math.min(100, Math.floor((parseInt(row.facility_count) / 50) * 100)) 
        }));

        res.status(200).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching coverage");
    }
};

exports.getActivity = async (req, res) => {
    try {
        const tenant = req.tenantCode;
        const query = `
            SELECT al.id, u.username as user, al.action, al.entity_type as table_name, al.timestamp as created_at
            FROM audit_logs al
            LEFT JOIN users u ON al.changed_by = u.id
            WHERE al.tenant_code = $1
            ORDER BY al.timestamp DESC
            LIMIT 10
        `;
        const result = await pool.query(query, [tenant]);

        const data = result.rows.map(row => ({
            id: row.id,
            user: row.user || 'System',
            type: mapActionToType(row.action),
            action: `${row.action} on ${row.table_name}`,
            details: `Table: ${row.table_name}`,
            timestamp: row.created_at
        }));

        res.status(200).json(data);
    } catch (err) {
        console.error("Audit log fetch failed:", err.message);
        res.status(200).json([]); 
    }
};

function mapActionToType(action) {
    if (!action) return 'info';
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('insert')) return 'creation';
    if (a.includes('update') || a.includes('edit')) return 'edit';
    if (a.includes('delete')) return 'delete';
    if (a.includes('login')) return 'login';
    return 'info';
}

exports.getDistribution = async (req, res) => {
    try {
        const tenant = req.tenantCode;
        const query = `
            SELECT 
                r.name as region_name,
                p.name as province_name,
                f.type as facility_type,
                COUNT(f.id) as count
            FROM facilities f
            LEFT JOIN districts d ON f.district_id = d.id AND d.tenant_code = $1
            LEFT JOIN provinces p ON d.province_id = p.id AND p.tenant_code = $1
            LEFT JOIN regions r ON p.region_id = r.id AND r.tenant_code = $1
            WHERE f.tenant_code = $1
            GROUP BY r.name, p.name, f.type
            ORDER BY r.name, p.name, f.type
        `;
        const result = await pool.query(query, [tenant]);

        const root = { name: 'Facility Distribution', children: [] };

        result.rows.forEach(row => {
            const regionName = row.region_name || 'Unknown Region';
            const provinceName = row.province_name || 'Unknown Province';
            const typeName = row.facility_type || 'Unknown Type';
            const count = parseInt(row.count);

            let regionNode = root.children.find(c => c.name === regionName);
            if (!regionNode) {
                regionNode = { name: regionName, children: [] };
                root.children.push(regionNode);
            }

            let provinceNode = regionNode.children.find(c => c.name === provinceName);
            if (!provinceNode) {
                provinceNode = { name: provinceName, children: [] };
                regionNode.children.push(provinceNode);
            }

            provinceNode.children.push({ name: typeName, size: count });
        });

        res.status(200).json(root.children); 
    } catch (err) {
        console.error("Error fetching distribution:", err);
        res.status(500).send("Error fetching distribution analytics");
    }
};
