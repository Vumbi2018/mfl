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

async function debugDb() {
    const client = await pool.connect();
    try {
        const fRes = await client.query('SELECT count(*) FROM facilities');
        console.log('Facilities Count:', fRes.rows[0].count);

        const dRes = await client.query('SELECT count(*) FROM districts');
        console.log('Districts Count:', dRes.rows[0].count);

        const pRes = await client.query('SELECT count(*) FROM provinces');
        console.log('Provinces Count:', pRes.rows[0].count);

        const rRes = await client.query('SELECT count(*) FROM regions');
        console.log('Regions Count:', rRes.rows[0].count);

        const fSample = await client.query('SELECT name, latitude, longitude, ownership, common_props FROM facilities LIMIT 1');
        console.log('Sample Facility:', fSample.rows[0]);

    } catch (err) {
        console.error('Debug error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

debugDb();
