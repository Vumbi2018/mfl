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

async function check() {
    try {
        console.log("Checking Tables...");
        const tables = ['permissions', 'role_permissions', 'user_permissions'];
        for (const tbl of tables) {
            const res = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = $1
            `, [tbl]);
            if (res.rows.length > 0) {
                console.log(`Table '${tbl}' exists.`);
                const cols = await pool.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = $1
                `, [tbl]);
                console.log(`Columns:`, cols.rows.map(c => `${c.column_name}(${c.data_type})`).join(', '));
            } else {
                console.log(`Table '${tbl}' DOES NOT exist.`);
            }
        }

        // List some sample permissions
        const perms = await pool.query('SELECT * FROM permissions LIMIT 5');
        console.log("Sample Permissions:", JSON.stringify(perms.rows));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

check();
