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

async function main() {
    try {
        console.log("--- DATABASE TABLES IN 'mfl_db' ---");
        const tablesRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        for (const row of tablesRes.rows) {
            const tableName = row.table_name;
            const columnsRes = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            
            console.log(`\nTable: ${tableName}`);
            console.log("-----------------------------------------");
            columnsRes.rows.forEach(col => {
                console.log(`  ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
            });
        }
    } catch (err) {
        console.error("Error inspecting database:", err);
    } finally {
        await pool.end();
    }
}

main();
