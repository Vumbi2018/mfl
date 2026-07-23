const { Pool } = require('pg');
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

async function upgradeAudit() {
    const client = await pool.connect();
    try {
        console.log("Upgrading Audit Logs Table...");
        await client.query('BEGIN');

        // 1. Rename/Add Columns
        await client.query(`
            ALTER TABLE audit_logs 
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS ip_address INET,
            ADD COLUMN IF NOT EXISTS user_agent TEXT,
            ADD COLUMN IF NOT EXISTS details JSONB; -- For storing generic metadata/diffs
        `);

        // Check if 'changes' exists (it does from check_cols), rename or keep?
        // Let's keep 'changes' for diffs, 'details' for context.

        // Ensure entity_id is generic text or keep as int? 
        // Usually entity_id is int, but what if UUID? MFL uses Ints mostly.

        await client.query(`
            ALTER TABLE audit_logs 
            ALTER COLUMN changes TYPE JSONB USING changes::JSONB;
        `);

        await client.query('COMMIT');
        console.log("Audit Logs Table Upgraded.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Upgrade failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

upgradeAudit();
