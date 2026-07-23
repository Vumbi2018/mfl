const fs = require('fs');
const path = require('path');
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

async function initDb() {
    const schemaPath = path.join(__dirname, '../database/init_schema.sql');

    if (!fs.existsSync(schemaPath)) {
        console.error('Schema file not found at:', schemaPath);
        process.exit(1);
    }

    console.log('Reading init_schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Applying schema...');
        await client.query('BEGIN');
        await client.query(schemaSql);
        await client.query('COMMIT');
        console.log('Database initialized successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error initializing database:', err);
    } finally {
        client.release();
        pool.end();
    }
}

initDb();
