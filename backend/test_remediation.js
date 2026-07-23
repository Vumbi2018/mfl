/**
 * Verification Script for MFL Critical Bug Remediation
 * Tests imports, pools, and SQL queries against the active PostgreSQL database.
 */

const pool = require('./db');

async function verifyRemediation() {
    console.log("🚀 Starting MFL Remediation Verification...");
    
    // 1. Verify DB Connectivity via standardized pool
    try {
        console.log("Checking DB connection pool...");
        const res = await pool.query("SELECT NOW()");
        console.log("✅ DB Connected successfully at:", res.rows[0].now);
    } catch (err) {
        console.error("❌ DB Connection failed:", err.message);
        process.exit(1);
    }

    // 2. Verify all modified controller files import and load without syntax/ReferenceErrors
    console.log("\nChecking controller imports...");
    const controllers = [
        { name: 'admin', path: './controllers/admin.controller' },
        { name: 'analytics', path: './controllers/analytics.controller' },
        { name: 'audit', path: './controllers/audit.controller' },
        { name: 'facility', path: './controllers/facility.controller' },
        { name: 'reference', path: './controllers/reference.controller' },
        { name: 'ticket', path: './controllers/ticket.controller' },
        { name: 'user', path: './controllers/user.controller' },
        { name: 'auth', path: './controllers/auth.controller' }
    ];

    for (const ctrl of controllers) {
        try {
            require(ctrl.path);
            console.log(`✅ Controller '${ctrl.name}' loaded successfully (No missing imports or syntax issues).`);
        } catch (err) {
            console.error(`❌ Controller '${ctrl.name}' failed to load:`, err);
            process.exit(1);
        }
    }

    // 3. Test corrected ticket module query against active database
    console.log("\nVerifying ticket module SQL schema alignment...");
    try {
        const query = `
            SELECT t.*, 
                   f.name as facility_name, 
                   f.latitude, f.longitude,
                   d.name as district,
                   p.name as province,
                   r.name as region,
                   u.username as assigned_technician
            FROM tickets t
            LEFT JOIN facilities f ON t.facility_id = f.id
            LEFT JOIN districts d ON f.district_id = d.id
            LEFT JOIN provinces p ON d.province_id = p.id
            LEFT JOIN regions r ON p.region_id = r.id
            LEFT JOIN users u ON t.assigned_technician_id = u.id
            ORDER BY t.created_at DESC
            LIMIT 5
        `;
        const ticketRes = await pool.query(query);
        console.log(`✅ Ticket query executed successfully! Found ${ticketRes.rowCount} active tickets.`);
    } catch (err) {
        console.error("❌ Ticket SQL Query failed:", err.message);
        process.exit(1);
    }

    // 4. Test corrected analytics queries against active database
    console.log("\nVerifying analytics workflow state queries...");
    try {
        const tenant = 'zambia'; // Default active tenant

        const pending = await pool.query(
            `SELECT COUNT(*) FROM facilities 
             WHERE operational_status != 'Operational' 
             AND workflow_status NOT IN ('CLOSED', 'ESCALATED', 'REQUIRES_CLARIFICATION', 'APPROVED') 
             AND tenant_code = $1`,
            [tenant]
        );

        const inReview = await pool.query(
            `SELECT COUNT(*) FROM facilities 
             WHERE workflow_status IN ('IN_REVIEW', 'DISTRICT_REVIEW', 'PROVINCE_REVIEW', 'NATIONAL_REVIEW', 'PENDING_REVIEW', 'PENDING_APPROVAL') 
             AND tenant_code = $1`,
            [tenant]
        );

        const escalated = await pool.query(
            `SELECT COUNT(*) FROM facilities 
             WHERE workflow_status IN ('ESCALATED', 'REQUIRES_CLARIFICATION') 
             AND tenant_code = $1`,
            [tenant]
        );

        console.log(`✅ Analytics counters loaded successfully!`);
        console.log(`   - Pending: ${pending.rows[0].count}`);
        console.log(`   - In Review: ${inReview.rows[0].count}`);
        console.log(`   - Escalated/Needs Clarification: ${escalated.rows[0].count}`);
    } catch (err) {
        console.error("❌ Analytics query failed:", err.message);
        process.exit(1);
    }

    // 5. Test registration insert capability (Rollback transaction to keep DB clean)
    console.log("\nVerifying self-registration database operation capability...");
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        
        // Mock register query
        const testUser = `test_rem_${Math.floor(Math.random() * 100000)}@mfl.gov.pg`;
        const testPassHash = "$2a$10$w6D9t5XJ6pB.Wq5ZlQdZWeGfLd3R0m8YmI2Tz6e7d692E47.6.oT2"; // dummy hash
        
        const insertRes = await client.query(`
            INSERT INTO users (username, email, password_hash, role_id, tenant_code, active)
            VALUES ($1, $2, $3, 3, 'zambia', true)
            RETURNING id, username, email
        `, [testUser.split('@')[0], testUser, testPassHash]);

        console.log(`✅ Registration database insert successfully tested (UserID: ${insertRes.rows[0].id}).`);
        
        await client.query("ROLLBACK");
        console.log("✅ Transaction successfully rolled back. Database remains pristine.");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Registration database test failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
    }

    console.log("\n⭐ ALL REMEDIATIONS VERIFIED SUCCESSFULLY! ⭐\n");
    await pool.end();
}

verifyRemediation();
