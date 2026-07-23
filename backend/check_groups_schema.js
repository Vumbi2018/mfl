const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password', // check specific password
    port: process.env.DB_PORT || 5432,
});

async function checkGroups() {
    try {
        console.log("Checking Groups Table Structure:");
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'groups'
        `);
        console.table(res.rows);

        console.log("\nChecking Groups Content:");
        const content = await pool.query('SELECT * FROM groups');
        console.table(content.rows);

        console.log("\nChecking Users Table Columns (looking for group_id):");
        const userCols = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name LIKE '%group%'
        `);
        console.table(userCols.rows);

        console.log("\nChecking for user_groups table:");
        const ugTable = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'user_groups'
        `);
        console.table(ugTable.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

checkGroups();
