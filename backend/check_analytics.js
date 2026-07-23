const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function run() {
    try {
        console.log("Checking Provinces Count...");
        const provCheck = await pool.query("SELECT count(*) FROM provinces");
        console.log("Provinces:", provCheck.rows[0].count);

        console.log("Testing getSummary...");
        const facilityCount = await pool.query('SELECT COUNT(*) FROM facilities');
        const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE active = true');
        const pendingCount = await pool.query("SELECT COUNT(*) FROM facilities WHERE workflow_status = 'PENDING_REVIEW'");
        console.log("Summary Stats:", {
            fac: facilityCount.rows[0].count,
            user: userCount.rows[0].count,
            pend: pendingCount.rows[0].count
        });

        console.log("Testing getCoverage...");
        const covQuery = `
            SELECT p.id, p.name, COUNT(f.id) as facility_count
            FROM provinces p
            LEFT JOIN districts d ON d.province_id = p.id
            LEFT JOIN facilities f ON f.district_id = d.id
            GROUP BY p.id, p.name
            ORDER BY facility_count DESC
        `;
        const covRes = await pool.query(covQuery);
        console.log("Coverage Rows:", covRes.rows.length);

        console.log("Testing getActivity (Audit Logs)...");
        // Check if table exists first to provide better debug info
        const tableCheck = await pool.query("SELECT to_regclass('public.audit_logs')");
        if (!tableCheck.rows[0].to_regclass) {
            console.error("CRITICAL: audit_logs table DOES NOT EXIST.");
        } else {
            const actQuery = `
                SELECT al.id, u.username as user, al.action, al.entity_type as table_name, al.timestamp as created_at
                FROM audit_logs al
                LEFT JOIN users u ON al.changed_by = u.id
                ORDER BY al.timestamp DESC
                LIMIT 10
            `;
            const actRes = await pool.query(actQuery);
            console.log("Activity Rows:", actRes.rows.length);
        }

    } catch (err) {
        console.error("QUERY FAILED:", err.message);
    } finally {
        pool.end();
    }
}

run();
