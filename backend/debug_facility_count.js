const { Pool } = require('pg');
const dotenv = require('dotenv');
const { getScopeFilters } = require('./middleware/rbac.middleware');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function debug() {
    try {
        console.log("--- DEBUGGING FACILITY COUNT & ACCESS ---");

        // 1. Raw Count
        const countRes = await pool.query('SELECT COUNT(*) FROM facilities');
        console.log(`Total Facilities in DB: ${countRes.rows[0].count}`);

        // 2. Check Admin User
        const adminRes = await pool.query('SELECT id, username, is_national FROM users WHERE id = 1');
        const admin = adminRes.rows[0];
        console.log("Admin User:", admin);

        // 3. Check Scope Filters logic
        // We need to look at what getScopeFilters returns for user 1
        // Note: We need to mock the req object if we were calling the middleware directly, 
        // but here we just want to see the logic.
        // We'll reproduce the query logic manually or import the function if possible.
        // Accessing the internal logic of getScopeFilters might be hard if it relies on req/res. 
        // Let's assume we imported it from rbac.middleware.js. 
        // NOTE: rbac.middleware.js usually exports middleware functions (req, res, next). 
        // But I see `exports.getScopeFilters` in the file view previously? 
        // Let's check rbac.middleware.js content first? No, I'll just rely on the import I added.

        console.log("Checking Scope Filters for User 1...");
        try {
            const scope = await getScopeFilters(1);
            console.log("Scope result:", scope);
        } catch (e) {
            console.error("Error checking scope filters:", e);
        }

    } catch (err) {
        console.error("Debug script error:", err);
    } finally {
        pool.end();
    }
}

debug();
