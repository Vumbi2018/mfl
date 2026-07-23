const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load the .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkSchema() {
    try {
        console.log(`Checking schema for database: ${process.env.DB_NAME}`);

        // Check users table columns
        const usersRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        const userCols = usersRes.rows.map(r => r.column_name);
        console.log("\nUsers Table Columns:", userCols);

        const missingUserCols = ['first_name', 'last_name', 'phone_number', 'facility_id', 'is_national']
            .filter(col => !userCols.includes(col));

        if (missingUserCols.length === 0) {
            console.log("✅ Users table has all RBAC columns.");
        } else {
            console.log("❌ Users table is missing columns:", missingUserCols);
        }

        // Check verification_codes table
        const verCodesRes = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_jurisdictions'
            );
        `);
        if (verCodesRes.rows[0].exists) {
            console.log("✅ user_jurisdictions table exists.");
        } else {
            console.log("❌ user_jurisdictions table DOES NOT exist.");
        }

    } catch (err) {
        console.error("Error checking schema:", err);
    } finally {
        pool.end();
    }
}

checkSchema();
