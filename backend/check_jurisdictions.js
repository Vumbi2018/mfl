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
        console.log("Checking User Jurisdictions...");

        // Fetch LATEST user with formatted jurisdiction dump
        const res = await pool.query(`
            SELECT u.id, u.username, u.is_national,
                   json_agg(
                       json_build_object(
                           'user_id', uj.user_id,
                           'region_id', uj.region_id,
                           'region_name_found', r.name
                       )
                   ) as debug_jurisdictions
            FROM users u
            LEFT JOIN user_jurisdictions uj ON u.id = uj.user_id
            LEFT JOIN regions r ON uj.region_id = r.id
            GROUP BY u.id
            ORDER BY u.id DESC
            LIMIT 1
        `);

        console.log("Latest User Debug:", JSON.stringify(res.rows[0], null, 2));

        console.log("Checking Regions:");
        const regions = await pool.query('SELECT id, name FROM regions LIMIT 5');
        console.log(regions.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
