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
    const client = await pool.connect();
    try {
        console.log("Attempting user creation with jurisdiction...");
        await client.query('BEGIN');

        // 1. Get valid region
        const regionRes = await client.query('SELECT id, name FROM regions LIMIT 1');
        if (regionRes.rows.length === 0) throw new Error("No regions found to test with");
        const regionId = regionRes.rows[0].id;
        console.log(`Using Region ID: ${regionId} (${regionRes.rows[0].name})`);

        // 2. Insert User
        const query = `
            INSERT INTO users (
                username, email, password_hash, role_id, 
                first_name, last_name, phone_number, facility_id, is_national, active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        `;
        const values = [
            'jurtest', 'jur@test.com', 'hash', 1,
            'Jur', 'Test', '555', null, false, true
        ];

        const res = await client.query(query, values);
        const userId = res.rows[0].id;
        console.log("Created user ID:", userId);

        // 3. Insert Jurisdiction
        await client.query(`
            INSERT INTO user_jurisdictions (user_id, region_id, province_id, district_id)
            VALUES ($1, $2, $3, $4)
        `, [userId, regionId, null, null]);
        console.log("Inserted Jurisdiction.");

        // 4. Verify Fetch (The BIG query logic)
        const fetchQuery = `
            SELECT u.id, u.username,
                   json_agg(
                       json_build_object(
                           'region_name', reg.name
                       )
                   ) FILTER (WHERE uj.id IS NOT NULL) as jurisdictions
            FROM users u
            LEFT JOIN user_jurisdictions uj ON u.id = uj.user_id
            LEFT JOIN regions reg ON uj.region_id = reg.id
            WHERE u.id = $1
            GROUP BY u.id
        `;
        const fetchRes = await client.query(fetchQuery, [userId]);
        console.log("Verification Result:", JSON.stringify(fetchRes.rows[0], null, 2));

        await client.query('ROLLBACK');
        console.log("Rolled back.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("FAILURE: Creation failed:", err.message);
        if (err.detail) console.error("Detail:", err.detail);
        if (err.hint) console.error("Hint:", err.hint);
    } finally {
        client.release();
        pool.end();
    }
}

run();
