const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

const TENANT_CODE = 'zambia';

const MOCK_USERS = [
    { username: 'jdoe', email: 'jdoe@health.gov.zm', role: 2, first: 'Jane', last: 'Doe' },
    { username: 'msmith', email: 'msmith@health.gov.zm', role: 3, first: 'Michael', last: 'Smith' },
    { username: 'lbanda', email: 'lbanda@health.gov.zm', role: 2, first: 'Lumbani', last: 'Banda' },
    { username: 'kphiri', email: 'kphiri@health.gov.zm', role: 3, first: 'Kondwani', last: 'Phiri' },
    { username: 'cmutale', email: 'cmutale@health.gov.zm', role: 4, first: 'Chanda', last: 'Mutale' }
];

const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN'];
const ENTITY_TYPES = ['FACILITY', 'USER', 'ROLE', 'SETTINGS'];

async function seedMockData() {
    const client = await pool.connect();
    try {
        console.log('Starting Mock Data Seeding for Tenant:', TENANT_CODE);
        await client.query('BEGIN');

        // 1. Seed Mock Users
        console.log('Seeding Mock Users...');
        const userIds = [];
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);

        for (const user of MOCK_USERS) {
            const res = await client.query(
                `INSERT INTO users (username, email, password_hash, role_id, active, tenant_code, first_name, last_name) 
                 VALUES ($1, $2, $3, $4, true, $5, $6, $7)
                 ON CONFLICT (email) DO UPDATE SET active = true
                 RETURNING id`,
                [user.username, user.email, hash, user.role, TENANT_CODE, user.first, user.last]
            );
            userIds.push(res.rows[0].id);
        }

        // 2. Fetch some existing facilities to mutate
        const facilitiesRes = await client.query(
            `SELECT id, name, type FROM facilities WHERE tenant_code = $1 ORDER BY RANDOM() LIMIT 500`,
            [TENANT_CODE]
        );
        const facilities = facilitiesRes.rows;

        console.log(`Modifying metrics for ${facilities.length} facilities...`);

        let updatedCount = 0;
        let auditLogsCount = 0;

        for (const f of facilities) {
            // Randomly assign beds and staff based on type roughly
            let tBeds = 0, iBeds = 0, docs = 0, nurses = 0;
            const typeStr = (f.type || '').toLowerCase();

            if (typeStr.includes('hospital')) {
                tBeds = Math.floor(Math.random() * 200) + 50;
                iBeds = Math.floor(Math.random() * 20) + 5;
                docs = Math.floor(Math.random() * 50) + 10;
                nurses = Math.floor(Math.random() * 100) + 20;
            } else if (typeStr.includes('clinic') || typeStr.includes('center')) {
                tBeds = Math.floor(Math.random() * 20) + 5;
                docs = Math.floor(Math.random() * 5) + 1;
                nurses = Math.floor(Math.random() * 15) + 3;
            } else {
                tBeds = Math.floor(Math.random() * 5);
                docs = Math.floor(Math.random() * 2);
                nurses = Math.floor(Math.random() * 5) + 1;
            }

            // Assign a workflow status randomly (most should be APPROVED)
            let wStatus = 'APPROVED';
            const rand = Math.random();
            if (rand < 0.05) wStatus = 'IN_REVIEW';
            else if (rand < 0.08) wStatus = 'ESCALATED';
            else if (rand < 0.12) wStatus = 'PENDING_APPROVAL';
            else if (rand < 0.15) wStatus = 'REJECTED';

            await client.query(
                `UPDATE facilities SET 
                    total_beds = $1, icu_beds = $2, doctors = $3, nurses = $4,
                    workflow_status = $5, updated_at = NOW() - (random() * interval '30 days')
                 WHERE id = $6`,
                [tBeds, iBeds, docs, nurses, wStatus, f.id]
            );
            updatedCount++;

            // Create workflow log if not approved
            if (wStatus !== 'APPROVED') {
                const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
                await client.query(
                    `INSERT INTO workflow_logs (facility_id, status_from, status_to, actor_id, comments, tenant_code, timestamp)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW() - (random() * interval '10 days'))`,
                    [f.id, 'PENDING_REVIEW', wStatus, randomUserId, `Status updated to ${wStatus} during review process.`, TENANT_CODE]
                );
            }
        }
        console.log(`Updated metrics for ${updatedCount} facilities.`);

        // 3. Generate Random Audit Logs
        console.log('Generating random audit logs...');
        for (let i = 0; i < 150; i++) {
            const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
            const action = AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)];
            const entityType = ENTITY_TYPES[Math.floor(Math.random() * ENTITY_TYPES.length)];
            const entityId = Math.floor(Math.random() * 1000) + 1;
            
            await client.query(
                `INSERT INTO audit_logs (entity_type, entity_id, action, changed_by, changes, tenant_code, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW() - (random() * interval '30 days'))`,
                [entityType, entityId, action, randomUserId, '{}', TENANT_CODE]
            );
            auditLogsCount++;
        }
        console.log(`Inserted ${auditLogsCount} random audit logs.`);

        await client.query('COMMIT');
        console.log('Mock data seeding completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error seeding mock data:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seedMockData();
