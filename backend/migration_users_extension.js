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

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log("Starting migration...");

        // 1. Add new columns to users table
        console.log("Adding columns to users table...");
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS facility_id INTEGER REFERENCES facilities(id),
            ADD COLUMN IF NOT EXISTS is_national BOOLEAN DEFAULT FALSE;
        `);

        // 2. Create user_jurisdictions table
        console.log("Creating user_jurisdictions table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_jurisdictions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                region_id INTEGER REFERENCES regions(id),
                province_id INTEGER REFERENCES provinces(id),
                district_id INTEGER REFERENCES districts(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Migrate existing data (if columns exist and have data)
        console.log("Migrating existing location data...");
        // 3. Migrate existing data properly
        console.log("Checking for existing columns...");
        const colsResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name IN ('region_id', 'province_id', 'district_id');
        `);

        const existingCols = colsResult.rows.map(r => r.column_name);

        if (existingCols.length > 0) {
            console.log(`Found columns: ${existingCols.join(', ')}. Migrating data...`);
            // Build dynamic select query
            const selectQuery = `SELECT id, ${existingCols.join(', ')} FROM users`;
            const users = await client.query(selectQuery);

            for (const user of users.rows) {
                // Construct insert object
                const region_id = user.region_id || null;
                const province_id = user.province_id || null;
                const district_id = user.district_id || null;

                if (region_id || province_id || district_id) {
                    await client.query(`
                        INSERT INTO user_jurisdictions (user_id, region_id, province_id, district_id)
                        VALUES ($1, $2, $3, $4)
                    `, [user.id, region_id, province_id, district_id]);
                }
            }
        } else {
            console.log("No location columns found in users table. Skipping data migration.");
        }

        // 4. Drop old columns (Optional, but cleaner. Let's do it to force usage of new table)
        // console.log("Dropping old columns...");
        // await client.query(`
        //     ALTER TABLE users 
        //     DROP COLUMN IF EXISTS region_id,
        //     DROP COLUMN IF EXISTS province_id,
        //     DROP COLUMN IF EXISTS district_id;
        // `);
        // comment out drop for safety for now, just in case revert is needed immediately. 
        // But for "Implement" request, we should switch fully. 
        // I will keep them for this specific run to be safe, but code will use new table.

        await client.query('COMMIT');
        console.log("Migration completed successfully.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
